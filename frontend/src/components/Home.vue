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
      fetch('localhost:8080/compile', 
        {  
          method: 'POST',
          data: {
              code: this.code
          }

        }
      ).then(response => {
        console.log(response.body);
      });
    }
  }
}
</script>