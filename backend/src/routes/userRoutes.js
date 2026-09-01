const express = require('express');
const router = express.Router();
const userController = require('../controllers/UserController');
const { authenticate } = require('../middlewares/authMiddleware');

const settingsRepository = require('../repositories/SettingsRepository');

router.use(authenticate);

router.get('/employees', (req, res, next) => userController.getAllEmployees(req, res, next));
router.get('/departments', (req, res, next) => userController.getAllDepartments(req, res, next));
router.get('/office-location', async (req, res, next) => {
  try {
    const loc = await settingsRepository.getOfficeSettings();
    return res.status(200).json({ success: true, data: loc });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
