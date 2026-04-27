<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { printTemplateData, useExport } from '../composables/useExport'
import { getTemplateFile, getTemplates } from '../services/api'
import type { Checklist, ExcelTemplate, ExportFormat } from '../types'

const props = defineProps<{
  modelValue: boolean
  checklist: Checklist | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const {
  exportToExcel,
  exportToExcelWithTemplate,
  exportToPdf,
  exportToPdfWithTemplate,
  exportToPrint,
  buildFilledTemplateData,
} = useExport()

const errorMessage = ref('')

const currentStep = ref<'format-select' | 'template-select'>('format-select')
const selectedFormat = ref<ExportFormat | null>(null)
const templates = ref<ExcelTemplate[]>([])
const templatesLoading = ref(false)
const templatesError = ref('')
const processingTemplateId = ref<string | null>(null)

const dialogTitle = computed(() => {
  if (currentStep.value !== 'template-select') return '選擇匯出格式'
  if (selectedFormat.value === 'pdf') return '選擇 PDF 模板'
  if (selectedFormat.value === 'print') return '選擇列印模板'
  return '選擇 Excel 模板'
})

const isBusy = computed(() => processingTemplateId.value !== null)

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
  if (isBusy.value) return
  emit('update:modelValue', false)
}

function goBack() {
  if (isBusy.value) return
  currentStep.value = 'format-select'
  errorMessage.value = ''
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      errorMessage.value = ''
      currentStep.value = 'format-select'
      selectedFormat.value = null
      templates.value = []
      templatesLoading.value = false
      templatesError.value = ''
      processingTemplateId.value = null
    }
  },
)

async function loadTemplates() {
  templatesLoading.value = true
  templatesError.value = ''
  try {
    templates.value = await getTemplates()
  } catch (err) {
    templatesError.value = err instanceof Error ? err.message : '無法載入模板清單'
  } finally {
    templatesLoading.value = false
  }
}

async function handleChoose(format: ExportFormat) {
  if (!props.checklist || isBusy.value) return
  errorMessage.value = ''
  selectedFormat.value = format
  currentStep.value = 'template-select'
  await loadTemplates()
}

async function handleSelectTemplate(template: ExcelTemplate | null) {
  if (!props.checklist || processingTemplateId.value !== null) return
  errorMessage.value = ''
  processingTemplateId.value = template ? template.id : 'no-template'
  const format = selectedFormat.value

  // 列印特殊流程：建立模板資料 → close dialog → wait 300ms → print → cleanup
  if (format === 'print') {
    try {
      if (template) {
        const buffer = await getTemplateFile(template.id)
        printTemplateData.value = await buildFilledTemplateData(props.checklist, template, buffer)
      } else {
        printTemplateData.value = null
      }
    } catch (err) {
      errorMessage.value = err instanceof Error ? err.message : '匯出失敗'
      processingTemplateId.value = null
      return
    }
    emit('update:modelValue', false)
    processingTemplateId.value = null
    // Vuetify v-dialog 淡出動畫約 225ms；等 300ms 確保 DOM 完全離場
    try {
      await new Promise<void>((resolve) => setTimeout(resolve, 300))
      exportToPrint()
    } finally {
      printTemplateData.value = null
    }
    return
  }

  // Excel / PDF 標準流程
  try {
    if (format === 'excel') {
      if (template) {
        const buffer = await getTemplateFile(template.id)
        await exportToExcelWithTemplate(props.checklist, template, buffer)
      } else {
        await exportToExcel(props.checklist)
      }
    } else if (format === 'pdf') {
      if (template) {
        const buffer = await getTemplateFile(template.id)
        await exportToPdfWithTemplate(props.checklist, template, buffer)
      } else {
        await exportToPdf(props.checklist)
      }
    }
    emit('update:modelValue', false)
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : '匯出失敗'
  } finally {
    processingTemplateId.value = null
  }
}
</script>

<template>
  <v-dialog
    :model-value="props.modelValue"
    max-width="480"
    :persistent="isBusy"
    @update:model-value="(v: boolean) => emit('update:modelValue', v)"
  >
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-export" class="mr-2" />
        {{ dialogTitle }}
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

        <!-- 格式選擇步驟 -->
        <v-list v-if="currentStep === 'format-select'" lines="two" density="comfortable">
          <v-list-item
            v-for="option in FORMAT_OPTIONS"
            :key="option.value"
            :prepend-icon="option.icon"
            :title="option.title"
            :subtitle="option.subtitle"
            @click="handleChoose(option.value)"
          >
            <template #append>
              <v-icon icon="mdi-chevron-right" />
            </template>
          </v-list-item>
        </v-list>

        <!-- 模板選擇步驟 -->
        <div v-else>
          <v-progress-linear v-if="templatesLoading" indeterminate color="primary" class="mb-2" />

          <v-alert
            v-if="templatesError"
            type="error"
            variant="tonal"
            density="compact"
            class="mb-3"
          >
            {{ templatesError }}
          </v-alert>

          <v-list v-if="!templatesLoading" lines="two" density="comfortable">
            <v-list-item
              :disabled="processingTemplateId !== null"
              prepend-icon="mdi-close-circle-outline"
              title="不使用模板"
              subtitle="使用預設樣式匯出"
              @click="handleSelectTemplate(null)"
            >
              <template #append>
                <v-progress-circular
                  v-if="processingTemplateId === 'no-template'"
                  indeterminate
                  size="20"
                  width="2"
                  color="primary"
                />
                <v-icon v-else icon="mdi-chevron-right" />
              </template>
            </v-list-item>

            <v-list-item
              v-for="t in templates"
              :key="t.id"
              :disabled="processingTemplateId !== null"
              prepend-icon="mdi-file-table-outline"
              :title="t.name"
              :subtitle="`資料起始列：第 ${t.dataStartRow} 列`"
              @click="handleSelectTemplate(t)"
            >
              <template #append>
                <v-progress-circular
                  v-if="processingTemplateId === t.id"
                  indeterminate
                  size="20"
                  width="2"
                  color="primary"
                />
                <v-icon v-else icon="mdi-chevron-right" />
              </template>
            </v-list-item>
          </v-list>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-btn
          v-if="currentStep === 'template-select'"
          variant="text"
          :disabled="isBusy"
          prepend-icon="mdi-arrow-left"
          @click="goBack"
        >
          返回
        </v-btn>
        <v-spacer />
        <v-btn variant="text" :disabled="isBusy" @click="close">取消</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
