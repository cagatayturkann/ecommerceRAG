const test = require('node:test');
const assert = require('node:assert/strict');
const { costMicroUsd, monthKey, monthlyBudgetMicroUsd } = require('../services/budgetService');

const withBudget = (value, fn) => {
  const previous = process.env.MONTHLY_BUDGET_USD;
  if (value === undefined) delete process.env.MONTHLY_BUDGET_USD;
  else process.env.MONTHLY_BUDGET_USD = value;
  try {
    return fn();
  } finally {
    if (previous === undefined) delete process.env.MONTHLY_BUDGET_USD;
    else process.env.MONTHLY_BUDGET_USD = previous;
  }
};

test('prices an Opus answer from its usage', () => {
  // 1,000 input tokens at $4/1M = 4,000 micro-dollars; 200 output tokens at $20/1M = 4,000.
  const cost = costMicroUsd('claude-opus-5-5', {
    model: 'claude-opus-5-5',
    usage: { input_tokens: 1000, output_tokens: 200 },
  });
  assert.equal(cost, 8000);
});

test('prices a Haiku rewrite and rounds up', () => {
  // 300 * 0.1 + 15 * 0.5 = 37.5 -> 38
  const cost = costMicroUsd('claude-haiku-5-5', {
    model: 'claude-haiku-5-5',
    usage: { input_tokens: 300, output_tokens: 15 },
  });
  assert.equal(cost, 38);
});

test('counts cache writes and reads', () => {
  const cost = costMicroUsd('claude-opus-5-5', {
    model: 'claude-opus-5-5',
    usage: { input_tokens: 0, cache_creation_input_tokens: 100, cache_read_input_tokens: 1000, output_tokens: 0 },
  });
  assert.equal(cost, 100 * 4 * 1.25 + 1000 * 0.2);
});

test('charges an unknown or fallback model at the highest price', () => {
  const usage = { input_tokens: 1000, output_tokens: 100 };
  const served = costMicroUsd('claude-opus-5-5', { model: 'claude-some-fallback', usage });
  assert.equal(served, 1000 * 8 + 100 * 40);
  const requested = costMicroUsd('claude-unknown', { model: 'claude-haiku-5-5', usage });
  assert.equal(requested, 1000 * 8 + 100 * 40);
});

test('missing usage costs nothing', () => {
  assert.equal(costMicroUsd('claude-opus-5-5', { model: 'claude-opus-5-5' }), 0);
});

test('month key is the UTC calendar month', () => {
  assert.equal(monthKey(new Date('2026-11-30T23:59:59Z')), '2026-11');
  assert.equal(monthKey(new Date('2026-12-01T00:00:00Z')), '2026-12');
});

test('budget defaults to 15 USD and reads MONTHLY_BUDGET_USD', () => {
  assert.equal(withBudget(undefined, monthlyBudgetMicroUsd), 15_000_000);
  assert.equal(withBudget('2.5', monthlyBudgetMicroUsd), 2_500_000);
  assert.equal(withBudget('0', monthlyBudgetMicroUsd), 0);
});

test('rejects an invalid budget', () => {
  assert.throws(() => withBudget('abc', monthlyBudgetMicroUsd), /MONTHLY_BUDGET_USD/);
  assert.throws(() => withBudget('-1', monthlyBudgetMicroUsd), /MONTHLY_BUDGET_USD/);
});
