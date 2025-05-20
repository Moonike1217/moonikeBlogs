---
title: ThreadLocal原理详解
date: 2025-05-08T22:42:00
updated: 2025-05-20T15:01:00
categories: 
  - [Java, Java基础]
cover: 
---

# 什么是 ThreadLocal


ThreadLocal 是一个线程级别的变量，每个线程都有一个 ThreadLocal 的副本，竞态条件被彻底消除，在并发情况下是绝对安全的变量。当我们执行 `ThreadLocal<T> value = new ThreadLocal<T>();` ，系统会自动在每一个线程上创建一个 T 的副本，副本之间彼此独立，互不影响，可以用 ThreadLocal 存储一些参数，以便在线程中多个方法中使用，用以代替方法传参的做法。


# ThreadLocal 的底层实现


`ThreadLocalMap` 是 `ThreadLocal` 的内部静态类，是一个**定制版的哈希表结构**，每个线程对象 `Thread` 内部都有一个 `ThreadLocalMap`，用于保存所有和该线程相关的 `ThreadLocal` 变量。


ThreadLocalMap 的 Key 是对 ThreadLocal 对象的弱引用，Value 是实际要存放的数据。ThreadLocalMap 通过开地址法解决哈希冲突问题。


# 为什么 Key 是弱引用但 Value 是强引用


一句话回答：为了让 JVM 有机会自动回收不再使用的 ThreadLocal 对象。


```java
ThreadLocal<String> tl = new ThreadLocal<>();
tl = null; // 丢弃了对tl的引用
```


如果 ThreadLocalMap 中的 key 是强引用，那么这个 ThreadLocal 永远不会被 GC 回收


使用 弱引用，一旦开发者放弃了外部引用，GC 可以直接清除 key。


当开发者调用 `set()` `get()` `remove()` 时，JVM 会自动清除 key 为 null 的 value。


# 内存泄漏


## 为什么 ThreadLocal 会引发内存泄漏


每个线程（`Thread`）内部都有一个 `ThreadLocalMap`，用来存储该线程的 ThreadLocal 变量。


```java
Thread.currentThread().threadLocals.set(threadLocal, value);
```


在这个 `ThreadLocalMap` 结构中，**key 是对 ThreadLocal 对象的弱引用（WeakReference）**，而 **value 是强引用**。


假设有下面的代码：


```java
ThreadLocal<String> tl = new ThreadLocal<>();
tl.set("hello");
tl = null; // 手动把 ThreadLocal 的强引用断掉
```

- 由于 `tl` 是弱引用，在 GC 执行时，ThreadLocal 对象会被**回收掉**。
- 但是它的 value 仍然**被当前线程的 ThreadLocalMap 强引用着**。
- 由于 key 已经是 null，这个 value 再也无法被访问，但它仍然在内存中，**GC 无法清除它**。

如果线程是线程池中的工作线程，生命周期很长或不会被销毁，这个 value 会**长时间得不到释放**，**造成内存泄漏**！


## 如何避免 ThreadLocal 的内存泄漏


在 ThreadLocal 使用结束后，一定要调用 `remove()` 方法。`remove()` 会从当前线程的 `ThreadLocalMap` 中，**删除 key 和 value 对**，彻底断开引用关系，让 GC 可以正确回收。


```java
ThreadLocal<String> tl = new ThreadLocal<>();
try {
    tl.set("some value");
    // 使用 ThreadLocal 的值进行业务处理
} finally {
    tl.remove(); // 移除 entry，避免内存泄漏
}
```


# TransmittableThreadLocal （TTL）


在 `ThreadLocal` 基础上，TransmittableThreadLocal  **增强了线程池场景下的上下文传递能力**。


## 原理对比


**ThreadLocal**

- 数据存在当前线程的 `ThreadLocalMap` 中，提交给线程池的任务看不到父线程的值。
- 子线程（非线程池）可以使用 `InheritableThreadLocal` 继承一次“父→子”值，但线程池线程是长生命周期，继承仅在构造线程时一次性生效，不适用后续任务。

**TransmittableThreadLocal**

- **捕获阶段**：在调用 `executor.submit(runnable)` 时，TTL 拦截包装了 `runnable`，将提交线程的 TTL 值保存到一个临时快照。
- **执行阶段**：在线程池线程执行 `runnable` 前，TTL 从快照中将值“注入”到执行线程的 `ThreadLocalMap`。
- **恢复阶段**：任务执行完后，将执行线程原先的 TTL 值恢复，避免对后续任务造成污染。

## 使用场景

- **普通业务单线程**：只需 `ThreadLocal`。
- **需在线程池异步任务间传递上下文**（如用户身份、TraceId、日志 MDC ……）：推荐使用 `TransmittableThreadLocal`。
