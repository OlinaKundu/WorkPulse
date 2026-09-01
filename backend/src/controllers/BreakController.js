const breakService = require('../services/BreakService');

class BreakController {
  async startBreak(req, res, next) {
    try {
      const { breakType } = req.body;
      const result = await breakService.startBreak(req.user.id, breakType);
      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async endBreak(req, res, next) {
    try {
      const result = await breakService.endBreak(req.user.id);
      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getActiveBreak(req, res, next) {
    try {
      const activeBreak = await breakService.getActiveBreak(req.user.id);
      return res.status(200).json({
        success: true,
        data: activeBreak,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BreakController();
