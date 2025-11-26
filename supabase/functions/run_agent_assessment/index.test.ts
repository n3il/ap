import type { LLMTradeAction } from "../_shared/llm/types.ts";

function assertEquals(actual: unknown, expected: unknown, msg?: string) {
  const pass =
    Number.isNaN(actual) && Number.isNaN(expected)
      ? true
      : JSON.stringify(actual) === JSON.stringify(expected);
  if (!pass) {
    const errorMessage = msg ??
      `Assertion failed: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`;
    throw new Error(errorMessage);
  }
}

type StubFn<Args extends unknown[], Return> = ((...args: Args) => Return) & {
  calls: Args[];
};

function stubFn<Args extends unknown[], Return>(
  implementation: (...args: Args) => Return,
): StubFn<Args, Return> {
  const calls: Args[] = [];
  const fn = ((...args: Args) => {
    calls.push(args);
    return implementation(...args);
  }) as StubFn<Args, Return>;
  fn.calls = calls;
  return fn;
}

const { runAgentAssessment } = await import("./index.ts");

Deno.test("runAgentAssessment orchestrates active agent workflow", async () => {
  const tradeActions: LLMTradeAction[] = [
    { asset: "BTC", action: "OPEN_LONG", leverage: 2 },
    { asset: "SOL", action: "CLOSE_LONG" },
  ];

  const authenticateRequest = stubFn(async () => ({
    userId: "user-1",
    isServiceRequest: true,
  }));
  const fetchAndValidateAgent = stubFn(async () =>
    ({
      id: "agent-123",
      user_id: "user-1",
      name: "Test Agent",
      initial_capital: "10000",
      llm_provider: "openai",
      model_name: "gpt-4o",
      simulate: false,
      prompt_id: null,
      is_active: true,
    } as any)
  );
  const isAgentActive = stubFn(() => true);
  const fetchOpenPositions = stubFn(async () =>
    [{ asset: "BTC", entry_price: 50000, size: 0.1, leverage: 2, side: "LONG" }] as any
  );
  const fetchClosedTrades = stubFn(async () => [{ realized_pnl: 25 }] as any);
  const fetchMarketData = stubFn(async () =>
    ({
      marketData: [{ symbol: "BTC", asset: "BTC", price: 51000, change_24h: 1.2 }],
      candleData: { BTC: [] },
    })
  );
  const calculatePnLMetrics = stubFn(() => ({
    realizedPnl: 25,
    unrealizedPnl: 10,
    accountValue: 1035,
    marginUsed: 100,
    remainingCash: 935,
  }));
  const createSupabaseServiceClient = stubFn(() => ({} as any));
  const fetchPrompt = stubFn(async () =>
    ({
      system_instruction: "sys",
      user_template: "tmpl",
    } as any)
  );
  const buildPrompt = stubFn(() => ({
    systemInstruction: "sys",
    userQuery: "user prompt",
  }));
  const callLLMProvider = stubFn(async () => ({ text: "llm text", parsed: { tradeActions } as any }));
  const createMarketSnapshot = stubFn(() => ({ snapshot: true } as any));
  const saveAssessment = stubFn(async () =>
    ({
      id: "assessment-1",
      agent_id: "agent-123",
      timestamp: new Date().toISOString(),
      market_data_snapshot: {},
      llm_prompt_used: "",
      llm_response_text: "llm text",
      parsed_llm_response: {},
      trade_action_taken: "OPEN_LONG BTC",
    }) as any
  );
  const savePnLSnapshot = stubFn(async () => {});
  const executeOpenTrade = stubFn(async () => ({ status: "opened" }));
  const executeCloseTrade = stubFn(async () => ({ status: "closed" }));

  const result = await runAgentAssessment("agent-123", "Bearer token", {
    authenticateRequest,
    fetchAndValidateAgent,
    isAgentActive,
    fetchOpenPositions,
    fetchClosedTrades,
    fetchMarketData,
    calculatePnLMetrics,
    fetchPrompt,
    buildPrompt,
    callLLMProvider,
    createMarketSnapshot,
    saveAssessment,
    savePnLSnapshot,
    executeOpenTrade,
    executeCloseTrade,
    createSupabaseServiceClient,
  });

  assertEquals(result.success, true);
  assertEquals(result.assessment_id, "assessment-1");
  assertEquals(result.agent_name, "Test Agent");
  assertEquals(result.simulate, false);
  assertEquals(result.trade_actions, tradeActions);
  assertEquals(result.trade_results?.length, 2);
  assertEquals((result.trade_results ?? [])[0].result.status, "opened");
  assertEquals((result.trade_results ?? [])[1].result.status, "closed");
  assertEquals(savePnLSnapshot.calls.length, 1);
  assertEquals(executeOpenTrade.calls.length, 1);
  assertEquals(executeCloseTrade.calls.length, 1);
});

Deno.test("runAgentAssessment skips inactive agents early", async () => {
  const authenticateRequest = stubFn(async () => ({
    userId: "user-1",
    isServiceRequest: true,
  }));
  const fetchAndValidateAgent = stubFn(async () =>
    ({ id: "agent-123", name: "Inactive Agent", is_active: null } as any)
  );
  const isAgentActive = stubFn(() => false);
  const fetchOpenPositions = stubFn(() => {
    throw new Error("should not fetch open positions for inactive agent");
  });
  const fetchClosedTrades = stubFn(() => {
    throw new Error("should not fetch closed trades for inactive agent");
  });
  const fetchMarketData = stubFn(() => {
    throw new Error("should not fetch market data for inactive agent");
  });

  const result = await runAgentAssessment("agent-123", "Bearer token", {
    authenticateRequest,
    fetchAndValidateAgent,
    isAgentActive,
    fetchOpenPositions,
    fetchClosedTrades,
    fetchMarketData,
  });

  assertEquals(result.success, true);
  assertEquals(result.skipped, true);
  assertEquals(result.message, "Agent inactive");
});
