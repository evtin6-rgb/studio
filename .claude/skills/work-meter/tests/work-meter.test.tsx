import { expect, mock, test } from 'claude-code/testing'

const PANE = {
  component: 'Pane',
  requestId: 'work-meter',
  props: { title: 'Работа и контекст', isFocused: false, bodyColumns: 60 },
} as const

test('pane shows the finished step and the context block on every surface', async ($, on) => {
  mock.clock(on)
  on('tool.call', () => ({ result: 'ok' }) as never)
  await $.tool.call({ tool: 'Read', file_path: '/home/user/studio/index.html' } as never)

  for (const surface of ['terminal', 'desktop', 'vscode', 'mobile'] as const) {
    const ui = await $.ui.mount({ plugin: 'work-meter', surface, ...PANE })
    expect(await ui.find({ type: 'Text', text: /Читаю: index\.html/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /Контекст ветки/ })).toBeDefined()
  }
})
