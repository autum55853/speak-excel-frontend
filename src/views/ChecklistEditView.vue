<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ChecklistTable from '../components/ChecklistTable.vue'
import { createChecklist, getChecklist, getGauges, updateChecklist } from '../services/api'
import type { ChecklistRow, Gauge } from '../types'

const route = useRoute()
const router = useRouter()

const checklistId = computed(() => (typeof route.params.id === 'string' ? route.params.id : null))
const isEdit = computed(() => checklistId.value !== null)

const name = ref('')
const rows = ref<ChecklistRow[]>([])
const gauges = ref<Gauge[]>([])

const loading = ref(false)
const saving = ref(false)
const nameError = ref('')
const errorMessage = ref('')

function defaultName(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `自主檢查表-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

async function loadGauges() {
  gauges.value = await getGauges()
}

async function loadChecklist(id: string) {
  const c = await getChecklist(id)
  if (!c) {
    errorMessage.value = `找不到檢查表：${id}`
    return
  }
  name.value = c.name
  rows.value = c.rows
}

async function initialize() {
  loading.value = true
  errorMessage.value = ''
  try {
    await loadGauges()
    if (isEdit.value && checklistId.value) {
      await loadChecklist(checklistId.value)
    } else {
      name.value = defaultName()
      rows.value = []
    }
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : '初始化失敗'
  } finally {
    loading.value = false
  }
}

function onGaugeCreated(g: Gauge) {
  if (!gauges.value.some((x) => x.id === g.id)) {
    gauges.value = [...gauges.value, g].sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant'))
  }
}

async function handleSave() {
  nameError.value = ''
  errorMessage.value = ''
  if (!name.value.trim()) {
    nameError.value = '文件名稱不可為空'
    return
  }
  saving.value = true
  try {
    let savedId: string
    if (isEdit.value && checklistId.value) {
      const updated = await updateChecklist(checklistId.value, {
        name: name.value,
        rows: rows.value,
      })
      savedId = updated.id
    } else {
      const created = await createChecklist({ name: name.value, rows: rows.value })
      savedId = created.id
    }
    router.push({ name: 'checklist-preview', params: { id: savedId } })
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : '儲存失敗'
  } finally {
    saving.value = false
  }
}

function handleCancel() {
  router.push({ name: 'checklist-list' })
}

onMounted(initialize)
</script>

<template>
  <div>
    <v-row align="center" class="mb-6" dense>
      <v-col cols="12" md="8">
        <h1 class="text-h4 font-weight-medium">{{ isEdit ? '編輯檢查表' : '新增檢查表' }}</h1>
        <div class="text-body-2 text-medium-emphasis mt-1">
          {{ isEdit ? '修改現有檢查表內容' : '建立一份新的自主檢查表' }}
        </div>
      </v-col>
      <v-col cols="12" md="4" class="d-flex ga-2 justify-start justify-md-end">
        <v-btn variant="text" :disabled="saving" @click="handleCancel">取消</v-btn>
        <v-btn
          color="primary"
          prepend-icon="mdi-content-save"
          :loading="saving"
          @click="handleSave"
        >
          儲存
        </v-btn>
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

    <v-card v-if="loading" class="pa-6 d-flex justify-center">
      <v-progress-circular indeterminate color="primary" />
    </v-card>

    <template v-else>
      <v-card class="mb-4 pa-4">
        <v-text-field
          v-model="name"
          label="文件名稱"
          maxlength="200"
          counter
          :error-messages="nameError ? [nameError] : []"
        />
      </v-card>

      <v-card class="pa-4">
        <ChecklistTable
          :rows="rows"
          :gauges="gauges"
          @update:rows="(v: ChecklistRow[]) => (rows = v)"
          @gauge-created="onGaugeCreated"
        />
      </v-card>
    </template>
  </div>
</template>
