---
title: 百万量级 Excel 数据下，EasyExcel 和 Apache POI 的对比
date: 2025-05-22T16:45:00
updated: 2025-05-23T15:04:00
categories: 
  - 场景问题
cover: 
---

# 简单介绍 EasyExcel 和 POI


EasyExcel 和 Apache POI 是 Java 中常用的处理 Excel 文件的开源工具库。


**Apache POI** 是功能全面的 Excel 读写库，支持 `.xls` 和 `.xlsx` 格式，适合复杂的 Excel 操作，比如自定义样式、图表、公式等。但它在处理大文件时内存占用较高，效率相对较低。


**EasyExcel** 是阿里巴巴 2017 年开源的 Excel 读写工具，基于 POI 开发，专注于高性能的 Excel 操作。它采用 SAX 方式读取数据，极大地降低了内存消耗，特别适合处理百万级数据的 Excel 文件。但在功能上不如 POI 全面，主要适用于表格数据的导入导出场景。


在实习的时候，我所在的是营帐部门，主要负责处理公司的产品计费数据，所以经常会遇到这样的问题：用户消费账单的 Excel 文件基本都是百万量级的，所以高效处理 Excel 文件就成了一个不得不面对的问题。本文基于公司场景进行复现，从写入和解析两个角度来对比 EasyExcel 和 POI 处理 Excel 文件的能力。


# 为什么 EasyExcel 比 POI 快这么多


## SAX 解析


**SAX（Simple API for XML）事件驱动**是一种**按顺序读取文件、边读边处理**的方式。每次读到一个元素（一行数据）就出发一个事件，回调我们定义的处理方法。

- **EasyExcel 读取 Excel 文件时使用 SAX（事件驱动）模式**，只在读取时加载当前一行数据，内存占用极低。
- **POI 默认使用 DOM（文档对象模型）方式**，会将整个 Excel 文件加载到内存中，尤其在处理大文件时容易造成内存溢出。

## 数据结构优化

- EasyExcel 避免了创建大量中间对象，仅保留必要的数据结构。
- POI 中对象封装较重，每个单元格、样式、行列信息都会转化为多个对象，造成 GC 压力大

## 优化样式复用

- EasyExcel 在写入时避免了 POI 中常见的样式重复问题（POI 每写一个单元格样式就可能创建一个新对象，数量过多会报错）。它自动缓存和复用样式，提升了写入效率并避免内存泄漏。

## 自定义监听器

- EasyExcel 支持自定义读取监听器，边读边处理，不需要一次性加载所有数据。这使得它在处理**百万级 Excel 数据**时依然稳定快速。

# 场景设定


目前要对用户信息进行操作，数据量为 70w 行，mock 用户信息的代码如下：


```java
private static List<ExcelData> generateTestData() {
        List<ExcelData> dataList = new ArrayList<>(TOTAL_ROWS); // 预分配容量
        for (long i = 0; i < TOTAL_ROWS; i++) {

            ExcelData data = new ExcelData()
                    .setId(i + 1)
                    .setName("测试用户" + (i + 1))
                    .setAge(20 + (int)(i % 50))
                    .setAddress("测试地址" + (i + 1))
                    .setPhone("1380013" + String.format("%04d", i % 10000))
                    .setEmail("test" + (i + 1) + "@example.com")
                    .setRemark("备注信息" + UUID.randomUUID().toString().substring(0, 8));
            dataList.add(data);
        }
        return dataList;
    }
```


以下为执行过程中的日志，用于辅助后续图片理解：


