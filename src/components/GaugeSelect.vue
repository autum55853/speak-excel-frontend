<script setup lang="ts">
import { ref, watch } from 'vue'
import { createGauge } from '../services/api'
import type { Gauge } from '../types'

const props = defineProps<{
  modelValue: string
  gauges: Gauge[]
  label?: string
  density?: 'default' | 'comfortable' | 'compact'
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'gauge-created': [gauge: Gauge]
}>()

const newGaugeDialog = ref(false)
const newGaugeName = ref('')
const creating = ref(false)
const createError = ref('')

const selectedId = ref<string>(props.modelValue)
watch(
  () => props.modelValue,
  (v) => {
    selectedId.value = v
  },
)

function onSelect(value: string | null) {
  selectedId.value = value ?? ''
  emit('update:modelValue', selectedId.value)
}

function openCreateDialog() {
  newGaugeName.value = ''
  createError.value = ''
  newGaugeDialog.value = true
}

async function submitCreate() {
  createError.value = ''
  creating.value = true
  try {
    const gauge = await createGauge(newGaugeName.value)
    emit('gauge-created', gauge)
    emit('update:modelValue', gauge.id)
    selectedId.value = gauge.id
    newGaugeDialog.value = false
  } catch (err) {
    createError.value = err instanceof Error ? err.message : '新增量具失敗'
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <div class="d-flex align-center ga-2">
    <v-autocomplete
      :model-value="selectedId || null"
      :items="props.gauges"
      item-title="name"
      item-value="id"
      :label="props.label ?? '量具'"
      :density="props.density ?? 'comfortable'"
      clearable
      hide-details
      no-data-text="尚無量具，請新增"
      @update:model-value="onSelect"
    />
    <v-btn
      icon="mdi-plus"
      size="small"
      variant="tonal"
      color="primary"
      aria-label="新增量具"
      @click="openCreateDialog"
    />

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
            @keyup.enter="submitCreate"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn :disabled="creating" @click="newGaugeDialog = false">取消</v-btn>
          <v-btn color="primary" :loading="creating" @click="submitCreate">新增</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
