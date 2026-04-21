import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { defineComponent, h } from 'vue'

const notFound = defineComponent({
  name: 'NotFoundView',
  render() {
    return h('div', { style: 'padding:24px;' }, [
      h('h2', null, '找不到頁面'),
      h('p', null, '請確認網址是否正確。'),
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
    component: () => import('../views/ChecklistPreviewView.vue'),
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
    component: notFound,
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
