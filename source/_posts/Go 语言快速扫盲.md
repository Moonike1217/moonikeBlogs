---
title: Go 语言快速扫盲
date: 2025-07-03T14:25:00
updated: 2025-07-18T10:12:00
categories: 
  - Go
cover: 
---

# `main.go` 和 `go.mod` 

- `main.go` 是 Go 项目的入口文件，通常包含了应用程序的启动逻辑和执行过程。

```go
package main

import "fmt"

func main() {
    fmt.Println("Hello, Go!") // 程序启动时执行的逻辑
}
```

- `go.mod` 是 Go 语言的 **模块管理文件**，用于管理 Go 项目的依赖。

```go
module go-library

go 1.16

require (
    github.com/stretchr/testify v1.7.0
)
```


在上面的例子中：

- `module go-library`：表示该项目的模块名称是 `go-library`。如果发布到 GitHub，通常会指定类似 `github.com/username/repo` 作为模块名。
- `go 1.16`：指定该项目使用的 Go 版本。
- `require`：列出该项目的外部依赖项。在本例中，`github.com/stretchr/testify` 是一个用于测试的库，版本是 `v1.7.0`。

### **常见命令**：

- **初始化模块**：`go mod init <module-name>`，用于创建一个新的 `go.mod` 文件。
- **添加依赖**：`go get <package>`，用于添加新的依赖。
- **更新依赖**：`go get -u`，更新所有依赖到最新的次要版本。
- **查看依赖**：`go list -m all`，查看项目中所有的依赖模块。

# 变量


## 变量类型


Go 是一种强类型语言，变量的类型在声明时需要明确指定或由短声明自动推导。


**常见类型**：

- 基本数据类型：`int`, `float32`, `float64`, `bool`, `string`
- 复合类型：数组、切片（slice）、映射（map）、结构体（struct）

**示例**：


```go
func main() {
    // 基本类型
    var a int = 10
    var b float64 = 3.14
    var isActive bool = true
    var name string = "Go"

    // 数组
    var arr [3]int = [3]int{1, 2, 3}

    // 切片
    var slice []int = []int{10, 20, 30}

    // 映射（map）
    var person = map[string]string{"name": "Alice", "age": "25"}

    fmt.Println(a, b, isActive, name, arr, slice, person)
}
```


## 变量声明

- 使用 `var` 显式声明： `var variableName type` ；在这种情况下，如果没有指定变量的初始值，则会将变量赋零值 Zero Value（字符串为空串，数字类型为 0， 布尔类型为 false …）
- 短声明并初始化（用于函数内部）： `variableName := value`

## 指针


Go 语言也支持指针，可以直接通过 `&` 获取变量的地址，通过 `*` 解引用指针。


**示例：**


```go
func main() {
    x := 10
    p := &x       // p 是指向 x 的指针
    fmt.Println(*p) // 输出: 10, 解引用 p
    *p = 20        // 通过指针修改 x 的值
    fmt.Println(x) // 输出: 20
}
```


# 控制流


**示例**：


```go
func main() {
	// 1. if-else 语句
	var age int = 18
	if age < 18 {
		fmt.Println("You are a minor.")
	} else if age == 18 {
		fmt.Println("You are an adult now.")
	} else {
		fmt.Println("You are an adult.")
	}

	// 2. switch 语句
	day := 3
	switch day {
	case 1:
		fmt.Println("Monday")
	case 2:
		fmt.Println("Tuesday")
	case 6, 7:
		fmt.Println("Weekend")
	default:
		fmt.Println("Other or Invalid day")
	}

	// 3. for 语句
	// 3.1 普通 for 循环
	fmt.Println("For loop example:")
	for i := 1; i <= 5; i++ {
		fmt.Printf("i = %d\n", i)
	}

	// 3.2 使用 break 和 continue
	fmt.Println("Break and continue in for loop:")
	for i := 1; i <= 10; i++ {
		if i == 5 {
			fmt.Println("Breaking loop at i = 5")
			break
		}
		if i%2 == 0 {
			fmt.Printf("Skipping even number i = %d\n", i)
			continue
		}
		fmt.Printf("i = %d\n", i)
	}

	// 4. for-range 循环（用于数组或切片）
	fmt.Println("For-range loop example:")
	names := []string{"Alice", "Bob", "Charlie"}
	for index, name := range names {
		fmt.Printf("Index: %d, Name: %s\n", index, name)
	}

	// 5. defer 语句
	/*
		一个函数中的 defer 语句无论放在什么位置，都会在函数执行结束时执行；
		当函数中有多个 defer 语句时，它们会按照 后进先出（LIFO）的顺序执行，
		即最后一个 defer 最先执行。
	*/
	defer fmt.Println("This will be printed last.")
}
```


