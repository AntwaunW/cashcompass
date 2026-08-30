// ── Date helpers for the projection engine ──
//
// Everything here is pure: given the same inputs, it always returns the same
// outputs, with no database access and no dependency on "now" except when
// the caller explicitly passes a date in. All dates are normalized to UTC
// midnight so day-to-day comparisons aren't thrown off by time-of-day or the
// server's local timezone (important since this runs on Render, which may
// not be in the same timezone the user is in).

// Strip the time-of-day off a Date, in UTC, so two Dates on the "same day"
// always compare equal regardless of what time they were originally created at.
const normalizeToUTCMidnight = (date) => {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

// How many days are in a given month. Passing monthIndex+1 with day 0 is a
// classic JS Date trick: "day 0 of next month" rolls back to the last day
// of the target month.
const daysInMonth = (year, monthIndex) => {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
};

// Add N days to a date (N can be negative) and return a new UTC-midnight Date.
const addDays = (date, n) => {
  const d = normalizeToUTCMidnight(date);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
};

// Do two dates fall on the same calendar day (ignoring time-of-day)?
const sameUTCDate = (a, b) => {
  const da = normalizeToUTCMidnight(a);
  const db = normalizeToUTCMidnight(b);
  return da.getTime() === db.getTime();
};

/**
 * Generate every occurrence of a recurring event (a bill, a paycheck, etc.)
 * that falls within [windowStart, windowEnd], given how often it recurs and
 * one known anchor date to count from.
 *
 * frequency: 'weekly' | 'biweekly' | 'monthly' | 'semimonthly' | 'yearly'
 * anchorDate: any date the event is known to have landed on (a bill's
 *   creation date, the user's payCycle.anchorDate, etc.) — used purely to
 *   fix which day-of-week / day-of-month / month the recurrence lands on.
 */
const generateOccurrences = ({ frequency, anchorDate, windowStart, windowEnd }) => {
  const anchor = normalizeToUTCMidnight(anchorDate);
  const start = normalizeToUTCMidnight(windowStart);
  const end = normalizeToUTCMidnight(windowEnd);
  const results = [];

  if (frequency === 'weekly' || frequency === 'biweekly') {
    const stepDays = frequency === 'weekly' ? 7 : 14;
    const stepMs = stepDays * 24 * 60 * 60 * 1000;

    // Instead of walking day-by-day (slow for a long window), jump straight
    // to the first and last "step index" that could land inside the window.
    const kStart = Math.ceil((start.getTime() - anchor.getTime()) / stepMs);
    const kEnd = Math.floor((end.getTime() - anchor.getTime()) / stepMs);

    for (let k = kStart; k <= kEnd; k++) {
      results.push(addDays(anchor, k * stepDays));
    }
    return results;
  }

  if (frequency === 'monthly' || frequency === 'semimonthly' || frequency === 'yearly') {
    // Walk every (year, month) pair the window touches.
    let cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
    const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));

    while (cursor.getTime() <= last.getTime()) {
      const year = cursor.getUTCFullYear();
      const monthIndex = cursor.getUTCMonth();
      const totalDays = daysInMonth(year, monthIndex);

      // Yearly only fires in the same month the anchor date is in
      const monthMatches = frequency !== 'yearly' || monthIndex === anchor.getUTCMonth();

      if (monthMatches) {
        // Clamp the anchor's day-of-month so e.g. a bill due on the 31st
        // still lands sensibly in a 30-day (or 28-day) month.
        const day1 = Math.min(anchor.getUTCDate(), totalDays);
        const candidate1 = new Date(Date.UTC(year, monthIndex, day1));
        if (candidate1.getTime() >= start.getTime() && candidate1.getTime() <= end.getTime()) {
          results.push(candidate1);
        }

        // Semimonthly = twice a month. We treat the second occurrence as
        // "15 days after the first," clamped to the end of the month — a
        // reasonable approximation of a 1st/15th-style schedule for any anchor day.
        if (frequency === 'semimonthly') {
          const day2 = Math.min(anchor.getUTCDate() + 15, totalDays);
          const candidate2 = new Date(Date.UTC(year, monthIndex, day2));
          if (candidate2.getTime() >= start.getTime() && candidate2.getTime() <= end.getTime()) {
            results.push(candidate2);
          }
        }
      }

      // Move to the 1st of next month
      cursor = new Date(Date.UTC(year, monthIndex + 1, 1));
    }

    // Semimonthly can produce its two dates out of order within a month
    // (e.g. anchor day 20 -> day2 clamps below day1 near month-end), so sort.
    results.sort((a, b) => a.getTime() - b.getTime());
    return results;
  }

  // Unknown frequency — no occurrences rather than guessing
  return results;
};

module.exports = {
  normalizeToUTCMidnight,
  daysInMonth,
  addDays,
  sameUTCDate,
  generateOccurrences,
};
