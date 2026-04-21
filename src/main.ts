import { createApp } from 'vue'
import App from './App.vue'
import { vuetify } from './plugins/vuetify'
import { router } from './router'
import './style.css'
import 'vuetify/styles'

const app = createApp(App)

app.use(vuetify)
app.use(router)
app.mount('#app')
