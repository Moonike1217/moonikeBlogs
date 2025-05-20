---
title: String
date: 2025-02-27T20:08:00
updated: 2025-05-20T14:24:00
categories: 
  - [Java, Java基础]
cover: 
---

# String类常用方法

- `length()` 返回字符串长度
- `charAt(int index)` 返回指定位置字符
- `indexOf(String str)` 返回指定子字符串第一次出现的位置
- `trim()` 去除前后空格
- `split(String regex)` 根据正则表达式分割
- `valueOf(Object obj)` 返回指定对象的字符串形式
- `format(String format, Object... args)` 返回格式化后的字符串，类似 `printf`

# String为什么不可变


因为 String 类是 final 的，这保证他不会被子类修改。


并且 String 类中用来存储字符的 char 数组（Java9 之后为了节约空间改为 byte 数组）是 private final 的，类内也没有暴露修改该数组的方法。


综上 String 是不可变的。


# StringBuilder StringBuffer


StringBuilder 和 StringBuffer 都继承于 AbstarctStringBuilder， AbstarctStringBuilder 中包含如 append、indexOf 等操作字符串的方法，StringBuffer 内的方法或者对其调用的方法都是加锁的，所以是线程安全的；StringBuilder 内的方法或者对其调用的方法是不加锁的，所以是非线程安全的。


综上我们可以得出String、StringBuffer、StringBuilder的使用场景如下：

- 操作少量数据：String
- 单线程操作大量数据：StringBuilder
- 多线程操作大量数据：StringBuffer
