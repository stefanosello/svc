<template>
  <Home/>
</template>

<script>
import Home from './components/Home.vue'
import SocketService from './services/socket.service'

export default {
  name: 'App',
  components: {
    Home
  },
  created() {
    SocketService.init();
  }
}
</script>