# 函数


## 函数定义


```go
func functionName(parameters) returnType {
    // 函数体
}

func add(a int, b int) int {
		return a + b
}

func main() {
		var result int = add(1, 2)
}
```


## 返回值


Go 语言支持返回多个值，并且可以通过为返回值命名来简化返回操作。


```go
// 返回多个值的函数
func swap(a, b int) (int, int) {
    return b, a
}

func main() {
    x, y := swap(3, 4)
    fmt.Println(x, y)  // 输出: 4 3
}

// 命名返回值
func divide(a, b int) (result int, errorMessage string) {
    if b == 0 {
        errorMessage = "division by zero"
        return
    }
    result = a / b
    return
}

func main() {
    res, err := divide(10, 2)
    fmt.Println(res, err)  // 输出: 5 <空字符串>

    _, err2 := divide(10, 0)
    fmt.Println(err2)  // 输出: division by zero
}
```


## 匿名函数


```go
func main() {
    // 定义并调用一个匿名函数
    result := func(a, b int) int {
        return a + b
    }(5, 3)

    fmt.Println(result)  // 输出: 8
}
```


# 错误处理


## `error` 类型


在 Go 语言中，**`error`** 是一个接口类型，用于表示函数执行中的错误。它只有一个方法：


```go
type error interface {
    Error() string  // 返回错误描述信息
}
```


`error` 类型的返回值通常会传递一个错误信息（如 `fmt.Errorf` 或自定义错误类型），如果函数执行成功，返回的 `error` 值为 `nil`。


## 错误处理流程


调用可能出错的函数时，通过检查返回值中的 `error` 是否为 `nil` 来判断是否发生错误。


**示例**：


```go
// 定义一个返回错误的函数
func divide(a, b int) (int, error) {
    if b == 0 {
        return 0, fmt.Errorf("division by zero") // 返回错误
    }
    return a / b, nil // 返回正常结果，错误为 nil
}

func main() {
    result, err := divide(10, 2)
    if err != nil {
        fmt.Println("Error:", err)
    } else {
        fmt.Println("Result:", result)
    }
}
```


## **`defer`****,** **`panic`****,** **`recover`** **与错误处理**

- `defer` 用于确保一些清理操作（如关闭文件、释放资源）能够在函数退出时被调用。
- `panic` 是 Go 中的运行时错误，用来触发程序的异常流程。
- `recover` 允许捕获 `panic`，防止程序崩溃，并可以恢复程序的正常执行。

### **示例：****`defer`****、****`panic`** **和** **`recover`** **的组合**


```go
func riskyFunction() {
    defer func() {
        if r := recover(); r != nil {
            fmt.Println("Recovered from panic:", r)
        }
    }()

    fmt.Println("Starting risky function...")
    panic("something went wrong!")  // 引发 panic
    fmt.Println("This will never be printed")
}

func main() {
    riskyFunction()  // 捕获 panic，程序不会崩溃
    fmt.Println("Program continues...")
}
```


2025年7月9日记：上面主要梳理了一些 Go 语言的基础知识，后续会在本文章下面增量更新一些时间过程中遇到的小知识。由于笔者的主要技术栈为 Java ，所以可能会采用类比的方式进行梳理。


# 切片操作


示例代码：


```go
// 方式1：make显式创建
list := make([]repository.Test, 0)

// 方式2：字面量初始化（更简洁）
list := []repository.Test{}

// Java等价代码
List<Test> list = new ArrayList<>();
```

- 使用 `make` 创建切片可以指定初始容量（比如0，10，20），便于后续维护。
- 向切片中添加数据一般使用 `append` 函数

```go
slice = append(slice, elem1, elem2, ...)
```


# 包

