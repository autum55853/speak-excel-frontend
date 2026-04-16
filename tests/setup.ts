import { beforeEach, vi } from 'vitest'

// 每個測試前清空 localStorage，避免狀態污染
beforeEach(() => {
  localStorage.clear()
})

// Mock Web Speech API（測試環境不支援）
const SpeechRecognitionMock = vi.fn().mockImplementation(() => ({
  start: vi.fn(),
  stop: vi.fn(),
  abort: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  onresult: null,
  onerror: null,
  onend: null,
  continuous: false,
  interimResults: false,
  lang: '',
}))

Object.defineProperty(window, 'SpeechRecognition', {
  writable: true,
  value: SpeechRecognitionMock,
})

Object.defineProperty(window, 'webkitSpeechRecognition', {
  writable: true,
  value: SpeechRecognitionMock,
})

// Mock crypto.randomUUID（確保測試結果可重現，如需固定 ID 請在各測試中 vi.spyOn）
// 預設保留原生行為，各測試可自行 mock
