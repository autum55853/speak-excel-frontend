import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { defineComponent, h } from 'vue'

/**
 * Phase 1 基礎建設：先以 placeholder 元件佔位，
 * Phase 2 各 View 元件建立後，將此處改為 `() => import('../views/XxxView.vue')` 動態載入。
 */
const placeholder = (title: string) =>
  defineComponent({
    name: `Placeholder_${title.replace(/\s+/g, '')}`,
    render() {
      return h('div', { style: 'padding:24px;' }, [
        h('h2', null, title),
        h('p', null, '此頁面將於 Phase 2 實作。'),
      ])
    },
  })

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'checklist-list',
    component: placeholder('檢查表列表'),
  },
  {
    path: '/checklist/new',
    name: 'checklist-new',
    component: placeholder('新增檢查表'),
  },
  {
    path: '/checklist/:id/edit',
    name: 'checklist-edit',
    component: placeholder('編輯檢查表'),
    props: true,
  },
  {
    path: '/checklist/:id/preview',
    name: 'checklist-preview',
    component: placeholder('預覽檢查表'),
    props: true,
  },
  {
    path: '/gauges',
    name: 'gauges',
    component: placeholder('量具管理'),
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: placeholder('找不到頁面'),
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
