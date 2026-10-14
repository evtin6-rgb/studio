import type { RenderElement } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

import { asciiOctopus } from '../hooks/octopus'
import { describeTool, pushText } from '../hooks/register'

const BAND_PROPS = {
  hasSurvey: false,
  isWorking: true,
  maxRows: 10,
  bodyColumns: 80,
  scroll: { offset: 0, bodyRows: 10 },
  view: {},
}

test('describes tools by verb and short detail', async () => {
  expect(describeTool({ tool: 'Read', file_path: '/home/user/studio/index.html' })).toBe(
    'Читаю: index.html',
  )
  expect(describeTool({ tool: 'Bash', command: 'npm test', description: 'Run tests' })).toBe(
    'Выполняю: Run tests',
  )
  expect(describeTool({ tool: 'mcp__github__get_me' })).toBe('Зову: github · get_me')
})

test('draws an animated band above the prompt while a turn runs', async ($, on) => {
  const clock = mock.clock(on)
  on('ui.status', () => ({ value: undefined }))
  on('prompt.submit', (_$, e) => ({ text: e.text }))

  await $.prompt.submit({ text: 'привет', wait: false, origin: { kind: 'composer' } })
  await clock.advance(600)

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({
      plugin: 'process-spinner',
      surface,
      component: 'AbovePrompt',
      props: BAND_PROPS,
    })
    const text = await ui.find({ type: 'Text', text: /Думаю · \d+s/ })
    expect(text).toBeDefined()
    await ui.unmount()
  }
})

test('desktop draws the SVG octopus, terminal the ASCII one', async ($, on) => {
  const clock = mock.clock(on)
  on('ui.status', () => ({ value: undefined }))
  on('prompt.submit', (_$, e) => ({ text: e.text }))
  await $.prompt.submit({ text: 'привет', wait: false, origin: { kind: 'composer' } })
  await clock.advance(400)

  const desktop = await $.ui.mount({
    plugin: 'process-spinner',
    surface: 'desktop',
    component: 'AbovePrompt',
    props: BAND_PROPS,
  })
  expect(await desktop.find({ type: 'Svg' })).toBeDefined()
  await desktop.unmount()

  const terminal = await $.ui.mount({
    plugin: 'process-spinner',
    surface: 'terminal',
    component: 'AbovePrompt',
    props: BAND_PROPS,
  })
  expect(await terminal.find({ type: 'Text', text: /▐▛███▜▌|▐█████▌/ })).toBeDefined()
  await terminal.unmount()
})

test('Clawd steps its legs and blinks', () => {
  expect(asciiOctopus(0)).toEqual([' ▐▛███▜▌', '▝▜█████▛▘', '  ▘▘ ▝▝ '])
  expect(asciiOctopus(1)[2]).toBe('  ▝▝ ▘▘ ')
  expect(asciiOctopus(14)[0]).toBe(' ▐█████▌')
})

test('push text names time and tools', () => {
  const base = { phase: 'done' as const, frame: 0, label: '' }
  expect(pushText({ ...base, seconds: 125, tools: 7 })).toBe(
    '🐙 Claude закончил за 2 мин 5 с · инструментов: 7',
  )
  expect(pushText({ ...base, seconds: 61, tools: 0 })).toBe('🐙 Claude закончил за 1 мин 1 с')
})

test('band stays empty when nothing runs', async ($, on) => {
  on('ui.render', { component: 'AbovePrompt' }, ($, e) => {
    const { Box } = $.ui.resolve(e)
    return h(Box, { key: 'engine' }) as RenderElement
  })
  const ui = await $.ui.mount({
    plugin: 'process-spinner',
    surface: 'terminal',
    component: 'AbovePrompt',
    props: { ...BAND_PROPS, isWorking: false },
  })
  expect(await ui.find({ type: 'Text', text: /Думаю/ })).toBeUndefined()
  await ui.unmount()
})
