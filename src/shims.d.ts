/// <reference types="vite/client" />

declare module 'vuetify/styles'
declare module '@mdi/font/css/materialdesignicons.css'

interface SpeechRecognitionAlternative {
  readonly transcript: string
  readonly confidence: number
}

interface SpeechRecognitionResult {
  readonly length: number
  readonly isFinal: boolean
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionResultList {
  readonly length: number
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList
  readonly resultIndex: number
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string
  readonly message: string
}

interface SpeechRecognition extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onresult: ((ev: SpeechRecognitionEvent) => void) | null
  onend: ((ev: Event) => void) | null
  onerror: ((ev: SpeechRecognitionErrorEvent) => void) | null
  onstart: ((ev: Event) => void) | null
  start(): void
  stop(): void
  abort(): void
}
