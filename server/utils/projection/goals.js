// ── Goal pacing math ──
//
// Pure functions only. Answers "how much do I need to save per period to
// hit this goal by its target date?"

const { generateOccurrences } = require('./dateUtils');

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * How much needs to be contributed each period (default monthly) to close
 * the gap between currentAmount and targetAmount by targetDate.
 *
 * period/anchorDate follow the same shape generateOccurrences expects — use
 * the user's pay-cycle info so "per period" lines up with when they're
 * actually paid.
 *
 * Returns { requiredPerPeriod, periodsRemaining } on the happy path, or a
 * `note` explaining why no pace could be computed (no target date set, or
 * the target date has already passed).
 */
const requiredContribution = ({ targetAmount, currentAmount, targetDate, asOfDate, period = 'monthly', anchorDate }) => {
  if (!targetDate) {
    return { requiredPerPeriod: null, periodsRemaining: null, note: 'No targetDate set; cannot compute a required pace.' };
  }

  const remaining = Math.max(targetAmount - currentAmount, 0);

  const occurrences = generateOccurrences({
    frequency: period,
    anchorDate,
    windowStart: asOfDate,
    windowEnd: targetDate,
  });
  const periodsRemaining = occurrences.length;

  if (periodsRemaining <= 0) {
    return {
      requiredPerPeriod: round2(remaining),
      periodsRemaining: 0,
      note: 'Target date has passed or is within one period; the full remaining amount is needed now.',
    };
  }

  return { requiredPerPeriod: round2(remaining / periodsRemaining), periodsRemaining };
};

module.exports = { requiredContribution };
