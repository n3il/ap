import "event-target-polyfill";
import "fast-text-encoding";
import * as hl from "@nktkas/hyperliquid";
import { create } from "zustand";
import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";

// Type aliases for better readability
type HLClientInstance = InstanceType<typeof hl.SubscriptionClient>;
type HLSubscriptionHandler = (data: any) => void;

// Extracts subscription method names from the Hyperliquid client
// (methods that take params and a listener callback)
type HLMethodName = keyof {
  [K in keyof HLClientInstance as HLClientInstance[K] extends (
    params: any,
    listener: any
  ) => any
    ? K
    : never]: HLClientInstance[K];
};

interface HLStoreState {
  client: HLClientInstance;
  transport: hl.WebSocketTransport;
  registry: Map<string, Set<HLSubscriptionHandler>>;
  subscriptions: Map<string, { unsubscribe: () => Promise<void> }>;
  pendingPosts: Map<number, (res: any) => void>;
  sendPost: (req: any, id?: number) => Promise<any>;
  connectionState: "connecting" | "connected" | "disconnected";
  latencyMs: number | null;
  reconnect: () => void;
}

// Post ID counter for request tracking
let postCounter = 0;
const nextPostId = () => {
  postCounter = (postCounter + 1) % Number.MAX_SAFE_INTEGER;
  if (postCounter === 0) postCounter = 1;
  return postCounter;
};

// Clears all pending state on disconnect
const clearPendingState = (
  registry: Map<string, Set<HLSubscriptionHandler>>,
  subscriptions: Map<string, { unsubscribe: () => Promise<void> }>,
  pendingPosts: Map<number, (res: any) => void>,
  errorMsg: string
) => {
  registry.clear();
  subscriptions.clear();
  pendingPosts.forEach((resolver) => resolver({ error: errorMsg }));
  pendingPosts.clear();
};

// Waits for WebSocket to be open with timeout
const createWaitForOpen = (socket: WebSocket) => () =>
  new Promise<void>((resolve, reject) => {
    if (socket.readyState === WebSocket.OPEN) {
      resolve();
      return;
    }

    let timeout: NodeJS.Timeout;
    const cleanup = () => {
      clearTimeout(timeout);
      socket.removeEventListener("open", handleOpen);
      socket.removeEventListener("close", handleClose);
    };

    const handleOpen = () => {
      cleanup();
      resolve();
    };

    const handleClose = () => {
      cleanup();
      reject(new Error("Hyperliquid socket closed before open"));
    };

    timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Hyperliquid socket open timeout"));
    }, 5000);

    socket.addEventListener("open", handleOpen);
    socket.addEventListener("close", handleClose);
  });

// Handles incoming WebSocket messages
const createMessageHandler = (
  registry: Map<string, Set<HLSubscriptionHandler>>,
  pendingPosts: Map<number, (res: any) => void>
) => (event: MessageEvent) => {
  const msg = JSON.parse(event.data);

  // Handle post responses
  if (msg.channel === "post") {
    const resolver = pendingPosts.get(msg.data.id);
    if (resolver) {
      resolver(msg.data.response);
      pendingPosts.delete(msg.data.id);
    }
    return;
  }

  // Handle subscription data
  const handlers = registry.get(msg.channel);
  if (handlers) {
    handlers.forEach((h) => h(msg.data));
  }
};

// Creates and manages ping interval for latency tracking
const createPingManager = (
  socket: WebSocket,
  pendingPosts: Map<number, (res: any) => void>,
  updateLatency: (ms: number) => void
) => {
  const ping = async () => {
    const id = nextPostId();
    const start = performance.now();

    const response = await new Promise((resolve) => {
      pendingPosts.set(id, resolve);
      socket.send(
        JSON.stringify({
          method: "post",
          id,
          request: { type: "info", payload: { type: "exchangeStatus" } },
        })
      );
    });

    if (response) {
      updateLatency(performance.now() - start);
    }
  };

  return setInterval(ping, __DEV__ ? 4200 : 10000);
};

export const useHyperliquidStore = create<HLStoreState>((set, get) => {
  const transport = new hl.WebSocketTransport({ isTestnet: true });
  const client = new hl.SubscriptionClient({ transport });

  const registry = new Map<string, Set<HLSubscriptionHandler>>();
  const subscriptions = new Map<string, { unsubscribe: () => Promise<void> }>();
  const pendingPosts = new Map<number, (res: any) => void>();

  set({ connectionState: "connecting", latencyMs: null });

  // Setup connection state handlers
  transport.socket.addEventListener("open", () => {
    set({ connectionState: "connected" });
  });

  transport.socket.addEventListener("close", () => {
    set({ connectionState: "disconnected" });
    clearPendingState(registry, subscriptions, pendingPosts, "socket_closed_before_response");
  });

  transport.socket.addEventListener("error", () => {
    set({ connectionState: "disconnected" });
    clearPendingState(registry, subscriptions, pendingPosts, "socket_error_before_response");
  });

  // Setup message handler
  transport.socket.addEventListener(
    "message",
    createMessageHandler(registry, pendingPosts)
  );

  // Setup ping interval
  const waitForOpen = createWaitForOpen(transport.socket);
  createPingManager(transport.socket, pendingPosts, (ms) =>
    set({ latencyMs: ms })
  );

  return {
    client,
    transport,
    registry,
    subscriptions,
    pendingPosts,
    connectionState: "connecting",
    latencyMs: null,
    sendPost: async (req, id?: number) => {
      const requestId = id ?? nextPostId();
      await waitForOpen();
      return new Promise((resolve) => {
        pendingPosts.set(requestId, resolve);
        transport.socket.send(
          JSON.stringify({ method: "post", id: requestId, request: req })
        );
      });
    },
    reconnect: () => {
      const { connectionState } = get();
      if (connectionState === "disconnected") {
        try {
          set({ connectionState: "connecting" });
          // @ts-expect-error third arg is supported by rews implementation
          transport.socket?.close?.(4000, "manual reconnect", false);
        } catch (err) {
          console.warn("Failed to trigger HL reconnect", err);
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
  handler: HLSubscriptionHandler
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
  subscriptions: Map<string, { unsubscribe: () => Promise<void> }>
) => {
  const entry = registry.get(key);
  if (!entry) return;

  entry.delete(handler);
  if (entry.size === 0) {
    registry.delete(key);
    const sub = subscriptions.get(key);
    if (sub?.unsubscribe) {
      sub.unsubscribe().catch((err: unknown) =>
        console.warn(`Failed to unsubscribe ${key}`, err)
      );
    }
    subscriptions.delete(key);
  }
};

export function useHLSubscription(
  method: HLMethodName,
  params: any,
  handler: (data: any) => void,
  enabled = true
) {
  const { client, registry, subscriptions, connectionState } =
    useHyperliquidStore(
      useShallow((s) => ({
        client: s.client,
        registry: s.registry,
        subscriptions: s.subscriptions,
        connectionState: s.connectionState,
      }))
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
        createSubscription(client, method, param, key, registry, subscriptions, handler);
      }

      return key;
    });

    return () => {
      keys.forEach((key) =>
        cleanupSubscription(key, handler, registry, subscriptions)
      );
    };
  }, [enabled, method, handler, JSON.stringify(params), connectionState]);
}

export function useHyperliquidRequests() {
  const sendPost = useHyperliquidStore((s) => s.sendPost);
  return { sendRequest: sendPost };
}
