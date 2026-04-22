<script setup lang="ts">
import { ref, watch } from 'vue'
import { useExport } from '../composables/useExport'
import type { Checklist, ExportFormat } from '../types'

const props = defineProps<{
  modelValue: boolean
  checklist: Checklist | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { exportToExcel, exportToPdf, exportToPrint } = useExport()

const busyFormat = ref<ExportFormat | null>(null)
const errorMessage = ref('')

const FORMAT_OPTIONS: Array<{
  value: ExportFormat
  title: string
  subtitle: string
  icon: string
}> = [
  {
    value: 'excel',
    title: 'Excel (.xlsx)',
    subtitle: '可於 Microsoft Excel / Google 試算表開啟',
    icon: 'mdi-microsoft-excel',
  },
  {
    value: 'pdf',
    title: 'PDF',
    subtitle: '固定版面的 PDF 文件（含中文字型）',
    icon: 'mdi-file-pdf-box',
  },
  {
    value: 'print',
    title: '網頁列印',
    subtitle: '開啟瀏覽器列印對話框，可另存為 PDF',
    icon: 'mdi-printer',
  },
]

function close() {
  if (busyFormat.value) return
  emit('update:modelValue', false)
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) errorMessage.value = ''
  },
)

async function handleChoose(format: ExportFormat) {
  if (!props.checklist || busyFormat.value) return
  busyFormat.value = format
  errorMessage.value = ''
  try {
    if (format === 'excel') {
      await exportToExcel(props.checklist)
    } else if (format === 'pdf') {
      await exportToPdf(props.checklist)
    } else {
      emit('update:modelValue', false)
      busyFormat.value = null
      // Vuetify v-dialog 淡出動畫約 225ms；等 300ms 確保 DOM 完全離場，
      // 再搭配 App.vue 的 @media print 隱藏 .v-overlay-container 雙重保險
      await new Promise((resolve) => setTimeout(resolve, 300))
      exportToPrint()
      return
    }
    emit('update:modelValue', false)
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : '匯出失敗'
  } finally {
    busyFormat.value = null
  }
}
</script>

<template>
  <v-dialog
    :model-value="props.modelValue"
    max-width="480"
    :persistent="busyFormat !== null"
    @update:model-value="(v: boolean) => emit('update:modelValue', v)"
  >
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-export" class="mr-2" />
        選擇匯出格式
      </v-card-title>
      <v-card-text>
        <v-alert
          v-if="errorMessage"
          type="error"
          variant="tonal"
          density="compact"
          closable
          class="mb-3"
          @click:close="errorMessage = ''"
        >
          {{ errorMessage }}
        </v-alert>

        <v-list lines="two" density="comfortable">
          <v-list-item
            v-for="option in FORMAT_OPTIONS"
            :key="option.value"
            :disabled="busyFormat !== null && busyFormat !== option.value"
            :prepend-icon="option.icon"
            :title="option.title"
            :subtitle="option.subtitle"
            @click="handleChoose(option.value)"
          >
            <template #append>
              <v-progress-circular
                v-if="busyFormat === option.value"
                indeterminate
                size="20"
                width="2"
                color="primary"
              />
              <v-icon v-else icon="mdi-chevron-right" />
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" :disabled="busyFormat !== null" @click="close">取消</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
