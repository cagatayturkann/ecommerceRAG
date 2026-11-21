const BudgetMonth = require('../models/BudgetMonth');

// Monthly cap on Claude API spend for this demo. Once reached, /api/chat stops calling the API until the next
// month (UTC). In-flight requests can overshoot it by a few cents at most.
const DEFAULT_BUDGET_USD = 15;

// USD per 1M tokens (Anthropic first-party prices, checked 2026-11-22). Cache writes cost 1.25x input.
const PRICES = {
  'claude-opus-5-5': { input: 4, output: 20, cacheRead: 0.2 },
  'claude-haiku-5-5': { input: 0.1, output: 0.5, cacheRead: 0.1 },
};
// Unknown models (e.g. a server-side fallback answered) are charged at the highest current price,
// so the counter can overestimate but never underestimate.
const UNKNOWN_MODEL_PRICE = { input: 8, output: 40, cacheRead: 8 };

const monthlyBudgetMicroUsd = () => {
  const raw = process.env.MONTHLY_BUDGET_USD;
  const usd = raw === undefined || raw === '' ? DEFAULT_BUDGET_USD : Number(raw);
  if (!Number.isFinite(usd) || usd < 0) {
    throw new Error('MONTHLY_BUDGET_USD must be a non-negative number');
  }
  return Math.round(usd * 1e6);
};

// Fail at startup on a bad MONTHLY_BUDGET_USD instead of on the first chat request.
monthlyBudgetMicroUsd();

const monthKey = (date = new Date()) => date.toISOString().slice(0, 7);

/**
 * Cost of one Messages API response in micro-dollars (1 USD = 1,000,000).
 * @param {String} requestedModel - Model the request asked for
 * @param {Object} response - API response with `model` and `usage`
 * @returns {Number}
 */
const costMicroUsd = (requestedModel, response) => {
  const usage = response.usage || {};
  // A fallback model may have served the request; charge the more expensive of the two.
  const candidates = [requestedModel, response.model].map((model) => PRICES[model] || UNKNOWN_MODEL_PRICE);
  const price = candidates.reduce((a, b) => (a.input + a.output >= b.input + b.output ? a : b));

  // Price per 1M tokens equals micro-dollars per token.
  return Math.ceil(
    (usage.input_tokens || 0) * price.input +
      (usage.cache_creation_input_tokens || 0) * price.input * 1.25 +
      (usage.cache_read_input_tokens || 0) * price.cacheRead +
      (usage.output_tokens || 0) * price.output
  );
};

/**
 * True when this month's recorded spend has reached the budget. A database error propagates,
 * so the caller fails closed instead of calling the API without a budget check.
 */
const isExhausted = async () => {
  const month = await BudgetMonth.findById(monthKey()).lean();
  return (month?.spentMicroUsd || 0) >= monthlyBudgetMicroUsd();
};

/**
 * Adds the cost of one API response to this month's total (atomic upsert).
 */
const recordUsage = async (requestedModel, response) => {
  const cost = costMicroUsd(requestedModel, response);
  if (cost <= 0) return;
  await BudgetMonth.updateOne({ _id: monthKey() }, { $inc: { spentMicroUsd: cost } }, { upsert: true });
};

module.exports = {
  costMicroUsd,
  monthKey,
  monthlyBudgetMicroUsd,
  isExhausted,
  recordUsage,
};
