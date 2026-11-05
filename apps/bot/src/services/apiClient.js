import axios from 'axios';
import { config } from '../config/index.js';

export const apiClient = axios.create({
  baseURL: config.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
    'x-bot-api-key': config.botApiKey
  },
  timeout: 10000
});

export async function registerUser({ telegramId, telegramUsername, firstName, lastName, languageCode }) {
  const res = await apiClient.post('/bot/users/register', {
    telegramId: telegramId.toString(),
    telegramUsername,
    firstName,
    lastName,
    languageCode
  });
  return res.data.data;
}

export async function createSubmission({ telegramId, categoryCode, content, language, photoFileId, photoFileIds }) {
  const normalizedPhotoFileIds = Array.isArray(photoFileIds) && photoFileIds.length > 0
    ? photoFileIds
    : (photoFileId ? [photoFileId] : []);

  const res = await apiClient.post('/bot/submissions', {
    telegramId: telegramId.toString(),
    categoryCode,
    content,
    language,
    photoFileId: normalizedPhotoFileIds[0] || null,
    photoFileIds: normalizedPhotoFileIds
  });
  return res.data.data;
}

export async function getUserSubmissions(telegramId) {
  const res = await apiClient.get('/bot/submissions', {
    params: { telegramId: telegramId.toString() }
  });
  return res.data.data;
}

export async function submitReport({ publicationId, reporterTelegramId, reason, details }) {
  const res = await apiClient.post('/bot/reports', {
    publicationId,
    reporterTelegramId: reporterTelegramId ? reporterTelegramId.toString() : undefined,
    reason,
    details
  });
  return res.data.data;
}
