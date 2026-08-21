/// <reference types="@cloudflare/workers-types" />

declare namespace Cloudflare {
  interface Env {
    ADMIN_EMAIL: string;
    ACCESS_TEAM_DOMAIN: string;
    ASSETS: Fetcher;
    DB: D1Database;
    IMAGES: ImagesBinding;
    LOGIN_REGISTRY: DurableObjectNamespace<import("./worker/login-registry").LoginRegistry>;
  }
}

type Env = Cloudflare.Env;
