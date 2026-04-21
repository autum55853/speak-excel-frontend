<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { deleteChecklist, getChecklists } from '../services/api'
import type { ChecklistSummary } from '../types'

const router = useRouter()

const items = ref<ChecklistSummary[]>([])
const loading = ref(false)
const errorMessage = ref('')

const deleteDialog = ref(false)
const deleteTarget = ref<ChecklistSummary | null>(null)
const deleting = ref(false)

const headers = [
  { title: '序號', key: 'index', sortable: false, width: 80 },
  { title: '文件名稱', key: 'name' },
  { title: '存檔時間', key: 'updatedAt', width: 220 },
  { title: '操作', key: 'actions', sortable: false, width: 160, align: 'end' as const },
]

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

async function loadChecklists() {
  loading.value = true
  errorMessage.value = ''
  try {
    items.value = await getChecklists()
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : '載入失敗'
  } finally {
    loading.value = false
  }
}

function goPreview(item: ChecklistSummary) {
  router.push({ name: 'checklist-preview', params: { id: item.id } })
}

function goEdit(item: ChecklistSummary) {
  router.push({ name: 'checklist-edit', params: { id: item.id } })
}

function askDelete(item: ChecklistSummary) {
  deleteTarget.value = item
  deleteDialog.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await deleteChecklist(deleteTarget.value.id)
    deleteDialog.value = false
    deleteTarget.value = null
    await loadChecklists()
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : '刪除失敗'
  } finally {
    deleting.value = false
  }
}

onMounted(loadChecklists)
</script>

<template>
  <div>
    <div class="d-flex align-center flex-wrap ga-3 mb-6">
      <div>
        <h1 class="text-h4 font-weight-medium">檢查表列表</h1>
        <div class="text-body-2 text-medium-emphasis mt-1">管理所有已建立的自主檢查表文件</div>
      </div>
      <v-spacer />
      <v-btn color="primary" size="large" prepend-icon="mdi-plus" :to="{ name: 'checklist-new' }">
        新增文件
      </v-btn>
    </div>

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

    <v-card v-if="!loading && items.length === 0" class="pa-8">
      <v-empty-state
        icon="mdi-clipboard-text-off-outline"
        title="尚無檢查表"
        text="點擊右上角「新增文件」開始建立第一份檢查表"
      >
        <template #actions>
          <v-btn color="primary" prepend-icon="mdi-plus" :to="{ name: 'checklist-new' }">
            新增文件
          </v-btn>
        </template>
      </v-empty-state>
    </v-card>

    <v-card v-else>
      <v-data-table
        :headers="headers"
        :items="items"
        :loading="loading"
        hover
        no-data-text="尚無檢查表"
        loading-text="載入中..."
        items-per-page-text="每頁顯示筆數"
        @click:row="(_: unknown, { item }: { item: ChecklistSummary }) => goPreview(item)"
      >
        <template #[`item.index`]="{ index }">
          {{ index + 1 }}
        </template>
        <template #[`item.updatedAt`]="{ item }">
          {{ formatDateTime(item.updatedAt) }}
        </template>
        <template #[`item.actions`]="{ item }">
          <v-btn
            icon="mdi-pencil"
            variant="text"
            size="small"
            aria-label="編輯"
            @click.stop="goEdit(item)"
          />
          <v-btn
            icon="mdi-delete"
            variant="text"
            size="small"
            color="error"
            aria-label="刪除"
            @click.stop="askDelete(item)"
          />
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="deleteDialog" max-width="420" persistent>
      <v-card>
        <v-card-title>確認刪除</v-card-title>
        <v-card-text>
          確定要刪除檢查表「{{ deleteTarget?.name }}」嗎？此操作無法復原。
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
