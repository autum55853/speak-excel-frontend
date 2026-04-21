import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { defineComponent, h } from 'vue'

/**
 * Phase 2：ChecklistListView / ChecklistEditView / GaugeManageView 已實作。
 * Phase 3 將實作 ChecklistPreviewView（目前仍以 placeholder 佔位）。
 */
const placeholder = (title: string, phase: string) =>
  defineComponent({
    name: `Placeholder_${title.replace(/\s+/g, '')}`,
    render() {
      return h('div', { style: 'padding:24px;' }, [
        h('h2', null, title),
        h('p', null, `此頁面將於 ${phase} 實作。`),
      ])
    },
  })

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'checklist-list',
    component: () => import('../views/ChecklistListView.vue'),
  },
  {
    path: '/checklist/new',
    name: 'checklist-new',
    component: () => import('../views/ChecklistEditView.vue'),
  },
  {
    path: '/checklist/:id/edit',
    name: 'checklist-edit',
    component: () => import('../views/ChecklistEditView.vue'),
    props: true,
  },
  {
    path: '/checklist/:id/preview',
    name: 'checklist-preview',
    component: placeholder('預覽檢查表', 'Phase 3'),
    props: true,
  },
  {
    path: '/gauges',
    name: 'gauges',
    component: () => import('../views/GaugeManageView.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: placeholder('找不到頁面', 'Phase 2'),
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
