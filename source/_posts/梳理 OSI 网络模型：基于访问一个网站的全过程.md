---
title: 梳理 OSI 网络模型：基于访问一个网站的全过程
date: 2024-11-20T22:02:00
updated: 2025-08-17T22:12:00
categories: 
  - 计算机网络
cover: 
---

这篇文章基于访问一个网站的全过程，来梳理一下数据从网络中的一个 Node 传输到另一个 Node 所经历的状态，以及其中涉及到的 OSI 网络七层模型的知识。


# 什么是 OSI 七层网络模型


![6906c691-1867-4ef3-b056-6e366b0b10a1.png](https://raw.githubusercontent.com/Moonike1217/imageHosting/main/4580a7b720c83e1281a064f711d1f74a.png)


OSI 定义了网络互连的七层框架：物理层、数据链路层、网络层、传输层、会话层、表示层、应用层（自底向上）。每一层实现各自的功能和协议，并完成与相邻层的接口通信。OSI 的服务定义详细说明了各层所提供的服务，某一层的服务就是该层及其下各层的一种能力，它通过接口提供给更高一层，各层所提供的服务与这些服务是怎么实现的无关。每层的主要功能如下图所示：


![7f9ec7bb-0616-4ffc-9a09-850a64e3780c.png](https://raw.githubusercontent.com/Moonike1217/imageHosting/main/ce9eee86839c8567a57ae76726d70993.png)


当我们在浏览器的地址栏输入了一个域名，按下回车后，浏览器是如何渲染出这个页面的呢？接下来我们就基于这个背景，梳理一下整个过程。


# **URL 解析**


用户在地址栏中输入的域名 `https://www.example.com` 包含多个部分：

- 协议：`https://`，使用 HTTPS（基于三次握手建立 TCP 连接后，多了一个 SSL/TLS 握手的过程）。
- 主机名：`www.example.com`，需要解析为 IP 地址。
- 端口号（隐含）：默认 HTTPS 使用 443 端口，HTTP 使用 80 端口。
- 路径（如 `/index.html`）：指向服务器的具体资源。

# **DNS 解析**


由于计算机只能识别 IP 地址，浏览器需要将域名 `www.example.com` 解析为服务器的 IP 地址。这涉及 DNS（Domain Name System），具体流程如下：


## **浏览器缓存检查**


浏览器会先检查 **本地缓存**（浏览器 DNS 缓存、操作系统缓存，如 `hosts` 文件）中是否已有 `www.example.com` 的 IP 地址。


## **递归查询 DNS 服务器**


如果缓存中没有，浏览器向 本地 DNS 服务器（LDNS，通常由 ISP 提供） 发送 DNS 查询请求。

- 如果本地 DNS 服务器已有缓存，则直接返回 IP。
- 如果没有，本地 DNS 服务器执行 递归查询，向上级 DNS 服务器请求解析。
    - 根 DNS 服务器（`.`） 返回 `.com` 顶级域 DNS 服务器的地址。
    - 顶级域 DNS 服务器（如 `.com`） 返回 `example.com` 的 权威 DNS 服务器 地址。
    - 权威 DNS 服务器 直接返回 `www.example.com` 的 IP 地址（如 `192.0.2.1`）。
- 本地 DNS 服务器将 IP 地址缓存一段时间，以提高解析速度。

最终，浏览器获取 `www.example.com -> 192.0.2.1`，DNS 解析完成。


![image.png](https://raw.githubusercontent.com/Moonike1217/imageHosting/main/ef65d30c0957f483a3ef6a1a50cb08cb.png)


# **通过 ARP 协议获取 MAC 地址**


现在，浏览器准备向 `192.0.2.1` 发送数据，但 IP 地址（用于网络层）无法直接用于本地网络通信。此时，计算机需要通过 ARP 协议（网络层协议）获取服务器的 MAC 地址（MAC 地址用于数据链路层），过程如下：


## **检查 ARP 缓存**


主机检查本地 ARP 表（`arp -a`）是否已有 `192.0.2.1` 的 MAC 地址。


## **发送 ARP 请求**


如果本地 ARP 表没有目标 MAC 地址，计算机会广播发送 ARP 请求：


```plain text
源 MAC: 发送方网卡 MAC
目标 MAC: FF:FF:FF:FF:FF:FF（广播地址）
源 IP: 本机 IP
目标 IP: 192.0.2.1
```


## **服务器响应 ARP**


服务器收到 ARP 请求后，返回 **ARP 响应**，包含 `192.0.2.1` 的 MAC 地址。


```plain text
源 MAC: 服务器网卡 MAC
目标 MAC: 发送方网卡 MAC
源 IP: 192.0.2.1
目标 IP: 本机 IP
```


本机收到 MAC 地址后，会将其缓存到 ARP 表中。


# **三次握手建立 TCP 连接**


现在，我们已经有了服务器的 **IP 地址和 MAC 地址**，可以使用 **TCP** 建立连接。TCP 通过 **三次握手** 确保连接可靠：

- 客户端 → 服务器：发送 `SYN` 包，请求建立连接：`SYN=1, Seq=X`
- 服务器 → 客户端：服务器响应 `SYN-ACK`，确认连接：`SYN=1, ACK=1, Seq=Y, Ack=X+1`
- 客户端 → 服务器：客户端发送 `ACK`，连接建立：`ACK=1, Seq=X+1, Ack=Y+1`

# **TLS 握手（HTTPS 协议）**


如果是 **HTTPS**，则进行 **TLS（传输层安全协议）** 握手，以建立加密通道：

- **客户端 → 服务器**：发送 `ClientHello`，包括支持的加密算法。
- **服务器 → 客户端**：发送 `ServerHello` 和 SSL 证书。
- **密钥交换**：客户端验证证书，生成共享密钥。
- **建立安全通道**，后续通信被加密。

# **发送 HTTP 请求**


客户端向服务器发送 HTTP 请求，如：


```plain text
GET /index.html HTTP/1.1
Host: www.example.com
User-Agent: Mozilla/5.0
Accept: text/html
```

- **`GET`**：请求网页资源
- **`Host`**：目标服务器
- **`User-Agent`**：浏览器信息

# **服务器处理请求并返回响应**


服务器接收到 HTTP 请求后，执行以下操作：

- **检查资源是否存在**，如果 `/index.html` 找不到，则返回 `404 Not Found`。
- **查询数据库**，如果请求动态内容（如用户信息）。
- **返回 HTTP 响应**：

```plain text
HTTP/1.1 200 OK
Content-Type: text/html
Content-Length: 1234

<html>...</html>
```


# **数据传输过程（IP 数据包 + 物理传输）**


## **IP 分片**


如果数据包过大（超过 MTU，通常 1500 字节），IP 层会进行 **分片**，以便在网络上传输。


## **数据链路层封装**

- **IP 数据包** 添加 **MAC 头部**，形成 **以太网帧**：

    ```plain text
    目标 MAC | 源 MAC | 以太网类型 | 数据（IP 包）
    ```

- 以太网帧通过 **交换机（Switch）** 进行转发。

## **物理层传输**

- 数据以 **电信号**（有线）或 **无线信号**（Wi-Fi）发送到服务器。

# **浏览器解析 HTML 并渲染**

- **构建 DOM 树**（解析 HTML）
- **解析 CSS 并应用样式**
- **执行 JavaScript（如动态加载）**
- **绘制页面，显示给用户**

# **连接关闭（TCP 四次挥手）**

- **客户端 → 服务器**：发送 `FIN`，请求关闭连接。
- **服务器 → 客户端**：返回 `ACK`，确认关闭。
- **服务器 → 客户端**：发送 `FIN`，请求关闭。
- **客户端 → 服务器**：返回 `ACK`，连接断开。
