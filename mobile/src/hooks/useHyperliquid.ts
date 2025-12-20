import "event-target-polyfill";
import "fast-text-encoding";
import * as hl from "@nktkas/hyperliquid";
import { useEffect } from "react";
import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";

// Type aliases for better readability
type HLClientInstance = InstanceType<typeof hl.SubscriptionClient>;
type HLSubscriptionHandler = (data: any) => void;

// Extracts subscription method names from the Hyperliquid client
// (methods that take params and a listener callback)
type HLMethodName = keyof {
  [K in keyof HLClientInstance as HLClientInstance[K] extends (
    params: any,
    listener: any,
  ) => any
    ? K
    : never]: HLClientInstance[K];
};

interface HLStoreState {
  client: HLClientInstance;
  infoClient: hl.InfoClient;
  transport: hl.WebSocketTransport;
  registry: Map<string, Set<HLSubscriptionHandler>>;
  subscriptions: Map<string, { unsubscribe: () => Promise<void> }>;
  connectionState: "connecting" | "connected" | "disconnected";
  latencyMs: number | null;
  error: string | null;
  reconnect: () => void;
}

// Clears all pending state on disconnect
const clearPendingState = (
  registry: Map<string, Set<HLSubscriptionHandler>>,
  subscriptions: Map<string, { unsubscribe: () => Promise<void> }>,
) => {
  registry.clear();
  subscriptions.clear();
};

// Handles incoming WebSocket messages for subscriptions
const createMessageHandler =
  (registry: Map<string, Set<HLSubscriptionHandler>>) =>
  (event: MessageEvent) => {
    const msg = JSON.parse(event.data);
    console.log(msg.channel, msg.data?.response?.type)

    // Handle subscription data (post responses are handled by InfoClient)
    if (msg.channel !== "post") {
      const handlers = registry.get(msg.channel);
      if (handlers) {
        handlers.forEach((h) => h(msg.data));
      }
    }
  };

// Creates and manages ping interval for latency tracking
const createPingManager = (
  infoClient: hl.InfoClient,
  updateLatency: (ms: number) => void,
  updateError: (error: string | null) => void,
) => {
  const ping = async () => {
    try {
      const start = performance.now();
      await infoClient.exchangeStatus();
      updateLatency(performance.now() - start);
      updateError(null); // Clear error on successful ping
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Ping failed";
      console.warn("Ping failed:", err);
      updateError(errorMsg);
    }
  };

  return setInterval(ping, __DEV__ ? 10000 : 10000);
};

export const useHyperliquidStore = create<HLStoreState>((set, get) => {
  const transport = new hl.WebSocketTransport({
    isTestnet: true,
    resubscribe: false,
  });
  const client = new hl.SubscriptionClient({ transport });
  const infoClient = new hl.InfoClient({ transport });

  const registry = new Map<string, Set<HLSubscriptionHandler>>();
  const subscriptions = new Map<string, { unsubscribe: () => Promise<void> }>();

  set({ connectionState: "connecting", latencyMs: null, error: null });

  let pingInterval: NodeJS.Timeout | null = null;

  // Setup connection state handlers
  transport.socket.addEventListener("open", () => {
    set({ connectionState: "connected", error: null });
  });

  transport.socket.addEventListener("close", (event) => {
    const errorMsg =
      event.code !== 1000 && event.code !== 1005
        ? `Connection closed (code: ${event.code}, reason: ${event.reason || "unknown"})`
        : null;
    set({ connectionState: "disconnected", error: errorMsg });
    clearPendingState(registry, subscriptions);
    if (pingInterval) {
      clearInterval(pingInterval);
      pingInterval = null;
    }
  });

  transport.socket.addEventListener("error", (event) => {
    const errorMsg =
      typeof event === "object" ? event.message : "WebSocket error occurred";
    set({ connectionState: "disconnected", error: errorMsg });
    clearPendingState(registry, subscriptions);
    if (pingInterval) {
      clearInterval(pingInterval);
      pingInterval = null;
    }
  });

  // Setup message handler
  transport.socket.addEventListener("message", createMessageHandler(registry));

  // Setup ping interval
  pingInterval = createPingManager(
    infoClient,
    (ms) => set({ latencyMs: ms }),
    (error) => set({ error }),
  );

  return {
    client,
    infoClient,
    transport,
    registry,
    subscriptions,
    connectionState: "connecting",
    latencyMs: null,
    error: null,
    reconnect: () => {
      const { connectionState } = get();
      if (connectionState === "disconnected") {
        try {
          set({ connectionState: "connecting", error: null });
          // @ts-expect-error third arg is supported by rews implementation
          transport.socket?.close?.(4000, "manual reconnect", false);
        } catch (err) {
          console.warn("Failed to trigger HL reconnect", err);
          set({
            error: err instanceof Error ? err.message : "Failed to reconnect",
          });
        }
      }
    },
  };
});

