// ── Projection engine orchestrator ──
//
// This is the ONLY file in server/utils/projection/ that touches Mongoose.
// Its job is narrow: pull a user's raw facts (bills, debts, goals, income,
// variable expenses) out of the database, translate them into the plain
// inputs the pure math modules expect, call those modules, and hand back
// the result. Nothing computed here is ever saved back to the database —
// every call recomputes from scratch, so the projection is always in sync
// with whatever the user's data currently says.

const User = require('../../models/User');
const Bill = require('../../models/Bill');
const Debt = require('../../models/Debt');
const Goal = require('../../models/Goal');
const IncomeSource = require('../../models/IncomeSource');
const VariableExpense = require('../../models/VariableExpense');

const { normalizeToUTCMidnight, addDays, generateOccurrences } = require('./dateUtils');
const { simulateCashFlow, buildDailyVariableExpenseTotal, detectShortfalls } = require('./cashFlow');
const { projectDebtPayoff, monthsSavedWithExtra } = require('./debtPayoff');
const { requiredContribution } = require('./goals');
const { calculateMonthlySurplus } = require('./surplus');

// Fetch everything owned by this user in one parallel round trip.
// .lean() returns plain JS objects instead of Mongoose documents, since the
// math modules only need plain data and never save anything back.
const getUserContext = async (userId) => {
  const [user, bills, debts, goals, incomeSources, variableExpenses] = await Promise.all([
    User.findById(userId).lean(),
    Bill.find({ user: userId }).lean(),
    Debt.find({ user: userId }).lean(),
    Goal.find({ user: userId }).lean(),
    IncomeSource.find({ user: userId }).lean(),
    VariableExpense.find({ user: userId }).lean(),
  ]);
  return { user, bills, debts, goals, incomeSources, variableExpenses };
};

// Work out which date to anchor recurring pay-cycle math to, in priority
// order: an explicit override from the query string, the user's stored
// payCycle.anchorDate, or (last resort) the date their account was created.
// The fallback case is flagged in `warnings` so the caller knows the
// projection is only approximate until they set a real anchor date.
const resolvePayCycleAnchor = (user, overrideDate) => {
  if (overrideDate) return { anchor: normalizeToUTCMidnight(overrideDate), warnings: [] };
  if (user.payCycle && user.payCycle.anchorDate) {
    return { anchor: normalizeToUTCMidnight(user.payCycle.anchorDate), warnings: [] };
  }
  return {
    anchor: normalizeToUTCMidnight(user.createdAt),
    warnings: ['No payCycle.anchorDate set for this user — falling back to account creation date. Pass ?payCycleAnchorDate=YYYY-MM-DD for an accurate projection.'],
  };
};

// Turn one Bill into its occurrence dates within the window, using the
// documented assumption (see the plan): monthly/yearly use dueDay (clamped
// into the bill's createdAt month for yearly); weekly/biweekly count from
// createdAt since there's no other anchor available on this model.
const billToDiscreteEvents = (bill, windowStart, windowEnd) => {
  const created = new Date(bill.createdAt);
  let anchorDate = created;

  if (bill.frequency === 'monthly' || bill.frequency === 'yearly') {
    const day = bill.dueDay || created.getUTCDate();
    anchorDate = new Date(Date.UTC(created.getUTCFullYear(), created.getUTCMonth(), day));
  }

  const occurrences = generateOccurrences({
    frequency: bill.frequency,
    anchorDate,
    windowStart,
    windowEnd,
  });

  return occurrences.map((date) => ({
    date,
    amount: -bill.amount,
    type: 'bill',
    refId: bill._id,
    label: bill.name,
  }));
};

// Regular income follows its own frequency, anchored to the user's pay
// cycle (there's no per-source anchor date on IncomeSource).
const regularIncomeToDiscreteEvents = (income, payCycleAnchor, windowStart, windowEnd) => {
  const occurrences = generateOccurrences({
    frequency: income.frequency,
    anchorDate: payCycleAnchor,
    windowStart,
    windowEnd,
  });
  return occurrences.map((date) => ({
    date,
    amount: income.amount,
    type: 'income',
    refId: income._id,
    label: income.name,
  }));
};

// Irregular income has no real schedule, so it's modeled as one lump-sum
// estimate landing on the 1st of every month in the window.
const irregularIncomeToDiscreteEvents = (income, windowStart, windowEnd) => {
  const anchorDate = new Date(Date.UTC(windowStart.getUTCFullYear(), windowStart.getUTCMonth(), 1));
  const occurrences = generateOccurrences({ frequency: 'monthly', anchorDate, windowStart, windowEnd });
  return occurrences.map((date) => ({
    date,
    amount: income.estimatedMonthlyAmount,
    type: 'income',
    refId: income._id,
    label: income.name,
  }));
};

// Debts have no due-date field, so each debt's monthly payment is modeled
// as landing on the 1st of every month in the window.
const debtToDiscreteEvents = (debt, windowStart, windowEnd) => {
  const anchorDate = new Date(Date.UTC(windowStart.getUTCFullYear(), windowStart.getUTCMonth(), 1));
  const occurrences = generateOccurrences({ frequency: 'monthly', anchorDate, windowStart, windowEnd });
  const payment = debt.minimumPayment + (debt.extraPayment || 0);
  return occurrences.map((date) => ({
    date,
    amount: -payment,
    type: 'debt',
    refId: debt._id,
    label: debt.name,
  }));
};

