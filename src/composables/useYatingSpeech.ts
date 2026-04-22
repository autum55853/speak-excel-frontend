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
      const apiKey = import.meta.env.VITE_YATING_API_KEY as string
      const tokenRes = await fetch('https://asr.api.yating.tw/v1/token', {
        method: 'POST',
        headers: { key: apiKey },
      })
      const { token } = await tokenRes.json()

      stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      audioContext = new AudioContext({ sampleRate: 16000 })
      const source = audioContext.createMediaStreamSource(stream)
      processor = audioContext.createScriptProcessor(1024, 1, 1)

      ws = new WebSocket(`wss://asr.api.yating.tw/ws/v1/?token=${token}`)

      ws.onopen = () => {
        ws!.send(JSON.stringify({ config: { sample_rate: 16000, language: 'asr-zh-en-std' } }))
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
        const data = JSON.parse(e.data as string) as {
          asr_final?: boolean
          asr_sentence?: string
        }
        if (data.asr_final && data.asr_sentence) {
          onResult(data.asr_sentence.trim())
        }
      }

      ws.onclose = () => {
        isListening.value = false
      }
      ws.onerror = () => {
        stop()
      }
    } catch {
      stop()
    }
  }

  function stop() {
    processor?.disconnect()
    processor = null
    stream?.getTracks().forEach((t) => t.stop())
    stream = null
    audioContext?.close()
    audioContext = null
    ws?.close()
    ws = null
    isListening.value = false
  }

  function toggle() {
    if (isListening.value) stop()
    else void start()
  }

  onUnmounted(stop)

  return { isSupported, isListening, toggle }
}