const buildSubKey = (method: string, params: any) =>
  `${method}:${JSON.stringify(params ?? {})}`;

// Creates a new subscription for a given key
const createSubscription = (
  client: HLClientInstance,
  method: HLMethodName,
  param: any,
  key: string,
  registry: Map<string, Set<HLSubscriptionHandler>>,
  subscriptions: Map<string, { unsubscribe: () => Promise<void> }>,
  handler: HLSubscriptionHandler,
) => {
  const handlerSet = new Set<HLSubscriptionHandler>([handler]);
  registry.set(key, handlerSet);

  // @ts-expect-error - dynamic method access
  client[method](param, (data: any) => {
    const handlers = registry.get(key);
    if (handlers) {
      handlers.forEach((h) => h(data));
    }
  })
    .then((sub: { unsubscribe: () => Promise<void> }) => {
      if (sub?.unsubscribe) {
        subscriptions.set(key, sub);
      }
    })
    .catch((err: unknown) => {
      console.error(`Hyperliquid subscription failed for ${key}`, err);
      registry.delete(key);
    });
};

// Cleans up a subscription key when no handlers remain
const cleanupSubscription = (
  key: string,
  handler: HLSubscriptionHandler,
  registry: Map<string, Set<HLSubscriptionHandler>>,
  subscriptions: Map<string, { unsubscribe: () => Promise<void> }>,
) => {
  const entry = registry.get(key);
  if (!entry) return;

  entry.delete(handler);
  if (entry.size === 0) {
    registry.delete(key);
    const sub = subscriptions.get(key);
    if (sub?.unsubscribe) {
      sub
        .unsubscribe()
        .catch((err: unknown) =>
          console.warn(`Failed to unsubscribe ${key}`, err),
        );
    }
    subscriptions.delete(key);
  }
};

export function useHLSubscription(
  method: HLMethodName,
  params: any,
  handler: (data: any) => void,
  enabled = true,
) {
  const { client, registry, subscriptions, connectionState } =
    useHyperliquidStore(
      useShallow((s) => ({
        client: s.client,
        registry: s.registry,
        subscriptions: s.subscriptions,
        connectionState: s.connectionState,
      })),
    );

  useEffect(() => {
    if (!enabled || connectionState !== "connected") return;

    const paramList = Array.isArray(params) ? params : [params];
    if (!paramList.length) return;

    const keys = paramList.map((param) => {
      const key = buildSubKey(method as string, param);
      const existingHandlers = registry.get(key);

      if (existingHandlers) {
        existingHandlers.add(handler);
      } else {
        createSubscription(
          client,
          method,
          param,
          key,
          registry,
          subscriptions,
          handler,
        );
      }

      return key;
    });

    return () => {
      keys.forEach((key) =>
        cleanupSubscription(key, handler, registry, subscriptions),
      );
    };
  }, [enabled, method, handler, params, connectionState]);
}

export function useHyperliquidInfo() {
  const infoClient = useHyperliquidStore((s) => s.infoClient);
  return infoClient;
}

export function useHyperliquidConnectionStatus() {
  const { connectionState, error, latencyMs } = useHyperliquidStore(
    useShallow((s) => ({
      connectionState: s.connectionState,
      error: s.error,
      latencyMs: s.latencyMs,
    })),
  );
  return { connectionState, error, latencyMs };
}
