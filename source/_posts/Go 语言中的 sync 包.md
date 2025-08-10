---
title: Go 语言中的 sync 包
date: 2025-07-23T16:28:00
updated: 2025-08-06T16:47:00
categories: 
  - Go
cover: 
---

在并发编程中，同步原语（也就是我们通常说的锁）的主要作用是保证多个线程或者 `goroutine`在访问临界资源时不会出现线程安全问题，Go 语言中的 `sync` 包就提供了常用的同步源语，这里简单梳理一下不同同步源语的使用场景。


## **sync.Mutex**


`sync.Mutex` 实现了对临界资源的加锁访问：


```go
mutex := &sync.Mutex{}

mutex.Lock()
// 对临界资源执行需要的操作...
mutex.Unlock()
```

- `sync.Mutex` 是一个 **不可复制** 的对象。你不能对它进行直接的赋值或传递。
- 如果结构体包含 `sync.Mutex`，你应该传递结构体的指针，而不是结构体的副本。这样可以确保锁的状态不会丢失，并且在多个地方操作的是同一个互斥锁。

## **sync.RWMutex**


`sync.RWMutex` 是一种 **读写互斥锁**，它不仅实现了 `sync.Mutex` 的 `Lock` 和 `Unlock` 方法（因为两者都实现了 `sync.Locker` 接口），还提供了 `RLock` 和 `RUnlock` 方法，用于支持并发读取。


```go
mutex := &sync.RWMutex{}

// 写锁
mutex.Lock()
// 更新共享变量
mutex.Unlock()

// 读锁
mutex.RLock()
// 读取共享变量
mutex.RUnlock()
```


与 `sync.Mutex` 只能同时允许 **一个** 读锁或 **一个** 写锁不同，`sync.RWMutex` 允许 **多个** 读锁并行存在，或者 **一个** 写锁独占。它特别适用于 **频繁读取、少量写入** 的场景。


这里引用网上关于 `sync.Mutex` 和 `sync.RWMutex` 锁定性能的基准测试结果：


```plain text
BenchmarkMutexLock-4       83497579         17.7 ns/op
BenchmarkRWMutexLock-4     35286374         44.3 ns/op
BenchmarkRWMutexRLock-4    89403342         15.3 ns/op
```


从测试结果可以看出

- `sync.Mutex` 的锁定/解锁速度较快。
- `sync.RWMutex` 的写锁操作 (`Lock()`/ `Unlock()`) 比 `sync.Mutex` 慢。
- `sync.RWMutex` 的读锁操作 (`RLock()`/ `RUnlock()`) 比 `sync.Mutex` 更快。

因此 **`sync.Mutex`** 更适合用于 **频繁写入、少量读取** 的场景，而 **`sync.RWMutex`** 在 **频繁读取、少量写入** 的场景下能够提供更好的性能，特别是当多个 `goroutine` 需要并发读取时。


## **sync.WaitGroup**


`sync.WaitGroup` 是 Go 中常用的同步原语，它用于协调多个 `goroutine` 的执行，确保一个 `goroutine` 等待一组其他 `goroutine` 执行完成后再继续执行。


`sync.WaitGroup` 通过内部计数器来跟踪正在执行的 `goroutine` 数量。它的工作原理如下：

- **`Add(int)`**：用来增加计数器，指定有多少个 `goroutine` 要等待。
- **`Done()`**：每当一个 `goroutine` 完成时，调用 `Done()` 将计数器减 1。（其实是调用 `Add(-1)`）
- **`Wait()`**：让当前 `goroutine` 阻塞，直到计数器的值变为 0，表示所有等待的 `goroutine` 执行完毕。

在以下示例中，我们将启动八个 `goroutine`，并等待他们完成：


```go
wg := &sync.WaitGroup{}

for i := 0; i < 8; i++ {
  wg.Add(1) // 增加计数器
  go func() {
    // 模拟工作
    fmt.Println("Doing something")
    wg.Done() // 完成工作后减计数器
  }()
}

wg.Wait() // 阻塞等待所有 goroutine 完成
// 所有 goroutine 完成后，继续往下执行...
```


如果我们事先知道需要启动的 `goroutine` 数量，可以在循环外直接调用 `wg.Add({num})`，而不必在每次迭代中都调用 `Add(1)`。


## **sync.Map**


`sync.Map`是一个并发版本的 `map`，我们可以：

- 使用 `Store(interface {}, interface {})` 添加元素。
- 使用 `Load(interface {}, interface {})` 获取元素（类比 Get 操作）。
- 使用 `Delete(interface {})` 删除元素。
- 使用 `LoadOrStore(interface {}, interface {}) (interface {}, bool)` 检获取或添加之前不存在的元素。如果键之前在`map`中存在，则返回的布尔值为`true`。
- 使用 `Range` 遍历元素。

```go
m := &sync.Map{}

// 添加元素
m.Store(1, "one")
m.Store(2, "two")

// 获取元素1
value, contains := m.Load(1)
if contains {
  fmt.Printf("%s\n", value.(string))
}

// 返回已存value，否则把指定的键值存储到map中
value, loaded := m.LoadOrStore(3, "three")
if !loaded {
  fmt.Printf("%s\n", value.(string))
}

m.Delete(3)

// 迭代所有元素
m.Range(func(key, value interface{}) bool {
  fmt.Printf("%d: %s\n", key.(int), value.(string))
  return true
})
```


上面的程序会输出：


```plain text
one
three
1: one
2: two
```


如你所见，`sync.Map` 的 `Range` 方法接收一个类型为 `func(key, value interface{}) bool` 的函数参数。如果该函数返回 `false`，则会停止迭代。一个有趣的事实是，即使我们在迭代过程中返回了 `false`，最坏情况下的时间复杂度仍然是 `O(n)`，因为 `sync.Map` 仍然需要遍历所有元素。


