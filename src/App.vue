<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
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
      <v-container fluid>
        <RouterView />
      </v-container>
    </v-main>
  </v-app>
</template>
