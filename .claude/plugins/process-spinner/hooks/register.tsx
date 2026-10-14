import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, Timer } from 'claude-code'

import type { Spinner } from '../types'
import { sendTelegram } from './telegram'
import { ASCII_DONE, OCTOPUS_DONE_SVG, OCTOPUS_SVG, asciiOctopus } from './octopus'

const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
const TICK_MS = 200
const DONE_VISIBLE_MS = 4000
const PUSH_AFTER_SECONDS = 60
const DETAIL_MAX = 48
const IDLE_LABEL = 'Думаю'

const VERBS: Record<string, string> = {
  Bash: 'Выполняю',
  Read: 'Читаю',
  Edit: 'Правлю',
  Write: 'Пишу',
  Grep: 'Ищу',
  Glob: 'Ищу файлы',
  Agent: 'Запускаю агента',
  WebFetch: 'Загружаю',
  WebSearch: 'Гуглю',
  Skill: 'Подключаю скилл',
}

const IDLE: Spinner = { phase: 'idle', frame: 0, label: IDLE_LABEL, seconds: 0, tools: 0 }
const spinner = atom({ plugin: 'process-spinner', key: 'spinner' } as const, IDLE)

const shorten = (text: string): string => {
  const line = text.replace(/\s+/g, ' ').trim()
  return line.length > DETAIL_MAX ? `${line.slice(0, DETAIL_MAX - 1)}…` : line
}

const baseName = (path: string): string => path.split('/').pop() ?? path

export const describeTool = (input: Record<string, unknown>): string => {
  const tool = String(input.tool)
  const verb = VERBS[tool] ?? (tool.startsWith('mcp__') ? 'Зову' : 'Работаю')
  const pick = (key: string): string | undefined =>
    typeof input[key] === 'string' ? (input[key] as string) : undefined

  const path = pick('file_path')
  const detail =
    pick('description') ??
    (path ? baseName(path) : undefined) ??
    pick('pattern') ??
    pick('query') ??
    pick('url') ??
    pick('command') ??
    (tool.startsWith('mcp__') ? tool.split('__').slice(1).join(' · ') : tool)

  return shorten(`${verb}: ${detail}`)
}

export const statusText = (s: Spinner): string | undefined => {
  if (s.phase === 'working') return `${FRAMES[s.frame]} ${s.label} · ${s.seconds}s`
  if (s.phase === 'done') {
    const toolsNote = s.tools > 0 ? ` · инструментов: ${s.tools}` : ''
    return `✓ Готово за ${s.seconds}s${toolsNote}`
  }
  return undefined
}

type Clock = {
  timer: Timer | undefined
  clearTimer: Timer | undefined
  startedAt: number
  active: Map<string, string>
}

const clock: Clock = { timer: undefined, clearTimer: undefined, startedAt: 0, active: new Map() }

function currentLabel(): string {
  const labels = [...clock.active.values()]
  const last = labels[labels.length - 1]
  if (last === undefined) return IDLE_LABEL
  return labels.length > 1 ? `${last} (+${labels.length - 1})` : last
}

async function publish($: EngineInterface, next: Spinner): Promise<void> {
  await update($, spinner, () => next)
  $.ui.status(statusText(next))
}

async function tick($: EngineInterface): Promise<void> {
  const now = await $.clock.now()
  const prev = await read($, spinner)
  await publish($, {
    ...prev,
    phase: 'working',
    frame: (prev.frame + 1) % FRAMES.length,
    label: currentLabel(),
    seconds: Math.floor((now - clock.startedAt) / 1000),
  })
}

async function start($: EngineInterface): Promise<void> {
  clock.clearTimer?.cancel()
  clock.timer?.cancel()
  clock.startedAt = await $.clock.now()
  clock.active.clear()
  await publish($, { ...IDLE, phase: 'working' })
  clock.timer = $.clock.every(TICK_MS, () => void tick($))
}

async function finish($: EngineInterface): Promise<void> {
  clock.timer?.cancel()
  clock.timer = undefined
  clock.active.clear()
  const seconds = Math.round(((await $.clock.now()) - clock.startedAt) / 1000)
  const prev = await read($, spinner)
  const done: Spinner = { ...prev, phase: 'done', seconds }
  await publish($, done)
  if (seconds >= PUSH_AFTER_SECONDS) void pushDone($, done).catch(() => undefined)
  clock.clearTimer = $.clock.after(DONE_VISIBLE_MS, () => void publish($, IDLE))
}

export const pushText = (s: Spinner): string => {
  const minutes = Math.floor(s.seconds / 60)
  const rest = s.seconds % 60
  const time = minutes > 0 ? `${minutes} мин ${rest} с` : `${rest} с`
  const toolsNote = s.tools > 0 ? ` · инструментов: ${s.tools}` : ''
  return `🐙 Claude закончил за ${time}${toolsNote}`
}

async function pushDone($: EngineInterface, s: Spinner): Promise<void> {
  const text = pushText(s)
  await sendTelegram($, text).catch(() => undefined)
  await $.tool.call({ tool: 'PushNotification', message: text, status: 'proactive' })
}

export const register: Register = on => {
  on('prompt.submit', async ($, e, next) => {
    const result = await next(e)
    await start($)
    return result
  })

  on('tool.call', async ($, e, next) => {
    if (e.agentId !== undefined || clock.timer === undefined) return next(e)

    clock.active.set(e.tool_use_id, describeTool(e as unknown as Record<string, unknown>))
    await update($, spinner, s => ({ ...s, tools: s.tools + 1, label: currentLabel() }))
    try {
      return await next(e)
    } finally {
      clock.active.delete(e.tool_use_id)
    }
  })

  on('turn.complete', async ($, e, next) => {
    if (clock.timer !== undefined) await finish($)
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const s = await read($, spinner)
    const text = statusText(s)
    if (e.props.hasSurvey || text === undefined) return next(e)

    const color = s.phase === 'done' ? 'green' : 'magenta'

    if (e.surface === 'desktop') {
      const { Box, Svg, Text } = $.ui.resolve(e)
      return (
        <Box flexDirection="row" alignItems="center" gap={1}>
          <Svg
            source={s.phase === 'done' ? OCTOPUS_DONE_SVG : OCTOPUS_SVG}
            alt="Пиксельный осьминожек Claude"
            width={72}
            height={48}
            isInteractive
          />
          <Text color={color}>{text}</Text>
        </Box>
      )
    }

    const { Box, Text } = $.ui.resolve(e)
    const lines = s.phase === 'done' ? ASCII_DONE : asciiOctopus(s.frame)
    return (
      <Box flexDirection="row" alignItems="center" gap={1}>
        <Box flexDirection="column">
          {lines.map((line, i) => (
            <Text key={`clawd-${i}`} color="#d77757">
              {line}
            </Text>
          ))}
        </Box>
        <Text color={color}>{text}</Text>
      </Box>
    )
  })
}
