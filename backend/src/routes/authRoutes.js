const express = require('express');
const router = express.Router();
const authController = require('../controllers/AuthController');
const { authenticate } = require('../middlewares/authMiddleware');

const departmentRepository = require('../repositories/DepartmentRepository');

router.post('/login', (req, res, next) => authController.login(req, res, next));
router.post('/register', (req, res, next) => authController.register(req, res, next));
router.get('/departments', async (req, res, next) => {
  try {
    const depts = await departmentRepository.findAll();
    return res.status(200).json({ success: true, data: depts });
  } catch (err) {
    next(err);
  }
});
router.get('/me', authenticate, (req, res, next) => authController.getMe(req, res, next));

module.exports = router;
