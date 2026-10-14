/**
 * Clawd, the pixel octopus from the Claude Code welcome screen:
 *
 *    ▐▛███▜▌
 *   ▝▜█████▛▘
 *     ▘▘ ▝▝
 *
 * Desktop draws the same pixels as an animated SVG; the terminal draws the
 * block characters themselves, legs stepping and eyes blinking.
 */

const ORANGE = '#d77757'

/** Pixel rows (x from 0), one terminal quadrant each: half a cell wide, half a cell tall. */
const BODY_ROWS: readonly (readonly number[])[] = [
  range(3, 14),
  [3, 4, ...range(6, 11), 13, 14],
  range(1, 16),
  range(3, 14),
]
const EYES = [5, 12]
const LEGS_A = [4, 6, 11, 13]
const LEGS_B = [5, 7, 10, 12]

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i)
}

const PIXEL_W = 4
const PIXEL_H = 8

const rect = (x: number, y: number, extra = ''): string =>
  `<rect x="${x * PIXEL_W}" y="${y * PIXEL_H}" width="${PIXEL_W}" height="${PIXEL_H}"${extra}/>`

const legs = (xs: readonly number[], visibility: string): string =>
  `<g>${xs.map(x => rect(x, 4)).join('')}
    <animate attributeName="visibility" values="${visibility}" dur="0.5s" calcMode="discrete" repeatCount="indefinite"/></g>`

const body = BODY_ROWS.flatMap((xs, y) => xs.map(x => rect(x, y))).join('')

const blink = `<animate attributeName="opacity" values="0;0;1;0" keyTimes="0;0.92;0.96;1" dur="3s" calcMode="discrete" repeatCount="indefinite"/>`
const lids = EYES.map(x => rect(x, 1, ` opacity="0"`).replace('/>', `>${blink}</rect>`)).join('')

const WIDTH = 18 * PIXEL_W
const HEIGHT = 6 * PIXEL_H

export const OCTOPUS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -${PIXEL_H / 2} ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}" shape-rendering="crispEdges">
  <g fill="${ORANGE}">
    <animateTransform attributeName="transform" type="translate" values="0 0;0 -2;0 0" dur="0.5s" calcMode="discrete" repeatCount="indefinite"/>
    ${body}${lids}
    ${legs(LEGS_A, 'visible;hidden')}${legs(LEGS_B, 'hidden;visible')}
  </g>
</svg>`

export const OCTOPUS_DONE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -${PIXEL_H / 2} ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}" shape-rendering="crispEdges">
  <g fill="${ORANGE}">${body}${LEGS_A.map(x => rect(x, 4)).join('')}</g>
</svg>`

const TOP_OPEN = ' ▐▛███▜▌'
const TOP_BLINK = ' ▐█████▌'
const MIDDLE = '▝▜█████▛▘'
const LEGS_TEXT = ['  ▘▘ ▝▝ ', '  ▝▝ ▘▘ ']
const BLINK_EVERY = 15

/** The three terminal lines of Clawd for a spinner frame. */
export const asciiOctopus = (frame: number): [string, string, string] => [
  frame % BLINK_EVERY === BLINK_EVERY - 1 ? TOP_BLINK : TOP_OPEN,
  MIDDLE,
  LEGS_TEXT[frame % LEGS_TEXT.length] ?? LEGS_TEXT[0]!,
]

export const ASCII_DONE: [string, string, string] = [TOP_OPEN, MIDDLE, LEGS_TEXT[0]!]
