# SVC - an online compiler

Software performance and scalability project, UniVE, 2021/2022

## Usage

Start the dev environment:

```shell
$> docker-compose up
```

Navigate to [localhost:8081](http://localhost:8081).

---

The following containers will be instanciated:

| NAME  | DESCRIPTION  | PORT | NETWORKS |
|:-----:|:------------:|:----:|:--------:|
| *svc_frontend* | web server | 8081 | web-net |
| *svc_backend* | web server | 8080 | web-net, compiler-net |
| *svc_compiler* | compilation service | 1337 | compiler-net |
| *svc_redis-smq* | queue of compilation jobs | 6379 | compiler-net |


The `backend`, `redis-smq` and `compiler` containers are in the same network, named **compiler-net**, and communicates via HTTP protocol and sockets.

### Note
The `compiler` and `redis-smq` services have limited network access, since they are a potential security issue.
For now this app only compiles user-provided source code, but in the future it may also execute it.
For this reason these services are isolated and not accessible from the outside.
