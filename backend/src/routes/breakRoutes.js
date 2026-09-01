const express = require('express');
const router = express.Router();
const breakController = require('../controllers/BreakController');
const { authenticate } = require('../middlewares/authMiddleware');

router.use(authenticate);

router.post('/start', (req, res, next) => breakController.startBreak(req, res, next));
router.post('/end', (req, res, next) => breakController.endBreak(req, res, next));
router.get('/active', (req, res, next) => breakController.getActiveBreak(req, res, next));

module.exports = router;
