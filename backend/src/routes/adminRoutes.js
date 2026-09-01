const express = require('express');
const router = express.Router();
const adminController = require('../controllers/AdminController');
const { authenticate } = require('../middlewares/authMiddleware');
const { requireHR } = require('../middlewares/rbacMiddleware');

router.use(authenticate, requireHR);

router.get('/workforce-attendance', (req, res, next) => adminController.getWorkforceAttendance(req, res, next));
router.get('/stats', (req, res, next) => adminController.getDashboardStats(req, res, next));
router.get('/settings/office', (req, res, next) => adminController.getOfficeSettings(req, res, next));
router.put('/settings/office', (req, res, next) => adminController.updateOfficeSettings(req, res, next));
router.get('/settings/email', (req, res, next) => adminController.getEmailSettings(req, res, next));
router.put('/settings/email', (req, res, next) => adminController.updateEmailSettings(req, res, next));
router.post('/settings/email/test', (req, res, next) => adminController.testEmailNotification(req, res, next));
router.put('/attendance/:id', (req, res, next) => adminController.overrideAttendance(req, res, next));
router.put('/user/:userId/leave-balance', (req, res, next) => adminController.overrideLeaveBalance(req, res, next));
router.delete('/users/:userId', (req, res, next) => adminController.deleteUser(req, res, next));

module.exports = router;
