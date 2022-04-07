<template>
  <div class="container h-100vh">
    <h1 class="d-flex my-4 justify-content-center align-items-center shadow bg-body rounded py-3">SV<img class="icon" src="favicon.jpg"/></h1>

    <div class="d-flex flex-column align-items-center justify-content-center p-4 shadow bg-body rounded">
      <div class="w-100 mb-3">
        <label for="codeInput" class="form-label">Write your c++ code here</label>
        <prism-editor id="codeInput" class="my-editor rounded py-3" v-model="code" :highlight="highlight" line-numbers></prism-editor>
      </div>
      <div class="w-100 d-flex justify-content-end input-group mb-3">
        <input type="text" class="form-control" v-model="cflags" placeholder="Compilation flags">
        <button class="btn btn-secondary" @click="compile">Compile</button>
      </div>

      <div class="w-100">
        <div v-if="compilationInProgress" class="d-flex justify-content-center">
          <Preloader color="#6C757D" :scale="0.6"/>
        </div>
        <div class="alert mb-0" :class="`alert-${this.exitCode ? 'danger' : 'success'}`" role="alert" v-if="!compilationInProgress && compiled">
          <strong class="text-uppercase">
            {{ exitCodeDisplay }}
          </strong>
          <pre v-if="errorDisplay">{{ errorDisplay }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

import ApiService from '../services/api.service';
import socketService from '../services/socket.service';
import { highlight, languages } from 'prismjs/components/prism-core';
import { PrismEditor } from 'vue-prism-editor';
import 'vue-prism-editor/dist/prismeditor.min.css';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism-tomorrow.css';
import Preloader from './Preloader.vue'

export default {
  name: 'HelloWorld',
  components: {
    PrismEditor,
    Preloader,
  },
  data() {
    return {
      code: '',
      exitCode: '',
      stderr: '',
      compiled: false,
      compilationInProgress: false,
      cflags: ''
    }
  },
  computed: {
    exitCodeDisplay: function() {
      if (this.exitCode === 0) {
        return 'Compilation Successful!'
      } else {
        return 'Compilation Failed'
      }
    },
    errorDisplay: function() {
      if (!this.stderr)
        return '';

      const regex = /\/src\/([a-z0-9]*-?)*.cpp/gm;
      return this.stderr.replaceAll(regex, '(INPUT)')
    }
  },
  methods: {
    highlight(code) {
      return highlight(code, languages.clike);
    },
    compile() {
      localStorage.setItem('cflags', this.cflags);
      localStorage.setItem('code', this.code);
      ApiService.post('/compile', 
        { 
          code: this.code, 
          cflags: this.cflags
        }
      )
      .then(res => {
        this.compiled = false;
        this.compilationInProgress = true;
      });
    },
    mayInitData() {
      if (localStorage.getItem('code')) {
        this.code = localStorage.getItem('code');
      }
      if (localStorage.getItem('cflags')) {
        this.cflags = localStorage.getItem('cflags');
      }
    },
  },
  mounted() {
    socketService.on("compilation-result", (results) => {
      this.compilationInProgress = false;

      this.exitCode = results.exitCode;
      this.stderr = results.stderr;
      this.compiled = true;
    });
    this.mayInitData();
  }
}
</script>

<style lang="css">
  body {
    background-color: #f4f4f4 !important;
  }

  .h-100vh {
    height: 100vh;
  }

  /* required class */
  .my-editor {
    /* we dont use `language-` classes anymore so thats why we need to add background and text color manually */
    background: #2d2d2d;
    color: #FFFFFF;

    height: 40vh;
    resize: vertical;

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

  .prism-editor__container {
    height: 100% !important;
  }

  .icon {
    width: 2.5rem;
    height: 2.5rem;
  }

</style>