### **何时使用** **`sync.Map`** **而不是使用** **`map`** **和** **`sync.Mutex`****？**

- **频繁读取，少量写入的场景**：

    当你的代码有频繁的读取操作，但写入操作较少时，`sync.Map` 是一个不错的选择。与使用 `sync.Mutex` 锁住普通的 `map` 不同，`sync.Map` 在处理并发读取时能够提供更高的效率，因为它对读取操作进行了优化。

- **多个** **`goroutine`** **同时进行读取、写入和覆盖不相交的键**：

    例如，假设你有一个分片（sharding）机制，包含 4 个 `goroutine`，每个 `goroutine` 负责 25% 的键，这些键之间没有冲突。在这种情况下，`sync.Map` 更为合适，因为它内部使用了细粒度的锁机制（每个分片锁定不同的区域），从而能够在不发生冲突的情况下允许多个 `goroutine` 并发地操作不同的键。


## **sync.Pool**


`sync.Pool`是一个并发池，负责安全地保存一组对象。它有两个导出方法：

- `Get() interface{}` 用来从并发池中取出元素。
- `Put(interface{})` 将一个对象加入并发池。

```go
pool := &sync.Pool{}

pool.Put(NewConnection(1))
pool.Put(NewConnection(2))
pool.Put(NewConnection(3))

connection := pool.Get().(*Connection)
fmt.Printf("%d\n", connection.id)
connection = pool.Get().(*Connection)
fmt.Printf("%d\n", connection.id)
connection = pool.Get().(*Connection)
fmt.Printf("%d\n", connection.id)
```


输出：


```plain text
1
3
2
```


需要注意的是`Get()`方法会从并发池中随机取出对象，无法保证以固定的顺序获取并发池中存储的对象。


假设我们需要编写一个函数，将数据写入文件。在这个函数中，我们需要使用缓冲区来处理数据，而缓冲区在多次调用中是可以复用的。通过使用 `sync.Pool`，我们可以重用已分配的缓冲区，从而避免频繁的内存分配。

1. **获取缓冲区**：通过 `sync.Pool.Get()` 获取一个缓冲区对象。如果是第一次调用，它会创建一个新的缓冲区。
2. **重置缓冲区**：调用 `buf.Reset()` 重置缓冲区，确保之前的内容不会影响当前操作。
3. **使用** **`defer`** **归还缓冲区**：当操作完成后，使用 `defer` 将缓冲区放回 `sync.Pool`，以便下一次使用。

```go
func writeFile(pool *sync.Pool, filename string) error {
    // 从池中获取缓冲区对象
    buf := pool.Get().(*bytes.Buffer)

    // 确保在函数结束时将缓冲区放回池中
    defer pool.Put(buf)

    // 重置缓冲区，清空之前的内容
    buf.Reset()

    // 写入数据到缓冲区
    buf.WriteString("foo")

    // 将缓冲区内容写入文件
    return ioutil.WriteFile(filename, buf.Bytes(), 0644)
}
```


## **sync.Once**


`sync.Once` 是一个简单而强大的原语，可确保一个函数仅执行一次。在下面的示例中，只有一个 `goroutine` 会显示输出消息：


```go
once := &sync.Once{}
for i := 0; i < 4; i++ {
    i := i
    go func() {
        once.Do(func() {
            fmt.Printf("first %d\n", i)
        })
    }()
}
```


我们使用了 `Do(func ())` 方法来指定只能被调用一次的部分。


## **sync.Cond**


`sync.Cond` 是 `sync` 包中的同步原语，它通常用于在多个 `goroutine` 之间发出信号。通过 `sync.Cond`，你可以实现 **一对一信号**（`Signal()`）或 **一对多信号**（`Broadcast()`）的机制，用于通知其他 `goroutine` 继续执行。


`sync.Cond` 适合在你需要一个 `goroutine` 等待另一个 `goroutine` 的某个事件发生时，比如一个 `goroutine` 等待共享数据的变化。


假设我们有一个共享切片，`goroutine` 需要等待它的第一个元素被更新。

1. **创建** **`sync.Cond`****：**

    `sync.Cond` 需要一个 `sync.Locker` 类型的对象（如 `sync.Mutex` 或 `sync.RWMutex`）来保护共享数据。


    ```go
    cond := sync.NewCond(&sync.Mutex{})
    ```

2. **等待信号并处理：**

    创建一个函数，使用 `cond.Wait()` 等待信号，直到另一个 `goroutine` 更新共享数据。


    ```go
    func printFirstElement(s []int, cond *sync.Cond) {
        cond.L.Lock()  // 锁定共享资源
        cond.Wait()    // 等待信号
        fmt.Printf("%d\n", s[0])  // 打印第一个元素
        cond.L.Unlock()  // 解锁
    }
    ```

3. **发出信号：**

    `main goroutine` 更新共享切片的第一个元素，并通过 `cond.Signal()` 发出信号通知等待的 `goroutine`。


    ```go
    s := make([]int, 1)  // 创建一个共享切片
    for i := 0; i < runtime.NumCPU(); i++ {
        go printFirstElement(s, cond)  // 启动多个 goroutine
    }
    
    i := get()  // 获取要更新的值
    cond.L.Lock()
    s[0] = i     // 更新共享切片
    cond.Signal()  // 发出信号
    cond.L.Unlock()
    ```


    `Signal()` 会解除一个阻塞的 `goroutine`，它会打印 `s[0]` 中的值。

4. **广播信号：**

    如果希望所有等待的 `goroutine` 都收到信号，可以使用 `cond.Broadcast()`，而不是 `Signal()`。


    ```go
    i := get()
    cond.L.Lock()
    s[0] = i
    ```

