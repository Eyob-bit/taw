import { Telegraf } from 'telegraf';
import { config } from '../config/index.js';

let telegrafBot = null;

function getBot() {
  // During tests, always mock Telegram publishing to prevent real network calls and testing side effects
  if (process.env.NODE_ENV === 'test') {
    return null;
  }

  if (!telegrafBot && config.bot.token && !config.bot.token.includes('SAMPLE_TOKEN')) {
    telegrafBot = new Telegraf(config.bot.token);
  }
  return telegrafBot;
}

/**
 * Publish message to Telegram Channel (supporting single photo, photo album, or text-only).
 * @param {object} opts
 * @param {string} opts.channelId  - Target channel ID
 * @param {string} opts.text       - Post text / caption
 * @param {string|null} [opts.photo]   - Single Telegram file_id (legacy / single-photo)
 * @param {string[]} [opts.photos]     - Array of Telegram file_ids for multi-photo album
 */
export async function publishToTelegramChannel({ channelId, text, photo, photos }) {
  const targetChannel = channelId || config.bot.channelId;

  if (!targetChannel) {
    throw new Error('Telegram channel ID is not configured');
  }

  // Normalise: merge single `photo` into `photos` array
  const photoList = photos && photos.length > 0
    ? photos
    : (photo ? [photo] : []);

  const bot = getBot();

  // If real Telegram bot token is present and not a sample placeholder
  if (bot) {
    try {
      let message;

      if (photoList.length > 1) {
        // Send as media group (album) — max 10 photos, caption only on first item
        const caption = text.length <= 1024 ? text : text.slice(0, 1020) + '...';
        const mediaGroup = photoList.slice(0, 10).map((fileId, i) => ({
          type: 'photo',
          media: fileId,
          ...(i === 0 ? { caption, parse_mode: 'HTML' } : {})
        }));

        try {
          const messages = await bot.telegram.sendMediaGroup(targetChannel, mediaGroup);
          message = messages[0];
        } catch (sendErr) {
          if (sendErr.message?.includes('can\'t parse entities') || sendErr.message?.includes('entity')) {
            const fallbackGroup = photoList.slice(0, 10).map((fileId, i) => ({
              type: 'photo',
              media: fileId,
              ...(i === 0 ? { caption } : {})
            }));
            const messages = await bot.telegram.sendMediaGroup(targetChannel, fallbackGroup);
            message = messages[0];
          } else {
            throw sendErr;
          }
        }

        // If caption was truncated, send remainder as follow-up text
        if (text.length > 1024) {
          await bot.telegram.sendMessage(targetChannel, text.slice(1020), {
            parse_mode: 'HTML'
          }).catch(err => console.warn('Could not send remainder text follow-up:', err.message));
        }
      } else if (photoList.length === 1) {
        // Single photo
        const caption = text.length <= 1024 ? text : text.slice(0, 1020) + '...';
        try {
          message = await bot.telegram.sendPhoto(targetChannel, photoList[0], {
            caption,
            parse_mode: 'HTML'
          });
        } catch (sendErr) {
          if (sendErr.message?.includes('can\'t parse entities') || sendErr.message?.includes('entity')) {
            message = await bot.telegram.sendPhoto(targetChannel, photoList[0], {
              caption
            });
          } else {
            throw sendErr;
          }
        }

        // If caption was truncated due to 1024 char limit, send remainder as follow-up
        if (text.length > 1024) {
          await bot.telegram.sendMessage(targetChannel, text.slice(1020), {
            parse_mode: 'HTML'
          }).catch(err => console.warn('Could not send remainder text follow-up:', err.message));
        }
      } else {
        // Text-only
        try {
          message = await bot.telegram.sendMessage(targetChannel, text, {
            parse_mode: 'HTML',
            disable_web_page_preview: true
          });
        } catch (sendErr) {
          if (sendErr.message?.includes('can\'t parse entities') || sendErr.message?.includes('entity')) {
            message = await bot.telegram.sendMessage(targetChannel, text, {
              disable_web_page_preview: true
            });
          } else {
            throw sendErr;
          }
        }
      }

      return {
        success: true,
        channelId: targetChannel,
        messageId: message.message_id
      };
    } catch (error) {
      console.error(`[Telegram Publisher Error] Failed to publish to channel ${targetChannel}:`, error.message);
      throw error;
    }
  }

  // Development / Test Mock Adapter
  console.log(`\n📢 [MOCK TELEGRAM CHANNEL PUBLICATION]`);
  console.log(`Channel: ${targetChannel}`);
  if (photoList.length > 0) {
    console.log(`Photos (${photoList.length}): ${photoList.join(', ')}`);
  }
  console.log(`Message Content:\n${text}`);
  console.log(`-----------------------------------------\n`);

  const mockMessageId = Math.floor(100000 + Math.random() * 900000);
  return {
    success: true,
    channelId: targetChannel,
    messageId: mockMessageId,
    isMock: true
  };
}

/**
 * Remove / Delete message from Telegram Channel
 */
export async function deleteFromTelegramChannel({ channelId, messageId }) {
  const targetChannel = channelId || config.bot.channelId;
  const bot = getBot();

  if (bot) {
    try {
      await bot.telegram.deleteMessage(targetChannel, Number(messageId));
      return { success: true };
    } catch (error) {
      console.warn(`[Telegram Publisher] Could not delete message ${messageId} from channel ${targetChannel}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  console.log(`🗑️ [MOCK TELEGRAM CHANNEL] Deleted message ${messageId} from ${targetChannel}`);
  return { success: true, isMock: true };
}
