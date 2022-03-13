# SVC - an online compiler

Software performance and scalability project, UniVE, 2021/2022

## Usage

Start the dev environment:

```shell
$> docker-compose up
```

Navigate to [localhost:8080](http://localhost:8080).

---

The following containers will be instanciated:

| name  | description  | port | networks |
|:-----:|:------------:|:----:|:--------:|
| *svc-backend* | the web server | 8080 | web-net, compiler-net |
| *svc-compiler* | the compilation service | 1337 | compiler-net |


The `backend` and `compiler` containers are in the same network, named **compiler-net**, and communicates via HTTP protocol.

### Note
The `compiler` service has limited network access, since it is a potential security issue.
For now it only compiles user-provided source code, but in the future it may also execute it.
For this reason the service is isolated and not accessible from the outside.
