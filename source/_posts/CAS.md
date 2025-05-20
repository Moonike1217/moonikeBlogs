---
title: CAS
date: 2024-11-20T22:24:00
updated: 2025-05-20T14:36:00
categories: 
  - [Java, Java并发编程]
cover: 
---

## **乐观锁和悲观锁**

- 乐观锁多用于“读多写少“的环境，避免频繁加锁影响性能；
- 悲观锁多用于”写多读少“的环境，避免频繁失败和重试影响性能

## **什么是 CAS**

- V：要更新的变量(var) （可以理解成旧值实际是多少）
- E：预期值(expected) （可以理解成旧值应该是多少）
- N：新值(new)

比较并交换的过程如下：


判断 V 的值是否等于 E，如果等于，将 V 的值设置为 N；如果不等，说明已经有其它线程更新了 V，于是当前线程放弃更新，什么都不做。


当多个线程同时使用 CAS 操作一个变量时，只有一个会胜出，并成功更新，其余均会失败，但失败的线程并不会被挂起，仅是被告知失败，并且允许再次尝试，当然也允许失败的线程放弃操作。


## **CAS 原理**


在 Java 中，有一个`Unsafe`类，它在`sun.misc`包中，这个类能够提供低级别的、不安全的操作。`Unsafe`类中的 CAS 方法是`native`方法，`native`表示这些方法是通过本地代码（一般为 C 或 C++）而不是 Java 代码实现的，其中就有几个是关于 CAS 的：


```c++
boolean compareAndSwapObject(Object o, long offset,Object expected, Object x);
 boolean compareAndSwapInt(Object o, long offset,int expected,int x);
 boolean compareAndSwapLong(Object o, long offset,long expected,long x);
```


## **CAS 三大问题**


## **ABA**


所谓的 ABA 问题，就是一个值原来是 A，变成了 B，又变回了 A。这个时候使用 CAS 是检查不出变化的，但实际上却被更新了两次。


ABA 问题的解决思路是在变量前面追加上**版本号或者时间戳**。从 JDK 1.5 开始，JDK 的 atomic 包里提供了一个类`AtomicStampedReference`类来解决 ABA 问题。


这个类的`compareAndSet`方法的作用是首先检查当前引用是否等于预期引用，并且检查当前标志是否等于预期标志，如果二者都相等，才使用 CAS 设置为新的值和标志。


### **长时间自旋**


CAS 多与自旋结合。如果自旋 CAS 长时间不成功，会占用大量的 CPU 资源。


解决思路是让 JVM 支持处理器提供的**pause 指令**。


pause 指令能让自旋失败时 cpu 睡眠一小段时间再继续自旋，从而使得读操作的频率降低很多，为解决内存顺序冲突而导致的 CPU 流水线重排的代价也会小很多。


### **多个共享变量的原子操作**


当对一个共享变量执行操作时，CAS 能够保证该变量的原子性。但是对于多个共享变量，CAS 就无法保证操作的原子性，这时通常有两种做法：

1. 使用`AtomicReference`类保证对象之间的原子性，把多个变量放到一个对象里面进行 CAS 操作；
2. 使用锁。锁内的临界区代码可以保证只有当前线程能操作。
