import { expect, mock, test } from 'claude-code/testing'

import { describeTool } from '../hooks/register'

test('describes tools by verb and short detail', async () => {
  expect(describeTool({ tool: 'Read', file_path: '/home/user/studio/index.html' })).toBe(
    'Читаю: index.html',
  )
  expect(describeTool({ tool: 'Bash', command: 'npm test', description: 'Run tests' })).toBe(
    'Выполняю: Run tests',
  )
  expect(describeTool({ tool: 'mcp__github__get_me' })).toBe('Зову: github · get_me')
})

test('animates the status line while a turn runs', async ($, on) => {
  const clock = mock.clock(on)
  const lines: (string | undefined)[] = []
  on('ui.status', (_$, e) => {
    lines.push(e.text)
    return { value: undefined }
  })
  on('prompt.submit', (_$, e) => ({ text: e.text }))

  await $.prompt.submit({ text: 'привет', wait: false, origin: { kind: 'composer' } })
  await clock.advance(600)

  const spinning = lines.filter(line => line?.includes('Думаю'))
  expect(spinning.length).toBeGreaterThan(2)
  expect(new Set(spinning).size).toBeGreaterThan(1)
})
