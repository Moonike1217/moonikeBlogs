---
title: synchronized
date: 2024-11-20T22:24:00
updated: 2025-08-11T15:22:00
categories: 
  - [Java, Java并发编程]
cover: 
---

`synchronized` 是 Java 中的一个关键字，主要解决的是多个线程之间访问资源的同步性，可以**保证被它修饰的方法或者代码块在任意时刻只能有一个线程执行**。


早期 Java 中 `syncronized` 属于重量级锁，这是因为 `syncronized` 依赖于监视器锁，而监视器锁由依赖于底层操作系统的 Mutex Lock。操作系统实现线程之间的切换需要由用户态转换为内核态，这个状态需要较长时间，时间成本较高。


Java 6 之后，`syncronized` 引入了大量的优化操作，如：自旋锁、适应性自旋锁、锁消除、锁粗化、偏向锁、轻量级锁等技术来减少锁操作的开销，这使得 `syncronized` 锁的效率提升了很多。因此 `syncronized` 还是可以在项目中使用。


## **使用**

1. 修饰实例方法（对象）

    ```java
    synchronized void method() {
         //业务代码
     }
    ```

2. 修饰静态方法（类）

    ```java
    synchronized static void method() {
         //业务代码
     }
    ```

3. 修饰代码块

    对括号里指定的对象/类加锁：

    - `synchronized(object)` 表示进入同步代码库前要获得 **给定对象的锁**。
    - `synchronized(类.class)` 表示进入同步代码前要获得 **给定 Class 的锁**。

    ```java
    synchronized(this) {
         //业务代码
     }
    ```


值得注意的是，**静态** **`synchronized`** **方法和非静态** **`synchronized`** **方法之间的调用不互斥**！如果一个线程 A 调用一个实例对象的非静态 `synchronized` 方法，而线程 B 需要调用这个实例对象所属类的静态 `synchronized` 方法，不会发生互斥现象，因为**访问静态** **`synchronized`** **方法占用的锁是当前类的锁，而访问非静态** **`synchronized`** **方法占用的锁是当前实例对象锁**。


## **底层**


`synchronized` 同步语句块的实现使用的是 `monitorenter` 和 `monitorexit` 指令，其中 `monitorenter` 指令指向同步代码块的开始位置，`monitorexit` 指令则指明同步代码块的结束位置。

