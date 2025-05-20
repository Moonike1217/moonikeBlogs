---
title: Java 线程间的通信方式
date: 2025-04-07T10:37:00
updated: 2025-05-20T14:36:00
categories: 
  - [Java, Java并发编程]
cover: 
---

线程间通信指的是多个线程之间相互传递信息或共享资源的机制，通信是多线程编程中的重要概念，用于实现线程之间的协作和数据共享。在谈到线程间通信时，我们主要关注的是 **线程间的同步和互斥**。


## 共享变量


多个线程可以通过共享变量来进行通信。共享变量可以是全局变量或类的静态变量，多个线程可以同时读取和写入这些变量，通过变量的值来进行信息传递和共享数据。共享变量一般需要搭配 `volatile` 关键字进行使用。 


```java
public class SharedVariableExample {
    // 共享变量
    private static volatile boolean flag = false;
    private static volatile int counter = 0;
    
    public static void main(String[] args) throws InterruptedException {
        Thread writerThread = new Thread(() -> {
            try {
                Thread.sleep(1000);
                counter = 100; // 设置共享数据
                flag = true;   // 设置标志位
                System.out.println("写线程: 数据已准备完成");
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        });
        
        Thread readerThread = new Thread(() -> {
            while (!flag) {
                // 等待flag变为true
                Thread.yield(); // 让出 cpu，使该线程状态从运行中变为就绪
            }
            System.out.println("读线程: 读取到数据 " + counter);
        });
        
        writerThread.start();
        readerThread.start();
        
        writerThread.join();
        readerThread.join();
        
        //主线程的代码块中，如果碰到了t.join()方法
        //此时主线程需要阻塞等待子线程结束
        //才能继续执行t.join()之后的代码块
    }
}
```


## 锁机制


Java提供了内置的锁机制，如 `synchronized` 关键字和 `ReentrantLock` 类，用于实现线程的互斥访问。多个线程可以通过竞争同一个锁对象来实现同步，其中一个线程获取锁后执行一段代码，然后释放锁，其他线程等待锁的释放再争抢执行。


```java
public class LockExample {
    private static final Object lock = new Object();
    private static int counter = 0;
    
    public static void main(String[] args) throws InterruptedException {
        Runnable incrementTask = () -> {
            for (int i = 0; i < 1000; i++) {
                synchronized (lock) {
                    counter++;
                }
            }
        };
        
        Thread t1 = new Thread(incrementTask);
        Thread t2 = new Thread(incrementTask);
        
        t1.start();
        t2.start();
        
        t1.join();
        t2.join();
        
        System.out.println("最终计数: " + counter); // 输出2000
    }
}
```


## 条件变量


Java提供了 `wait()`、`notify()` 和 `notifyAll()` 方法，用于线程之间的条件等待和通知。在使用条件变量时，线程可以调用 `wait()` 方法进入等待状态，直到其他线程调用相同对象上的 `notify()` 或 `notifyAll()` 方法来唤醒等待的线程。


```java
public class WaitNotifyExample {
    private static final Object lock = new Object();
    private static boolean dataReady = false;
    private static String message = null;
    
    public static void main(String[] args) {
        Thread producer = new Thread(() -> {
            synchronized (lock) {
                System.out.println("生产者: 准备数据中...");
                try {
                    Thread.sleep(2000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                message = "重要消息";
                dataReady = true;
                System.out.println("生产者: 数据已准备完成");
                lock.notify(); // 通知等待的消费者
            }
        });
        
        Thread consumer = new Thread(() -> {
            synchronized (lock) {
                while (!dataReady) {
                    System.out.println("消费者: 等待数据...");
                    try {
                        lock.wait(); // 等待生产者通知
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                }
                System.out.println("消费者: 收到消息 - " + message);
            }
        });
        
        consumer.start();
        producer.start();
    }
}
```


## 阻塞队列


Java 的 `BlockingQueue` 接口提供了线程安全的阻塞队列实现，如 `ArrayBlockingQueue` 和 `LinkedBlockingQueue` 等。阻塞队列可以用来在生产者和消费者线程之间进行线程间通信，生产者线程将数据放入队列，而消费者线程从队列中取出数据。


```java
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;

public class BlockingQueueExample {
    public static void main(String[] args) {
        // 创建容量为5的阻塞队列
        BlockingQueue<String> queue = new ArrayBlockingQueue<>(5);
        
        // 生产者线程
        Thread producer = new Thread(() -> {
            try {
                String[] messages = {"消息1", "消息2", "消息3", "消息4", "消息5", "消息6"};
                for (String msg : messages) {
                    System.out.println("生产者: 生产 " + msg);
                    queue.put(msg); // 如果队列满了，put方法会阻塞
                    Thread.sleep(100);
                }
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        });
        
        // 消费者线程
        Thread consumer = new Thread(() -> {
            try {
                for (int i = 0; i < 6; i++) {
                    // take方法会阻塞直到队列中有元素
                    String message = queue.take();
                    System.out.println("消费者: 消费 " + message);
                    Thread.sleep(300); // 消费者处理速度慢于生产者
                }
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        });
        
        producer.start();
        consumer.start();
    }
}
```


## 线程信号量


Java 的 Semaphore类提供了计数信号量的实现，用于控制同时访问某些资源的线程数量。通过信号量，可以实现多个线程之间的互斥和同步，其中一个线程获取信号量后，其他线程需要等待信号量的释放。


```java
import java.util.concurrent.Semaphore;

public class SemaphoreExample {
    public static void main(String[] args) {
        // 创建只有3个许可的信号量，模拟3个可用资源
        Semaphore semaphore = new Semaphore(3);
        
        // 创建5个线程，共享3个资源
        for (int i = 1; i <= 5; i++) {
            final int threadId = i;
            new Thread(() -> {
                try {
                    System.out.println("线程" + threadId + " 等待获取资源");
                    semaphore.acquire(); // 获取一个许可
                    System.out.println("线程" + threadId + " 获得资源许可");
                    
                    // 模拟使用资源
                    Thread.sleep(2000);
                    
                    System.out.println("线程" + threadId + " 释放资源许可");
                    semaphore.release(); // 释放许可
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }).start();
        }
    }
}
```

