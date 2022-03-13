import express from 'express';
import axios from 'axios';
import bodyParser from 'body-parser'

const instance = axios.create({
  baseURL: 'http://svc-compiler:1337/',
})


async function doRequest(filename: string) {
  //console.log(instance);
  const res = await instance.post("/compile", { filename } );
  
  console.log("EXIT CODE:", res.data.exitCode);
  console.log("STDOUT:", res.data.stdout);
  console.log("STDERR:", res.data.stderr);
}

const app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())


app.listen(4000, () => {
  console.log(`server running on port 4000`);

  doRequest('main.cpp');
  
});
