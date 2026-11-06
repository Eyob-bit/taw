import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config/index.js';

let isConfigured = false;

// Configure Cloudinary from CLOUDINARY_URL or individual credentials
if (config.cloudinary.url) {
  cloudinary.config({
    cloudinary_url: config.cloudinary.url
  });
  isConfigured = true;
} else if (config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    secure: true
  });
  isConfigured = true;
}

export function isCloudinaryConfigured() {
  return isConfigured;
}

/**
 * Upload a raw buffer to Cloudinary with quality preservation
 * @param {Buffer} buffer 
 * @param {object} [options]
 * @returns {Promise<object>} Cloudinary upload response
 */
export async function uploadBuffer(buffer, options = {}) {
  if (!isConfigured) {
    throw new Error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET or CLOUDINARY_URL.');
  }

  const uploadOptions = {
    folder: config.cloudinary.folder || 'taw_submissions',
    resource_type: 'image',
    quality: 'auto:best',
    flags: 'preserve_transparency',
    ...options
  };

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) {
        return reject(error);
      }
      resolve(result);
    });

    uploadStream.end(buffer);
  });
}

/**
 * Download a photo from Telegram Bot API and upload directly to Cloudinary
 * Preserves high resolution and full quality
 * @param {object} params
 * @param {string} params.botToken
 * @param {string} params.fileId
 * @returns {Promise<string>} The Cloudinary secure HTTPS URL
 */
export async function uploadFromTelegram({ botToken, fileId }) {
  if (!botToken || botToken.includes('SAMPLE_TOKEN')) {
    console.warn('[Cloudinary] Telegram bot token is not configured. Skipping Cloudinary upload.');
    return null;
  }

  if (!isConfigured) {
    console.warn('[Cloudinary] Cloudinary is not configured. Keeping raw Telegram file ID.');
    return null;
  }

  try {
    // 1. Get file path from Telegram Bot API
    const fileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${encodeURIComponent(fileId)}`);
    const fileData = await fileRes.json();

    if (!fileData.ok || !fileData.result?.file_path) {
      console.warn('[Cloudinary] Could not get file path from Telegram for fileId:', fileId, fileData);
      return null;
    }

    // 2. Download the actual image bytes from Telegram
    const downloadUrl = `https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`;
    const imgRes = await fetch(downloadUrl);

    if (!imgRes.ok) {
      console.warn(`[Cloudinary] Failed to download image from Telegram: status ${imgRes.status}`);
      return null;
    }

    const buffer = Buffer.from(await imgRes.arrayBuffer());

    // 3. Upload to Cloudinary
    const uploadResult = await uploadBuffer(buffer, {
      public_id: `telegram_${fileId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(-30)}_${Date.now()}`
    });

    console.log(`☁️ [Cloudinary] Successfully uploaded image to Cloudinary: ${uploadResult.secure_url}`);
    return uploadResult.secure_url;
  } catch (err) {
    console.error('[Cloudinary] Error uploading Telegram photo to Cloudinary:', err.message);
    return null;
  }
}

export default {
  isCloudinaryConfigured,
  uploadBuffer,
  uploadFromTelegram
};

