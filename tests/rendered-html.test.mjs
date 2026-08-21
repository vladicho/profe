import assert from "node:assert/strict";
import { register } from "node:module";
import test from "node:test";

register(new URL("./workers-runtime-loader.mjs", import.meta.url));

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

test("renders development preview metadata", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  assert.match(await response.text(), developmentPreviewMeta);
});

test("authorizes the administrator through a hostname Access cookie", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `access-${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const originalFetch = globalThis.fetch;
  const backgroundTasks = [];
  let identityRequest;

  globalThis.fetch = async (input, init) => {
    identityRequest = { input: String(input), cookie: new Headers(init?.headers).get("cookie") };
    return Response.json({
      email: "vladi.acg@gmail.com",
      name: "Vladi",
      user_uuid: "admin-user",
      iat: 1787292000,
      ip: "203.0.113.10",
      geo: { country: "BR" },
      idp: { type: "google" },
    });
  };

  try {
    const response = await worker.fetch(
      new Request("http://localhost/admin", {
        headers: { accept: "text/html", cookie: "other=value; CF_Authorization=verified-token" },
      }),
      {
        ACCESS_TEAM_DOMAIN: "tight-meadow-4867.cloudflareaccess.com",
        ADMIN_EMAIL: "vladi.acg@gmail.com",
        LOGIN_REGISTRY: {
          getByName: () => ({ record: async () => undefined }),
        },
        ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
      },
      {
        waitUntil(promise) { backgroundTasks.push(promise); },
        passThroughOnException() {},
      },
    );

    await Promise.all(backgroundTasks);
    assert.equal(response.status, 200);
    assert.deepEqual(identityRequest, {
      input: "https://tight-meadow-4867.cloudflareaccess.com/cdn-cgi/access/get-identity",
      cookie: "CF_Authorization=verified-token",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
