// ── Investable surplus math ──
//
// Pure functions only. This module answers "how much money is free to
// invest?" — an AMOUNT ONLY. It must never suggest where that money should
// go (no tickers, no accounts, no timing) — that's a hard product guardrail.

const round2 = (n) => Math.round(n * 100) / 100;

// Normalize any recurrence frequency down to "how much per month" so
// amounts on different schedules (weekly paycheck vs. monthly rent) can be
// compared and summed on a common basis.
const toMonthlyAmount = (amount, frequency) => {
  switch (frequency) {
    case 'weekly':
      return (amount * 52) / 12;
    case 'biweekly':
      return (amount * 26) / 12;
    case 'semimonthly':
      return amount * 2;
    case 'yearly':
      return amount / 12;
    case 'monthly':
    default:
      return amount;
  }
};

/**
 * Roll up a user's monthly income, fixed bills, variable-expense estimates,
 * debt payments, and goal contributions into a single investable-surplus
 * figure, plus the breakdown that produced it (useful for an AI layer or
 * frontend to explain the number later — but the number itself is computed
 * here, deterministically, not by AI).
 *
 * incomeSources: array of IncomeSource docs
 * bills: array of Bill docs
 * variableExpenses: array of VariableExpense docs
 * debts: array of Debt docs
 * goalContributions: array of numbers (each goal's requiredPerPeriod,
 *   already normalized to monthly by the caller — see engine.js)
 */
const calculateMonthlySurplus = ({ incomeSources, bills, variableExpenses, debts, goalContributions }) => {
  const monthlyIncome = incomeSources.reduce((sum, income) => {
    const amount = income.type === 'irregular'
      ? income.estimatedMonthlyAmount
      : toMonthlyAmount(income.amount, income.frequency);
    return sum + amount;
  }, 0);

  const monthlyBills = bills.reduce((sum, bill) => sum + toMonthlyAmount(bill.amount, bill.frequency), 0);

  const monthlyVariableExpenses = variableExpenses.reduce((sum, v) => sum + v.estimatedMonthlyAmount, 0);

  const monthlyDebtPayments = debts.reduce((sum, debt) => sum + debt.minimumPayment + (debt.extraPayment || 0), 0);

  const monthlyGoalContributions = goalContributions.reduce((sum, contribution) => sum + contribution, 0);

  const investableSurplus =
    monthlyIncome - monthlyBills - monthlyVariableExpenses - monthlyDebtPayments - monthlyGoalContributions;

  return {
    monthlyIncome: round2(monthlyIncome),
    monthlyBills: round2(monthlyBills),
    monthlyVariableExpenses: round2(monthlyVariableExpenses),
    monthlyDebtPayments: round2(monthlyDebtPayments),
    monthlyGoalContributions: round2(monthlyGoalContributions),
    investableSurplus: round2(investableSurplus),
  };
};

module.exports = { toMonthlyAmount, calculateMonthlySurplus };
