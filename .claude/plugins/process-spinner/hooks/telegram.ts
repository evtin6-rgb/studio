import type { EngineInterface } from 'claude-code'

/**
 * Sends a line to Ivan's Telegram through his own bot.
 *
 * TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID both come from the environment's
 * settings (never the repo). The chat is never guessed from messages to the
 * bot, so a stranger who writes to it receives nothing.
 */

const API = 'https://api.telegram.org'

export type TelegramResult = { isSent: true } | { isSent: false; reason: string }

export async function sendTelegram($: EngineInterface, text: string): Promise<TelegramResult> {
  const token = await $.env.get('TELEGRAM_BOT_TOKEN')
  const chatId = await $.env.get('TELEGRAM_CHAT_ID')
  if (!token || !chatId) return { isSent: false, reason: 'no TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID' }

  const res = await $.http.fetch(`${API}/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  })
  return res.ok ? { isSent: true } : { isSent: false, reason: `telegram ${res.status}` }
}
