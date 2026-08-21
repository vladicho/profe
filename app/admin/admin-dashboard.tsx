"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type AdminUser = {
  email: string;
  name: string;
  userId: string;
  loginCount: number;
  firstLoginAt: number;
  lastLoginAt: number;
  lastSeenAt: number;
  country: string;
  ip: string;
  provider: string;
};

type LoginSession = {
  id: string;
  email: string;
  name: string;
  loginAt: number;
  country: string;
  ip: string;
  provider: string;
};

type DashboardData = {
  ok: boolean;
  currentUser: { email: string; name: string };
  totals: { users: number; logins: number; loginsToday: number };
  users: AdminUser[];
  recent: LoginSession[];
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

function formatDate(epochSeconds: number) {
  return epochSeconds ? dateFormatter.format(new Date(epochSeconds * 1000)) : "—";
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/logins", { cache: "no-store", credentials: "same-origin" });
      const payload = await response.json() as DashboardData & { error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Não foi possível carregar os acessos.");
      setData(payload);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível carregar os acessos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const users = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return data?.users || [];
    return (data?.users || []).filter((user) =>
      `${user.name} ${user.email} ${user.country}`.toLowerCase().includes(normalized),
    );
  }, [data, query]);

  return (
    <main className="admin-page">
      <header className="admin-topbar">
        <Link className="admin-brand" href="/" aria-label="Voltar ao Profe">
          <span className="admin-brand-mark">P</span>
          <span><strong>Profe</strong><small>Painel de acessos</small></span>
        </Link>
        <div className="admin-top-actions">
          {data?.currentUser && <span className="admin-current-user">{data.currentUser.email}</span>}
          <button className="admin-refresh" type="button" onClick={() => void load()} disabled={loading}>
            {loading ? "Atualizando…" : "Atualizar"}
          </button>
          <Link className="admin-open-site" href="/">Abrir Profe</Link>
        </div>
      </header>

      <section className="admin-content">
        <div className="admin-heading">
          <div>
            <p className="admin-eyebrow">CLOUDFLARE ACCESS · GOOGLE</p>
            <h1>Quem entrou no Profe</h1>
            <p>Histórico próprio das sessões autenticadas, organizado pelo horário de Brasília.</p>
          </div>
        </div>

        {error && <div className="admin-error" role="alert">{error}</div>}

        <section className="admin-stats" aria-label="Resumo dos acessos">
          <article><span>Usuários</span><strong>{data?.totals.users ?? "—"}</strong><small>contas diferentes</small></article>
          <article><span>Logins</span><strong>{data?.totals.logins ?? "—"}</strong><small>últimos 12 meses</small></article>
          <article><span>Últimas 24 h</span><strong>{data?.totals.loginsToday ?? "—"}</strong><small>novas sessões</small></article>
        </section>

        <section className="admin-card">
          <div className="admin-card-title">
            <div><h2>Usuários</h2><p>Uma ficha por conta Google.</p></div>
            <label className="admin-search">
              <span className="sr-only">Buscar usuário</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar nome ou e-mail" />
            </label>
          </div>

          <div className="admin-user-list">
            {loading && !data && <p className="admin-empty">Carregando acessos…</p>}
            {!loading && users.length === 0 && <p className="admin-empty">Nenhum usuário encontrado.</p>}
            {users.map((user) => (
              <article className="admin-user" key={user.email}>
                <div className="admin-avatar" aria-hidden="true">{user.name.charAt(0).toUpperCase()}</div>
                <div className="admin-user-main">
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                  <small>{user.provider === "google" ? "Google" : user.provider} · {user.country || "País não informado"}</small>
                </div>
                <div className="admin-user-metric"><strong>{user.loginCount}</strong><span>{user.loginCount === 1 ? "login" : "logins"}</span></div>
                <div className="admin-user-date"><span>Último login</span><strong>{formatDate(user.lastLoginAt)}</strong><small>Primeiro: {formatDate(user.firstLoginAt)}</small></div>
              </article>
            ))}
          </div>
        </section>

        <section className="admin-card">
          <div className="admin-card-title"><div><h2>Logins recentes</h2><p>Cada linha representa uma nova sessão do Access.</p></div></div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Usuário</th><th>Data e hora</th><th>Local</th><th>IP</th></tr></thead>
              <tbody>
                {(data?.recent || []).map((session) => (
                  <tr key={session.id}>
                    <td><strong>{session.name}</strong><span>{session.email}</span></td>
                    <td>{formatDate(session.loginAt)}</td>
                    <td>{session.country || "—"}</td>
                    <td className="admin-mono">{session.ip || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && data?.recent.length === 0 && <p className="admin-empty">Os próximos logins aparecerão aqui.</p>}
        </section>

        <p className="admin-privacy">Este painel é visível somente para a conta administradora. Não compartilhe capturas que exibam endereços IP.</p>
      </section>
    </main>
  );
}
