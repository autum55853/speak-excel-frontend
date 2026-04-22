<script setup lang="ts">
import { useSpeechRecognition } from '../composables/useSpeechRecognition'

const props = defineProps<{
  modelValue: string
  label?: string
  density?: 'default' | 'comfortable' | 'compact'
  hideDetails?: boolean
  maxlength?: number
  hint?: string
  persistentHint?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function appendTranscript(text: string) {
  const current = props.modelValue ?? ''
  const next = current.length > 0 ? `${current} ${text}` : text
  emit('update:modelValue', next)
}

const { isSupported, isListening, toggle } = useSpeechRecognition(appendTranscript)

function onInput(v: string) {
  emit('update:modelValue', v)
}
</script>

<template>
  <div class="speech-input-field">
    <v-text-field
      :model-value="props.modelValue"
      :label="props.label"
      :density="props.density ?? 'compact'"
      hide-details
      :hint="props.hint"
      :persistent-hint="props.persistentHint"
      :maxlength="props.maxlength"
      variant="underlined"
      @update:model-value="onInput"
    >
      <template #append-inner>
        <v-tooltip v-if="!isSupported" text="語音輸入僅支援 Chrome / Edge 瀏覽器" location="top">
          <template #activator="{ props: tooltipProps }">
            <span v-bind="tooltipProps">
              <v-btn
                icon="mdi-microphone-off"
                size="small"
                variant="text"
                density="comfortable"
                disabled
                aria-label="語音輸入（不支援）"
              />
            </span>
          </template>
        </v-tooltip>
        <v-tooltip v-else text="語音輸入" location="top">
          <template #activator="{ props: tooltipProps }">
            <v-btn
              v-bind="tooltipProps"
              :icon="isListening ? 'mdi-microphone' : 'mdi-microphone-outline'"
              :color="isListening ? 'error' : undefined"
              :class="{ 'mic-pulsing': isListening }"
              size="small"
              variant="text"
              density="comfortable"
              :aria-label="isListening ? '停止錄音' : '開始語音輸入'"
              @click.stop="toggle"
            />
          </template>
        </v-tooltip>
      </template>
    </v-text-field>
  </div>
</template>

<style scoped>
@keyframes mic-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(229, 57, 53, 0.6);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(229, 57, 53, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(229, 57, 53, 0);
  }
}

.mic-pulsing {
  border-radius: 50%;
  animation: mic-pulse 1.2s infinite;
}
</style>
