---
title: Leetcode 215：数组中的第K个最大元素
categories:
  - 算法
tags:
  - null
date: 2025-03-30 21:02:58
---

# 题目背景

给定整数数组 `nums` 和整数 `k`，请返回数组中第 **`k`** 个最大的元素。

请注意，你需要找的是数组排序后的第 `k` 个最大的元素，而不是第 `k` 个不同的元素。

你必须设计并实现时间复杂度为 `O(n)` 的算法解决此问题。

# 实现代码

```cpp
class Solution {
public:
    // 维护以 i 为根的子树，确保该子树满足大根堆性质
    void maxHeapify(vector<int>& a, int i, int heapSize) {
        // 取出 i 的左右子节点
        int l = 2 * i + 1, r = l + 1, largest = i;
        // 判断 i 的左右子节点的值 是否大于 i 的值
        if (l < heapSize && a[l] > a[largest]) largest = l;
        if (r < heapSize && a[r] > a[largest]) largest = r;
        // 如果根节点不是最大 那么就交换 然后重新维护
        if (largest != i) {
            swap(a[largest], a[i]);
            maxHeapify(a, largest, heapSize);
        }
    }

    // 无序数组构造为大根堆
    void buildMaxHeap(vector<int>& a, int heapSize) {
        // 从第一个非叶结点开始 自下向上处理
        // heapSize/2 - 1 就是最后一个非叶子节点的索引
        for (int i = heapSize / 2 - 1; i >= 0; i --) {
            maxHeapify(a, i, heapSize);
        }
    }

    int findKthLargest(vector<int>& nums, int k) {
        // 1.建堆
        int heapSize = nums.size();
        buildMaxHeap(nums, heapSize);

        // 2.执行 k-1 次弹出堆顶操作
        for (int i = nums.size() - 1; i >= nums.size() - k + 1; i --) {
            // 每次把当前最大值（堆顶）换到数组末尾，然后缩减堆大小，再重新调整堆顶
            swap(nums[0], nums[i]);
            heapSize --;
            maxHeapify(nums, 0, heapSize);
        }

        // 3.返回堆顶元素 此时堆顶元素为第 k 大元素
        return nums[0];
    }
};
```

# 复盘

时间复杂度：O(nlogn)，建堆的时间代价是 O(n)，删除的总代价是 O(klogn)，因为 k<n，故渐进时间复杂度为 O(n+klogn)≤O(n+nlogn)=O(nlogn)。

这个题涉及了堆这种数据结构，有一些常用的性质还是要知道的：

- 对于下标为 `i` 的节点：
  - **左子节点** 的下标为 `2*i + 1`
  - **右子节点** 的下标为 `2*i + 2`
  - **父节点** 的下标为 `(i - 1) / 2`（注意：整除，即向下取整）
- 操作的时间复杂度
  - **插入**：在堆末尾插入新元素，然后进行“上浮”调整，时间复杂度为 O(log⁡n)
  - **删除堆顶**：将堆顶与末尾元素交换，移除末尾元素，然后进行“下沉”调整，时间复杂度为 O(log⁡n)
  - **构建堆**：通过自底向上的调整方式构建堆，时间复杂度通常为 O(n）
