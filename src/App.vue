<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useSnackbar } from './composables/useSnackbar'

type NavItem = {
  title: string
  icon: string
  to: { name: string }
}

const { mobile } = useDisplay()
const drawer = ref(true)

const { visible: snackVisible, message: snackMessage, color: snackColor, show: showSnackbar } = useSnackbar()

function onUnauthorized() {
  showSnackbar('未授權存取，請重新整理頁面', 'error')
}
onMounted(() => window.addEventListener('auth:unauthorized', onUnauthorized))
onUnmounted(() => window.removeEventListener('auth:unauthorized', onUnauthorized))

const navItems: NavItem[] = [
  { title: '檢查表列表', icon: 'mdi-clipboard-list-outline', to: { name: 'checklist-list' } },
  { title: '新增檢查表', icon: 'mdi-file-document-plus-outline', to: { name: 'checklist-new' } },
  { title: '量具管理', icon: 'mdi-ruler', to: { name: 'gauges' } },
]

const isSpeechSupported = computed(() => {
  if (typeof window === 'undefined') return true
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
})

function toggleDrawer() {
  drawer.value = !drawer.value
}
</script>

<template>
  <v-app>
    <v-app-bar color="primary" density="comfortable" class="no-print">
      <v-app-bar-nav-icon aria-label="切換側欄" @click="toggleDrawer" />
      <v-app-bar-title>
        <RouterLink to="/" class="text-white text-decoration-none app-title">
          <v-icon icon="mdi-clipboard-check-outline" class="mr-2" />
          自主檢查表系統
        </RouterLink>
      </v-app-bar-title>
    </v-app-bar>

    <v-navigation-drawer
      v-model="drawer"
      :permanent="!mobile"
      :temporary="mobile"
      class="no-print"
      width="260"
      elevation="1"
    >
      <v-list nav density="comfortable">
        <v-list-subheader>主選單</v-list-subheader>
        <v-list-item
          v-for="item in navItems"
          :key="item.title"
          :to="item.to"
          :prepend-icon="item.icon"
          :title="item.title"
          color="primary"
        />
      </v-list>

      <template #append>
        <div class="pa-4 text-caption text-medium-emphasis">
          <div>CNC 自主檢查表</div>
          <div>v0.0.0</div>
        </div>
      </template>
    </v-navigation-drawer>

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

      <v-container fluid class="pa-4 pa-md-6">
        <RouterView />
      </v-container>
    </v-main>
    <v-snackbar
      v-model="snackVisible"
      :color="snackColor"
      :timeout="3500"
      location="bottom right"
    >
      {{ snackMessage }}
      <template #actions>
        <v-btn variant="text" @click="snackVisible = false">關閉</v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<style scoped>
.app-title {
  display: inline-flex;
  align-items: center;
  color: inherit;
}
</style>

<style>
@media print {
  .v-app-bar,
  .v-navigation-drawer,
  .v-overlay-container,
  .no-print {
    display: none !important;
  }
  .v-main {
    padding: 0 !important;
  }
  .v-main__wrap,
  .v-container {
    padding: 0 !important;
  }
}
</style>
