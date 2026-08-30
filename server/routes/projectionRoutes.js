const express = require('express');
const router = express.Router();

const {
  getFullProjection,
  getCashFlowProjection,
  getDebtProjection,
  getSingleDebtProjection,
  getGoalProjection,
  getSurplusProjection,
} = require('../controllers/projectionController');

// Every projection is scoped to the logged-in user, so this whole router
// requires a valid JWT.
const { protect } = require('../middleware/authMiddleware');
router.use(protect);

// GET /                 → full projection (cash flow + debts + goals + surplus)
router.get('/', getFullProjection);

// GET /cashflow          → day-by-day balance projection + shortfall alerts
router.get('/cashflow', getCashFlowProjection);

// GET /debts              → payoff timeline for every debt
router.get('/debts', getDebtProjection);

// GET /debts/:id          → payoff timeline for one debt (supports ?compareExtra=)
router.get('/debts/:id', getSingleDebtProjection);

// GET /goals               → required contribution pace for goals with a targetDate
router.get('/goals', getGoalProjection);

// GET /surplus              → investable surplus (amount only, never advice)
router.get('/surplus', getSurplusProjection);

module.exports = router;
