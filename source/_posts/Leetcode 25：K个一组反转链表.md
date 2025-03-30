---
title: Leetcode 25：K个一组反转链表
categories:
  - 算法
tags:
  - null
date: 2025-03-30 21:02:54
---

# 题目背景

给你链表的头节点 `head` ，每 `k` **个节点一组进行翻转，请你返回修改后的链表。

`k` 是一个正整数，它的值小于或等于链表的长度。如果节点总数不是 `k` **的整数倍，那么请将最后剩余的节点保持原有顺序。

你不能只是单纯的改变节点内部的值，而是需要实际进行节点交换。

![image.png](https://assets.leetcode.com/uploads/2020/10/03/reverse_ex1.jpg)

> 输入：head = [1,2,3,4,5], k = 2 输出：[2,1,4,3,5]

# 实现代码

```cpp
/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode() : val(0), next(nullptr) {}
 *     ListNode(int x) : val(x), next(nullptr) {}
 *     ListNode(int x, ListNode *next) : val(x), next(next) {}
 * };
 */
class Solution {
public:

    pair<ListNode*, ListNode*> myReverse(ListNode* head, ListNode* tail) {
        // prev 初始值设为 tail->next，即下一组的头结点
        // 这样在翻转完成后，原头结点就会指向下一组的头结点
        ListNode* prev = tail->next;
        // 取出当前的头结点
        ListNode* node = head;
        // 执行翻转过程
        while (prev != tail) {
            ListNode* nex = node->next;
            node->next = prev;
            prev = node;
            node = nex;
        }
        // 返回新的头尾结点
        return {tail, head};
    }

    ListNode* reverseKGroup(ListNode* head, int k) {
        // 引入虚拟头结点 简化后续操作
        ListNode* dummy = new ListNode(0);
        dummy->next = head;
        // pre 表示前一组的尾结点
        ListNode* pre = dummy;
        while (head) {
            // tail 表示当前组的尾结点
            ListNode* tail = pre;

            // 判断剩余部分的长度是否小于 k
            // 如果小于 k ，会直接返回头结点
            // 如果大于等于 k，tail 在下面这段代码执行结束后会被赋值为当前组的尾结点
            for (int i = 0; i < k; i ++) {
                tail = tail->next;
                if (!tail) return dummy->next;
            }

            // nex 为下一组的头结点
            ListNode* nex = tail->next;
            // 翻转当前组
            pair<ListNode*, ListNode*> res = myReverse(head, tail);
            head = res.first;
            tail = res.second;

            // 把当前组重新接回链表
            pre->next = head;
            tail->next = nex;
            
            // 为下一次循环做准备(下一次循环用到的 tail 是在上面的 for 循环进行赋值的)
            pre = tail;
            head = nex;
            
        }

        return dummy->next;
    }
};
```

# 复盘

这个题目中涉及到几个比较关键的变量，一定要搞懂他们的含义：

- `dummy` ：为了简化对 `head` 结点的操作而引入的虚拟头结点
- `pre` ：前一组的尾结点
- `nex` ：下一组的头结点
- `head` ：当前组的头结点
- `tail` ：当前组的尾结点

## 关于 `myReverse` 函数

这个函数的入参为要翻转的子链表的头尾结点，返回值为翻转完成后的头尾结点（以 Pair 的形式返回）。翻转过程比较显然，不做过多阐述。个人感觉比较巧的一步：将 `prev` 设置为下一组的头结点（即 `tail->next`），由于翻转过程中会将当前节点的 next 指向 prev，这样一来，对 head 的翻转操作执行完成后（理论上这时 head 其实已经变成 tail 了，只是我们并未显式变更它的名字），它的 next 就会指向下一组的头结点。

补充：后面仔细思考了一下，发现这个 `prev` 其实设置成 `nullptr` 也可以的，因为主函数有把当前组接回链表的操作。

## 关于 `reverKGroup` 函数

对于某一次 `while` 循环中用到的 `head` / `tail` / `pre` / `nex` ，分别是在以下几个时间点进行赋值：

- `head` ：上一次循环结束时， `head` 就可以被赋值为 `nex`
- `pre` ：上一次循环结束时， `pre` 就可以被赋值为 `tail->next`
- `tail` ：这次循环开始时，判断剩余部分的长度是否小于 k
- `nex` ： `tail` 赋值完， `nex` 就可以被赋值为 `tail->next`
