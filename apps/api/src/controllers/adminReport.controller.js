import * as reportService from '../services/report.service.js';

export async function listReports(req, res, next) {
  try {
    const { page, limit, status } = req.query;
    const result = await reportService.getReports({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      status
    });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function resolveReport(req, res, next) {
  try {
    const { id } = req.params;
    const { resolutionNotes, removePost } = req.body;
    const result = await reportService.resolveReport({
      reportId: id,
      adminId: req.admin.id,
      resolutionNotes,
      removePost: Boolean(removePost)
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function dismissReport(req, res, next) {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const result = await reportService.dismissReport({
      reportId: id,
      adminId: req.admin.id,
      note
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
