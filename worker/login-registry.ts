import { DurableObject } from "cloudflare:workers";

export type LoginSessionInput = {
  id: string;
  email: string;
  userId: string;
  name: string;
  loginAt: number;
  seenAt: number;
  ip: string;
  country: string;
  provider: string;
};

export type LoginSession = LoginSessionInput & {
  firstSeenAt: number;
  lastSeenAt: number;
};

type LoginSessionRow = {
  id: string;
  email: string;
  user_id: string;
  name: string;
  login_at: number;
  first_seen_at: number;
  last_seen_at: number;
  ip: string;
  country: string;
  provider: string;
};

export class LoginRegistry extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS login_sessions (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          login_at INTEGER NOT NULL,
          first_seen_at INTEGER NOT NULL,
          last_seen_at INTEGER NOT NULL,
          ip TEXT NOT NULL,
          country TEXT NOT NULL,
          provider TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS login_sessions_email_idx
          ON login_sessions (email);
        CREATE INDEX IF NOT EXISTS login_sessions_login_at_idx
          ON login_sessions (login_at DESC);
      `);
    });
  }

  async record(input: LoginSessionInput): Promise<void> {
    this.ctx.storage.sql.exec(
      `INSERT INTO login_sessions (
        id, email, user_id, name, login_at, first_seen_at, last_seen_at, ip, country, provider
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        last_seen_at = excluded.last_seen_at,
        name = excluded.name,
        ip = excluded.ip,
        country = excluded.country,
        provider = excluded.provider`,
      input.id,
      input.email,
      input.userId,
      input.name,
      input.loginAt,
      input.seenAt,
      input.seenAt,
      input.ip,
      input.country,
      input.provider,
    );
  }

  async listSessions(limit = 1000): Promise<LoginSession[]> {
    const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 2000);
    return this.ctx.storage.sql
      .exec<LoginSessionRow>(
        `SELECT id, email, user_id, name, login_at, first_seen_at, last_seen_at,
          ip, country, provider
        FROM login_sessions
        ORDER BY login_at DESC
        LIMIT ?`,
        safeLimit,
      )
      .toArray()
      .map((row) => ({
        id: row.id,
        email: row.email,
        userId: row.user_id,
        name: row.name,
        loginAt: row.login_at,
        seenAt: row.last_seen_at,
        firstSeenAt: row.first_seen_at,
        lastSeenAt: row.last_seen_at,
        ip: row.ip,
        country: row.country,
        provider: row.provider,
      }));
  }
}