/**
 * Build the day-by-day cash-flow projection and shortfall list for a user.
 * startingBalance is required (see the plan's "starting balance" decision —
 * nothing in the data model stores a running balance, and it shouldn't,
 * since there's no bank feed to keep it honest).
 */
const buildCashFlowProjection = async (userId, { startingBalance, windowStart, windowDays = 90, payCycleAnchorOverride }) => {
  const { user, bills, debts, incomeSources, variableExpenses } = await getUserContext(userId);

  const start = normalizeToUTCMidnight(windowStart || new Date());
  const end = addDays(start, windowDays - 1);
  const { anchor: payCycleAnchor, warnings } = resolvePayCycleAnchor(user, payCycleAnchorOverride);

  const discreteEvents = [
    ...bills.flatMap((bill) => billToDiscreteEvents(bill, start, end)),
    ...debts.flatMap((debt) => debtToDiscreteEvents(debt, start, end)),
    ...incomeSources.flatMap((income) =>
      income.type === 'irregular'
        ? irregularIncomeToDiscreteEvents(income, start, end)
        : regularIncomeToDiscreteEvents(income, payCycleAnchor, start, end)
    ),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  const dailyVariableExpenseTotal = buildDailyVariableExpenseTotal(variableExpenses);

  const series = simulateCashFlow({
    startingBalance,
    windowStart: start,
    windowDays,
    discreteEvents,
    dailyVariableExpenseTotal,
  });

  const shortfalls = detectShortfalls(series);

  return { windowStart: start, windowDays, series, shortfalls, warnings };
};

// Project payoff timelines for every one of a user's debts.
const buildDebtProjection = async (userId) => {
  const { debts } = await getUserContext(userId);
  return debts.map((debt) => ({
    _id: debt._id,
    name: debt.name,
    ...projectDebtPayoff(debt),
  }));
};

// Project a single debt's payoff, optionally comparing against paying
// `compareExtra` more per month than it currently has configured.
const buildSingleDebtProjection = async (userId, debtId, { compareExtra } = {}) => {
  const debt = await Debt.findOne({ _id: debtId, user: userId }).lean();
  if (!debt) return null;

  const result = { _id: debt._id, name: debt.name, ...projectDebtPayoff(debt) };

  if (compareExtra !== undefined) {
    result.monthsSavedWithExtra = monthsSavedWithExtra(debt, compareExtra);
  }

  return result;
};

// Required contribution pace for every goal that has a targetDate.
const buildGoalProjection = async (userId, { period = 'monthly', asOfDate, payCycleAnchorOverride } = {}) => {
  const { user, goals } = await getUserContext(userId);
  const now = normalizeToUTCMidnight(asOfDate || new Date());
  const { anchor: payCycleAnchor } = resolvePayCycleAnchor(user, payCycleAnchorOverride);

  return goals.map((goal) => ({
    _id: goal._id,
    name: goal.name,
    type: goal.type,
    ...requiredContribution({
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      targetDate: goal.targetDate,
      asOfDate: now,
      period,
      anchorDate: payCycleAnchor,
    }),
  }));
};

// How much of the user's monthly income is free to invest, after bills,
// variable-expense estimates, debt payments, and goal contributions.
// Reports the amount only — never a suggestion of where to put it.
const buildSurplusProjection = async (userId, { payCycleAnchorOverride } = {}) => {
  const { user, bills, debts, goals, incomeSources, variableExpenses } = await getUserContext(userId);
  const now = normalizeToUTCMidnight(new Date());
  const { anchor: payCycleAnchor } = resolvePayCycleAnchor(user, payCycleAnchorOverride);

  // Only goals with a real target date have a monthly "pace" to fold into
  // the surplus calculation — open-ended savings goals don't force a
  // monthly obligation.
  const goalContributions = goals
    .filter((goal) => goal.targetDate)
    .map((goal) =>
      requiredContribution({
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        targetDate: goal.targetDate,
        asOfDate: now,
        period: 'monthly',
        anchorDate: payCycleAnchor,
      }).requiredPerPeriod || 0
    );

  return calculateMonthlySurplus({ incomeSources, bills, variableExpenses, debts, goalContributions });
};

// Composes everything above into one response — used by GET /api/projection.
const buildFullProjection = async (userId, options) => {
  const [cashFlow, debtProjection, goalProjection, surplus] = await Promise.all([
    buildCashFlowProjection(userId, options),
    buildDebtProjection(userId),
    buildGoalProjection(userId, options),
    buildSurplusProjection(userId, options),
  ]);

  return { cashFlow, debts: debtProjection, goals: goalProjection, surplus };
};

module.exports = {
  getUserContext,
  buildCashFlowProjection,
  buildDebtProjection,
  buildSingleDebtProjection,
  buildGoalProjection,
  buildSurplusProjection,
  buildFullProjection,
};
