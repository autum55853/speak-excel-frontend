// CNC context: spoken "fi" / "phi" → diameter symbol Φ
const TRANSCRIPT_REPLACEMENTS: Array<[RegExp, string]> = [
  [/φ/g, 'Φ'],
  [/\b(?:phi|fi)\s*(\d)/gi, 'Φ$1'],
  [/\b(?:phi|fi)\b/gi, 'Φ'],
]

export function normalizeTranscript(text: string): string {
  let result = text
  for (const [pattern, replacement] of TRANSCRIPT_REPLACEMENTS) {
    result = result.replace(pattern, replacement)
  }
  return result
}
