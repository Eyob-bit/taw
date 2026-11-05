import * as settingsService from '../services/settings.service.js';
import { adminUpdateSettingsSchema } from '../validators/index.js';

export async function getSettings(req, res, next) {
  try {
    const settings = await settingsService.getSettings();
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
}

export async function updateSettings(req, res, next) {
  try {
    const validated = adminUpdateSettingsSchema.parse(req.body);
    const updated = await settingsService.updateSettings(validated, req.admin.id);
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}
