---
title: TCP 连接的三次握手和四次挥手
date: 2025-08-17T16:04:00
updated: 2025-08-17T21:42:00
categories: 
  - 计算机网络
cover: 
---

TCP 是面向连接的协议，所以使用 TCP 前必须先建立连接，建立连接是通过三次握手来进行的，断开连接是通过四次挥手来进行的，下面来简要分析一下建立和断开 TCP 连接的过程。


# 三次握手的流程


![image.png](https://raw.githubusercontent.com/Moonike1217/imageHosting/main/43da9c5a71c7e30016231f892ea9f2e2.png)

- 服务端主动监听某个端口，进入 LISTEN 状态。
- 客户端初始化序号（client_isn）并填入 TCP 报文首部的序号字段中，将 SYN 标志位设置为 1，然后向服务端发送 SYN 报文，客户端进入 SYN-SENT 状态。
- 服务端接收到客户端的 SYN 报文，初始化序号（server_isn）并填入 TCP 报文首部的序号字段中，将 client_isn + 1 填入 TCP 报文首部的确认应答号字段中，将 SYN 和 ACK 标志位设置为 1，然后向客户端发送该报文，服务端进入 SYN_RCVD 状态。
- 客户端接收到服务端的报文，将 server_isn 填入 TCP 报文首部的确认应答号字段中，将 ACK 标志位设置为 1，然后向服务端发送该报文，客户端进入 ESTABLISHED 状态。
- 服务端接收到客户端的报文，服务端进入 ESTABLISHED 状态。

# 为什么不是两次或者四次握手


![image.png](https://raw.githubusercontent.com/Moonike1217/imageHosting/main/ebab3f03fba9729eb5f08bb786416da7.png)


三次握手的首要原因是为了防止旧的重复连接初始化造成混乱。如图，如果采用两次握手建立 TCP 连接的场景下，服务端在向客户端发送数据前，并没有阻止掉历史连接，导致服务端建立了一个历史连接，又白白发送了数据，妥妥地浪费了服务端的资源。因此，要解决这种现象，最好就是在服务端发送数据前，也就是建立连接之前，要阻止掉历史连接，这样就不会造成资源浪费，而要实现这个功能，就需要三次握手。


四次握手也能够保证可靠传输，但是三次握手已经能保证可靠传输，所以不需要使用更多的通信次数。


# 四次挥手


![image.png](https://raw.githubusercontent.com/Moonike1217/imageHosting/main/6bed4244a61b513339dc9a80e35dbd50.png)

- 客户端将 TCP 报文首部中的 FIN 标志位设置为 1，然后向服务端发送该报文，客户端进入 FIN-WAIT-1 状态。
- 服务端接收到报文，将 TCP 报文首部中的 ACK 标志位设置为 1，然后向客户端发送该报文，服务端进入 CLOSE-WIAIT 状态。客户端接收到该报文后进入 FIN-WAIT-2 状态。
- 服务端将 TCP 报文首部的 FIN 字段设置为 1，然后向客户端发送该报文，服务端进入 LAST-ACK 状态。
- 客户端接收到报文，进入 TIME-WAIT 状态，将 TCP 报文首部中的 ACK 标志位设置为 1，然后向服务端发送该报文。服务端接收到该报文后进入 CLOSE 状态。
- 客户端进入 TIME-WAIT状态后，等待 2 MSL（Maximum Segment Lifetime 报文最大存活时间）后，进入 CLOSE 状态。

# 为什么需要四次挥手

- 关闭连接时，客户端向服务端发送 FIN 时，仅仅表示客户端不再发送数据了，但是还能接收数据。
- 服务端收到客户端的 FIN 报文时，先回一个 ACK 应答报文，而服务端可能还有数据需要处理和发送。等服务端不再发送数据时，才发送 FIN 报文给客户端，表示同意关闭连接。

从上面过程可知，服务端通常需要等待完成数据的发送和处理，所以服务端的 ACK 和 FIN 一般都会分开发送，因此是需要四次挥手。

