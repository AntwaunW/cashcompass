// This controller is the thin HTTP layer over the projection engine
// (server/utils/projection/). It only parses/validates query params and
// hands off to the engine — none of the actual money math lives here.
const {
  buildCashFlowProjection,
  buildDebtProjection,
  buildSingleDebtProjection,
  buildGoalProjection,
  buildSurplusProjection,
  buildFullProjection,
} = require('../utils/projection/engine');

// Shared helper: pull the optional query params every cash-flow-touching
// endpoint accepts, in one place.
const parseCashFlowOptions = (req) => {
  const { startingBalance, windowStart, windowDays, payCycleAnchorDate } = req.query;
  return {
    startingBalance: startingBalance !== undefined ? Number(startingBalance) : undefined,
    windowStart: windowStart ? new Date(windowStart) : undefined,
    windowDays: windowDays !== undefined ? Number(windowDays) : undefined,
    payCycleAnchorOverride: payCycleAnchorDate ? new Date(payCycleAnchorDate) : undefined,
  };
};

// @desc    Full projection: cash flow + debts + goals + surplus, all at once
// @route   GET /api/projection
const getFullProjection = async (req, res) => {
  try {
    const options = parseCashFlowOptions(req);
    if (options.startingBalance === undefined) {
      return res.status(400).json({ message: 'startingBalance is required' });
    }

    const projection = await buildFullProjection(req.user._id, options);
    res.status(200).json(projection);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Day-by-day cash-flow projection + shortfall detection
// @route   GET /api/projection/cashflow?startingBalance=&windowDays=&payCycleAnchorDate=
const getCashFlowProjection = async (req, res) => {
  try {
    const options = parseCashFlowOptions(req);
    if (options.startingBalance === undefined) {
      return res.status(400).json({ message: 'startingBalance is required' });
    }

    const projection = await buildCashFlowProjection(req.user._id, options);
    res.status(200).json(projection);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Payoff timeline for every debt the user has
// @route   GET /api/projection/debts
const getDebtProjection = async (req, res) => {
  try {
    const projection = await buildDebtProjection(req.user._id);
    res.status(200).json(projection);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Payoff timeline for one debt, optionally compared against an
//          extra monthly payment ("what if I paid $X more?")
// @route   GET /api/projection/debts/:id?compareExtra=100
const getSingleDebtProjection = async (req, res) => {
  try {
    const { compareExtra } = req.query;
    const projection = await buildSingleDebtProjection(req.user._id, req.params.id, {
      compareExtra: compareExtra !== undefined ? Number(compareExtra) : undefined,
    });

    // buildSingleDebtProjection returns null for both "doesn't exist" and
    // "belongs to someone else" — same 404-for-both approach used elsewhere.
    if (!projection) {
      return res.status(404).json({ message: 'Debt not found' });
    }

    res.status(200).json(projection);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Debt not found' });
    }
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Required contribution pace for every goal with a targetDate
// @route   GET /api/projection/goals?period=monthly
const getGoalProjection = async (req, res) => {
  try {
    const { period, payCycleAnchorDate } = req.query;
    const projection = await buildGoalProjection(req.user._id, {
      period,
      payCycleAnchorOverride: payCycleAnchorDate ? new Date(payCycleAnchorDate) : undefined,
    });
    res.status(200).json(projection);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Investable surplus (income minus bills, variable expenses, debt
//          payments, and goal contributions) — an AMOUNT ONLY, never advice
//          on where to invest it.
// @route   GET /api/projection/surplus
const getSurplusProjection = async (req, res) => {
  try {
    const { payCycleAnchorDate } = req.query;
    const projection = await buildSurplusProjection(req.user._id, {
      payCycleAnchorOverride: payCycleAnchorDate ? new Date(payCycleAnchorDate) : undefined,
    });
    res.status(200).json(projection);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getFullProjection,
  getCashFlowProjection,
  getDebtProjection,
  getSingleDebtProjection,
  getGoalProjection,
  getSurplusProjection,
};
