<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ExportDialog from '../components/ExportDialog.vue'
import { printTemplateData } from '../composables/useExport'
import { getChecklist } from '../services/api'
import type { Checklist, PrintTemplateCell } from '../types'

const route = useRoute()
const router = useRouter()

const checklistId = computed(() => (typeof route.params.id === 'string' ? route.params.id : null))

const checklist = ref<Checklist | null>(null)
const loading = ref(false)
const errorMessage = ref('')
const showExportDialog = ref(false)

const colWidthPercents = computed(() => {
  const widths = printTemplateData.value?.colWidths ?? []
  if (!widths.length) return []
  const total = widths.reduce((s, w) => s + w, 0)
  return widths.map(w => Math.round((w / total) * 100))
})

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

async function load() {
  if (!checklistId.value) {
    errorMessage.value = '無效的檢查表 ID'
    return
  }
  loading.value = true
  errorMessage.value = ''
  try {
    const data = await getChecklist(checklistId.value)
    if (!data) {
      errorMessage.value = `找不到檢查表：${checklistId.value}`
      return
    }
    checklist.value = data
    // 讓瀏覽器列印→另存為 PDF 時，預設檔名帶有文件名稱
    document.title = `${data.name} - 自主檢查表`
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : '載入失敗'
  } finally {
    loading.value = false
  }
}

function goEdit() {
  if (!checklistId.value) return
  router.push({ name: 'checklist-edit', params: { id: checklistId.value } })
}

function goBack() {
  router.push({ name: 'checklist-list' })
}

function handleExport() {
  if (!checklist.value) return
  showExportDialog.value = true
}

function getCellStyle(cell: PrintTemplateCell): Record<string, string> {
  const style: Record<string, string> = {
    fontWeight: cell.isBold ? 'bold' : 'normal',
    fontSize: `${cell.fontSize}pt`,
    textAlign: cell.textAlign,
    verticalAlign: cell.verticalAlign,
    padding: '2pt 4pt',
  }
  if (cell.backgroundColor) style.backgroundColor = cell.backgroundColor
  if (cell.hasBorder) style.border = '1px solid #000'
  return style
}

onMounted(load)

onUnmounted(() => {
  document.title = '自主檢查表系統'
})
</script>

<template>
  <div>
    <v-row align="center" class="mb-6 no-print" dense>
      <v-col cols="12" md="7" class="d-flex align-center ga-2">
        <v-btn icon="mdi-arrow-left" variant="text" aria-label="返回列表" @click="goBack" />
        <div>
          <h1 class="text-h4 font-weight-medium">檢查表預覽</h1>
          <div class="text-body-2 text-medium-emphasis mt-1">
            檢視文件內容並匯出為 Excel / PDF / 列印
          </div>
        </div>
      </v-col>
      <v-col cols="12" md="5" class="d-flex ga-2 justify-start justify-md-end">
        <v-btn variant="text" prepend-icon="mdi-pencil" @click="goEdit">重新編輯</v-btn>
        <v-btn
          color="primary"
          prepend-icon="mdi-export"
          :disabled="!checklist"
          @click="handleExport"
        >
          匯出
        </v-btn>
      </v-col>
    </v-row>

    <ExportDialog v-model="showExportDialog" :checklist="checklist" />

    <v-alert
      v-if="errorMessage"
      type="error"
      variant="tonal"
      closable
      class="mb-4 no-print"
      @click:close="errorMessage = ''"
    >
      {{ errorMessage }}
    </v-alert>

    <v-card v-if="loading" class="pa-6 d-flex justify-center">
      <v-progress-circular indeterminate color="primary" />
    </v-card>

    <!-- 列印模板表格：螢幕隱藏，@media print 才顯示 -->
    <div v-if="printTemplateData" class="print-excel-wrapper">
      <table class="print-excel-table">
        <colgroup>
          <col
            v-for="(w, i) in colWidthPercents"
            :key="i"
            :style="{ width: w + '%' }"
          />
        </colgroup>
        <tbody>
          <tr
            v-for="(row, rIdx) in printTemplateData.rows"
            :key="rIdx"
            :style="{ height: row.height + 'pt' }"
          >
            <td
              v-for="(cell, cIdx) in row.cells"
              :key="cIdx"
              :colspan="cell.colspan > 1 ? cell.colspan : undefined"
              :rowspan="cell.rowspan > 1 ? cell.rowspan : undefined"
              :style="getCellStyle(cell)"
            >{{ cell.value }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <v-card
      v-if="!loading && checklist"
      class="pa-6 checklist-preview"
      :class="{ 'hide-on-print': !!printTemplateData }"
    >
      <v-row align="end" class="mb-4" dense>
        <v-col cols="12" md="8">
          <div class="text-caption text-medium-emphasis">文件名稱</div>
          <h2 class="text-h5 checklist-title">{{ checklist.name }}</h2>
        </v-col>
        <v-col cols="12" md="4" class="text-md-right">
          <div class="text-caption text-medium-emphasis">
            建立時間：{{ formatDateTime(checklist.createdAt) }}
          </div>
          <div class="text-caption text-medium-emphasis">
            最後更新：{{ formatDateTime(checklist.updatedAt) }}
          </div>
        </v-col>
      </v-row>

      <v-table class="checklist-preview-table">
        <thead>
          <tr>
            <th class="col-index">#</th>
            <th class="col-position">圖面位置</th>
            <th class="col-gauge">量具</th>
            <th>檢驗項目</th>
            <th>備註</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in checklist.rows" :key="row.id">
            <td class="text-center">{{ index + 1 }}</td>
            <td>{{ row.position || '—' }}</td>
            <td>
              <span v-if="row.gaugeName">{{ row.gaugeName }}</span>
              <span v-else-if="row.gaugeId" class="text-error">（已刪除）</span>
              <span v-else class="text-medium-emphasis">—</span>
            </td>
            <td class="text-pre-wrap">{{ row.inspectionItem || '—' }}</td>
            <td class="text-pre-wrap">{{ row.remark || '—' }}</td>
          </tr>
          <tr v-if="checklist.rows.length === 0">
            <td colspan="5" class="text-center text-medium-emphasis py-6">此檢查表無任何資料列</td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </div>
</template>

<style scoped>
.checklist-preview-table .col-index {
  width: 48px;
}
.checklist-preview-table .col-position {
  width: 140px;
}
.checklist-preview-table .col-gauge {
  width: 200px;
}
.checklist-preview-table th {
  font-weight: 600;
}
.checklist-preview-table td {
  vertical-align: middle;
  padding-top: 8px;
  padding-bottom: 8px;
}
.text-pre-wrap {
  white-space: pre-wrap;
  word-break: break-word;
}
.checklist-title {
  margin: 0;
}

/* 模板表格：螢幕隱藏、列印顯示 */
.print-excel-wrapper {
  display: none;
}
.print-excel-table {
  width: 100%;
  border-collapse: collapse;
  font-family: sans-serif;
}

@media print {
  .no-print {
    display: none !important;
  }
  .checklist-preview {
    box-shadow: none !important;
    padding: 0 !important;
  }
  .print-excel-wrapper {
    display: block;
  }
  .hide-on-print {
    display: none !important;
  }
}
</style>