```plain text
2025-05-22 17:13:31.651 等待visualVM监视
2025-05-22 17:13:36.676 开始生成测试数据...
2025-05-22 17:13:39.301 测试数据生成完成，开始性能测试...
2025-05-22 17:13:39.301 开始EasyExcel写入测试...
2025-05-22 17:13:51.085 EasyExcel写入完成！
2025-05-22 17:13:51.085 EasyExcel写入700000行数据耗时：11秒
2025-05-22 17:13:51.085 开始POI写入测试...
2025-05-22 17:14:56.574 POI写入完成！
2025-05-22 17:14:56.574 POI写入700000行数据耗时：65秒
2025-05-22 17:15:02.572 开始解析性能对比...
2025-05-22 17:15:02.572 开始EasyExcel解析测试...
2025-05-22 17:15:06.813 EasyExcel解析完成！
2025-05-22 17:15:06.813 EasyExcel解析700000行数据耗时：4秒
2025-05-22 17:15:06.813 开始POI解析测试...
2025-05-22 17:15:38.075 POI解析完成！
2025-05-22 17:15:38.075 POI解析700000行数据耗时：31秒
```


# 重点：对比 Heap 使用情况和处理时间


下图为整个过程中的 Heap 使用情况，关键节点已经标出；同时我将时间轴分为了五个阶段，五个阶段的含义如下所述：

- 第一阶段：Easyexcel 写入文件
- 第二阶段：POI 写入文件
- 第三阶段：手动执行 Full GC，然后线程等待 5s，防止后续无法从图上直观看到 Easyexcel 解析过程中的 Heap 使用情况
- 第四阶段：Easyexcel 解析文件
- 第五阶段：POI 解析文件

