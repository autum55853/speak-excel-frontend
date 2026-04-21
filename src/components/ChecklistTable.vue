<script setup lang="ts">
import { v4 as uuidv4 } from 'uuid'
import GaugeSelect from './GaugeSelect.vue'
import SpeechInputField from './SpeechInputField.vue'
import type { ChecklistRow, Gauge } from '../types'

const props = defineProps<{
  rows: ChecklistRow[]
  gauges: Gauge[]
}>()

const emit = defineEmits<{
  'update:rows': [rows: ChecklistRow[]]
  'gauge-created': [gauge: Gauge]
}>()

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

function onGaugeCreated(index: number, gauge: Gauge) {
  emit('gauge-created', gauge)
  const next = props.rows.map((row, i) =>
    i === index ? { ...row, gaugeId: gauge.id, gaugeName: gauge.name } : row,
  )
  emitUpdate(next)
}
</script>

<template>
  <div>
    <v-table class="checklist-edit-table">
      <thead>
        <tr>
          <th class="col-index">#</th>
          <th class="col-position">圖面位置</th>
          <th class="col-gauge">量具</th>
          <th class="col-item">檢驗項目</th>
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
              hide-details
              maxlength="100"
              @update:model-value="(v: string) => updateField(index, 'position', v)"
            />
          </td>
          <td>
            <GaugeSelect
              :model-value="row.gaugeId"
              :gauges="props.gauges"
              density="compact"
              @update:model-value="(v: string) => onGaugeChange(index, v)"
              @gauge-created="(g: Gauge) => onGaugeCreated(index, g)"
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
            <v-btn
              icon="mdi-delete"
              size="small"
              variant="text"
              color="error"
              aria-label="刪除此列"
              @click="removeRow(index)"
            />
          </td>
        </tr>
        <tr v-if="props.rows.length === 0">
          <td colspan="6" class="text-center text-medium-emphasis py-6">
            尚無資料列，請點下方「新增一列」開始編輯
          </td>
        </tr>
      </tbody>
    </v-table>

    <div class="mt-3">
      <v-btn prepend-icon="mdi-plus" variant="tonal" @click="addRow">新增一列</v-btn>
    </div>
  </div>
</template>

<style scoped>
.checklist-edit-table .col-index {
  width: 48px;
}
.checklist-edit-table .col-action {
  width: 72px;
}
.checklist-edit-table .col-position {
  width: 140px;
}
.checklist-edit-table .col-gauge {
  width: 220px;
}
</style>
