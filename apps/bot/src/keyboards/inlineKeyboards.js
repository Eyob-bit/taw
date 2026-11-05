import { Markup } from 'telegraf';
import { getTranslation } from '@taw/shared';

export function getMainMenuKeyboard(lang = 'am') {
  const t = getTranslation(lang);

  return Markup.inlineKeyboard([
    [Markup.button.callback(t.menu.areWeDating, 'cat_are_we_dating')],
    [Markup.button.callback(t.menu.safetyConcern, 'cat_safety_concern')],
    [
      Markup.button.callback(t.menu.mySubmissions, 'menu_my_submissions'),
      Markup.button.callback(t.menu.help, 'menu_help')
    ],
    [Markup.button.callback(t.menu.changeLanguage, 'menu_language')]
  ]);
}

export function getGuidelinesKeyboard(lang = 'am') {
  const t = getTranslation(lang);

  return Markup.inlineKeyboard([
    [Markup.button.callback(t.guidelines.agreeButton, 'action_agree_guidelines')],
    [Markup.button.callback(t.guidelines.cancelButton, 'action_cancel')]
  ]);
}

export function getPreviewKeyboard(lang = 'am') {
  const t = getTranslation(lang);

  return Markup.inlineKeyboard([
    [Markup.button.callback(t.menu.confirm, 'action_confirm_submit')],
    [
      Markup.button.callback(t.menu.edit, 'action_edit_text'),
      Markup.button.callback(t.menu.cancel, 'action_cancel')
    ]
  ]);
}

export function getLanguageKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('🇪🇹 አማርኛ', 'lang_am'),
      Markup.button.callback('🇬🇧 English', 'lang_en')
    ],
    [Markup.button.callback('⬅️ Cancel / ሰርዝ', 'action_cancel')]
  ]);
}

export function getCancelKeyboard(lang = 'am') {
  const t = getTranslation(lang);
  return Markup.inlineKeyboard([
    [Markup.button.callback(t.menu.cancel, 'action_cancel')]
  ]);
}
