import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Meter, Stage, Step } from '../types'

const PANE = 'work-meter'
const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
const FRAME_MS = 200
const HISTORY_SIZE = 8
const BAR_WIDTH = 20

const stage = atom({ plugin: 'work-meter', key: 'stage' } as const, null)
const history = atom({ plugin: 'work-meter', key: 'history' } as const, [])
const frame = atom({ plugin: 'work-meter', key: 'frame' } as const, 0)
const meter = atom({ plugin: 'work-meter', key: 'meter' } as const, null)

type Fields = { tool: string } & Record<string, unknown>

const short = (text: string, max = 48) =>
  text.length > max ? `${text.slice(0, max - 1)}…` : text

const fileName = (path: string) => path.split('/').pop() ?? path

const describe = (e: Fields) => {
  const s = (key: string) => (typeof e[key] === 'string' ? (e[key] as string) : '')

  switch (e.tool) {
    case 'Read':
      return { label: 'Читаю', detail: fileName(s('file_path')) }
    case 'Edit':
    case 'MultiEdit':
      return { label: 'Правлю', detail: fileName(s('file_path')) }
    case 'Write':
      return { label: 'Пишу', detail: fileName(s('file_path')) }
    case 'Grep':
    case 'Glob':
      return { label: 'Ищу', detail: s('pattern') }
    case 'Bash':
      return e.run_in_background === true
        ? { label: 'Запускаю в фоне', detail: s('description') || s('command') }
        : { label: 'Выполняю', detail: s('description') || s('command') }
    case 'Agent':
      return { label: 'Агент работает', detail: s('description') }
    case 'WebSearch':
    case 'WebFetch':
      return { label: 'Смотрю в сети', detail: s('query') || s('url') }
    case 'Monitor':
      return { label: 'Жду фон', detail: s('description') }
    case 'SendUserFile':
      return { label: 'Отправляю файл', detail: '' }
    default:
      return { label: 'Инструмент', detail: e.tool }
  }
}

const bar = (percent: number) => {
  const filled = Math.round((Math.min(100, percent) / 100) * BAR_WIDTH)
  return '█'.repeat(filled) + '░'.repeat(BAR_WIDTH - filled)
}

const kTokens = (n: number) => `${Math.round(n / 1000)}k`

const meterColor = (percent: number) =>
  percent >= 85 ? 'red' : percent >= 60 ? 'yellow' : 'green'

let stopTicker: (() => void) | null = null

async function setStage($: EngineInterface, next: Stage | null) {
  await update($, stage, () => next)
  if (next && !stopTicker) {
    const tick = $.clock.every(FRAME_MS, () =>
      update($, frame, f => (f + 1) % FRAMES.length),
    )
    stopTicker = () => tick.cancel()
  }
  if (!next && stopTicker) {
    stopTicker()
    stopTicker = null
  }
}

async function refreshMeter($: EngineInterface) {
  const usage = await $.session.usage({ breakdown: 'summary' })
  const memory = usage.context.breakdown?.memoryFiles
  const value: Meter = {
    percent: usage.context.percent ?? null,
    tokens: usage.context.tokens ?? null,
    window: usage.context.window,
    memoryTokens: memory
      ? memory.reduce((sum, file) => sum + file.tokens, 0)
      : null,
  }
  await update($, meter, () => value)
  $.ui.status(value.percent === null ? undefined : `контекст ${value.percent}%`)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'work-meter',
      description: 'Открыть панель этапов работы и заполненности контекста',
    })
    void $.ui.open({ id: PANE, title: 'Работа и контекст' })
    void refreshMeter($)

    return next(e)
  })

  on('command.run', { command: 'work-meter' }, async $ => {
    await $.ui.open({ id: PANE, title: 'Работа и контекст' })
    await refreshMeter($)

    return { text: 'Панель «Работа и контекст» открыта.' }
  })

  on('prompt.submit', async ($, e, next) => {
    await update($, history, () => [])
    await setStage($, { label: 'Думаю', detail: '', since: await $.clock.now() })

    return next(e)
  }).catch(($, e, next) => next(e))

  on('tool.call', async ($, e, next) => {
    const what = describe(e as unknown as Fields)
    const since = await $.clock.now()
    await setStage($, { ...what, since })
    const ran = await next(e)
    const seconds = Math.round(((await $.clock.now()) - since) / 1000)
    const step: Step = {
      ...what,
      seconds,
      isError: ran.deny !== undefined || ran.isError === true,
    }
    await update($, history, list => [...list, step].slice(-HISTORY_SIZE))
    await setStage($, { label: 'Думаю', detail: '', since: await $.clock.now() })

    return ran
  }).catch(($, e, next) => next(e))

  on('session.measure', async ($, e, next) => {
    if (e.changed.includes('context')) {
      const previous = await read($, meter)
      await update($, meter, () => ({
        percent: e.context.percent ?? null,
        tokens: e.context.tokens ?? null,
        window: e.context.window,
        memoryTokens: previous?.memoryTokens ?? null,
      }))
      if (e.context.percent !== undefined) $.ui.status(`контекст ${e.context.percent}%`)
    }

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    await setStage($, null)
    void refreshMeter($)

    return next(e)
  })

  on('ui.render', { component: 'Spinner' }, async ($, e, next) => {
    const current = await read($, stage)
    if (!current) return next(e)
    const m = await read($, meter)
    const ctx = m?.percent != null ? ` · контекст ${m.percent}%` : ''
    const detail = current.detail ? `: ${short(current.detail, 32)}` : ''

    return next({ ...e, props: { ...e.props, message: `${current.label}${detail}${ctx}` } })
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const current = await read($, stage)
    const steps = await read($, history)
    const f = await read($, frame)
    const m = await read($, meter)
    const now = await $.clock.now()

    return (
      <Box flexDirection="column">
        <Text bold>Сейчас</Text>
        {current ? (
          <Text color="cyan">
            {FRAMES[f]} {current.label}
            {current.detail ? `: ${short(current.detail)}` : ''} ·{' '}
            {Math.round((now - current.since) / 1000)} с
          </Text>
        ) : (
          <Text dimColor>✓ Жду твоего сообщения</Text>
        )}
        {steps.map(step => (
          <Text dimColor={!step.isError} color={step.isError ? 'red' : undefined}>
            {step.isError ? '✗' : '✓'} {step.label}
            {step.detail ? `: ${short(step.detail, 40)}` : ''} · {step.seconds} с
          </Text>
        ))}
        <Text> </Text>
        <Text bold>Контекст ветки</Text>
        {m?.percent != null ? (
          <Text color={meterColor(m.percent)}>
            {bar(m.percent)} {m.percent}% ({kTokens(m.tokens ?? 0)} из {kTokens(m.window)})
          </Text>
        ) : (
          <Text dimColor>появится после первого ответа</Text>
        )}
        <Text dimColor>
          Память (CLAUDE.md и правила):{' '}
          {m?.memoryTokens != null ? `${kTokens(m.memoryTokens)} токенов` : 'считаю…'}
        </Text>
      </Box>
    )
  })
}
