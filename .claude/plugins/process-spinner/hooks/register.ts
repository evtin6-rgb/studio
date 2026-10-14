import type { EngineInterface, Register, Timer } from 'claude-code'

const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
const TICK_MS = 150
const DONE_VISIBLE_MS = 4000
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

type Spin = {
  timer: Timer | undefined
  clearTimer: Timer | undefined
  frame: number
  startedAt: number
  tools: number
  active: Map<string, string>
}

const spin: Spin = {
  timer: undefined,
  clearTimer: undefined,
  frame: 0,
  startedAt: 0,
  tools: 0,
  active: new Map(),
}

function currentLabel(): string {
  const labels = [...spin.active.values()]
  if (labels.length === 0) return IDLE_LABEL
  const last = labels[labels.length - 1] ?? IDLE_LABEL
  return labels.length > 1 ? `${last} (+${labels.length - 1})` : last
}

async function draw($: EngineInterface): Promise<void> {
  const seconds = Math.floor(((await $.clock.now()) - spin.startedAt) / 1000)
  spin.frame = (spin.frame + 1) % FRAMES.length
  $.ui.status(`${FRAMES[spin.frame]} ${currentLabel()} · ${seconds}s`)
}

async function start($: EngineInterface): Promise<void> {
  spin.clearTimer?.cancel()
  spin.timer?.cancel()
  spin.startedAt = await $.clock.now()
  spin.tools = 0
  spin.frame = 0
  spin.active.clear()
  await draw($)
  spin.timer = $.clock.every(TICK_MS, () => void draw($))
}

async function finish($: EngineInterface): Promise<void> {
  spin.timer?.cancel()
  spin.timer = undefined
  spin.active.clear()
  const seconds = Math.round(((await $.clock.now()) - spin.startedAt) / 1000)
  const toolsNote = spin.tools > 0 ? ` · инструментов: ${spin.tools}` : ''
  $.ui.status(`✓ Готово за ${seconds}s${toolsNote}`)
  spin.clearTimer = $.clock.after(DONE_VISIBLE_MS, () => $.ui.status(undefined))
}

export const register: Register = on => {
  on('prompt.submit', async ($, e, next) => {
    const result = await next(e)
    await start($)
    return result
  })

  on('tool.call', async ($, e, next) => {
    if (e.agentId !== undefined || spin.timer === undefined) return next(e)

    spin.tools += 1
    spin.active.set(e.tool_use_id, describeTool(e as unknown as Record<string, unknown>))
    await draw($)
    try {
      return await next(e)
    } finally {
      spin.active.delete(e.tool_use_id)
    }
  })

  on('turn.complete', async ($, e, next) => {
    if (spin.timer !== undefined) await finish($)
    return next(e)
  })
}
