// ── Debt payoff (amortization) math ──
//
// Pure functions only. Standard monthly-compounding amortization: each
// month, interest accrues on the remaining balance, then the payment covers
// that interest first and whatever's left reduces principal.

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Project a single debt to $0, month by month.
 *
 * balance, interestRate (annual %, e.g. 20 for 20%), minimumPayment,
 * extraPayment are all taken straight from a Debt document.
 *
 * Returns { payoffMonths, totalInterestPaid, schedule } — or, if the
 * payment doesn't even cover the interest that accrues each month (balance
 * would grow forever), returns { payoffMonths: null, totalInterestPaid:
 * null, schedule: [], warning } instead of looping forever.
 */
const projectDebtPayoff = ({ balance, interestRate, minimumPayment, extraPayment = 0, maxMonths = 600 }) => {
  const monthlyRate = interestRate / 100 / 12;
  const payment = minimumPayment + extraPayment;

  // If the payment doesn't even cover a month's interest, the balance never
  // shrinks — bail out instead of looping up to maxMonths for nothing.
  if (monthlyRate > 0 && payment <= balance * monthlyRate) {
    return {
      payoffMonths: null,
      totalInterestPaid: null,
      schedule: [],
      warning: 'Payment does not cover monthly interest; balance will never reach zero at this payment level.',
    };
  }

  let remaining = balance;
  let month = 0;
  let totalInterest = 0;
  const schedule = [];

  while (remaining > 0 && month < maxMonths) {
    const interest = remaining * monthlyRate;
    let principal = payment - interest;

    // Don't overshoot on the final payment
    if (principal > remaining) principal = remaining;

    remaining -= principal;
    totalInterest += interest;
    month += 1;

    schedule.push({
      month,
      interest: round2(interest),
      principal: round2(principal),
      remainingBalance: round2(remaining),
    });
  }

  return { payoffMonths: month, totalInterestPaid: round2(totalInterest), schedule };
};

/**
 * How many months sooner would this debt be paid off with `additionalExtra`
 * more per month on top of whatever extraPayment it already has?
 * Returns null if either scenario never pays off (see projectDebtPayoff).
 */
const monthsSavedWithExtra = (debt, additionalExtra) => {
  const baseline = projectDebtPayoff(debt);
  const withExtra = projectDebtPayoff({ ...debt, extraPayment: (debt.extraPayment || 0) + additionalExtra });

  if (baseline.payoffMonths == null || withExtra.payoffMonths == null) return null;
  return baseline.payoffMonths - withExtra.payoffMonths;
};

module.exports = { projectDebtPayoff, monthsSavedWithExtra };
