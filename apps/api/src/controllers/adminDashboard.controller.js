import * as dashboardService from '../services/dashboard.service.js';

export async function getStats(req, res, next) {
  try {
    const stats = await dashboardService.getDashboardStats();
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}

export async function getActivity(req, res, next) {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 15;
    const activity = await dashboardService.getRecentActivity(limit);
    res.status(200).json({ success: true, data: activity });
  } catch (error) {
    next(error);
  }
}
