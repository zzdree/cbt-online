import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { D1Database } from '@cloudflare/workers-types';

export interface PreparedStatement {
  get<T = any>(...params: any[]): Promise<T | null>;
  all<T = any>(...params: any[]): Promise<T[]>;
  run(...params: any[]): Promise<{ success: boolean; changes?: number }>;
}

export interface UniversalDb {
  prepare(sql: string): PreparedStatement;
  exec(sql: string): Promise<void>;
  isD1: boolean;
}

// Cached local node:sqlite instance
let _nodeDb: any = null;

// Plain Node (`next dev` / `next start`) defines no Worker globals, while
// workerd always provides WebSocketPair. Use that as the discriminator so a
// local run never binds to the empty dev D1 emulator.
function isWorkerRuntime(): boolean {
  return typeof (globalThis as Record<string, unknown>).WebSocketPair !== 'undefined';
}

async function getD1Database(): Promise<D1Database | null> {
  if (!isWorkerRuntime()) {
    return null;
  }

  try {
    const ctx = await getCloudflareContext({ async: true });
    if (ctx?.env && (ctx.env as Record<string, unknown>).DB) {
      return (ctx.env as unknown as { DB: D1Database }).DB;
    }
  } catch {
    // getCloudflareContext throws if called outside cloudflare worker request context
  }

  const globalEnv = (globalThis as { env?: { DB?: D1Database } }).env;
  if (globalEnv?.DB) {
    return globalEnv.DB;
  }

  return null;
}

function getNodeDb() {
  if (!_nodeDb) {
    const { DatabaseSync } = require('node:sqlite');
    const path = require('node:path');
    const dbPath = path.join(process.cwd(), 'cbt.db');
    _nodeDb = new DatabaseSync(dbPath);
    _nodeDb.exec('PRAGMA foreign_keys = ON;');
  }
  return _nodeDb;
}

export async function getDb(): Promise<UniversalDb> {
  const d1 = await getD1Database();

  if (d1) {
    return {
      isD1: true,
      prepare(sql: string): PreparedStatement {
        return {
          async get<T = any>(...params: any[]): Promise<T | null> {
            const stmt = params.length > 0 ? d1.prepare(sql).bind(...params) : d1.prepare(sql);
            const res = await stmt.first<T>();
            return (res as T) ?? null;
          },
          async all<T = any>(...params: any[]): Promise<T[]> {
            const stmt = params.length > 0 ? d1.prepare(sql).bind(...params) : d1.prepare(sql);
            const res = await stmt.all<T>();
            return (res.results as T[]) || [];
          },
          async run(...params: any[]): Promise<{ success: boolean; changes?: number }> {
            const stmt = params.length > 0 ? d1.prepare(sql).bind(...params) : d1.prepare(sql);
            const res = await stmt.run();
            return { success: res.success, changes: (res.meta as any)?.changes };
          },
        };
      },
      async exec(sql: string): Promise<void> {
        await d1.exec(sql);
      },
    };
  }

  // Fallback to local node:sqlite
  const nodeDb = getNodeDb();
  return {
    isD1: false,
    prepare(sql: string): PreparedStatement {
      const stmt = nodeDb.prepare(sql);
      return {
        async get<T = any>(...params: any[]): Promise<T | null> {
          const res = stmt.get(...params);
          return (res as T) ?? null;
        },
        async all<T = any>(...params: any[]): Promise<T[]> {
          const res = stmt.all(...params);
          return (res as T[]) || [];
        },
        async run(...params: any[]): Promise<{ success: boolean; changes?: number }> {
          const res = stmt.run(...params);
          return { success: true, changes: res?.changes };
        },
      };
    },
    async exec(sql: string): Promise<void> {
      nodeDb.exec(sql);
    },
  };
}
