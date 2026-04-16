import { describe, it, expect, beforeEach } from 'vitest'

/**
 * 這是範例測試檔，用來確認 Vitest 環境運作正常。
 * 實際業務測試請依以下分類建立：
 *   tests/composables/  — composable 單元測試
 *   tests/services/     — api.ts / localStorage 操作測試
 *   tests/components/   — Vue 元件互動測試
 */

describe('測試環境驗證', () => {
  it('基本斷言可正常運作', () => {
    expect(1 + 1).toBe(2)
  })

  it('localStorage 在每個測試前已清空', () => {
    expect(localStorage.length).toBe(0)
  })

  it('localStorage 寫入與讀取正常', () => {
    localStorage.setItem('test-key', 'hello')
    expect(localStorage.getItem('test-key')).toBe('hello')
  })

  it('Web Speech API mock 已掛載', () => {
    expect(window.SpeechRecognition).toBeDefined()
    expect(window.webkitSpeechRecognition).toBeDefined()
  })
})

describe('localStorage 狀態隔離驗證', () => {
  beforeEach(() => {
    // setup.ts 已全局執行 localStorage.clear()，此處僅示範可再加 beforeEach
  })

  it('前一個測試寫入的 key 不應存在', () => {
    // 確認 setup.ts 的 beforeEach 清空有效
    expect(localStorage.getItem('test-key')).toBeNull()
  })
})
