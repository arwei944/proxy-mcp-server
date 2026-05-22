import { randomUUID } from 'crypto';

interface ProxyRule {
  id: string;
  target: string;
  proxyUrl: string;
  enabled: boolean;
  createdAt: string;
}

interface ProxyRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
}

interface ProxyResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
  timestamp: string;
}

interface ProxyStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  rulesCount: number;
}

export class ProxyManager {
  private rules: Map<string, ProxyRule> = new Map();
  private stats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    totalResponseTime: 0,
  };

  addRule(rule: Omit<ProxyRule, 'id' | 'createdAt'>): ProxyRule {
    const newRule: ProxyRule = {
      ...rule,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };
    this.rules.set(newRule.id, newRule);
    return newRule;
  }

  removeRule(id: string): boolean {
    return this.rules.delete(id);
  }

  listRules(): ProxyRule[] {
    return Array.from(this.rules.values());
  }

  getStats(): ProxyStats {
    const avgTime = this.stats.totalRequests > 0
      ? this.stats.totalResponseTime / this.stats.totalRequests
      : 0;
    return {
      totalRequests: this.stats.totalRequests,
      successfulRequests: this.stats.successfulRequests,
      failedRequests: this.stats.failedRequests,
      averageResponseTime: Math.round(avgTime),
      rulesCount: this.rules.size,
    };
  }

  async proxyRequest(request: ProxyRequest): Promise<ProxyResponse> {
    const startTime = Date.now();
    this.stats.totalRequests++;

    try {
      const url = new URL(request.url);
      
      // 查找匹配的代理规则
      const rule = this.findMatchingRule(url.hostname);
      
      const fetchOptions: RequestInit = {
        method: request.method,
        headers: {
          ...request.headers,
          'User-Agent': 'Proxy-MCP-Server/1.0',
        },
      };

      if (request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        fetchOptions.body = request.body;
      }

      // 如果有代理规则，使用代理
      let targetUrl = request.url;
      if (rule && rule.enabled) {
        // 这里可以实现实际的代理逻辑
        console.log(`Using proxy ${rule.proxyUrl} for ${targetUrl}`);
      }

      const response = await fetch(targetUrl, fetchOptions);
      const body = await response.text();
      
      const responseTime = Date.now() - startTime;
      this.stats.totalResponseTime += responseTime;
      this.stats.successfulRequests++;

      return {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.stats.failedRequests++;
      throw error;
    }
  }

  private findMatchingRule(hostname: string): ProxyRule | undefined {
    return Array.from(this.rules.values()).find(rule => 
      rule.enabled && hostname.includes(rule.target)
    );
  }
}
