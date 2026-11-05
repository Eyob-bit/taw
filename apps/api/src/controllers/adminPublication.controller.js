import * as publicationService from '../services/publication.service.js';
import { enqueuePublishJob } from '../jobs/publisher.queue.js';
import prisma from '../services/prisma.js';

export async function listPublications(req, res, next) {
  try {
    const { page, limit, status, search } = req.query;
    const result = await publicationService.getPublications({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      status,
      search
    });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function removePublication(req, res, next) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const result = await publicationService.removePublication({
      publicationId: id,
      adminId: req.admin.id,
      reason: reason || 'Publication removed by administrator'
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function retryPublication(req, res, next) {
  try {
    const { id } = req.params;
    // Find either publication or submission
    const submission = await prisma.submission.findUnique({
      where: { id }
    });

    if (!submission) {
      return res.status(404).json({ success: false, error: 'Submission not found' });
    }

    await prisma.submission.update({
      where: { id },
      data: { status: 'READY_TO_PUBLISH' }
    });

    await enqueuePublishJob(id);

    res.status(200).json({ success: true, message: 'Publication job requeued successfully' });
  } catch (error) {
    next(error);
  }
}
