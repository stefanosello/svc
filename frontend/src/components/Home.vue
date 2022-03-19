<template>
  <div class="container h-100vh d-flex flex-column align-items-center justify-content-center">
    <h1> SVC </h1>
    <div class="w-100 my-5">
      <div v-if="compiled">
        <p>STATUS: {{statusCode}}</p>
        <p>STDERR: {{ stderr }}</p>
      </div>
      <label for="codeInput" class="form-label">Write your c++ code here</label>
      <textarea class="form-control" v-model="code" id="codeInput" rows="6"></textarea>
    </div>
    <div class="w-100 d-flex justify-content-end">
      <button class="btn btn-primary" @click="compile">Compile</button>
    </div>
  </div>
</template>

<script>

import ApiService from '../services/api.service'
import socketService from '../services/socket.service';

export default {
  name: 'HelloWorld',
  props: {
  },
  data() {
    return {
      code: '',
      statusCode: '',
      stderr: '',
      compiled: false,
    }
  },
  methods: {
    compile() {
      ApiService.post('/compile', 
        { code: this.code }
      )
      .then(res => {
        this.compiled = false;
        console.log(res);
      });
    }
  },

  mounted() {
    socketService.on("compilation-result", (results) => {
      console.log(results);
      this.statusCode = results.exitCode;
      this.stderr = results.stderr;
      this.compiled = true;
    })
  }
}
</script>

<style lang="css" scoped>
  .h-100vh {
    height: 100vh;
  }
</style>