# Shared Libraries - Supabase Edge Functions

This directory contains shared utilities and modules used across all Supabase edge functions.

## Directory Structure

```
_shared/
├── lib/           # Common utilities and business logic
│   ├── auth.ts    # Authentication & authorization
│   ├── http.ts    # HTTP response helpers
│   ├── validation.ts  # Input validation
│   ├── pnl.ts     # PnL calculations (pure functions)
│   ├── parser.ts  # Trade action parsing
│   ├── ledger.ts  # Trading account & ledger management
│   ├── prompts.ts # Prompt fetching from database
│   └── types.ts   # Shared TypeScript types
├── llm/           # LLM-related functionality
│   ├── providers.ts   # Unified LLM provider interface
│   └── types.ts       # LLM-specific types
├── anthropic.ts   # Anthropic API client
├── deepseek.ts    # Deepseek API client
├── gemini.ts      # Google Gemini API client
├── openai.ts      # OpenAI API client
├── hyperliquid.ts # Hyperliquid trading API
├── supabase.ts    # Supabase client creation
└── cors.ts        # CORS headers
```

## Module Overview

### `lib/` - Common Utilities

#### `auth.ts` - Authentication
Handles user and service authentication.

**Functions:**
- `authenticateRequest(authHeader)` - Validates JWT or service key, returns auth context
- `validateUserAuth(authHeader)` - Validates user JWT, returns user ID

**Example:**
```typescript
import { authenticateRequest } from '../_shared/lib/auth.ts';

const authContext = await authenticateRequest(req.headers.get('Authorization'));
// { supabase, userId, isServiceRequest }
```

#### `http.ts` - HTTP Helpers
Standardized HTTP response creation.

**Functions:**
- `successResponse(data, status?)` - Creates success JSON response
- `errorResponse(error, status?)` - Creates error JSON response
- `corsPreflightResponse()` - Returns CORS preflight response
- `handleError(error)` - Intelligently handles errors with appropriate status codes

**Example:**
```typescript
import { successResponse, handleError } from '../_shared/lib/http.ts';

try {
  const result = await doSomething();
  return successResponse(result);
} catch (error) {
  return handleError(error); // Automatically determines status code
}
```

#### `validation.ts` - Input Validation
Reusable validation functions.

**Functions:**
- `validateRequiredFields(data, fields)` - Ensures required fields exist
- `validatePositiveNumber(value, fieldName)` - Validates positive numbers
- `validateNumber(value, fieldName)` - Validates any number
- `validateAgentId(agentId)` - Validates agent ID format
- `sanitizeMetadata(metadata)` - Sanitizes objects for JSON storage

**Example:**
```typescript
import { validateRequiredFields, validatePositiveNumber } from '../_shared/lib/validation.ts';

validateRequiredFields(body, ['name', 'amount']);
const amount = validatePositiveNumber(body.amount, 'amount');
```

#### `pnl.ts` - PnL Calculations
**Pure functions** for profit/loss calculations (no side effects).

**Functions:**
- `calculateTradePnL(entry, exit, size, side, leverage)` - Single trade PnL
- `calculateRealizedPnL(closedTrades)` - Sum of closed profits
- `calculateUnrealizedPnL(openPositions, priceMap)` - Current position values
- `calculateTotalMarginUsed(positions, priceMap)` - Total margin calculation
- `calculatePnLMetrics(capital, closed, open, market)` - Complete account metrics

**Example:**
```typescript
import { calculatePnLMetrics } from '../_shared/lib/pnl.ts';

const metrics = calculatePnLMetrics(10000, closedTrades, openPositions, marketData);
// { realizedPnl, unrealizedPnl, accountValue, marginUsed, remainingCash }
```

#### `parser.ts` - Trade Action Parsing
Parses trade action strings.

**Functions:**
- `parseTradeAction(action)` - Parses "OPEN_LONG_BTC_10X" style actions

**Example:**
```typescript
import { parseTradeAction } from '../_shared/lib/parser.ts';

const action = parseTradeAction("OPEN_LONG_BTC_10X");
// { type: 'OPEN', asset: 'BTC-PERP', side: 'LONG', size: 0.01, leverage: 10 }
```

#### `ledger.ts` - Trading Account Management
Manages trading accounts and ledger entries.

**Functions:**
- `ensureTradingAccount(params)` - Gets or creates trading account
- `recordLedgerExecution(params)` - Records in all ledger tables

**Example:**
```typescript
import { ensureTradingAccount, recordLedgerExecution } from '../_shared/lib/ledger.ts';

const account = await ensureTradingAccount({
  supabase, userId, agentId, agentName, type: 'real'
});

await recordLedgerExecution({
  supabase, accountId, agentId, userId,
  symbol: 'BTC-PERP', executionSide: 'BUY',
  quantity: 0.1, price: 50000, fee: 5
});
```

#### `prompts.ts` - Prompt Fetching
Fetches prompts from the database.

