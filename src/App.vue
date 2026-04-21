<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView } from 'vue-router'

const isSpeechSupported = computed(() => {
  if (typeof window === 'undefined') return true
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
})
</script>

<template>
  <v-app>
    <v-app-bar color="primary" density="comfortable">
      <v-app-bar-title>
        <RouterLink to="/" class="text-white text-decoration-none"> 自主檢查表系統 </RouterLink>
      </v-app-bar-title>
      <template #append>
        <v-btn :to="{ name: 'gauges' }" prepend-icon="mdi-ruler" variant="text" color="white">
          量具管理
        </v-btn>
      </template>
    </v-app-bar>

    <v-main>
      <v-alert
        v-if="!isSpeechSupported"
        type="info"
        variant="tonal"
        density="compact"
        class="mx-4 mt-3 no-print"
        icon="mdi-microphone-off"
      >
        語音輸入僅支援 Chrome / Edge 瀏覽器，其他瀏覽器請以鍵盤輸入。
      </v-alert>

      <v-container fluid>
        <RouterView />
      </v-container>
    </v-main>
  </v-app>
</template>

<style>
@media print {
  .v-app-bar,
  .no-print {
    display: none !important;
  }
  .v-main {
    padding-top: 0 !important;
  }
}
</style>
