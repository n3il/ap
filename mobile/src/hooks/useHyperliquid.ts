import { create } from "zustand";
import "fast-text-encoding";
import "event-target-polyfill";
import * as hl from "@nktkas/hyperliquid";
import { useEffect } from "react";

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
  registry: Map<string, Set<HLSubscriptionHandler>>;
  pendingPosts: Map<number, (res: any) => void>;
  sendPost: (req: any, id?: number) => Promise<any>;
  connectionState: "connecting" | "connected" | "disconnected";
  latencyMs: number | null;
}

export const useHyperliquidStore = create<HLStoreState>((set, get) => {
  const client = new hl.SubscriptionClient({
    transport: new hl.WebSocketTransport(),
  });

  const registry = new Map<string, Set<HLSubscriptionHandler>>();
  const pendingPosts = new Map<number, (res: any) => void>();

  set({ connectionState: "connecting", latencyMs: null });

  client.transport.socket.addEventListener("open", () => {
    set({ connectionState: "connected" });
  });

  client.transport.socket.addEventListener("close", () => {
    set({ connectionState: "disconnected" });
  });

  client.transport.socket.addEventListener("error", () => {
    set({ connectionState: "disconnected" });
  });

  client.transport.socket.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);

    if (msg.channel === "post") {
      const resolver = pendingPosts.get(msg.data.id);
      if (resolver) {
        resolver(msg.data.response);
        pendingPosts.delete(msg.data.id);
      }
      return;
    }

    if (msg.channel === "subscriptionResponse") {
      const key = JSON.stringify(msg.data.subscription);
      const handlers = registry.get(key);
      if (!handlers) return;
      handlers.forEach((h) => h(msg.data));
    }
  });

  const ping = async () => {
    const id = Date.now();
    const start = performance.now();

    const p = new Promise((resolve) => {
      pendingPosts.set(id, resolve);
    });

    client.transport.socket.send(
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

  setInterval(ping, 10000);

  return {
    client,
    registry,
    pendingPosts,
    connectionState: "connecting",
    latencyMs: null,
    sendPost: (req, id = Date.now()) =>
      new Promise((resolve) => {
        pendingPosts.set(id, resolve);
        client.transport.socket.send(
          JSON.stringify({ method: "post", id, request: req })
        );
      }),
  };
});

export function useHLSubscription(
  method: HLMethodName,
  params: any,
  handler: (data: any) => void,
  enabled = true
) {
  const { client, registry } = useHyperliquidStore.getState();
  const key = JSON.stringify({ method, params });

  useEffect(() => {
    if (!enabled) return;

    const entry = registry.get(key);

    if (!entry) {
      const set = new Set<HLSubscriptionHandler>();
      set.add(handler);
      registry.set(key, set);

      client[method](params, (data: any) => {
        const handlers = registry.get(key);
        if (!handlers) return;
        handlers.forEach((h) => h(data));
      });
    } else {
      entry.add(handler);
    }

    return () => {
      const entry = registry.get(key);
      if (!entry) return;
      entry.delete(handler);
      if (entry.size === 0) registry.delete(key);
    };
  }, [enabled, key, handler]);
}

export function useHyperliquidRequests() {
  const sendPost = useHyperliquidStore((s) => s.sendPost);
  return { sendRequest: sendPost };
}
