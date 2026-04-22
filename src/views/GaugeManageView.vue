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

const search = ref('')

const headers = [
  { title: '量具名稱', key: 'name' },
  { title: '建立時間', key: 'createdAt', width: 220 },
  { title: '操作', key: 'actions', sortable: false, width: 120, align: 'center' as const },
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
    <v-row class="mb-6" dense>
      <v-col cols="12">
        <h1 class="text-h4 font-weight-medium">量具管理</h1>
        <div class="text-body-2 text-medium-emphasis mt-1">新增、刪除可供檢查表選用的量具</div>
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
      <v-row align="start" dense>
        <v-col cols="12" sm="9" md="10">
          <v-text-field
            v-model="newName"
            label="新增量具名稱"
            maxlength="50"
            counter
            :error-messages="createError ? [createError] : []"
            @keyup.enter="submitCreate"
          />
        </v-col>
        <v-col cols="12" sm="3" md="1" class="d-flex">
          <v-btn
            color="primary"
            prepend-icon="mdi-plus"
            :loading="creating"
            block
            class="mt-1"
            @click="submitCreate"
          >
            新增
          </v-btn>
        </v-col>
      </v-row>
    </v-card>

    <v-card>
      <v-card-text class="pb-0">
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="搜尋量具名稱"
          clearable
          hide-details
          density="compact"
        />
      </v-card-text>
      <v-data-table
        :headers="headers"
        :items="gauges"
        :loading="loading"
        :search="search"
        no-data-text="尚無量具，請於上方新增"
        loading-text="載入中..."
        items-per-page-text="每頁顯示筆數"
      >
        <template #[`item.createdAt`]="{ item }">
          {{ formatDateTime(item.createdAt) }}
        </template>
        <template #[`item.actions`]="{ item }">
          <v-tooltip text="刪除此量具" location="top">
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
