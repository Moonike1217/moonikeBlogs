---
title: Leetcode 148：排序链表
date: 2025-05-09T14:13:00
updated: 2025-05-20T14:22:00
categories: 
  - [算法, 刷穿Leetcode]
cover: 
---

# 题目背景


给你链表的头结点 `head` ，请将其按 **升序** 排列并返回 **排序后的链表** 。


# 实现代码


```c++
class Solution {
private:
    // 寻找链表的中间结点
    ListNode* findMiddle(ListNode* head) {
        ListNode* slow = head;
        ListNode* fast = head;
        ListNode* pre = head;
        while (fast != nullptr && fast->next != nullptr) {
            pre = slow;
            slow = slow->next;
            fast = fast->next->next;
        }
        pre->next = nullptr;
        return slow;
    }

    // 合并两个有序链表
    ListNode* merge(ListNode* head1, ListNode* head2) {
        ListNode dummy;
        ListNode* cur = &dummy;
        while (head1 != nullptr && head2 != nullptr) {
            if (head1->val < head2->val) {
                cur->next = head1;
                head1 = head1->next;
            } else {
                cur->next = head2;
                head2 = head2->next;
            }
                cur = cur->next;
        }
        cur->next = head1 == nullptr ? head2 : head1;
        return dummy.next;
    }
public:
		// 排序
    ListNode* sortList(ListNode* head) {
        // 如果链表中没有元素或者只有一个元素则直接返回
        if (head == nullptr || head->next == nullptr) {
            return head;
        }
        
        // 寻找链表的中间元素
        ListNode* mid = findMiddle(head);
        
        // 排序拆分好的两个链表
        ListNode* head1 = sortList(head);
        ListNode* head2 = sortList(mid);

        //合并
        return merge(head1, head2);
    }
};
```


# 复盘


对链表的排序可以拆分成以下的步骤：寻找链表中间节点、拆分链表、分别对链表进行排序、合并链表。整体实现思路不是很困难，但是 coding 过程中有一些点还是需要注意的：

- 寻找链表中间结点
    - 需要定义 `pre` 指针用来存储 `slow` 更新之前的值， `pre` 指针是为了最后拆分链表时使用。
    - 循环条件为 `while (fast && fast->next)` ，并不涉及 `slow` 指针。（因为 `fast` 走过的地方， `slow` 未来肯定也能走）
- 合并有序链表
    - 定义辅助变量 `dummy` 和 `cur` ，在更新时更新的是 `cur->next` 而不是 `cur` 。
    - 最后是将还未遍历到的部分拼接到 `cur->next` 上而不是 `cur` 上。
