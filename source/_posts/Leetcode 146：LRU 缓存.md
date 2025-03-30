---
title: Leetcode 146：LRU 缓存
categories:
  - 算法
tags:
  - null
date: 2025-03-30 21:02:56
---

# 题目背景

请你设计并实现一个满足 [LRU (最近最少使用) 缓存](https://baike.baidu.com/item/LRU) 约束的数据结构。

实现 `LRUCache` 类：

- `LRUCache(int capacity)` 以 **正整数** 作为容量 `capacity` 初始化 LRU 缓存
- `int get(int key)` 如果关键字 `key` 存在于缓存中，则返回关键字的值，否则返回 `1` 。
- `void put(int key, int value)` 如果关键字 `key` 已经存在，则变更其数据值 `value` ；如果不存在，则向缓存中插入该组 `key-value` 。如果插入操作导致关键字数量超过 `capacity` ，则应该 **逐出** 最久未使用的关键字。

函数 `get` 和 `put` 必须以 `O(1)` 的平均时间复杂度运行。

# 实现代码

```cpp
// 手写双向链表结构体
struct DLinkedNode {
    int key, value;
    DLinkedNode* prev;
    DLinkedNode* next;
    // 两个构造函数
    DLinkedNode(): key(0), value(0), prev(nullptr), next(nullptr) {}
    DLinkedNode(int _key, int _value): key(_key), value(_value), prev(nullptr), next(nullptr) {}
};

// LRU 类
class LRUCache {
private:
    unordered_map<int, DLinkedNode*> cache;
    DLinkedNode* head;
    DLinkedNode* tail;
    // 当前存储元素个数
    int size;
    // 最大容量
    int capacity;

public:
    // 初始化函数
    LRUCache(int _capacity): capacity(_capacity), size(0) {
        head = new DLinkedNode();
        tail = new DLinkedNode();
        head->next = tail;
        tail->prev = head;
    }
    
    // 获取指定缓存 并且如果缓存存在，将该缓存移至链表尾部
    int get(int key) {
        // 获取指定缓存
        if (!cache.count(key)) {
            // 缓存不存在，返回 -1
            return -1;
        } else {
            // 缓存存在，先拿到 node
            DLinkedNode* node = cache[key];
            // 然后将链表中的 node 移至链表头
            moveToHead(node);
            return node->value;
        }
    }
    
    void put(int key, int value) {
        if (!cache.count(key)) {
            // 要插入的 node 不存在，先 new 一个
            DLinkedNode* node = new DLinkedNode();
            // 给 node 赋基础信息
            node->key = key;
            node->value = value;
            // 把这个新的 node 插到哈希表
            cache[key] = node;
            // 把这个新的 node 插到链表头
            addToHead(node);
            // 当前存储元素数 +1
            size ++;
            // 插入完成后，判断当前存储元素数是否超过最大容量
            if (size > capacity) {
                // 当前存储元素数是否超过最大容量 删除尾结点
                // 删除的 node 要拿到 因为要从哈希表中删除对应信息
                DLinkedNode* node = removeTail();
                // 从哈希表中删除
                cache.erase(node->key);
                // 释放空间 防止内存泄漏
                delete node;
                // 当前存储元素数 -1
                size --;
            }
        } else {
            // node 存在，先把 node 拿到
            DLinkedNode* node = cache[key];
            // 修改值
            node->value = value;
            // 把修改好的 node 插到链表头
            moveToHead(node);
        }

        
    }

		// 将 node 移至链表头（移动链表中的已有 node）
    void moveToHead(DLinkedNode* node) {
        // 先把这个 node 从链表中删除
        removeNode(node);
        // 然后把这个 node 插入到链表头
        addToHead(node);
    }

		// 删除链表中的已有 node
    void removeNode(DLinkedNode* node) {
        node->prev->next = node->next;
        node->next->prev = node->prev;
    }

		// 将 node 插入至链表头（插入一个链表中不存在的 node）
    void addToHead(DLinkedNode* node) {
        node->next = head->next;
        node->prev = head;
        head->next = node;
        node->next->prev = node;
    }

		// 删除尾 node（tail->prev）
    DLinkedNode* removeTail() {
        DLinkedNode* node = tail->prev;
        removeNode(node);
        return node;
    }
};

/**
 * Your LRUCache object will be instantiated and called as such:
 * LRUCache* obj = new LRUCache(capacity);
 * int param_1 = obj->get(key);
 * obj->put(key,value);
 */
```

# 复盘

LRU 是内存管理的一种常用方法，将最近最少使用的页面替换出内存。完整思路其实并不难，难的是如何能时刻保持住清晰的思路，明确下一步要做什么，并且要把思路准确地复现为代码。由于我自己平常写的是 Java 代码，只有在做算法题的时候会用 C++，所以很多 STL 容器现在用的也并不熟练，后面会总结一下写算法题涉及到的一些 C++ 的基础知识。
