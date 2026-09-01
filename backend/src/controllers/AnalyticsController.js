const analyticsService = require('../services/AnalyticsService');

class AnalyticsController {
  async getWorkforceAnalytics(req, res, next) {
    try {
      const data = await analyticsService.getWorkforceAnalytics();
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyAnalytics(req, res, next) {
    try {
      const data = await analyticsService.getEmployeePersonalAnalytics(req.user.id);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getEmployeeAnalyticsById(req, res, next) {
    try {
      const { id } = req.params;
      const data = await analyticsService.getEmployeePersonalAnalytics(id);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AnalyticsController();
