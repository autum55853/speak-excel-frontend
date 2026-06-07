import { describe, expect, it } from 'vitest'
import { normalizeTranscript } from '../src/utils/transcriptNormalizer'

describe('normalizeTranscript', () => {
  it('不修改普通中文', () => {
    expect(normalizeTranscript('檢查外徑尺寸')).toBe('檢查外徑尺寸')
  })

  it('獨立 fi → Φ', () => {
    expect(normalizeTranscript('fi')).toBe('Φ')
    expect(normalizeTranscript('Fi')).toBe('Φ')
    expect(normalizeTranscript('FI')).toBe('Φ')
  })

  it('獨立 phi → Φ', () => {
    expect(normalizeTranscript('phi')).toBe('Φ')
    expect(normalizeTranscript('PHI')).toBe('Φ')
  })

  it('小寫 φ → Φ', () => {
    expect(normalizeTranscript('φ10')).toBe('Φ10')
  })

  it('fi 接數字 → Φ 接數字（無空格）', () => {
    expect(normalizeTranscript('fi10')).toBe('Φ10')
    expect(normalizeTranscript('fi 10')).toBe('Φ10')
    expect(normalizeTranscript('phi 25.4')).toBe('Φ25.4')
  })

  it('句中 fi 替換', () => {
    expect(normalizeTranscript('直徑 fi 10 公差 0.1')).toBe('直徑 Φ10 公差 0.1')
  })

  it('已是 Φ 不影響', () => {
    expect(normalizeTranscript('Φ10')).toBe('Φ10')
  })

  it('不替換字串中間的 fi（如 wifi）', () => {
    expect(normalizeTranscript('wifi')).toBe('wifi')
  })
})
