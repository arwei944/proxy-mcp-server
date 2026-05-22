---
title: Proxy MCP Server
emoji: 🌐
colorFrom: indigo
colorTo: blue
sdk: docker
pinned: false
---

# Proxy MCP Server

一个带有 macOS 极简风格管理界面的 MCP (Model Context Protocol) 代理服务器。

## 功能特性

- 🤖 **MCP 协议支持** - 兼容 Model Context Protocol 标准
- 🌐 **代理服务** - 支持 HTTP/HTTPS 请求代理
- 📊 **统计监控** - 实时请求统计和性能监控
- 🎨 **macOS 风格 UI** - 极简优雅的管理界面
- 🌙 **深色模式** - 自动适配系统主题
- 📱 **响应式设计** - 支持桌面和移动设备

## 快速开始

### 安装依赖

```bash
npm install
```

### 构建项目

```bash
npm run build
```

### 启动服务

```bash
npm start
```

服务启动后：
- Web 管理界面: http://localhost:3000
- MCP 服务: stdio 模式

## MCP 工具

### proxy_request
通过代理访问外部网络资源。

```json
{
  "url": "https://api.example.com/data",
  "method": "GET",
  "headers": {},
  "body": null
}
```

### add_proxy_rule
添加代理规则。

```json
{
  "target": "example.com",
  "proxyUrl": "http://proxy.example.com:8080",
  "enabled": true
}
```

### list_proxy_rules
列出所有代理规则。

### remove_proxy_rule
删除代理规则。

```json
{
  "id": "rule-uuid"
}
```

### get_proxy_stats
获取代理统计信息。

## API 端点

- `GET /api/rules` - 获取所有规则
- `POST /api/rules` - 添加规则
- `DELETE /api/rules/:id` - 删除规则
- `GET /api/stats` - 获取统计信息
- `/proxy/*` - 代理端点

## 配置

环境变量：
- `PORT` - Web 服务端口 (默认: 3000)

## 技术栈

- TypeScript
- Express.js
- MCP SDK
- 原生 JavaScript (前端)

## 许可证

MIT
