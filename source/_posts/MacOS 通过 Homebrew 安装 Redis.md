---
title: MacOS 通过 Homebrew 安装 Redis
date: 2025-07-18T11:23:00
updated: 2025-08-06T16:48:00
categories: 
  - 环境搭建
cover: 
---

# 安装 Redis


```bash
brew install redis
brew link redis

# 启动 Redis ------------
redis-server
```


看到下图证明启动成功：


![image.png](https://raw.githubusercontent.com/Moonike1217/imageHosting/main/964834cf984ebbec7de070257d0e6d1a.png)


# 按需修改配置文件


通过 Homebrew 安装的 Redis 和用常规 tar 包安装的 Redis 的配置文件目录有所不同。


Homebrew 安装的配置文件路径： `/usr/local/etc/redis.conf`


关于配置文件，我们一般会修改以下几个属性：

- `requirepass {password}`：设置密码
- `daemonize [yes/no]` ：前台运行或后台运行
- `logfile {path}`：修改日志文件路径

# 按配置启动 Redis


修改了配置文件后，我们需要在命令行参数中补充配置文件路径，才能够保证配置文件生效。


```bash
redis-server /usr/local/etc/redis.conf
```

