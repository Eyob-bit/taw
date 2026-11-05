import * as userService from '../services/user.service.js';
import { adminBlockUserSchema } from '../validators/index.js';

export async function listUsers(req, res, next) {
  try {
    const { page, limit, search, isBlocked } = req.query;
    const result = await userService.getUsersList({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      search,
      isBlocked: isBlocked !== undefined ? isBlocked === 'true' : undefined
    });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function blockUser(req, res, next) {
  try {
    const { id } = req.params;
    const { reason } = adminBlockUserSchema.parse(req.body);
    const result = await userService.blockUser({
      userId: id,
      reason,
      adminId: req.admin.id
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function unblockUser(req, res, next) {
  try {
    const { id } = req.params;
    const result = await userService.unblockUser({
      userId: id,
      adminId: req.admin.id
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
