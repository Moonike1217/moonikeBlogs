---
title: JVM 的垃圾收集器
date: 2025-04-08T11:42:00
updated: 2025-10-16T12:53:00
categories: 
  - [Java, JVM虚拟机]
cover: 
---

没有最好的垃圾收集器，更没有万能的垃圾收集器，**我们要做的就是根据具体应用场景选择适合自己的垃圾收集器**。试想一下：如果有一种四海之内、任何场景下都适用的完美收集器存在，那么我们的 HotSpot 虚拟机就不会实现那么多不同的垃圾收集器了。


不同版本 JDK 的默认垃圾收集器（使用 `java -XX:+PrintCommandLineFlags -version` 命令查看）：

- JDK 8: Parallel Scavenge（新生代）+ Parallel Old（老年代）；引入了 G1 垃圾回收器，可以通过 `-XX:+UseG1GC` 启用。
- JDK 9 ~ JDK16: G1
- JDK 17：依旧使用 G1 作为默认垃圾回收器，但引入了 ZGC。

# Java 垃圾收集器对比表


| 收集器名称                          | 所属年代 | 是否并行    | 是否并发 | 停顿时间 | 特点/适用场景                                  |
| ------------------------------ | ---- | ------- | ---- | ---- | ---------------------------------------- |
| **Serial**                     | 年轻代  | 否       | 否    | 高    | 单线程，简单高效，适合客户端、小堆内存（单核）环境                |
| **ParNew**                     | 年轻代  | 是       | 否    | 中    | Serial 的并行版本，常和 CMS 搭配使用                 |
| **Parallel Scavenge**          | 年轻代  | 是       | 否    | 中    | 吞吐量优先，搭配 Parallel Old，适合后台计算型程序          |
| **Serial Old**                 | 老年代  | 否       | 否    | 高    | Serial 的老年代版本，常用于 Client 模式或 CMS 的失败备选方案 |
| **Parallel Old**               | 老年代  | 是       | 否    | 中    | Parallel Scavenge 的老年代版本，强调吞吐量           |
| **CMS（Concurrent Mark Sweep）** | 老年代  | 是（标记阶段） | 是    | 低    | 低停顿，适用于对响应时间敏感的应用，但碎片多                   |
| **G1（Garbage First）**          | 全堆   | 是       | 是    | 低    | 分区收集，预测停顿时间，适合大内存应用，是 CMS 的替代者           |
| **ZGC**                        | 全堆   | 是       | 是    | 极低   | 适合超大内存（TB 级），GC 停顿时间通常 <10ms，支持并发压缩      |

- **并行（Parallel）**：多个线程一起执行垃圾回收任务，缩短停顿时间。
- **并发（Concurrent）**：GC 与应用线程**同时执行**，减少“Stop-The-World”时间。

## 收集器的常见搭配关系


| 年轻代收集器            | 搭配的老年代收集器          |
| ----------------- | ------------------ |
| Serial            | Serial Old         |
| ParNew            | CMS、Serial Old（备用） |
| Parallel Scavenge | Parallel Old       |
| G1                | 自身内部完成（无需搭配）       |
| ZGC               | 自身内部完成（无需搭配）       |


# Serial / Serial Old垃圾回收器


