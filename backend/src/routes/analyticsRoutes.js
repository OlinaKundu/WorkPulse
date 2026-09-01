const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/AnalyticsController');
const { authenticate } = require('../middlewares/authMiddleware');
const { requireHR } = require('../middlewares/rbacMiddleware');

router.use(authenticate);

// Individual employee personal analytics
router.get('/my-analytics', (req, res, next) => analyticsController.getMyAnalytics(req, res, next));

// HR workforce-wide analytics & AI burnout risk engine
router.get('/workforce', requireHR, (req, res, next) => analyticsController.getWorkforceAnalytics(req, res, next));
router.get('/employee/:id', requireHR, (req, res, next) => analyticsController.getEmployeeAnalyticsById(req, res, next));

module.exports = router;
