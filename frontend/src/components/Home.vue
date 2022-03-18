<template>
  <div class="container d-flex flex-column align-items-center justify-content-center">
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
import axios from 'axios';

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
    async compile() {
      axios.defaults.baseURL = 'http://svc-backend:80';
      axios.defaults.headers.common = {};
      const res = await axios.post('/compile', { code: this.code  });
      console.log(res);  
    }
  }
}
</script>