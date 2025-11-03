const WS_URL = 'wss://api.hyperliquid.xyz/ws';
const DEFAULT_COINS = ['BTC', 'ETH', 'SOL'];
const COIN_METADATA = {
  BTC: { symbol: 'BTC', name: 'Bitcoin' },
  ETH: { symbol: 'ETH', name: 'Ethereum' },
  SOL: { symbol: 'SOL', name: 'Solana' },
};
const RECONNECT_DELAY_MS = 5000;

// Debug flag - set to false in production
const DEBUG = false;
const log = (...args) => DEBUG && console.log('[HyperLiquid]', ...args);
const logError = (...args) => console.log('[HyperLiquid ERROR]', ...args);

let socket = null;
let reconnectTimer = null;
let isConnecting = false;
let latestRaw = null;

const listeners = new Set();

const clearSocket = () => {
  if (socket) {
    socket.onopen = null;
    socket.onclose = null;
    socket.onmessage = null;
    socket.onerror = null;
    try {
      socket.close();
    } catch {
      // no-op if socket already closed
    }
  }
  socket = null;
  isConnecting = false;
};

const notifyListeners = (payload) => {
  listeners.forEach((listener) => {
    const assets = listener.coins.map((coin) => {
      const upper = coin.toUpperCase();
      const metadata = COIN_METADATA[upper] ?? { symbol: upper, name: upper };
      const mid = payload?.mids?.[upper];
      const price = typeof mid === 'string' ? parseFloat(mid) : null;

      return {
        id: upper,
        symbol: metadata.symbol,
        name: metadata.name,
        price: Number.isFinite(price) ? price : null,
        change24h: null,
      };
    });

    listener.onUpdate?.({
      assets,
      timestamp: Date.now(),
      raw: payload,
    });
  });
};

const notifyError = (error) => {
  listeners.forEach((listener) => {
    listener.onError?.(JSON.stringify(error));
  });
};

const scheduleReconnect = () => {
  if (reconnectTimer || isConnecting || !listeners.size) {
    return;
  }

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    if (listeners.size) {
      initializeSocket();
    }
  }, RECONNECT_DELAY_MS);
};

const sendSubscription = () => {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    log('Cannot send subscription - socket not ready:', socket?.readyState);
    return;
  }

  const subscription = {
    method: 'subscribe',
    subscription: { type: 'allMids' },
  };

  try {
    log('Sending subscription:', subscription);
    socket.send(JSON.stringify(subscription));
  } catch (error) {
    logError('Failed to send subscription:', error);
    notifyError(error);
  }
};

const handleMessage = (event) => {
  try {
    const payload = JSON.parse(event.data);
    log('Received message:', { channel: payload?.channel, hasData: !!payload?.data });
    if (payload?.channel === 'allMids' && payload?.data) {
      latestRaw = payload.data;
      log('Updating prices - received', Object.keys(payload.data.mids || {}).length, 'assets');
      notifyListeners(payload.data);
    } else if (payload?.channel === 'error') {
      logError('Error from server:', payload?.data?.error);
      notifyError(new Error(payload?.data?.error ?? 'Hyperliquid websocket error'));
    } else {
      log('Unhandled message channel:', payload?.channel);
    }
  } catch (error) {
    logError('Failed to parse message:', error);
    notifyError(error);
  }
};

function initializeSocket() {
  if (isConnecting || socket?.readyState === WebSocket.OPEN || !listeners.size) {
    log('Skipping socket init:', { isConnecting, socketState: socket?.readyState, listenerCount: listeners.size });
    return;
  }

  if (typeof WebSocket === 'undefined') {
    logError('WebSocket not supported in this environment');
    notifyError(new Error('WebSocket not supported in this environment'));
    return;
  }

  log('Initializing WebSocket connection to', WS_URL);
  isConnecting = true;
  clearTimeout(reconnectTimer);
  reconnectTimer = null;

  socket = new WebSocket(WS_URL);

  socket.onopen = () => {
    log('WebSocket connected successfully');
    isConnecting = false;
    sendSubscription();
    if (latestRaw) {
      log('Replaying cached data to new listeners');
      notifyListeners(latestRaw);
    }
  };

  socket.onmessage = handleMessage;

  socket.onerror = (event) => {
    logError('WebSocket error:', event);
    notifyError(
      event?.message
        ? new Error(event.message)
        : new Error('Hyperliquid websocket connection error')
    );
  };

  socket.onclose = (event) => {
    log('WebSocket closed:', { code: event?.code, reason: event?.reason, wasClean: event?.wasClean });
    isConnecting = false;
    if (listeners.size) {
      log('Scheduling reconnect in', RECONNECT_DELAY_MS, 'ms');
      // scheduleReconnect();
    }
  };
}

const ensureConnection = () => {
  if (!listeners.size) {
    return;
  }

  if (!socket || socket.readyState === WebSocket.CLOSED) {
    clearSocket();
  }

  if (!socket || socket.readyState !== WebSocket.OPEN) {
    initializeSocket();
  }
};

export const priceService = {
  subscribeToMarketSnapshot(coins = DEFAULT_COINS, handlers = {}) {
    const listener = {
      coins: coins.map((coin) => coin.toUpperCase()),
      onUpdate: handlers.onUpdate,
      onError: handlers.onError,
    };

    log('New subscription for coins:', listener.coins);
    listeners.add(listener);
    log('Total listeners:', listeners.size);
    ensureConnection();

    if (latestRaw) {
      log('Sending cached data to new subscriber');
      notifyListeners(latestRaw);
    }

    return () => {
      log('Unsubscribing listener for coins:', listener.coins);
      listeners.delete(listener);
      if (!listeners.size) {
        log('No more listeners - cleaning up socket');
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
        clearSocket();
        latestRaw = null;
      }
    };
  },

  refresh() {
    log('Manual refresh requested');
    if (!listeners.size) {
      log('No listeners - skipping refresh');
      return;
    }

    if (socket && socket.readyState === WebSocket.OPEN) {
      log('Closing socket to force reconnect');
      socket.close();
    } else {
      log('Initializing fresh socket');
      initializeSocket();
    }
  },
};
