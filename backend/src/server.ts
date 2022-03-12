import express from 'express';

const { spawn } = require("child_process");
const shlex = require("shlex");

function compile() {
  const filename = "main.cpp";
  const cmd = `docker-compose exec svc-compiler g++ -std=c++17 /src/${filename}`;
  
  const shlexed = shlex.split(cmd);
  return spawn(shlexed.shift(), shlexed);
  //spawn("docker-compose", [filename])
}

const app = express();
app.listen(4000, () => {
  console.log(`server running on port 4000`);
  compile();
});
