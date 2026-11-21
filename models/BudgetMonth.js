const mongoose = require('mongoose');

// One document per calendar month (UTC): _id is "YYYY-MM", spend is in micro-dollars so $inc stays exact.
const budgetMonthSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    spentMicroUsd: { type: Number, required: true, default: 0 },
  },
  { versionKey: false }
);

module.exports = mongoose.model('BudgetMonth', budgetMonthSchema);
