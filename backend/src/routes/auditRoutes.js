const express = require('express');
const router = express.Router();
const auditController = require('../controllers/AuditController');
const { authenticate } = require('../middlewares/authMiddleware');
const { requireHR } = require('../middlewares/rbacMiddleware');

router.use(authenticate, requireHR);

router.get('/logs', (req, res, next) => auditController.getAuditLogs(req, res, next));
router.get('/attendance/:attendanceId', (req, res, next) => auditController.getAttendanceAuditHistory(req, res, next));

module.exports = router;
