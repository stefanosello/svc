import { createApp } from 'vue'
import App from './App.vue'

import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap"

import ApiService from './services/api.service'

ApiService.init(process.env.VUE_APP_API_ROOT)

createApp(App).mount('#app')
