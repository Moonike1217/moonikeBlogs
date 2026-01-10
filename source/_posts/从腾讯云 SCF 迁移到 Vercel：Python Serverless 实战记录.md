---
title: 从腾讯云 SCF 迁移到 Vercel：Python Serverless 实战记录
date: 2026-01-11T01:33:00
updated: 2026-01-11T01:35:00
categories: 
  - Vercel
cover: 
---
> 将A股分红复投计算器从腾讯云云函数（SCF）迁移到 Vercel Serverless Functions 的完整过程记录

## 前言


最近将自己开发的一个**A股分红复投计算器**从腾讯云 SCF（Serverless Cloud Function）迁移到了 Vercel Platform。整个过程遇到了不少坑，特别是 Python 依赖版本兼容性和 Vercel 配置方面的问题。本文记录了完整的迁移过程，希望能帮助到有类似需求的同学。


## 项目背景


这是一个使用 Python 开发的股票分红复投计算器，主要功能包括：

- 📊 获取股票历史价格数据（通过 AKShare API）
- 💰 计算分红复投收益
- 📈 支持多只股票的投资收益分析
- 🎯 提供 RESTful API 接口

**技术栈**：

- 后端：Python 3.9
- 数据源：AKShare（中国股市数据 API）
- 原部署平台：腾讯云 SCF
- 新部署平台：Vercel

## 迁移过程


### 1. 项目结构调整


**腾讯云 SCF 结构**：


```plain text
stock-data-service/
├── index.py              # 云函数入口
├── stock_functions.py    # 业务逻辑
└── requirements.txt      # 依赖
```


**Vercel 结构**：


```plain text
api/
├── index.py              # Serverless Function 入口
├── stock_functions.py    # 业务逻辑
├── __init__.py           # Python 包标记
requirements.txt          # 依赖
pyproject.toml           # Python 项目配置
vercel.json              # Vercel 配置
```


### 2. 入口文件改造


腾讯云 SCF 的入口函数：


```python
def main_handler(event, context):
    # SCF 特定的事件处理
    body = json.loads(event.get('body', '{}'))
    # ...
```


Vercel Python Functions 的入口类：


```python
from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        # 读取请求体
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8')
        # ...
```


**关键区别**：

- SCF 使用函数式入口（`main_handler`）
- Vercel 使用类式入口（继承 `BaseHTTPRequestHandler`）

### 3. 模块导入问题修复


这是遇到的第一个坑！Vercel 运行时报错：


```plain text
ModuleNotFoundError: No module named 'stock_functions'
```


**原因**：Vercel Python runtime 在执行时无法找到同一目录下的模块。


**解决方案**：在 `api/index.py` 中动态添加路径：


```python
import sys
import os

# 添加当前目录到 Python 路径
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from stock_functions import (
    get_stock_name,
    calculate_total_benefit,
    # ...
)
```


同时创建 `api/__init__.py` 将目录标记为 Python 包。


### 4. Python 依赖版本适配（最大的坑！）


这是最折腾的部分！


### 问题 1：本地 Python 版本不匹配


```bash
# 本地 Python 3.13.3
numpy==1.21.6  # 只支持 Python 3.7-3.10
```


错误信息：


```plain text
ERROR: No matching distribution found for numpy==1.21.6
```


**解决方案**：升级依赖版本以兼容 Python 3.9-3.12


### 问题 2：Vercel 部署使用 Python 3.12


虽然配置了 `runtime.txt`，但 Vercel 默认使用 Python 3.12 构建，导致旧版本 `numpy==1.21.6` 构建失败：


```plain text
Failed to build `numpy==1.21.6`
The build backend returned an error
```


**最终解决方案**：升级所有依赖到支持 Python 3.12 的版本


**修改前**（腾讯云 SCF）：


```plain text
numpy==1.21.6      # Python 3.7-3.10
pandas==1.3.5      # Python 3.7-3.10
akshare==1.18.8
requests==2.31.0
urllib3==1.26.18
```


**修改后**（Vercel）：


```plain text
numpy>=1.26.0      # Python 3.9-3.12
pandas>=2.0.0      # Python 3.9-3.12
akshare>=1.12.0
requests>=2.31.0
```


### 5. Vercel 配置文件


创建 `pyproject.toml` 指定 Python 版本：


```toml
[project]
name = "stock-dividend-calculator"
version = "0.1.0"
description = "A股分红复投计算器"
requires-python = ">=3.9"
dependencies = [
    "numpy>=1.26.0",
    "pandas>=2.0.0",
    "akshare>=1.12.0",
    "requests>=2.31.0",
]
```


