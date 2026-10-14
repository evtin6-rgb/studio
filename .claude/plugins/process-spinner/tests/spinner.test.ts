import type { RenderElement } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

import { describeTool } from '../hooks/register'

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
