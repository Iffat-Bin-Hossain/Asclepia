const express = require('express');
const { getDashboardStats, getMonthlyStats } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/dashboard', getDashboardStats);
router.get('/monthly', getMonthlyStats);

module.exports = router;
