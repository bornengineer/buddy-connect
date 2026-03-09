import type { Response } from "express";

type ClientMap = Map<number, Set<Response>>;

const clients: ClientMap = new Map();

export function registerSseClient(userId: number, res: Response) {
  const existing = clients.get(userId) ?? new Set<Response>();
  existing.add(res);
  clients.set(userId, existing);

  res.write(`event: connected\ndata: ${JSON.stringify({ ok: true })}\n\n`);

  return () => {
    const userClients = clients.get(userId);
    if (!userClients) {
      return;
    }
    userClients.delete(res);
    if (userClients.size === 0) {
      clients.delete(userId);
    }
  };
}

export function pushToUser(userId: number, event: string, payload: unknown) {
  const userClients = clients.get(userId);
  if (!userClients) {
    return;
  }

  const chunk = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of userClients) {
    res.write(chunk);
  }
}
