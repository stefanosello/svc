<template>
  <div class="container h-100vh d-flex flex-column align-items-center justify-content-center">
    <h1> SVC </h1>
    <div class="w-100 my-5">
      <div v-if="compiled">
        <p>STATUS: {{statusCode}}</p>
        <p>STDERR: {{ stderr }}</p>
      </div>
      <label for="codeInput" class="form-label">Write your c++ code here</label>
      <prism-editor class="my-editor" v-model="code" :highlight="highlight" line-numbers></prism-editor>
    </div>
    <div class="w-100 d-flex justify-content-end">
      <button class="btn btn-primary" @click="compile">Compile</button>
    </div>
  </div>
</template>

<script>

import ApiService from '../services/api.service';
import socketService from '../services/socket.service';
import { PrismEditor } from 'vue-prism-editor';
import 'vue-prism-editor/dist/prismeditor.min.css';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism-tomorrow.css';

export default {
  name: 'HelloWorld',
  components: {
    PrismEditor,
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
    highlight(code) {
      return highlight(code, languages.clike);
    },
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
  /* required class */
  .my-editor {
    /* we dont use `language-` classes anymore so thats why we need to add background and text color manually */
    background: #2d2d2d;
    color: #ccc;

    /* you must provide font-family font-size line-height. Example: */
    font-family: Fira code, Fira Mono, Consolas, Menlo, Courier, monospace;
    font-size: 14px;
    line-height: 1.5;
    padding: 5px;
  }

  /* optional class for removing the outline */
  .prism-editor__textarea:focus {
    outline: none;
  }
</style>