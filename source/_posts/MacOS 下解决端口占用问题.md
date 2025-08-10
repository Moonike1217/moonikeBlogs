---
title: MacOS 下解决端口占用问题
date: 2025-08-08T14:45:00
updated: 2025-08-08T15:22:00
categories: 
  - 命令行
cover: 
---

之前都是在 Windows 上解决端口占用的问题，最近因为工作需要，以及自己也买了一台 Macbook Air，所以现在的大部分工作都是在 Mac 下完成的了，简单记录如何解决 MacOS 的端口占用问题。


# 确定被占用端口


这个其实很好确定，一般是在启动服务时会报端口被占用的错误：


![image.png](https://raw.githubusercontent.com/Moonike1217/imageHosting/main/5e023346d048e1f3892e76255285b23e.png)


如图就是8080端口被占用了。


# 确定占用端口的进程


我们一般可以采用 `lsof` (List Open File) 命令来确定占用端口的进程：


```bash
lsof -i :8080
# -i 表示仅显示与网络连接相关的文件（IPv4/IPv6 套接字）

# 我们一般会得到如下输出，可以看到 PID 为 1234 的进程监听了 8080 端口
COMMAND  PID    USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
nginx    1234   root    6u  IPv4  12345      0t0  TCP *:8080 (LISTEN)
```


# 干掉他


然后就可以快乐地使用 `kill 1234` 来把这个进程干掉啦～


# one more command


我们可以使用 `ps aux` 命令查看所有用户的所有进程。在电脑卡顿时，我们可以考虑使用这个命令找出 CPU 占用较高的进程，将其销毁：


```bash
ps aux --sort=-%cpu | head -n 5  # 显示CPU占用前5的进程

# ps aux：列出所有用户的进程详情（包括 CPU/内存占用）
# --sort=-%cpu：按 CPU 占用率降序排序（- 表示从高到低）
# | head -n 5：仅显示前 5 行结果
```

