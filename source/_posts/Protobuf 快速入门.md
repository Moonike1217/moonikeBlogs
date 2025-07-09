---
title: Protobuf 快速入门
date: 2025-07-03T19:41:00
updated: 2025-07-09T11:36:00
categories: 
  - Protobuf
cover: 
---

# Protobuf 是什么


Protobuf（Protocol Buffers）是 Google 开发的一种轻量级、高效的序列化结构数据的方法，它被广泛应用于不同的编程语言中，特别是分布式系统、微服务架构以及高效的数据传输。Protobuf 提供了比传统的 JSON 和 XML **更小、更快速**的数据格式。通过定义好的 `.proto` 文件，Protobuf 可以自动生成各种编程语言的源代码，提供一种语言中立、平台中立、可扩展的序列化机制。


# Protobuf 语法


为了快速理解 Protobuf 的语法，我使用 AI 创建了一个 `.proto` 文件来辅助理解。


```protobuf
syntax = "proto3";  // 使用 protobuf 3 语法版本

// package 定义：定义该 proto 文件的命名空间
package example;

// 导入其他的 .proto 文件：可以用来重用定义的消息类型、服务等
import "google/protobuf/empty.proto";  // 导入 protobuf 官方定义的 empty 类型

// 选项：用来设置一些特定的配置，例如优化、API 版本等
option java_package = "com.example.protobuf"; // 设置 Java 生成代码的包名
option go_package = "github.com/example/protobuf"; // 设置 Go 生成代码的包路径

// 定义一个枚举类型，表示用户的角色
enum Role {
    UNKNOWN = 0; // 默认值，表示角色未知
    ADMIN = 1;   // 管理员
    USER = 2;    // 普通用户
}

// 定义一个消息类型，表示用户信息
message User {
    string id = 1;         // 用户 ID
    string name = 2;       // 用户名字
    Role role = 3;         // 用户角色，使用枚举类型
    bool is_active = 4;    // 用户是否激活
}

// 定义一个服务，包含与客户端的交互方法
service UserService {
    // 定义一个方法：获取用户信息，接收一个 User ID，返回一个 User 对象
    // tRPC 框架中通过 @alias 将 tRPC 方法映射到对应的 HTTP 路径
    // 实际效果：
		// tRPC调用：client.GetUser(req)
		// HTTP调用：POST /api/v1/getuser
    rpc GetUser (GetUserRequest) returns (User); //@alias=/api/v1/getuser

    // 定义一个方法：创建新用户，接收一个 User 对象，返回一个空响应
    rpc CreateUser (User) returns (google.protobuf.Empty);
    
    // 注：在 service 中，rpc 表示一个客户端可以调用的服务方法
}

// 定义一个请求消息，用于 GetUser 方法
message GetUserRequest {
    string user_id = 1;  // 请求中需要的用户 ID
}
```


# Protobuf 编译


在 Protobuf 中，定义好 `.proto` 文件后，我们需要使用 `protoc` 编译器通过 **编译** 生成特定语言的代码。编译过程将 Protobuf 的数据结构转化为不同编程语言中的类、结构体和方法，使得我们可以在应用程序中方便地使用这些数据结构。使用时，通过命令行执行 `protoc --<language>_out=<output-dir> <file>.proto` 来生成目标语言的代码。


同时我们可以使用 tRPC 命令行工具来对 `proto` 文件进行编译。


```shell
# 首次使用，用该命令生成完整工程，当前目录下不要出现跟 pb 同名的目录名，如 pb 名为 helloworld.proto，则当前目录不要出现 helloworld 的目录名
trpc create -p helloworld.proto 
  
# 只生成 rpcstub，常用于已经创建工程以后更新协议字段时，重新生成桩代码
trpc create -p helloworld.proto --rpconly

# 使用 http 协议
trpc create -p helloworld.proto --protocol=http
```


注：桩代码是 tRPC-Go 框架通过 `protobuf` 定义自动生成的**服务端/客户端骨架代码。**

- **服务端桩代码**：提供接口方法的空实现（如 `SayHello` 返回默认值），开发者需填充业务逻辑。
- **客户端桩代码**：封装远程调用细节，使客户端能像调用本地函数一样调用服务端方法。
