---
title: 浅析 MySQL 的三种日志：RedoLog、UndoLog、BinLog
date: 2025-08-11T17:40:00
updated: 2025-08-13T15:37:00
categories: 
  - MySQL
cover: 
---

MySQL 中存在着各种日志，如错误日志、查询日志、慢查询日志、事务日志、二进制日志等，这篇文章聊一下下面几种日志：

- **Undo Log 回滚日志**：InnoDB 存储引擎层生成的 UndoLog 用于记录事务修改前的数据状态，以便在事务回滚时恢复数据，实现了事务的 **原子性**。
- **Redo Log 重做日志**：InnoDB 存储引擎层生成的 RedoLog 用于记录事务修改后的数据状态，保证在数据库崩溃时能够恢复数据到最后提交的状态，实现了事务的 **持久性**。
- **Bin Log 归档日志**：Server 层生成的 BinLog（Binary Log）记录所有数据库修改操作，用于主从复制、数据恢复和审计。

# Undo Log 回滚日志


事务没提交之前，MySQL 会先记录更新前的数据到 Undo Log 日志文件里面，当事务回滚时，可以利用 Undo Log 来进行回滚。


每当 InnoDB 引擎对一条记录进行操作（修改、删除、新增）时，要把回滚时需要的信息都记录到 Undo Log 里，比如：

- 在**插入**一条记录时，要把这条记录的主键值记下来，这样之后回滚时只需要把这个主键值对应的记录**删掉**就好了；
- 在**删除**一条记录时，要把这条记录中的内容都记下来，这样之后回滚时再把由这些内容组成的记录**插入**到表中就好了；
- 在**更新**一条记录时，要把被更新的列的旧值记下来，这样之后回滚时再把这些列**更新为旧值**就好了。

## Undo Log 的日志格式


一条记录的每一次更新操作所产生的 Undo Log 格式都有一个 roll_pointer 指针和一个 trx_id 事务id：

- 通过 trx_id 可以知道该记录是被哪个事务修改的；
- 一条日志的 roll_pointer 指针指向的是另一条日志，通过指针可以将这些 Undo Log 串成一个链表，这个链表就被称为**版本链**

![Clipboard_Screenshot_1754984106.png](https://raw.githubusercontent.com/Moonike1217/imageHosting/main/14245c91e7422cefcca6af1fcc02f396.png)


## 通过 Undo Log 和 Read View 实现 MVCC


对于 读已提交 和 可重复读 隔离级别的事务来说，它们的快照读（普通 `select` 语句）是通过 Read View + Undo Log 来实现的，它们的区别在于创建 Read View 的时机不同（Read View 其实就是执行 `select` 语句时的活跃事务 id 集合）：

- 读提交 隔离级别是在**每次执行** **`select`** **语句时**都会生成一个新的 Read View，这也就意味着可能会出现不可重复读的问题，因为可能这期间另外一个事务修改了该记录，并提交了事务。
- 可重复读 隔离级别是**启动事务时**生成一个 Read View，然后整个事务期间都在用这个 Read View，这样就保证了在事务期间读到的数据都是事务启动之前的记录。

每行数据自带 trx_id 与 roll_pointer，读取时若当前版本不可见，即沿 Undo Log 链回溯，直至找到对该 Read View 可见的历史版本，从而在同一记录上为不同事务提供互不阻塞的一致性快照。因此通过 Read View 和 Undo Log 就可以实现 MVCC 多版本并发控制，进而实现了读已提交和可重复读这两个事物隔离级别。


# Redo Log 重做日志


## 什么是 Redo Log


Redo Log 是物理日志，记录了某个数据页做了什么修改，比如**对 XXX 表空间中的 YYY 数据页 ZZZ 偏移量的地方做了 AAA 更新**，每执行一个事务就会产生一条或者多条这样的物理日志。


在事务提交时，只要先将 Redo Log 持久化到磁盘即可，可以不需要等到将缓存在 Buffer Pool 里的脏页数据持久化到磁盘。


当系统崩溃时，虽然脏页数据没有持久化，但是 Redo Log 已经持久化，接着 MySQL 重启后，可以根据 Redo Log 的内容，将所有数据恢复到最新的状态。


## Redo Log 是如何保证持久性的


为了防止断电导致数据丢失的问题，当有一条记录需要更新的时候，InnoDB 引擎就会先更新内存（同时标记为脏页），然后将本次对这个页的修改以 Redo Log 的形式记录下来，**这个时候更新就算完成了**。后续 InnoDB 引擎会在适当的时候，由后台线程将缓存在 Buffer Pool 的脏页刷新到磁盘里，这就是 **WAL （Write-Ahead Logging）技术**。**WAL 技术指的是， MySQL 的写操作是先写日志，然后在合适的时间再写到磁盘上**。


![Clipboard_Screenshot_1754987818.png](https://raw.githubusercontent.com/Moonike1217/imageHosting/main/b62830fc7822f9f384b84eb21687fdca.png)


## Redo Log 是直接写入磁盘的吗？


执行一个事务的过程中，产生的 Redo Log 也不是直接写入磁盘的，因为这样会产生大量的 I/O 操作，而且磁盘的运行速度远慢于内存。所以 Redo Log 也有自己的缓存—— **Redo Log buffer**，每当产生一条 Redo Log 时，会先写入到 Redo Log buffer，后续再持久化到磁盘。


## 为什么不直接将数据写入磁盘，而是先写 Redo Log？


写入 **Redo Log** 时使用了追加操作，因此磁盘的写入是顺序写，而不是随机写。相比随机写，顺序写在磁盘上更高效，因为磁盘的顺序写入比随机写开销要小得多。这也是 **WAL**（Write-Ahead Logging）技术的一个优势：MySQL 的写操作通过将数据先记录到日志中，再在适当的时机将数据更新到磁盘，避免了频繁的随机写，从而提升了写操作的性能。


# Bin Log 归档日志


MySQL 在完成一条更新操作后，Server 层还会生成一条 binlog，等之后事务提交的时候，会将该事物执行过程中产生的所有 binlog 统一写入 binlog 文件。


binlog 文件是记录了所有数据库表结构变更和表数据修改的日志，不会记录查询类的操作，比如 `SELECT` 和 `SHOW` 操作。并且 binlog 是追加写，写满一个文件，就创建一个新的文件继续写，不会覆盖以前的日志，保存的是全量的日志。


## 使用 Bin Log 进行主从复制


MySQL 的主从复制的过程就是将 binlog 中的数据从主库传输到从库上，这个过程一般是**异步**的，也就是主库上执行事务操作的线程不会等待复制 binlog 的线程同步完成，具体详细过程如下：

- MySQL 主库在收到客户端提交事务的请求之后，会先写入 binlog，再提交事务，更新存储引擎中的数据，事务提交完成后，返回给客户端“操作成功”的响应。
- 从库会创建一个专门的 I/O 线程，连接主库的 log dump 线程，来接收主库的 binlog 日志，再把 binlog 信息写入 relay log 的中继日志里，再返回给主库“复制成功”的响应。
- 从库会创建一个用于回放 binlog 的线程，去读 relay log 中继日志，然后回放 binlog 更新存储引擎中的数据，最终实现主从的数据一致性。

在完成主从复制之后，你就可以在写数据时只写主库，在读数据时只读从库，这样即使写请求会锁表或者锁记录，也不会影响读请求的执行。


![image.png](https://raw.githubusercontent.com/Moonike1217/imageHosting/main/9011a8c1b7f0192ba26d658e5cf9412e.png)

