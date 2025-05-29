---
title: 基于 Redis 实现令牌桶限流和动态配置 QPS
date: 2025-05-23T17:02:00
updated: 2025-05-29T16:30:00
categories: 
  - 场景问题
cover: 
---

# 场景介绍


这几天没什么需求，再来复现一个公司的业务场景。用量明细分析模块我们在某次迭代中新开发的一个模块，它的主要作用是接收子应用上传的用量明细，但是由于用量明细经常会有波动，这会导致子应用短时间内进行多次上报，大量消耗资源。考虑到这是一个新的小模块，因此我们采用了基于 Redis 和令牌桶算法来实现限流。同时又因为各个子应用的上报频率波动较大，所以还开发了根据角色来动态配置 QPS 的功能。


# 简单回顾一下令牌桶算法


令牌桶（Token Bucket）算法是一种比较常见的限流算法，其中两个比较重要的变量为桶容量和令牌生成速率。

- 桶容量：限制了系统中最多能够积攒多少令牌
- 令牌生成速率：系统每秒钟向桶中添加的令牌数量（即 QPS）

当我们实现了令牌桶算法后，每个请求必须要拿到一个令牌才能够执行，否则请求会进入等待或直接被拒绝。


# 限流核心逻辑


在 Redis 中我们要维护两个 Key，按子应用维度区分：


| Key                                     | 描述                    |
| --------------------------------------- | --------------------- |
| `rate_limit:{applicationId}:tokens`     | 桶中剩余的令牌数              |
| `rate_limit:{uapplicationId}:timestamp` | 上次请求的时间戳（用于计算生成多少新令牌） |


由于限流是一个组合操作，所以我们需要通过 Lua 脚本来执行，保证操作的原子性。Lua 脚本可以参考下面的例子：


```lua
-- 参数
local key_prefix = "rate_limit:" .. application_id
local capacity = tonumber(ARGV[1]) -- 每秒可生成的令牌数（QPS）
local now = tonumber(ARGV[2])      -- 当前时间戳（单位：毫秒）
local interval = 1000 / capacity   -- 每生成一个令牌需要的时间（ms）

-- 获取 Redis 中已有的令牌和时间
local last_time = tonumber(redis.call("get", key_prefix .. ":timestamp")) or now
local tokens = tonumber(redis.call("get", key_prefix .. ":tokens")) or capacity

-- 计算经过的时间，生成新令牌
local elapsed = now - last_time
local add_tokens = math.floor(elapsed / interval)
tokens = math.min(capacity, tokens + add_tokens) -- 更新桶内令牌数量

if tokens > 0 then
  -- 有令牌，允许请求
  redis.call("set", key_prefix .. ":tokens", tokens - 1)
  redis.call("set", key_prefix .. ":timestamp", now)
  return 1
else
  -- 没有令牌，限流
  return 0
end
```


通过如上的脚本，我们就实现了基于 Redis 的令牌桶限流算法。


# 动态配置 QPS


有了限流的逻辑，这部分实现起来就相当轻松了。子应用在调用上传用量明细接口时，会在 Header 中携带自己的编码，我们提前将不同子应用的 QPS 上限存储在表中，这样当子应用发起调用请求时，我们首先拿到对应的 QPS 上限，然后将其作为参数传入，即可实现 QPS 的动态配置。

