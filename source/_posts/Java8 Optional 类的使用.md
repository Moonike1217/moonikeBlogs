---
title: Java8 Optional 类的使用
date: 2025-03-18T11:56:00
updated: 2025-05-20T14:24:00
categories: 
  - [Java, Java基础]
cover: 
---

传统的防止出现 `NullpointerException`异常的方法是使用 `if-else`语句来进行判断，而 Optional 类的出现是为了简化对 `null`的判断。


# **什么是 Optional 类**


`java.util.Optional<T>`类是一个封装了`Optional`值的容器对象。如果值存在，调用`get()`方法可以获取值，并且调用`isPresent()`方法会返回`true`；如果值不存在，那么调用`isPresent()`方法会返回 `false`，并且调用 `get()`方法会抛出异常。


# **如何创建 Optional 对象**


`Optional`类提供类三个方法用于实例化一个`Optional`对象，它们分别为`empty()`、`of()`、`ofNullable()`，这三个方法都是静态方法，可以直接调用。


---

- `empty()`方法用于创建一个没有值的`Optional`对象：

```java
Optional<String> emptyOpt = Optional.empty();
```


`empty()`方法创建的对象没有值，如果对`emptyOpt`变量调用`isPresent()`方法会返回`false`，调用`get()`方法抛出`NullPointerException`异常。


---

- `of()`方法使用一个非空的值创建`Optional`对象：

```java
String str = "Hello World";
Optional<String> notNullOpt = Optional.of(str);
```


---

- `ofNullable()`方法接收一个可以为`null`的值：

```java
Optional<String> nullableOpt = Optional.ofNullable(str);
```


如果`str`的值为`null`，得到的`nullableOpt`是一个没有值的`Optional`对象。


# **提取 Optional 对象中的值**


`orElse(var)`：如果有值就返回，否则返回`var`作为默认值；


`orElseGet()`：与`orElse()`方法作用类似，区别在于生成默认值的方式不同。该方法接受一个`Supplier<? extends T>`函数式接口参数，用于生成默认值；


`orElseThrow()`：与前面介绍的`get()`方法类似，当值为`null`时调用这两个方法都会抛出`NullPointerException`异常，区别在于该方法可以指定抛出的异常类型。


## **具体用法**


```java
String str = "Hello World";
Optional<String> strOpt = Optional.of(str);
String orElseResult = strOpt.orElse("Hello Shanghai");
String orElseGet = strOpt.orElseGet(() -> "Hello Shanghai");
String orElseThrow = strOpt.orElseThrow(() -> new IllegalArgumentException("Argument 'str' cannot be null or blank."));
```


# **如何正确使用 Optional 类**

1. 尽量避免在程序中直接调用`Optional`对象的`get()`和`isPresent()`方法；

直接调用`get()`方法是很危险的做法，如果`Optional`的值为空，那么毫无疑问会抛出`NullPointerException`异常，而为了调用`get()`方法而使用`isPresent()`方法作为空值检查，这种做法与传统的用`if`语句块做空值检查没有任何区别。

1. 避免使用`Optional`类型声明实体类的属性；

这个类在设计的时候就没有考虑过用来作为类的属性，可以查看`Optional`的源代码，你会发现它没有实现`java.io.Serializable`接口，也就是说如果你用到一些orm框架的二级缓存，使用`Optional`作为实体类的属性没法被序列化。

1. 当你很确定一个对象不可能为`null`的时候，应该使用`of()`方法，否则，尽可能使用`ofNullable()`方法创建 Optional 对象。

## **使用示例**

1. 简化嵌套 `if-else`

```java
User user = ...
if (user != null) {
    String userName = user.getUserName();
    if (userName != null) {
        return userName.toUpperCase();
    } else {
        return null;
    }
} else {
    return null;
}
```


---


上面的代码可以简化成：


```java
User user = ...
Optional<User> userOpt = Optional.ofNullable(user);

return userOpt.map(User::getUserName)
            .map(String::toUpperCase)
            .orElse(null);
```

1. 判重

如判断用户名不能重复的逻辑，根据用户名从数据库中查询一个用户，如果不为null就抛出异常告诉前端用户已存在：


```java
User existUser = userDAO.findById(user.getUsername());
if (existUser != null) {
    throw new AppException("用户名已存在");
}
```


可以简写为：


```java
User user = userDAO.findById(user.getId());
// ifPresent的方法体只有在 Optional 值不为空的时候才会执行
Optional.ofNullable(user).ifPresent(it -> {
  throw new AppException("用户名已存在");
})
```

