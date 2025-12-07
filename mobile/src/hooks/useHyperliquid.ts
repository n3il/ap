import "event-target-polyfill";
import "fast-text-encoding";
import * as hl from "@nktkas/hyperliquid";
import { create } from "zustand";
import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";

type HLClientInstance = InstanceType<typeof hl.SubscriptionClient>;

type HLMethodName = keyof {
  [K in keyof HLClientInstance as HLClientInstance[K] extends (
    params: any,
    listener: any
  ) => any
    ? K
    : never]: HLClientInstance[K];
};

type HLSubscriptionHandler = (data: any) => void;

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

let postCounter = 0;
const nextPostId = () => {
  postCounter = (postCounter + 1) % Number.MAX_SAFE_INTEGER;
  if (postCounter === 0) postCounter = 1;
  return postCounter;
};

export const useHyperliquidStore = create<HLStoreState>((set, get) => {
  const transport = new hl.WebSocketTransport({ isTestnet: true });
  const client = new hl.SubscriptionClient({
    transport,
  });

  const registry = new Map<string, Set<HLSubscriptionHandler>>();
  const subscriptions = new Map<string, { unsubscribe: () => Promise<void> }>();
  const pendingPosts = new Map<number, (res: any) => void>();

  set({ connectionState: "connecting", latencyMs: null });

  transport.socket.addEventListener("open", () => {
    set({ connectionState: "connected" });
  });

  transport.socket.addEventListener("close", () => {
    set({ connectionState: "disconnected" });
    // drop registry/subscriptions so downstream hooks can resubscribe cleanly
    registry.clear();
    subscriptions.clear();
    pendingPosts.forEach((resolver) =>
      resolver({ error: "socket_closed_before_response" })
    );
    pendingPosts.clear();
  });

  transport.socket.addEventListener("error", () => {
    set({ connectionState: "disconnected" });
    registry.clear();
    subscriptions.clear();
    pendingPosts.forEach((resolver) =>
      resolver({ error: "socket_error_before_response" })
    );
    pendingPosts.clear();
  });

  const waitForOpen = () =>
    new Promise<void>((resolve, reject) => {
      if (transport.socket.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      const handleOpen = () => {
        cleanup();
        resolve();
      };

      const handleClose = () => {
        cleanup();
        reject(new Error("Hyperliquid socket closed before open"));
      };

      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error("Hyperliquid socket open timeout"));
      }, 5000);

      const cleanup = () => {
        clearTimeout(timeout);
        transport.socket.removeEventListener("open", handleOpen);
        transport.socket.removeEventListener("close", handleClose);
      };

      transport.socket.addEventListener("open", handleOpen);
      transport.socket.addEventListener("close", handleClose);
    });

  transport.socket.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    if (msg.channel === "post") {
      const resolver = pendingPosts.get(msg.data.id);
      if (resolver) {
        resolver(msg.data.response);
        pendingPosts.delete(msg.data.id);
      }
      return;
    }

    const key = msg.channel;
    const handlers = registry.get(key);
    if (!handlers) return;
    handlers.forEach((h) => h(msg.data));
  });

  const ping = async () => {
    const id = nextPostId();
    const start = performance.now();

    const p = new Promise((resolve) => {
      pendingPosts.set(id, resolve);
    });

    transport.socket.send(
      JSON.stringify({
        method: "post",
        id,
        request: { type: "info", payload: { type: "exchangeStatus" } },
      })
    );

    const res = await p;
    if (res) {
      const end = performance.now();
      set({ latencyMs: end - start });
    }
  };

  setInterval(ping, __DEV__ ? 1200 : 10000);

  return {
    client,
    transport,
    registry,
    subscriptions,
    pendingPosts,
    connectionState: "connecting",
    latencyMs: null,
    sendPost: async (req, id?: number) => {
      const requestId = typeof id === "number" ? id : nextPostId();
      await waitForOpen();
      return new Promise((resolve) => {
        pendingPosts.set(requestId, resolve);
        transport.socket.send(
          JSON.stringify({ method: "post", id: requestId, request: req })
        );
      });
    },
    reconnect: () => {
      if (connectionState === "disconnected") {
        try {
          set({ connectionState: "connecting" });
          // Close without terminating so the ReconnectingWebSocket can reopen
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
      })),
    );

  useEffect(() => {
    if (!enabled || connectionState !== "connected") return;

    const paramList = Array.isArray(params) ? params : [params];
    if (!paramList.length) return;

    const keys: string[] = [];

    paramList.forEach((param) => {
      const key = buildSubKey(method as string, param);
      keys.push(key);

      const entry = registry.get(key);

      if (!entry) {
        const set = new Set<HLSubscriptionHandler>();
        set.add(handler);
        registry.set(key, set);

        // @ts-expect-error
        client[method](param, (data: any) => {
          const handlers = registry.get(key);
          if (!handlers) return;
          handlers.forEach((h) => h(data));
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
      } else {
        entry.add(handler);
      }
    });

    return () => {
      keys.forEach((key) => {
        const entry = registry.get(key);
        if (entry) {
          entry.delete(handler);
            if (entry.size === 0) {
              registry.delete(key);
              const sub = subscriptions.get(key);
              if (sub?.unsubscribe) {
                sub
                .unsubscribe()
                .catch((err: unknown) =>
                  console.warn(`Failed to unsubscribe ${key}`, err)
                );
            }
            subscriptions.delete(key);
          }
        }
      });
    };
  }, [enabled, method, handler, JSON.stringify(params), connectionState]);
}

export function useHyperliquidRequests() {
  const sendPost = useHyperliquidStore((s) => s.sendPost);
  return { sendRequest: sendPost };
}
