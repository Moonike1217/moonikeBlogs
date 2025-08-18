---
title: 浅析 Java8 引入的 CompletableFuture
date: 2025-08-16T17:48:00
updated: 2025-08-17T21:42:00
categories: 
  - [Java, Java基础]
cover: 
---

对于 Java 程序来说，Java 8 中引入的 `CompletableFuture` 可以帮助我们来做多个任务的编排，功能非常强大。


# Future


`Future` 类是异步思想的典型运用。我们可以将一个耗时的任务交给子线程去执行，等到执行完毕后我们可以直接通过 `Future` 类获取结果，这样一来便可显著提高工作效率。在 Java 中，`Future` 类只是一个泛型接口，位于 `java.util.concurrent` 包下，其中定义了 5 个方法：


```java
// V 代表了Future执行的任务返回值的类型
public interface Future<V> {
    // 取消任务执行
    // 成功取消返回 true，否则返回 false
    boolean cancel(boolean mayInterruptIfRunning);
    // 判断任务是否被取消
    boolean isCancelled();
    // 判断任务是否已经执行完成
    boolean isDone();
    // 获取任务执行结果
    V get() throws InterruptedException, ExecutionException;
    // 指定时间内没有返回计算结果就抛出 TimeOutException 异常
    V get(long timeout, TimeUnit unit)

        throws InterruptedException, ExecutionException, TimeoutExceptio

}
```


# CompletableFuture


`Future` 在实际使用过程中存在一些局限性，比如不支持异步任务的编排组合、获取计算结果的 `get()` 方法为阻塞调用。Java 8 引入`CompletableFuture` 类可以解决`Future` 的这些缺陷。`CompletableFuture` 除了提供了更为好用和强大的 `Future` 特性之外，还提供了**函数式编程、异步任务编排组合**等能力。`CompletableFuture` 还同时实现了 `Future` 和 `CompletionStage` 接口。


![image.png](https://raw.githubusercontent.com/Moonike1217/imageHosting/main/af9c8856d64a3fbd0eec7732a322ccba.png)


## CompletableFuture 的使用


想要使用，首先我们应该创建一个 `CompletableFuture` ，我们可以通过 `new` 关键字或者静态工厂方法来创建。


```java
// 使用new关键字
CompletableFuture<U> resultFuture = new CompletableFuture<>();
// 使用默认线程池
static <U> CompletableFuture<U> supplyAsync(Supplier<U> supplier);
// 使用自定义线程池(推荐)
static <U> CompletableFuture<U> supplyAsync(Supplier<U> supplier, Executor executor);
// 使用默认线程池
static CompletableFuture<Void> runAsync(Runnable runnable);
// 使用自定义线程池(推荐)
static CompletableFuture<Void> runAsync(Runnable runnable, Executor executor);

// 注意: Runnable 没有返回值, Supplier 有返回值
```


当我们将任务提交了以后，就要考虑如何处理返回的结果，比较常用的方法有以下几个：

- **thenApply() ，**对上一步的结果做转换，**有返回值**。

```java
CompletableFuture<Integer> future = CompletableFuture.supplyAsync(() -> 5)
        .thenApply(x -> x * 2); // 把5转成10

System.out.println(future.join()); // 输出 10
```

- **thenAccept()，**消费上一步的结果，**无返回值**。

```java
CompletableFuture.supplyAsync(() -> "Hello")
        .thenAccept(s -> System.out.println(s + " World")); // 打印 Hello World
```

- **thenRun()，**不关心上一步的结果，只在前一步完成后**再执行一个动作**（无参、无返回值）。

```java
CompletableFuture.supplyAsync(() -> "Hello")
        .thenRun(() -> System.out.println("Task finished!"));
```

- **whenComplete()，**无论正常还是异常，都会在任务结束时回调，**可以拿到结果和异常**。

```java
CompletableFuture.supplyAsync(() -> 10 / 0) // 故意出错
        .whenComplete((res, ex) -> {
            if (ex != null) {
                System.out.println("出错了: " + ex.getMessage());
            } else {
                System.out.println("结果: " + res);
            }
        });
```


## CompletableFuture 存在哪些问题


使用 `CompletableFuture` 可以通过并行的方式加快接口的响应速度，但是这会给我们带来什么问题呢？

- 线程池资源消耗：由于传入的任务是通过子线程去执行的，所以会有额外的资源消耗。
- 异常处理复杂：链式调用时，一旦某个环节抛异常，后续计算可能直接中断，所以要显式捕获异常进行兜底。
- 上下文传递：比如 ThreadLocal 中的变量，日志的 TraceID都无法传递到子线程当中。
- 内存和 GC 压力较大：需要维护一堆回调和状态，链式调用过多可能导致内存占用增加，GC 压力变大。
