import { Response } from 'express';
import { logger } from '../utils/logger.js';

export type SSEEventType =
  | 'connected'
  | 'event:created'
  | 'alert:created'
  | 'alert:updated'
  | 'agent:enrolled'
  | 'agent:heartbeat'
  | 'endpoint:status_changed'
  | 'incident:created'
  | 'incident:updated'
  | 'stats:updated';

interface SSEClient {
  id: string;
  userId: string;
  role: string;
  res: Response;
  heartbeatTimer: NodeJS.Timeout;
}

class SSEHub {
  private clients = new Map<string, SSEClient>();

  addClient(id: string, userId: string, role: string, res: Response): void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const heartbeatTimer = setInterval(() => {
      if (!res.writableEnded) {
        res.write(`: keepalive ${Date.now()}\n\n`);
      }
    }, 25_000);

    this.clients.set(id, { id, userId, role, res, heartbeatTimer });

    this.sendToClient(res, 'connected', {
      clientId: id,
      connectedAt: new Date().toISOString()
    });

    logger.info('SSE client connected', { clientId: id, userId, totalClients: this.clients.size });
  }

  removeClient(id: string): void {
    const client = this.clients.get(id);
    if (!client) return;
    clearInterval(client.heartbeatTimer);
    this.clients.delete(id);
    logger.info('SSE client disconnected', { clientId: id, totalClients: this.clients.size });
  }

  publish(event: SSEEventType, data: unknown): void {
    if (this.clients.size === 0) return;
    for (const [id, client] of this.clients.entries()) {
      if (client.res.writableEnded) {
        this.removeClient(id);
        continue;
      }
      try {
        this.sendToClient(client.res, event, data);
      } catch {
        this.removeClient(id);
      }
    }
  }

  getClientCount(): number {
    return this.clients.size;
  }

  closeAll(): void {
    for (const [id, client] of this.clients.entries()) {
      clearInterval(client.heartbeatTimer);
      if (!client.res.writableEnded) {
        client.res.end();
      }
      this.clients.delete(id);
    }
  }

  private sendToClient(res: Response, event: SSEEventType, data: unknown): void {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }
}

export const sseHub = new SSEHub();
