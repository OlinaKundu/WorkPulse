const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/AttendanceController');
const { authenticate } = require('../middlewares/authMiddleware');

router.use(authenticate);

router.post('/check-in', (req, res, next) => attendanceController.checkIn(req, res, next));
router.post('/check-out', (req, res, next) => attendanceController.checkOut(req, res, next));
router.get('/today', (req, res, next) => attendanceController.getTodayStatus(req, res, next));
router.get('/my-history', (req, res, next) => attendanceController.getMyHistory(req, res, next));

module.exports = router;
