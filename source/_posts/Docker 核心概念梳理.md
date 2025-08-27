---
title: Docker 核心概念梳理
date: 2025-08-13T15:37:00
updated: 2025-08-27T16:03:00
categories: 
  - 云原生
cover: 
---

# 什么是 Docker

- Docker 是世界领先的软件容器平台。
- Docker 使用 Google 公司推出的 Go 语言 进行开发实现，基于 Linux 内核 提供的 CGroup 功能和 namespace 来实现的，以及 AUFS 类的 UnionFS 等技术，对进程进行封装隔离，属于操作系统层面的虚拟化技术。 由于隔离的进程独立于宿主和其它的隔离的进程，因此也称其为容器。
- Docker 能够自动执行重复性任务，例如搭建和配置开发环境，从而解放了开发人员以便他们专注在真正重要的事情上：构建杰出的软件。
- 用户可以方便地创建和使用容器，把自己的应用放入容器。容器还可以进行版本管理、复制、分享、修改，就像管理普通的代码一样。

# Docker 基本概念


Docker 中有非常重要的三个基本概念：镜像（Image）、容器（Container）和仓库（Repository）。


![image.png](https://raw.githubusercontent.com/Moonike1217/imageHosting/main/b77ea2d4b77ae157aed5a1067e25f836.png)


## 镜像


Docker 镜像是一个包含应用程序及其所有依赖、库、文件系统等的轻量级、可执行的包。它是容器的模板，用来创建 Docker 容器。镜像本质上是只读的，包含了运行某个应用所需的一切内容。通过 Docker 镜像，开发者可以保证在不同环境下应用的一致性，无论是本地开发、测试还是生产环境。


## 容器


镜像（Image）和容器（Container）的关系，就像是面向对象程序设计中的 类 和 实例 一样，镜像是静态的定义，容器是镜像运行时的实体。容器可以被创建、启动、停止、删除、暂停等 。容器的实质是进程，但与直接在宿主执行的进程不同，容器进程运行于属于自己的独立的命名空间。


## 仓库


镜像构建完成后，可以很容易的在当前宿主上运行，但是， 如果需要在其它服务器上使用这个镜像，我们就需要一个集中的存储、分发镜像的服务，Docker Registry 就是这样的服务。


一个 Docker Registry 中可以包含多个仓库（Repository）；每个仓库可以包含多个标签（Tag）；每个标签对应一个镜像。所以，镜像仓库是 Docker 用来集中存放镜像文件的地方，类似于我们常用的代码仓库。


通常，一个仓库会包含同一个软件不同版本的镜像，而标签就常用于对应该软件的各个版本 。我们可以通过 `<仓库名>:<标签>` 的格式来指定具体是这个软件哪个版本的镜像。如果不给出标签，将以 latest 作为默认标签.。


## 镜像、容器和仓库之间的关系


![image.png](https://raw.githubusercontent.com/Moonike1217/imageHosting/main/5dda3636517e72c165b76e736c702d7f.png)

- Dockerfile 是一个文本文件，包含了一系列的指令和参数，用于定义如何构建一个 Docker 镜像。运行 `docker build` 命令并指定一个 Dockerfile 时，Docker 会读取 Dockerfile 中的指令，逐步构建一个新的镜像，并将其保存在本地。
- `docker pull` 命令可以从指定的 Registry/Hub 下载一个镜像到本地，默认使用 Docker Hub。
- `docker run` 命令可以从本地镜像创建一个新的容器并启动它。如果本地没有镜像，Docker 会先尝试从 Registry/Hub 拉取镜像。
- `docker push` 命令可以将本地的 Docker 镜像上传到指定的 Registry/Hub。

# Docker 常用命令


## 基本命令


```bash
docker version # 查看docker版本
docker images # 查看所有已下载镜像，等价于：docker image ls 命令
docker container ls # 查看所有容器
docker ps #查看正在运行的容器
docker image prune # 清理临时的、没有被使用的镜像文件。-a, --all: 删除所有没有用的镜像，而不仅仅是临时文件；
```


## 拉取镜像


`docker pull` 命令默认使用的 Registry/Hub 是 Docker Hub。当你执行 `docker pull` 命令而没有指定任何 Registry/Hub 的地址时，Docker 会从 Docker Hub 拉取镜像。


```bash
docker search mysql # 查看mysql相关镜像
docker pull mysql:5.7 # 拉取mysql镜像
docker image ls # 查看所有已下载镜像
```


## 构建镜像


运行 `docker build` 命令并指定一个 Dockerfile 时，Docker 会读取 Dockerfile 中的指令，逐步构建一个新的镜像，并将其保存在本地。


```bash
# imageName 是镜像名称，1.0.0 是镜像的版本号或标签
docker build -t imageName:1.0.0 .
```


需要注意：Dockerfile 的文件名不必须为 Dockerfile，也不一定要放在构建上下文的根目录中。使用 `-f` 或 `--file` 选项，可以指定任何位置的任何文件作为 Dockerfile。当然，一般大家习惯性的会使用默认的文件名 `Dockerfile`，以及会将其置于镜像构建上下文目录中。


## 删除镜像


比如我们要删除我们下载的 mysql 镜像。


通过 `docker rmi [image]` （等价于`docker image rm [image]`）删除镜像之前首先要确保这个镜像没有被容器引用。通过我们前面讲的`docker ps`命令即可查看。


```shell
➜  ~ docker ps
CONTAINER ID        IMAGE               COMMAND                  CREATED        STATUS              PORTS                               NAMES
c4cd691d9f80        mysql:5.7           "docker-entrypoint.s…"   7 weeks ago    Up 12 days          0.0.0.0:3306->3306/tcp, 33060/tcp   mysql
```


可以看到 mysql 正在被 id 为 `c4cd691d9f80` 的容器引用，我们需要首先通过 `docker stop c4cd691d9f80` 或者 `docker stop mysql`暂停这个容器。


然后查看 mysql 镜像的 id：


```shell
➜  ~ docker images
REPOSITORY              TAG                 IMAGE ID            CREATED             SIZE
mysql                   5.7                 f6509bac4980        3 months ago        373MB
```


通过 IMAGE ID 或者 REPOSITORY 名字即可删除


```bash
docker rmi f6509bac4980 
#  或者 docker rmi mysql
```


## 镜像推送


`docker push` 命令用于将本地的 Docker 镜像上传到指定的 Registry/Hub。


```bash
# 将镜像推送到私有镜像仓库 Harbor
# harbor.example.com是私有镜像仓库的地址，ubuntu是镜像的名称，18.04是镜像的版本标签
docker push harbor.example.com/ubuntu:18.04
```


镜像推送之前，要确保本地已经构建好需要推送的 Docker 镜像。另外，务必先登录到对应的镜像仓库。