![image.png](https://raw.githubusercontent.com/Moonike1217/imageHosting/main/6dff88796e7eac64386529944f97899e.png)


Easyexcel 写入 Excel 文件过程中，最大堆内存占用为 1249693576B（约 1.16G）。


![image.png](https://raw.githubusercontent.com/Moonike1217/imageHosting/main/573802d23fbf7bef6307debf9b407af2.png)


POI 写入 Excel 文件过程中，最大堆内存占用为 5906678592B（约 5.50G）。


![image.png](https://raw.githubusercontent.com/Moonike1217/imageHosting/main/6f8d5bcdb5f20556fa100f40991606e5.png)


Easyexcel 解析 Excel 文件过程中，最大堆内存占用为 467380336B（约 0.44G）。


![image.png](https://raw.githubusercontent.com/Moonike1217/imageHosting/main/2cc83d63bb8d435d72d481dd997f343e.png)


POI 解析 Excel 文件过程中，最大堆内存占用为 5578518376B（约 5.20G，约为文件大小的 163.5 倍）。


![image.png](https://raw.githubusercontent.com/Moonike1217/imageHosting/main/925a6a1dcb315d71cbde1cdedef50b53.png)


![image.png](https://raw.githubusercontent.com/Moonike1217/imageHosting/main/278300791215695f7020b3ec60f1bae2.png)


所以我们可见，无论是在速度上，还是在 Heap 的使用情况上，EasyExcel 相比 POI 都有着不小的优势；但是我也发现，公司内部有很多工具类仍然选择基于 POI 进行封装，这又是为什么呢？


# 写入和解析过程的代码对比


```java
// 使用 EasyExcel 写入数据
    private static void testEasyExcel(List<ExcelData> dataList) {
        log.info("{} 开始EasyExcel写入测试...", now());
        EasyExcel.write(EASY_EXCEL_FILE, ExcelData.class)
                .sheet("测试数据")
                .doWrite(dataList);
        log.info("{} EasyExcel写入完成！", now());
    }
    
    // 使用 POI 写入数据
    private static void testPOI(List<ExcelData> dataList) throws IOException {
        log.info("{} 开始POI写入测试...", now());
        Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook();
        Sheet sheet = workbook.createSheet("测试数据");
        // 创建表头
        Row headerRow = sheet.createRow(0);
        String[] headers = {"ID", "姓名", "年龄", "地址", "电话", "邮箱", "备注"};
        for (int i = 0; i < headers.length; i++) {
            headerRow.createCell(i).setCellValue(headers[i]);
        }
        // 写入数据
        for (int i = 0; i < dataList.size(); i++) {
            if (i % 5000 == 0) {
                log.info("{} POI已写入{}行数据", now(), i);
            }
            Row row = sheet.createRow(i + 1);
            ExcelData data = dataList.get(i);
            row.createCell(0).setCellValue(data.getId());
            row.createCell(1).setCellValue(data.getName());
            row.createCell(2).setCellValue(data.getAge());
            row.createCell(3).setCellValue(data.getAddress());
            row.createCell(4).setCellValue(data.getPhone());
            row.createCell(5).setCellValue(data.getEmail());
            row.createCell(6).setCellValue(data.getRemark());
        }
        // 写入文件
        try (FileOutputStream outputStream = new FileOutputStream(POI_FILE)) {
            workbook.write(outputStream);
        }
        workbook.close();
        log.info("{} POI写入完成！", now());
    }
    
    // 使用 EasyExcel 解析文件
    private static void testEasyExcelRead() {
	    log.info("{} 开始EasyExcel解析测试...", now());
	    EasyExcel.read(EASY_EXCEL_FILE, ExcelData.class, new com.alibaba.excel.read.listener.ReadListener<ExcelData>() {
	        @Override
	        public void invoke(ExcelData data, com.alibaba.excel.context.AnalysisContext context) {
	            // 这是一个回调函数，可以做数据处理，这里不做任何操作，只进行计数
	        }
	        @Override
	        public void doAfterAllAnalysed(com.alibaba.excel.context.AnalysisContext context) {
	            // 解析完成
	        }
	    }).sheet().doRead();
	    log.info("{} EasyExcel解析完成！", now());
    }

    // 使用 POI 解析文件
    private static void testPOIRead() throws IOException {
        log.info("{} 开始POI解析测试...", now());
        try (org.apache.poi.ss.usermodel.Workbook workbook = org.apache.poi.ss.usermodel.WorkbookFactory.create(new java.io.File(POI_FILE))) {
            Sheet sheet = workbook.getSheetAt(0);
            int rowCount = sheet.getPhysicalNumberOfRows();
            for (int i = 1; i < rowCount; i++) { // 跳过表头
                Row row = sheet.getRow(i);
                if (row == null) continue;
                // 这里可以做数据处理，这里只做计数
            }
        }
        log.info("{} POI解析完成！", now());
    }
```


在相同的写入操作中，**EasyExcel** 的代码量明显少于 **POI**，并且支持自动映射 Java 对象属性，使用上更加简洁高效。但需要注意，EasyExcel 并不适用于需要对每个单元格进行精细控制的复杂场景。若需实现如**合并单元格、设置样式、插入图片、编写公式**等功能，仍应优先考虑 POI。在 Excel 文件解析方面，虽然两者的代码复杂度差异不大，但 EasyExcel 的逻辑更直观，且在内存管理上优于 POI，特别适合处理大数据量。究竟是使用 EasyExcel 还是使用 POI，还是需要根据使用场景进行考虑。


# POI 的生存之道


既然 POI 在大部分时候都不如 EasyExcel，为什么现在依然还屹立不倒呢？我问了 ChatGPT POI 经久不衰的原因，他是从下面这几个角度考虑的：

- **功能更全面**：支持单元格样式、图表、公式、批注等复杂操作，适用于多种办公文档格式（如 Word、PowerPoint）。
- **社区成熟**：开发时间长，文档丰富，使用者多，遇到问题容易找到解决方案。
- **可控性强**：提供底层 API，支持更高程度的自定义，适合有特殊格式或样式需求的场景。
- **兼容性高**：EasyExcel 底层依赖 POI，在某些复杂功能上仍需回退使用 POI。
- **项目历史原因**：很多老项目或大型系统最初就使用 POI，出于稳定性和迁移成本考虑，仍在沿用。

我觉得回答还是比较全面的。从 Git 提交记录发现，公司使用的一些工具类从一开始就基于 POI 进行封装，如果要全部迁移，成本还是比较巨大的，同时 POI 更能够适合复杂场景的处理，这或许支撑着 EasyExcel 一直走到了现在。

