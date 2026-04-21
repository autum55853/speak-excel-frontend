<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { createGauge, deleteGauge, getGauges } from '../services/api'
import type { Gauge } from '../types'

const gauges = ref<Gauge[]>([])
const loading = ref(false)
const errorMessage = ref('')

const newName = ref('')
const creating = ref(false)
const createError = ref('')

const deleteDialog = ref(false)
const deleteTarget = ref<Gauge | null>(null)
const deleting = ref(false)

const headers = [
  { title: '量具名稱', key: 'name' },
  { title: '建立時間', key: 'createdAt', width: 220 },
  { title: '操作', key: 'actions', sortable: false, width: 120, align: 'end' as const },
]

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

async function loadGauges() {
  loading.value = true
  errorMessage.value = ''
  try {
    gauges.value = await getGauges()
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : '載入失敗'
  } finally {
    loading.value = false
  }
}

async function submitCreate() {
  createError.value = ''
  creating.value = true
  try {
    await createGauge(newName.value)
    newName.value = ''
    await loadGauges()
  } catch (err) {
    createError.value = err instanceof Error ? err.message : '新增量具失敗'
  } finally {
    creating.value = false
  }
}

function askDelete(g: Gauge) {
  deleteTarget.value = g
  deleteDialog.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await deleteGauge(deleteTarget.value.id)
    deleteDialog.value = false
    deleteTarget.value = null
    await loadGauges()
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : '刪除失敗'
  } finally {
    deleting.value = false
  }
}

onMounted(loadGauges)
</script>

<template>
  <div>
    <div class="d-flex align-center mb-4">
      <h1 class="text-h5">量具管理</h1>
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

    <v-card class="mb-4 pa-4">
      <div class="d-flex align-start ga-2">
        <v-text-field
          v-model="newName"
          label="新增量具名稱"
          maxlength="100"
          counter
          :error-messages="createError ? [createError] : []"
          @keyup.enter="submitCreate"
        />
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          :loading="creating"
          class="mt-1"
          @click="submitCreate"
        >
          新增
        </v-btn>
      </div>
    </v-card>

    <v-card>
      <v-data-table
        :headers="headers"
        :items="gauges"
        :loading="loading"
        no-data-text="尚無量具，請於上方新增"
        loading-text="載入中..."
        items-per-page-text="每頁顯示筆數"
      >
        <template #[`item.createdAt`]="{ item }">
          {{ formatDateTime(item.createdAt) }}
        </template>
        <template #[`item.actions`]="{ item }">
          <v-btn
            icon="mdi-delete"
            variant="text"
            size="small"
            color="error"
            aria-label="刪除"
            @click="askDelete(item)"
          />
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="deleteDialog" max-width="420" persistent>
      <v-card>
        <v-card-title>確認刪除</v-card-title>
        <v-card-text>
          確定要刪除量具「{{ deleteTarget?.name }}」嗎？已使用此量具的檢查表仍會保留顯示名稱。
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