![image.png](https://raw.githubusercontent.com/Moonike1217/imageHosting/main/7b191af10175913448ed3d96292520a8.png)

- **算法：**新生代（Serial）采用标记-复制算法，老年代（Serial Old）采用标记-整理算法。
- **收集区域：**新生代（Serial）、老年代（Serial Old）
- **特点：**简单而高效（与其他收集器的单线程相比）。Serial 收集器由于没有线程交互的开销，自然可以获得很高的单线程收集效率。Serial 收集器对于运行在 Client 模式下的虚拟机来说是个不错的选择。

# ParNew 收集器


![parnew-garbage-collector.png](https://raw.githubusercontent.com/Moonike1217/imageHosting/main/5e6e67bb3c2bc932c4ef25d228395496.png)

- **算法：** 标记-复制算法
- **收集区域：** 新生代
- **特点：** 多线程。ParNew 收集器其实就是 Serial 收集器的多线程版本，除了使用多线程进行垃圾收集外，其余行为（控制参数、收集算法、回收策略等等）和 Serial 收集器完全一样。它是许多运行在 Server 模式下的虚拟机的首要选择，除了 Serial 收集器外，只有它能与 CMS 收集器配合工作。

# Parallel Scavenge 收集器


![image.png](https://raw.githubusercontent.com/Moonike1217/imageHosting/main/6d8ccf417cb514dff0af838bc03d3eb0.png)

- **算法：** 标记-复制算法
- **收集区域：** 新生代
- **特点：**更加关注吞吐量（CPU 中用于运行用户代码的时间与 CPU 总消耗时间的比值）。高吞吐量的特点使得这个收集器适合对响应时间要求不高，但对整体执行效率要求高的程序。同时虚拟机可以根据程序运行情况自动优化堆参数，减少调参难度。

# Parallel Old 收集器


![image.png](https://raw.githubusercontent.com/Moonike1217/imageHosting/main/2d0653846b9e95bcdcc526a1b9dde5bf.png)

- **算法：** 标记-整理算法
- **收集区域：**老年代
- **特点：**Parallel Scavenge 收集器的老年代版本。

# CMS 收集器


![image.png](https://raw.githubusercontent.com/Moonike1217/imageHosting/main/b744da2bfd0c03e9ff5d19077beb48d1.png)


CMS（Concurrent Mark Sweep）收集器是 HotSpot 虚拟机第一款真正意义上的**并发**收集器，它第一次实现了让**垃圾收集线程与用户线程几乎同时工作**。

- **算法：**标记-清除算法
- **收集区域：**老年代
- **特点：**以获取短回收停顿时间为目标、并发收集垃圾
- **收集过程：**
    - **初始标记：** 短暂停顿（Stop-The-World，STW），标记从 GC Roots 可直接引用的对象，即标记所有直接可达的活跃对象。
    - **并发标记：** 同时开启 GC 和用户线程，递归寻找可达对象。由于用户线程可能会不断的更新引用域，所以 GC 线程无法保证可达性分析的实时性。所以这个算法里会跟踪记录这些发生引用更新的地方。
    - **重新标记：再次** STW，修正并发标记期间因为用户程序继续运行而导致标记产生变动的那一部分对象的标记记录，这个阶段的停顿时间一般会比初始标记阶段的时间稍长，远远比并发标记阶段时间短。
    - **并发清除：** 开启用户线程，同时 GC 线程开始对未标记的区域做清扫。

CMS 垃圾回收器在 Java 9 中已经被标记为过时，并在 Java 14 中被移除。


# G1 收集器


![g1-garbage-collector.png](https://raw.githubusercontent.com/Moonike1217/imageHosting/main/0e86690a58a0b91ac0488b6d2194c00b.png)


G1 (Garbage-First) 是一款面向服务器的垃圾收集器，它开创了 **面向局部的垃圾收集思路** 和 **基于 Region 的内存布局形式** ，并且 G1 收集器建立了一个 **停顿时间模型** 。因此从 JDK 9 开始，G1 收集器成为了默认的垃圾收集器。


## 基于 Region 的堆内存布局


G1 逻辑上分代，但是物理上不分代。G1 的各代存储地址是不连续的，每一代都使用了 n 个不连续的大小相同的 Region，每个 Region 占有一块连续的虚拟内存地址。


![image.png](https://raw.githubusercontent.com/Moonike1217/imageHosting/main/10db34c36c2b398c0139cba18746b440.png)


标记为 H 的称为 **Humongous 区域**，专门用来存储大对象，可以简单理解为对应着老年代。**G1 认为只要大小超过了 1.5 个 Region 容量的对象即可判定为大对象。**对于那些超过了整个 Region 容量的超级大对象，将会被存放在 N 个连续的Humongous Region 之中。G1 的大多数行为都把 Humongous Region 作为老年代的一部分来进行看待。


分配大对象的时候，因为占用空间太大，可能会过早发生 GC 停顿。G1 在每次分配大对象的时候都会去检查当前堆内存占用是否超过初始堆占用阈值 IHOP(The Initiating Heap Occupancy Percent)，默认情况是 Java 堆内存的 45%。当老年代的空间超过 45%，G1 会启动一次 Mixed GC。


## 停顿时间模型


G1 将 Region 作为单次回收的最小单元，即每次收集到的内存空间都是 Region 大小的整数倍，这样可以避免在整个 Java 堆中进行全区域的垃圾收集。


**G1 收集器会去跟踪各个 Region 的价值（即回收所获得的空间大小以及回收所需时间的经验值），然后在后台维护一个优先队列。**


G1 每次根据用户设定允许的收集停顿时间（使用参数`-XX：MaxGCPauseMillis`指定，默认值是200毫秒），**优先处理回收价值收益最大的 Region**，这也就是「Garbage First」名字的由来。这种使用 Region 划分内存空间，以及具有优先级的区域回收方式，保证了 G1 收集器能**在有限的时间内尽可能地提高收集效率**。


## 垃圾回收过程

- 初始标记（Initial Marking）：短暂停顿（Stop-The-World，STW），标记从 GC Roots 可直接引用的对象，即标记所有直接可达的活跃对象。
- 并发标记（Concurrent Marking）：同时开启 GC 和用户线程，递归寻找可达对象。由于用户线程可能会不断的更新引用域，所以 GC 线程无法保证可达性分析的实时性。所以这个算法里会跟踪记录这些发生引用更新的地方。
- 最终标记（Final Marking）：**再次** STW，修正并发标记期间因为用户程序继续运行而导致标记产生变动的那一部分对象的标记记录，这个阶段的停顿时间一般会比初始标记阶段的时间稍长，远远比并发标记阶段时间短。
- 筛选回收（Live Data Counting and Evacuation）：**更新 Region 的统计数据，对各个 Region 的回收价值和成本进行排序，根据用户所期望的停顿时间来制定回收计划**，可以自由选择任意多个 Region 构成回收集，然后把决定回收的那一部分 Region 的存活对象复制到空的 Region 中，再清理掉整个旧 Region 的全部空间。这里的操作涉及存活对象的移动，所以必须暂停用户线程，由多条收集器线程并行完成。

# ZGC 收集器


与 CMS、ParNew 和 G1 类似，ZGC 也采用标记-复制算法，不过 ZGC 对该算法做了重大改进。


ZGC 可以将暂停时间控制在几毫秒以内，且暂停时间不受堆内存大小的影响，出现 Stop The World 的情况会更少，但代价是牺牲了一些吞吐量。ZGC 最大支持 16TB 的堆内存。

