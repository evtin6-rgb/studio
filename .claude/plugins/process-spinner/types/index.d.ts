export type Spinner = {
  /** 'working' while a turn runs, 'done' for a few seconds after it, 'idle' otherwise. */
  phase: 'idle' | 'working' | 'done'
  frame: number
  label: string
  seconds: number
  tools: number
}

declare module 'claude-code' {
  interface PluginState {
    'process-spinner': { spinner: Spinner }
  }
}
