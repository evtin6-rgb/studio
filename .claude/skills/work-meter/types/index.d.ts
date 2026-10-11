export type Stage = { label: string; detail: string; since: number }
export type Step = { label: string; detail: string; seconds: number; isError: boolean }
export type Meter = { percent: number | null; tokens: number | null; window: number; memoryTokens: number | null }

declare module 'claude-code' {
  interface PluginState {
    'work-meter': { stage: Stage | null; history: Step[]; frame: number; meter: Meter | null }
  }
}
