<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ExportDialog from '../components/ExportDialog.vue'
import { getChecklist } from '../services/api'
import type { Checklist } from '../types'

const route = useRoute()
const router = useRouter()

const checklistId = computed(() => (typeof route.params.id === 'string' ? route.params.id : null))

const checklist = ref<Checklist | null>(null)
const loading = ref(false)
const errorMessage = ref('')
const showExportDialog = ref(false)

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

onMounted(load)
</script>

<template>
  <div>
    <div class="d-flex align-center flex-wrap ga-3 mb-6 no-print">
      <v-btn icon="mdi-arrow-left" variant="text" aria-label="返回列表" @click="goBack" />
      <div>
        <h1 class="text-h4 font-weight-medium">檢查表預覽</h1>
        <div class="text-body-2 text-medium-emphasis mt-1">
          檢視文件內容並匯出為 Excel / PDF / 列印
        </div>
      </div>
      <v-spacer />
      <v-btn variant="text" prepend-icon="mdi-pencil" @click="goEdit">重新編輯</v-btn>
      <v-btn color="primary" prepend-icon="mdi-export" :disabled="!checklist" @click="handleExport">
        匯出
      </v-btn>
    </div>

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

    <v-card v-else-if="checklist" class="pa-6 checklist-preview">
      <div class="d-flex justify-space-between align-end mb-4 flex-wrap ga-2">
        <div>
          <div class="text-caption text-medium-emphasis">文件名稱</div>
          <h2 class="text-h5 checklist-title">{{ checklist.name }}</h2>
        </div>
        <div class="text-right">
          <div class="text-caption text-medium-emphasis">
            建立時間：{{ formatDateTime(checklist.createdAt) }}
          </div>
          <div class="text-caption text-medium-emphasis">
            最後更新：{{ formatDateTime(checklist.updatedAt) }}
          </div>
        </div>
      </div>

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
  vertical-align: top;
}
.text-pre-wrap {
  white-space: pre-wrap;
  word-break: break-word;
}
.checklist-title {
  margin: 0;
}

@media print {
  .no-print {
    display: none !important;
  }
  .checklist-preview {
    box-shadow: none !important;
    padding: 0 !important;
  }
}
</style>
