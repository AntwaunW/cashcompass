// ── Day-by-day cash-flow simulation ──
//
// Pure functions only: no database access. `engine.js` is responsible for
// turning a user's Bills/Debts/IncomeSources into the plain `discreteEvents`
// array and `dailyVariableExpenseTotal` function these expect.

const { addDays, sameUTCDate, daysInMonth } = require('./dateUtils');

/**
 * Walk forward day by day from `windowStart` for `windowDays` days, starting
 * from `startingBalance`, applying:
 *   1. a smooth daily drag from variable expenses (spread across the month
 *      rather than dumped on one day, since they're estimates, not scheduled
 *      transactions)
 *   2. any discrete events (income, bills, debt payments) dated that day
 *
 * discreteEvents: pre-built array of { date, amount, type, refId, label }
 *   — amount is positive for income, negative for bills/debts/goal contributions.
 * dailyVariableExpenseTotal: (date) => number — the day's share of variable
 *   spending, already divided by that month's day count by the caller.
 *
 * Returns an array of { date, balance, events } — one entry per simulated day.
 */
const simulateCashFlow = ({ startingBalance, windowStart, windowDays, discreteEvents, dailyVariableExpenseTotal }) => {
  let balance = startingBalance;
  const series = [];

  for (let dayOffset = 0; dayOffset < windowDays; dayOffset++) {
    const day = addDays(windowStart, dayOffset);

    // Smooth daily drag from variable expense estimates
    balance -= dailyVariableExpenseTotal(day);

    // Apply every discrete event that lands exactly on this day
    const todaysEvents = discreteEvents.filter((event) => sameUTCDate(event.date, day));
    for (const event of todaysEvents) {
      balance += event.amount;
    }

    // Round to the cent so floating-point drift doesn't produce numbers
    // like 499.9999999999998 in the API response.
    series.push({ date: day, balance: Math.round(balance * 100) / 100, events: todaysEvents });
  }

  return series;
};

/**
 * Build a `dailyVariableExpenseTotal(date)` function from a user's variable
 * expense estimates — each month's total is spread evenly across that
 * month's actual number of days.
 */
const buildDailyVariableExpenseTotal = (variableExpenses) => {
  const monthlyTotal = variableExpenses.reduce((sum, v) => sum + v.estimatedMonthlyAmount, 0);
  return (date) => monthlyTotal / daysInMonth(date.getUTCFullYear(), date.getUTCMonth());
};

/**
 * Scan a simulated cash-flow series and report every point where the
 * balance drops below zero — specifically the START of each negative
 * streak (not every day within it), since that's the moment worth alerting
 * the user about ("you'll be -$182 on Aug 28").
 */
const detectShortfalls = (series) => {
  const shortfalls = [];
  let inShortfall = false;

  for (const day of series) {
    if (day.balance < 0 && !inShortfall) {
      inShortfall = true;
      shortfalls.push({ date: day.date, amount: day.balance });
    } else if (day.balance >= 0) {
      inShortfall = false;
    }
  }

  return shortfalls;
};

module.exports = { simulateCashFlow, buildDailyVariableExpenseTotal, detectShortfalls };