简化 `vercel.json`：


```json
{
  "buildCommand": "",
  "outputDirectory": ""
}
```


创建 `.vercelignore` 排除不必要的文件：


```plain text
__pycache__
*.pyc
*.pyo
stock-data-service
docs
```


### 6. 本地开发体验


使用 `vercel dev` 启动本地开发服务器：


```bash
vercel dev
```


**优势**：

- 🔥 热重载：修改代码自动重启
- 🐛 本地调试：完美模拟生产环境
- 📊 实时日志：控制台输出清晰

### 7. 部署到生产环境


```bash
# 部署到生产环境
vercel --prod

# 或通过 GitHub 推送自动部署
git push origin main
```


## 自定义域名配置


最后一步，配置自定义域名 `investment.12172003.xyz`：


### Vercel Dashboard 配置

1. 进入项目设置 → Domains
2. 添加域名 `investment.12172003.xyz`
3. 获取 DNS 配置信息

### DNSPod 配置


添加 CNAME 记录：


| 主机记录       | 记录类型  | 记录值                                                  |
| ---------- | ----- | ---------------------------------------------------- |
| investment | CNAME | [cname.vercel-dns.com](http://cname.vercel-dns.com/) |


等待 DNS 生效（通常 5-10 分钟），即可通过自定义域名访问 API：


```plain text
<https://investment.12172003.xyz/api>
```


## 遇到的坑总结


### 1. 模块导入错误


**问题**：`ModuleNotFoundError: No module named 'stock_functions'`


**解决**：动态添加 `sys.path` 并创建 `__init__.py`


### 2. Python 版本不兼容


**问题**：`numpy==1.21.6` 不支持 Python 3.12


**解决**：升级到 `numpy>=1.26.0`、`pandas>=2.0.0`


### 3. 404 Not Found 错误


**问题**：`vercel.json` 配置使用了旧版 `builds` 格式


**解决**：使用简化的配置或完全删除 `vercel.json`


### 4. 构建失败


**问题**：依赖包构建超时或失败


**解决**：使用预编译的二进制包版本，避免从源码编译


## 迁移前后对比


| 特性        | 腾讯云 SCF     | Vercel            |
| --------- | ----------- | ----------------- |
| 部署方式      | 手动上传/CLI    | Git 推送自动部署        |
| 本地调试      | 需要模拟环境      | `vercel dev` 完美模拟 |
| 冷启动       | 1-2 秒       | 1-3 秒             |
| 免费额度      | 每月 100 万次调用 | 每月 100GB 流量       |
| 域名配置      | 需要 API 网关   | 一键添加自定义域名         |
| 日志查看      | 控制台查询       | 实时流式日志            |
| Python 版本 | 需手动指定       | 自动检测（支持 3.9-3.12） |


## 性能测试


使用 `investment.12172003.xyz` 进行测试：


```bash
curl -X POST <https://investment.12172003.xyz/api> \\
  -H "Content-Type: application/json" \\
  -d '{"action":"getStockName","params":{"stockCode":"600519"}}'
```


**响应时间**：

- 冷启动：800-1200ms
- 热启动：100-300ms

**结果**：


```json
{
  "errMsg": "",
  "data": "贵州茅台",
  "success": true
}
```


## 最佳实践建议


### 1. 依赖管理

- ✅ 使用 `pyproject.toml` 而非 `requirements.txt`（更现代化）
- ✅ 使用版本范围（`>=`）而非固定版本（`==`）以适应 Python 版本变化
- ✅ 定期更新依赖以获得安全补丁

### 2. 配置管理

- ✅ 保持 `vercel.json` 简洁
- ✅ 使用 `.vercelignore` 排除不必要文件
- ✅ 通过环境变量管理敏感配置

### 3. 开发流程

- ✅ 使用 `vercel dev` 本地开发
- ✅ 连接 GitHub 实现自动部署
- ✅ 使用 Preview URLs 进行预发布测试

### 4. 监控和日志

- ✅ 使用 Vercel Analytics 监控性能
- ✅ 配置错误追踪（如 Sentry）
- ✅ 定期检查 Function Logs

## 相关链接

- **项目代码**：[GitHub Repository](https://github.com/yourusername/reinvestment-vercel)
- **在线演示**：[https://reinvestment.12172003.xyz](https://reinvestment.12172003.xyz/)
- **Vercel Python 文档**：[https://vercel.com/docs/functions/runtimes/python](https://vercel.com/docs/functions/runtimes/python)
- **AKShare 文档**：[https://akshare.akfamily.xyz](https://akshare.akfamily.xyz/)