**Functions:**
- `fetchPrompt(supabase, agent, promptType)` - Fetches from database with priority: agent custom → user default → global default

**Example:**
```typescript
import { fetchPrompt } from '../_shared/lib/prompts.ts';

const prompt = await fetchPrompt(supabase, agent, 'MARKET_SCAN');
// { system_instruction: "...", user_template: "..." }
```

### `llm/` - LLM Functionality

#### `providers.ts` - Unified LLM Interface
Single interface for all LLM providers.

**Functions:**
- `callLLMProvider(provider, prompt, model?)` - Routes to correct provider
- `determinePromptType(hasOpenPositions)` - Determines prompt type

**Example:**
```typescript
import { callLLMProvider } from '../_shared/llm/providers.ts';

const response = await callLLMProvider('openai', prompt, 'gpt-4');
// { text: "...", action: "OPEN_LONG_BTC" }
```

#### `types.ts` - LLM Types
TypeScript types for LLM operations.

**Types:**
- `PromptType` - 'POSITION_REVIEW' | 'MARKET_SCAN'
- `LLMProvider` - 'google' | 'openai' | 'anthropic' | 'deepseek'
- `LLMPrompt` - { systemInstruction, userQuery }
- `LLMResponse` - { text, action }

## Design Principles

### 1. **Single Responsibility**
Each module handles one aspect of functionality. Auth is separate from validation is separate from PnL.

### 2. **Pure Functions Where Possible**
Business logic (especially PnL calculations) uses pure functions:
- Same inputs → same outputs
- No side effects
- Easily testable without mocks

### 3. **Composability**
Small functions compose into larger workflows:
```typescript
const metrics = calculatePnLMetrics(capital, closed, open, market);
const prompt = determinePromptType(open.length > 0);
const response = await callLLMProvider(provider, prompt);
```

### 4. **Centralized Error Handling**
Use `handleError()` for consistent error responses:
```typescript
try {
  // ...
} catch (error) {
  return handleError(error); // Auto-determines 400/401/404/500
}
```

### 5. **Type Safety**
Shared types in `lib/types.ts` ensure consistency across functions.

## Usage Patterns

### Typical Edge Function Structure

```typescript
import { corsPreflightResponse, successResponse, handleError } from '../_shared/lib/http.ts';
import { validateUserAuth } from '../_shared/lib/auth.ts';
import { validateRequiredFields } from '../_shared/lib/validation.ts';

async function handleRequest(req: Request) {
  const userId = await validateUserAuth(req.headers.get('Authorization'));
  const body = await req.json();

  validateRequiredFields(body, ['field1', 'field2']);

  // Do work
  return { success: true, data: result };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();

  try {
    const result = await handleRequest(req);
    return successResponse(result);
  } catch (error) {
    return handleError(error);
  }
});
```

### Testing Pure Functions

Pure functions can be tested without mocks:

```typescript
import { calculateTradePnL } from '../_shared/lib/pnl.ts';
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";

Deno.test("calculateTradePnL - LONG position profit", () => {
  const pnl = calculateTradePnL(50000, 55000, 0.1, 'LONG', 10);
  assertEquals(pnl, 500); // 10% gain * 5000 position value * 10x leverage
});
```

## Migration Guide

When refactoring existing functions:

1. **Replace HTTP boilerplate:**
   ```typescript
   // Before
   return new Response(JSON.stringify({...}), {
     headers: { ...corsHeaders, 'Content-Type': 'application/json' },
     status: 200
   });

   // After
   return successResponse({...});
   ```

2. **Replace auth logic:**
   ```typescript
   // Before
   const supabase = createSupabaseClient(authHeader);
   const { data: { user }, error } = await supabase.auth.getUser();
   if (error || !user) throw new Error('Unauthorized');

   // After
   const userId = await validateUserAuth(authHeader);
   ```

3. **Replace validation:**
   ```typescript
   // Before
   if (!name || !amount) throw new Error('Missing fields');
   if (typeof amount !== 'number' || amount <= 0) throw new Error('Invalid amount');

   // After
   validateRequiredFields(body, ['name', 'amount']);
   const amount = validatePositiveNumber(body.amount, 'amount');
   ```

4. **Extract business logic to pure functions:**
   ```typescript
   // Before (in main function)
   const pnl = (exitPrice - entryPrice) / entryPrice * size * entryPrice * leverage;

   // After (use shared function)
   const pnl = calculateTradePnL(entryPrice, exitPrice, size, side, leverage);
   ```

## Benefits

- ✅ **Reduced Code Duplication** - Write once, use everywhere
- ✅ **Easier Testing** - Pure functions are trivial to test
- ✅ **Better Maintainability** - Changes in one place
- ✅ **Type Safety** - Shared types catch errors at compile time
- ✅ **Consistent Error Handling** - Automatic status code determination
- ✅ **Clearer Intent** - Function names document what they do
