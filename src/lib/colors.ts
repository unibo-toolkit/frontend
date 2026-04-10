export interface SubjectColorPair {
  bg: string
  text: string
  border: string
}

const DARK_COLOR_PAIRS: SubjectColorPair[] = [
  { bg: '#3f2913', text: '#c17f3d', border: '#c17f3d' }, // amber
  { bg: '#133d3f', text: '#3dbcc1', border: '#3dbcc1' }, // teal
  { bg: '#3f1322', text: '#c13d69', border: '#c13d69' }, // pink
  { bg: '#283f13', text: '#7dc13d', border: '#7dc13d' }, // green
  { bg: '#3f3313', text: '#c19c3d', border: '#c19c3d' }, // yellow
  { bg: '#1a1340', text: '#7b6dc1', border: '#7b6dc1' }, // purple
  { bg: '#0f2b3d', text: '#3d9cc1', border: '#3d9cc1' }, // blue
  { bg: '#3d1b13', text: '#c14a3d', border: '#c14a3d' }, // red
  { bg: '#2d1340', text: '#b06dc1', border: '#b06dc1' }, // violet
  { bg: '#133d28', text: '#3dc17b', border: '#3dc17b' }, // emerald
]

const LIGHT_COLOR_PAIRS: SubjectColorPair[] = [
  { bg: '#ffedb3', text: '#7a5500', border: '#d4a017' }, // amber
  { bg: '#aaf7ff', text: '#005c5e', border: '#1ab8be' }, // teal
  { bg: '#ffb8d4', text: '#8b0a38', border: '#e03070' }, // pink
  { bg: '#c8ffaa', text: '#2e6600', border: '#5cbf28' }, // green
  { bg: '#ffd6b0', text: '#7a3300', border: '#e07830' }, // orange
  { bg: '#ddd0ff', text: '#3d1fa0', border: '#7055d4' }, // purple
  { bg: '#b8e8ff', text: '#003d80', border: '#2090d0' }, // blue
  { bg: '#ffc4b0', text: '#8a1800', border: '#d94020' }, // red
  { bg: '#eab8ff', text: '#5c0a8a', border: '#a830d4' }, // violet
  { bg: '#a8ffd8', text: '#00582e', border: '#18bf70' }, // emerald
]

export function getSubjectColorPair(index: number, isDark: boolean): SubjectColorPair {
  const arr = isDark ? DARK_COLOR_PAIRS : LIGHT_COLOR_PAIRS
  return arr[index % arr.length]
}

// Legacy single-color API (dark theme accent colors)
const SUBJECT_COLORS = DARK_COLOR_PAIRS.map((p) => p.border)

export function getSubjectColor(index: number): string {
  return SUBJECT_COLORS[index % SUBJECT_COLORS.length]
}

export { SUBJECT_COLORS }
