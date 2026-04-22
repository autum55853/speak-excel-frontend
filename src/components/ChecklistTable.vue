<script setup lang="ts">
import { computed, ref } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import GaugeSelect from './GaugeSelect.vue'
import SpeechInputField from './SpeechInputField.vue'
import { createGauge } from '../services/api'
import type { ChecklistRow, Gauge } from '../types'

const props = defineProps<{
  rows: ChecklistRow[]
  gauges: Gauge[]
}>()

const emit = defineEmits<{
  'update:rows': [rows: ChecklistRow[]]
  'gauge-created': [gauge: Gauge]
}>()

const newGaugeDialog = ref(false)
const newGaugeName = ref('')
const creating = ref(false)
const createError = ref('')

const canAddRow = computed(() => {
  if (props.rows.length === 0) return true
  const last = props.rows[props.rows.length - 1]
  return last.position.trim() !== '' && last.gaugeId !== '' && last.inspectionItem.trim() !== ''
})

function emitUpdate(next: ChecklistRow[]) {
  emit('update:rows', next)
}

function updateField<K extends keyof ChecklistRow>(index: number, key: K, value: ChecklistRow[K]) {
  const next = props.rows.map((row, i) => (i === index ? { ...row, [key]: value } : row))
  emitUpdate(next)
}

function onGaugeChange(index: number, gaugeId: string) {
  const gauge = props.gauges.find((g) => g.id === gaugeId)
  const next = props.rows.map((row, i) =>
    i === index
      ? {
          ...row,
          gaugeId,
          gaugeName: gauge?.name ?? '',
        }
      : row,
  )
  emitUpdate(next)
}

function addRow() {
  if (!canAddRow.value) return
  const next: ChecklistRow[] = [
    ...props.rows,
    {
      id: uuidv4(),
      position: '',
      gaugeId: '',
      gaugeName: '',
      inspectionItem: '',
      remark: '',
    },
  ]
  emitUpdate(next)
}

function removeRow(index: number) {
  const next = props.rows.filter((_, i) => i !== index)
  emitUpdate(next)
}

function openCreateGaugeDialog() {
  newGaugeName.value = ''
  createError.value = ''
  newGaugeDialog.value = true
}

async function submitCreateGauge() {
  createError.value = ''
  creating.value = true
  try {
    const gauge = await createGauge(newGaugeName.value)
    emit('gauge-created', gauge)
    newGaugeDialog.value = false
  } catch (err) {
    createError.value = err instanceof Error ? err.message : '新增量具失敗'
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <div>
    <v-table class="checklist-edit-table">
      <thead>
        <tr>
          <th class="col-index">#</th>
          <th class="col-position">
            <div class="d-flex align-center ga-1">
              圖面位置<span class="text-h6 must-item">*</span>
            </div>
          </th>
          <th class="col-gauge">
            <div class="d-flex align-center ga-1">
              <span>量具</span><span class="text-h6 must-item">*</span>
              <v-tooltip text="新增量具" location="top">
                <template #activator="{ props: tooltipProps }">
                  <v-btn
                    v-bind="tooltipProps"
                    icon="mdi-plus"
                    size="x-small"
                    variant="tonal"
                    color="primary"
                    aria-label="新增量具"
                    @click="openCreateGaugeDialog"
                  />
                </template>
              </v-tooltip>
            </div>
          </th>
          <th class="col-item">
            <div class="d-flex align-center ga-1">
              檢驗項目 <span class="text-h6 must-item">*</span>
            </div>
          </th>
          <th class="col-remark">備註</th>
          <th class="col-action">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, index) in props.rows" :key="row.id">
          <td class="text-center">{{ index + 1 }}</td>
          <td>
            <v-text-field
              :model-value="row.position"
              density="compact"
              maxlength="50"
              hide-details
              @update:model-value="(v: string) => updateField(index, 'position', v)"
            />
          </td>
          <td>
            <GaugeSelect
              :model-value="row.gaugeId"
              :gauges="props.gauges"
              label="請選擇量具"
              density="compact"
              hide-create-button
              @update:model-value="(v: string) => onGaugeChange(index, v)"
            />
          </td>
          <td>
            <SpeechInputField
              :model-value="row.inspectionItem"
              density="compact"
              @update:model-value="(v: string) => updateField(index, 'inspectionItem', v)"
            />
          </td>
          <td>
            <SpeechInputField
              :model-value="row.remark"
              density="compact"
              @update:model-value="(v: string) => updateField(index, 'remark', v)"
            />
          </td>
          <td class="text-center">
            <v-tooltip text="刪除此列" location="top">
              <template #activator="{ props: tooltipProps }">
                <v-btn
                  v-bind="tooltipProps"
                  icon="mdi-delete"
                  size="small"
                  variant="text"
                  color="error"
                  aria-label="刪除此列"
                  @click="removeRow(index)"
                />
              </template>
            </v-tooltip>
          </td>
        </tr>
        <tr v-if="props.rows.length === 0">
          <td colspan="6" class="text-center text-medium-emphasis py-6">
            尚無資料列，請點下方「新增一列」開始編輯
          </td>
        </tr>
      </tbody>
    </v-table>

    <div class="d-flex justify-end mt-3">
      <v-btn prepend-icon="mdi-plus" variant="tonal" :disabled="!canAddRow" @click="addRow">
        新增一列
      </v-btn>
    </div>

    <v-dialog v-model="newGaugeDialog" max-width="420" persistent>
      <v-card>
        <v-card-title>新增量具</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newGaugeName"
            label="量具名稱"
            maxlength="100"
            counter
            autofocus
            :error-messages="createError ? [createError] : []"
            @keyup.enter="submitCreateGauge"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn :disabled="creating" @click="newGaugeDialog = false">取消</v-btn>
          <v-btn color="primary" :loading="creating" @click="submitCreateGauge">新增</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.checklist-edit-table .col-index {
  width: 20px;
}
.checklist-edit-table .col-action {
  width: 50px;
}
.checklist-edit-table .col-position {
  width: 120px;
}
.checklist-edit-table .col-gauge {
  width: 200px;
}

.must-item {
  color: rgb(228, 67, 67);
}
</style>
