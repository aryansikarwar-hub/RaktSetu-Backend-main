import WebSocket, { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { repo } from './repository.js';
import { logger } from '../utils/logger.js';

// Simple in-memory map of connected sockets by userId
const clients = new Map(); // userId -> ws

export function initRealtime(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', async (ws, req) => {
    let userId = null;
    try {
      // prefer JWT sent over Sec-WebSocket-Protocol (subprotocol) for security
      const headerToken = req.headers['sec-websocket-protocol'];
      if (headerToken) {
        try {
          const decoded = jwt.verify(String(headerToken), env.JWT_SECRET);
          userId = decoded.id;
        } catch (_) {
          userId = null;
        }
      }
      // fallback to query token (legacy)
      if (!userId) {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const token = url.searchParams.get('token');
        if (token) {
          try { const decoded = jwt.verify(token, env.JWT_SECRET); userId = decoded.id; } catch (_) { userId = null; }
        }
        // fallback to userId query (legacy)
        if (!userId) userId = url.searchParams.get('userId');
      }

      if (userId) {
        // ensure user exists
        const u = await repo.findUserById(userId);
        if (u) {
          clients.set(String(userId), ws);
          logger.info(`Realtime: user connected ${userId}`);
        } else {
          // unknown user — allow but do not register
          logger.info(`Realtime: unknown user attempted WS ${userId}`);
        }
      }

      ws.on('message', (msg) => {
        // keep-alive or client messages ignored for now
      });

      ws.on('close', () => {
        if (userId && clients.get(String(userId)) === ws) {
          clients.delete(String(userId));
          logger.info(`Realtime: user disconnected ${userId}`);
        }
      });
    } catch (err) {
      logger.error('Realtime connection error: ' + err.message);
    }
  });

  wss.on('listening', () => logger.info('Realtime WebSocket server listening'));
}

export async function sendNotificationToUser(userId, notification) {
  try {
    const ws = clients.get(String(userId));
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'notification', payload: notification }));
      return true;
    }
  } catch (err) {
    logger.error('Failed to send realtime notification: ' + err.message);
  }
  return false;
}

export function getConnectedCount() {
  return clients.size;
}

export default { initRealtime, sendNotificationToUser, getConnectedCount };
