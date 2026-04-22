# 計劃：整合雅婷逐字稿 API 語音辨識

## Context

目前語音辨識使用瀏覽器內建的 Web Speech API（`zh-TW`），辨識品質不佳，且僅支援 Chrome/Edge。
計劃整合台灣在地化服務「雅婷逐字稿 API」，其繁體中文辨識品質更優，並以 WebSocket 串流實現即時辨識。

目標：**不改動 `SpeechInputField.vue`**（介面不變），透過環境變數切換 Provider。

---

## 雅婷 API 技術規格

| 項目 | 說明 |
|------|------|
| Token 端點 | `POST https://asr.api.yating.tw/v1/token`，Header: `key: <API_KEY>` |
| Token 有效期 | 60 秒（取得後須立即建立 WebSocket） |
| WebSocket | `wss://asr.api.yating.tw/ws/v1/?token=<TOKEN>` |
| 首個訊息 | JSON config: `{ "config": { "sample_rate": 16000, "language": "asr-zh-en-std" } }` |
| 音訊格式 | 16kHz / Mono / 16-bit PCM binary chunks（約 2000 bytes/chunk） |
| 結果訊息 | `{ asr_sentence: string, asr_final: boolean, asr_state: string }` |

---

## 修改範圍

| 檔案 | 動作 | 說明 |
|------|------|------|
| `src/composables/useYatingSpeech.ts` | **新增** | Yating WebSocket provider |
| `src/composables/useSpeechRecognition.ts` | **修改** | 加入 Provider 切換邏輯 |
| `.env.example` | **修改** | 新增 `VITE_YATING_API_KEY` |
| `src/components/SpeechInputField.vue` | **不動** | 介面不變 |
| `src/types/index.ts` | **不動** | 無需新型別 |

---

## 實作步驟

### Step 1：更新 `.env.example`

```
VITE_API_BASE_URL=
VITE_YATING_API_KEY=
```

使用者在 `.env` 填入 API Key 即可啟用 Yating provider；未填寫則 fallback 至 Web Speech API。

---

### Step 2：新增 `src/composables/useYatingSpeech.ts`

```typescript
import { onUnmounted, ref } from 'vue'

export function useYatingSpeech(onResult: (text: string) => void) {
  const isSupported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia
  const isListening = ref(false)

  let ws: WebSocket | null = null
  let audioContext: AudioContext | null = null
  let processor: ScriptProcessorNode | null = null
  let stream: MediaStream | null = null

  async function start() {
    if (isListening.value) return
    isListening.value = true

    try {
      // 1. 取得短效 token
      const apiKey = import.meta.env.VITE_YATING_API_KEY as string
      const tokenRes = await fetch('https://asr.api.yating.tw/v1/token', {
        method: 'POST',
        headers: { key: apiKey },
      })
      const { token } = await tokenRes.json()

      // 2. 取得麥克風 stream
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // 3. AudioContext 重採樣至 16kHz
      audioContext = new AudioContext({ sampleRate: 16000 })
      const source = audioContext.createMediaStreamSource(stream)
      processor = audioContext.createScriptProcessor(1024, 1, 1)

      // 4. 建立 WebSocket
      ws = new WebSocket(`wss://asr.api.yating.tw/ws/v1/?token=${token}`)

      ws.onopen = () => {
        ws!.send(JSON.stringify({
          config: { sample_rate: 16000, language: 'asr-zh-en-std' }
        }))
        processor!.onaudioprocess = (e) => {
          if (ws?.readyState !== WebSocket.OPEN) return
          const float32 = e.inputBuffer.getChannelData(0)
          const int16 = new Int16Array(float32.length)
          for (let i = 0; i < float32.length; i++) {
            int16[i] = Math.max(-32768, Math.min(32767, float32[i] * 32768))
          }
          ws.send(int16.buffer)
        }
        source.connect(processor!)
        processor!.connect(audioContext!.destination)
      }

      ws.onmessage = (e) => {
        const data = JSON.parse(e.data as string)
        if (data.asr_final && data.asr_sentence) {
          onResult(data.asr_sentence.trim())
        }
      }

      ws.onclose = () => { isListening.value = false }
      ws.onerror = () => { stop() }

    } catch {
      stop()
    }
  }

  function stop() {
    processor?.disconnect()
    processor = null
    stream?.getTracks().forEach(t => t.stop())
    stream = null
    audioContext?.close()
    audioContext = null
    ws?.close()
    ws = null
    isListening.value = false
  }

  function toggle() {
    if (isListening.value) stop()
    else start()
  }

  onUnmounted(stop)

  return { isSupported, isListening, toggle }
}
```

---

### Step 3：修改 `src/composables/useSpeechRecognition.ts`

在函式開頭加入 provider 切換，其餘 Web Speech API 邏輯不變：

```typescript
import { useYatingSpeech } from './useYatingSpeech'

export function useSpeechRecognition(onResult: (text: string) => void) {
  if (import.meta.env.VITE_YATING_API_KEY) {
    return useYatingSpeech(onResult)
  }
  // ... 原本 Web Speech API 邏輯不變
}
```

---

## 驗證方式

1. 在 `.env` 填入 `VITE_YATING_API_KEY=<your-key>`
2. `npm run dev`
3. 開啟任意瀏覽器（含 Firefox / Safari）前往檢查表編輯頁
4. 點擊麥克風按鈕，說繁體中文
5. 確認辨識結果追加至欄位
6. 移除 `VITE_YATING_API_KEY` → 確認自動 fallback 到 Web Speech API（Chrome/Edge only）
7. `npm run build` 確認 TypeScript 無型別錯誤
