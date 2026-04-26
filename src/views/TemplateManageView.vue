<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useSnackbar } from '../composables/useSnackbar'
import { deleteTemplate, getTemplates, uploadTemplate } from '../services/api'
import type { ExcelTemplate } from '../types'

const { show: showSnackbar } = useSnackbar()

const templates = ref<ExcelTemplate[]>([])
const loading = ref(false)
const errorMessage = ref('')

const newName = ref('')
const newDataStartRow = ref<number>(2)
const newFile = ref<File | null>(null)
const creating = ref(false)
const createError = ref('')
const fileError = ref('')

const deleteDialog = ref(false)
const deleteTarget = ref<ExcelTemplate | null>(null)
const deleting = ref(false)

const headers = [
  { title: '模板名稱', key: 'name' },
  { title: '資料起始列', key: 'dataStartRow', width: 140, align: 'center' as const },
  { title: '建立時間', key: 'createdAt', width: 220 },
  { title: '操作', key: 'actions', sortable: false, width: 120, align: 'center' as const },
]

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

async function loadTemplates() {
  loading.value = true
  errorMessage.value = ''
  try {
    templates.value = await getTemplates()
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : '載入失敗'
  } finally {
    loading.value = false
  }
}

async function submitCreate() {
  createError.value = ''
  fileError.value = ''

  if (!newName.value.trim()) {
    createError.value = '模板名稱不可為空'
    return
  }
  if (!newFile.value) {
    fileError.value = '請選擇 .xlsx 模板檔案'
    return
  }

  creating.value = true
  const createdName = newName.value.trim()
  try {
    await uploadTemplate(createdName, newFile.value, newDataStartRow.value)
    newName.value = ''
    newDataStartRow.value = 2
    newFile.value = null
    await loadTemplates()
    showSnackbar(`模板「${createdName}」上傳成功`)
  } catch (err) {
    createError.value = err instanceof Error ? err.message : '上傳失敗'
  } finally {
    creating.value = false
  }
}

function askDelete(t: ExcelTemplate) {
  deleteTarget.value = t
  deleteDialog.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  const targetName = deleteTarget.value.name
  try {
    await deleteTemplate(deleteTarget.value.id)
    deleteDialog.value = false
    deleteTarget.value = null
    await loadTemplates()
    showSnackbar(`模板「${targetName}」已刪除`)
  } catch (err) {
    deleteDialog.value = false
    deleteTarget.value = null
    showSnackbar(err instanceof Error ? err.message : '刪除失敗', 'error')
  } finally {
    deleting.value = false
  }
}

onMounted(loadTemplates)
</script>

<template>
  <div>
    <v-row class="mb-6" dense>
      <v-col cols="12">
        <h1 class="text-h4 font-weight-medium">模板管理</h1>
        <div class="text-body-2 text-medium-emphasis mt-1">
          上傳自訂 Excel 模板（含公司版頭），匯出時套用
        </div>
      </v-col>
    </v-row>

    <v-alert
      v-if="errorMessage"
      type="error"
      variant="tonal"
      closable
      class="mb-4"
      @click:close="errorMessage = ''"
    >
      {{ errorMessage }}
    </v-alert>

    <v-card class="mb-4 pa-4">
      <div class="text-subtitle-1 font-weight-medium mb-3">上傳新模板</div>
      <v-row align="start" dense>
        <v-col cols="12" sm="5" md="4">
          <v-text-field
            v-model="newName"
            label="模板名稱"
            maxlength="100"
            counter
            :error-messages="createError ? [createError] : []"
            @update:model-value="createError = ''"
          />
        </v-col>
        <v-col cols="12" sm="3" md="2">
          <v-text-field
            v-model.number="newDataStartRow"
            label="資料起始列"
            type="number"
            min="1"
            max="1000"
            hint="版頭列數 + 1"
            persistent-hint
          />
        </v-col>
        <v-col cols="12" sm="4" md="4">
          <v-file-input
            v-model="newFile"
            label="選擇 .xlsx 模板"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            prepend-icon="mdi-paperclip"
            :error-messages="fileError ? [fileError] : []"
            @update:model-value="fileError = ''"
          />
        </v-col>
        <v-col cols="12" sm="12" md="2" class="d-flex">
          <v-btn
            color="primary"
            prepend-icon="mdi-upload"
            :loading="creating"
            block
            class="mt-1"
            @click="submitCreate"
          >
            上傳
          </v-btn>
        </v-col>
      </v-row>
    </v-card>

    <v-card>
      <v-data-table
        :headers="headers"
        :items="templates"
        :loading="loading"
        no-data-text="尚無模板，請於上方上傳"
        loading-text="載入中..."
        items-per-page-text="每頁顯示筆數"
      >
        <template #[`item.createdAt`]="{ item }">
          {{ formatDateTime(item.createdAt) }}
        </template>
        <template #[`item.dataStartRow`]="{ item }">
          第 {{ item.dataStartRow }} 列
        </template>
        <template #[`item.actions`]="{ item }">
          <v-tooltip text="刪除此模板" location="top">
            <template #activator="{ props: tooltipProps }">
              <v-btn
                v-bind="tooltipProps"
                icon="mdi-delete"
                variant="text"
                size="small"
                color="error"
                aria-label="刪除"
                @click="askDelete(item)"
              />
            </template>
          </v-tooltip>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="deleteDialog" max-width="420" persistent transition="dialog-top-transition">
      <v-card>
        <v-card-title>確認刪除</v-card-title>
        <v-card-text>
          確定要刪除模板「{{ deleteTarget?.name }}」嗎？此操作無法復原。
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn :disabled="deleting" @click="deleteDialog = false">取消</v-btn>
          <v-btn color="error" :loading="deleting" @click="confirmDelete">刪除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
