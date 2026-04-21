import { onUnmounted, ref } from 'vue'

type SpeechRecognitionCtor = new () => SpeechRecognition

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  return (
    (window as unknown as { SpeechRecognition?: SpeechRecognitionCtor }).SpeechRecognition ??
    (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionCtor })
      .webkitSpeechRecognition ??
    null
  )
}

export function useSpeechRecognition(onResult: (text: string) => void) {
  const isSupported = getSpeechRecognitionCtor() !== null
  const isListening = ref(false)

  let recognition: SpeechRecognition | null = null

  function start() {
    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor || isListening.value) return

    recognition = new Ctor()
    recognition.lang = 'zh-TW'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim()
      if (transcript) onResult(transcript)
    }

    recognition.onend = () => {
      isListening.value = false
    }

    recognition.onerror = () => {
      isListening.value = false
    }

    recognition.start()
    isListening.value = true
  }

  function stop() {
    recognition?.stop()
    isListening.value = false
  }

  function toggle() {
    if (isListening.value) stop()
    else start()
  }

  onUnmounted(stop)

  return { isSupported, isListening, toggle }
}
