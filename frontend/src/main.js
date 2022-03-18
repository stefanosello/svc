import { createApp } from 'vue'
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap"
import App from './App.vue'

import { ApiService } from './services/api.service'

ApiService.init("http://localhost:8080")

createApp(App).mount('#app')
