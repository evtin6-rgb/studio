/** Claude's octopus: an SMIL-animated SVG for desktop, two-line ASCII frames for the terminal. */

const BODY = '#d97757'
const SHADE = '#b85c3f'
const EYE = '#21172b'

const tentacle = (x: number, delay: number): string => `
  <path d="M${x} 34 q-3 7 0 12 q3 5 0 9" fill="none" stroke="${BODY}" stroke-width="4" stroke-linecap="round">
    <animateTransform attributeName="transform" type="rotate" values="-14 ${x} 34;14 ${x} 34;-14 ${x} 34"
      dur="0.9s" begin="${delay}s" repeatCount="indefinite"/>
  </path>`

export const OCTOPUS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 60" width="56" height="52">
  <g>
    <animateTransform attributeName="transform" type="translate" values="0 0;0 -3;0 0" dur="1.2s" repeatCount="indefinite"/>
    ${tentacle(18, 0)}${tentacle(27, 0.15)}${tentacle(37, 0.3)}${tentacle(46, 0.45)}
    <ellipse cx="32" cy="24" rx="20" ry="17" fill="${BODY}"/>
    <ellipse cx="32" cy="31" rx="17" ry="7" fill="${SHADE}" opacity="0.35"/>
    <g fill="${EYE}">
      <ellipse cx="25" cy="22" rx="3" ry="3.6">
        <animate attributeName="ry" values="3.6;3.6;0.4;3.6" keyTimes="0;0.9;0.95;1" dur="3s" repeatCount="indefinite"/>
      </ellipse>
      <ellipse cx="39" cy="22" rx="3" ry="3.6">
        <animate attributeName="ry" values="3.6;3.6;0.4;3.6" keyTimes="0;0.9;0.95;1" dur="3s" repeatCount="indefinite"/>
      </ellipse>
    </g>
    <path d="M28 29 q4 3 8 0" fill="none" stroke="${EYE}" stroke-width="1.8" stroke-linecap="round"/>
  </g>
</svg>`

export const OCTOPUS_DONE_SVG = OCTOPUS_SVG.replace(/<animate[^>]*\/>|<animateTransform[^>]*\/>/g, '')

const HEADS = ['(°▿°)', '(°▿°)', '(°▿°)', '(°▿°)', '(-▿-)']
const LEGS = ['/\\/\\/', '\\/\\/\\']

/** Two lines of the terminal octopus for a spinner frame. */
export const asciiOctopus = (frame: number): [string, string] => [
  ` ${HEADS[frame % HEADS.length]}`,
  ` ${LEGS[frame % LEGS.length]}`,
]

export const ASCII_DONE: [string, string] = [' (^▿^)', ' \\o/ ']
