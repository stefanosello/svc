<template>
  <div class="container h-100vh d-flex flex-column align-items-center justify-content-center">
    <h1> SVC </h1>

    <div class="w-100 my-5">
      <label for="codeInput" class="form-label">Write your c++ code here</label>
      <prism-editor id="codeInput" class="my-editor" v-model="code" :highlight="highlight" line-numbers></prism-editor>
    </div>
    <div class="w-100 d-flex justify-content-end input-group mb-3">
      <input type="text" class="form-control" v-model="cflags" placeholder="Compilation flags">
      <div class="input-group-append">
        <button class="btn btn-secondary" @click="compile">Compile</button>
      </div>
    </div>

    <div v-if="compiled" class="w-100 my-5">
      <div v-bind:class="{ 'text-success': this.exitCode === 0, 'text-danger': this.exitCode !== 0,  }" >
        {{ exitCodeDisplay }}
      </div>
      <div>
        <pre>{{ stderr }}</pre>
      </div>
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
      exitCode: '',
      stderr: '',
      compiled: false,
      cflags: ''
    }
  },
  computed: {
    exitCodeDisplay: function() {
      if (this.exitCode === 0) {
        return 'Compilation Successful!'
      } else {
        return 'Complation Failed'
      }
    },
  },
  methods: {
    highlight(code) {
      return highlight(code, languages.clike);
    },
    compile() {
      ApiService.post('/compile', 
        { 
          code: this.code, 
          cflags: this.cflags
        }
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
      this.exitCode = results.exitCode;
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