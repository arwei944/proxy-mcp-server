#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { ProxyManager } from './proxy-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 代理管理器
const proxyManager = new ProxyManager();

// MCP 服务器
const server = new Server(
  {
    name: 'proxy-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 工具列表
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'proxy_request',
        description: '通过代理访问外部网络资源',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: '目标 URL',
            },
            method: {
              type: 'string',
              description: 'HTTP 方法 (GET, POST, PUT, DELETE)',
              enum: ['GET', 'POST', 'PUT', 'DELETE'],
              default: 'GET',
            },
            headers: {
              type: 'object',
              description: '请求头',
              default: {},
            },
            body: {
              type: 'string',
              description: '请求体 (用于 POST/PUT)',
            },
          },
          required: ['url'],
        },
      },
      {
        name: 'add_proxy_rule',
        description: '添加代理规则',
        inputSchema: {
          type: 'object',
          properties: {
            target: {
              type: 'string',
              description: '目标域名或 URL 模式',
            },
            proxyUrl: {
              type: 'string',
              description: '代理服务器地址',
            },
            enabled: {
              type: 'boolean',
              description: '是否启用',
              default: true,
            },
          },
          required: ['target', 'proxyUrl'],
        },
      },
      {
        name: 'list_proxy_rules',
        description: '列出所有代理规则',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'remove_proxy_rule',
        description: '删除代理规则',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: '规则 ID',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'get_proxy_stats',
        description: '获取代理统计信息',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// 工具调用处理
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'proxy_request': {
        const result = await proxyManager.proxyRequest({
          url: args.url as string,
          method: (args.method as string) || 'GET',
          headers: (args.headers as Record<string, string>) || {},
          body: args.body as string | undefined,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'add_proxy_rule': {
        const rule = proxyManager.addRule({
          target: args.target as string,
          proxyUrl: args.proxyUrl as string,
          enabled: (args.enabled as boolean) ?? true,
        });
        return {
          content: [
            {
              type: 'text',
              text: `代理规则已添加: ${JSON.stringify(rule, null, 2)}`,
            },
          ],
        };
      }

      case 'list_proxy_rules': {
        const rules = proxyManager.listRules();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(rules, null, 2),
            },
          ],
        };
      }

      case 'remove_proxy_rule': {
        proxyManager.removeRule(args.id as string);
        return {
          content: [
            {
              type: 'text',
              text: `规则 ${args.id} 已删除`,
            },
          ],
        };
      }

      case 'get_proxy_stats': {
        const stats = proxyManager.getStats();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(stats, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`未知工具: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `错误: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Web 管理界面
const app = express();
app.use(cors());
app.use(express.json());

// 静态文件服务
app.use(express.static(join(__dirname, '../public')));

// API 路由
app.get('/api/rules', (req, res) => {
  res.json(proxyManager.listRules());
});

app.post('/api/rules', (req, res) => {
  try {
    const rule = proxyManager.addRule(req.body);
    res.json(rule);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

app.delete('/api/rules/:id', (req, res) => {
  proxyManager.removeRule(req.params.id);
  res.json({ success: true });
});

app.get('/api/stats', (req, res) => {
  res.json(proxyManager.getStats());
});

// 代理端点
app.all('/proxy/*', async (req, res) => {
  const targetUrl = req.path.replace('/proxy/', '');
  try {
    const result = await proxyManager.proxyRequest({
      url: targetUrl,
      method: req.method,
      headers: req.headers as Record<string, string>,
      body: JSON.stringify(req.body),
    });
    res.status(result.status).json(result);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// 启动 Web 服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Web 管理界面运行在 http://localhost:${PORT}`);
});

// 启动 MCP 服务器
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Proxy MCP Server running on stdio');
}

main().catch(console.error);
