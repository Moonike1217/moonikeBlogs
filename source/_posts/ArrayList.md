---
title: ArrayList
date: 2024-12-03T19:54:00
updated: 2025-05-20T14:30:00
categories: 
  - [Java, Java集合]
cover: 
---

# 底层实现

- 底层使用 `Object[]` 数组存储元素。
- 当调用无参构造函数时，`ArrayList` 会被初始化为一个空的 `Object[]`，容量为 0。只有在添加第一个元素时，容量才会扩展到默认值 10。
- 当调用带参构造函数时：
    - 如果传入的参数为 0，则 `ArrayList` 同样会初始化为一个空的 `Object[]`，容量为 0；
    - 如果传入的参数大于 0，则会直接将 `Object[]` 的大小初始化为传入的参数值。

# 扩容机制


ArrayList 中的 `grow` 方法是扩容的关键


```java
/**
     * ArrayList扩容的核心方法。
     */
    private void grow(int minCapacity) {
        // oldCapacity为旧容量，newCapacity为新容量
        int oldCapacity = elementData.length;
        //将oldCapacity 右移一位，其效果相当于oldCapacity /2，
        //我们知道位运算的速度远远快于整除运算，整句运算式的结果就是将新容量更新为旧容量的1.5倍，
        int newCapacity = oldCapacity + (oldCapacity >> 1);
        //然后检查新容量是否大于最小需要容量，若还是小于最小需要容量，那么就把最小需要容量当作数组的新容量，
        if (newCapacity - minCapacity < 0)
            newCapacity = minCapacity;
       // 如果新容量大于 MAX_ARRAY_SIZE,进入(执行) `hugeCapacity()` 方法来比较 minCapacity 和 MAX_ARRAY_SIZE，
       //如果minCapacity大于最大容量，则新容量则为`Integer.MAX_VALUE`，否则，新容量大小则为 MAX_ARRAY_SIZE 即为 `Integer.MAX_VALUE - 8`。
        if (newCapacity - MAX_ARRAY_SIZE > 0)
            newCapacity = hugeCapacity(minCapacity);
        // minCapacity is usually close to size, so this is a win:
        elementData = Arrays.copyOf(elementData, newCapacity);
    }
```

