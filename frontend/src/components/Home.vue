<template>
  <div class="container h-100vh d-flex flex-column align-items-center justify-content-center">
    <h1> SVC </h1>
    <div class="w-100 my-5">
      <label for="codeInput" class="form-label">Write your c++ code here</label>
      <textarea class="form-control" v-model="code" id="codeInput" rows="6"></textarea>
    </div>
    <div class="w-100 d-flex justify-content-end">
      <button class="btn btn-primary" @click="compile">Compile</button>
    </div>
  </div>
</template>

<script>

import { ApiService } from '../services/api.service'
import { SocketService } from '../services/socket.service'

export default {
  name: 'HelloWorld',
  props: {
    msg: String
  },
  data() {
    return {
      code: '',
    }
  },
  methods: {
    compile() {
      ApiService.post('/compile', 
        { code: this.code }
      )
      .then(res => {
        console.log(res);
      });
    }
  },

  mounted() {
    SocketService.on('user-connected', (clientId) => {
      console.log(clientId);
    })
  }
}
</script>

<style lang="css" scoped>
  .h-100vh {
    height: 100vh;
  }
</style>