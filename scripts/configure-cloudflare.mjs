const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const token = process.env.CLOUDFLARE_API_TOKEN;
const bucketName = process.env.R2_BUCKET_NAME || "aliko-diamond-key-media";
const previewBucketName =
  process.env.R2_PREVIEW_BUCKET_NAME || `${bucketName}-preview`;
const requestedProject = process.env.CLOUDFLARE_PAGES_PROJECT || "aliko";

if (!accountId || !token) {
  console.error(
    "Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN before running this command.",
  );
  process.exit(1);
}

const base = "https://api.cloudflare.com/client/v4";
const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};

async function cf(path, init = {}) {
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: { ...headers, ...(init.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.success === false) {
    const details =
      body.errors?.map((entry) => entry.message).join("; ") ||
      `${response.status} ${response.statusText}`;
    throw new Error(`${path}: ${details}`);
  }
  return body.result;
}

async function ensureBucket(name = bucketName) {
  const buckets = await cf(`/accounts/${accountId}/r2/buckets`);
  if (buckets?.buckets?.some((bucket) => bucket.name === name)) return;
  await cf(`/accounts/${accountId}/r2/buckets`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  console.log(`Created R2 bucket ${name}.`);
}

async function ensureLifecyclePolicy() {
  const path = `/accounts/${accountId}/r2/buckets/${encodeURIComponent(bucketName)}/lifecycle`;
  const current = await cf(path).catch(() => ({ rules: [] }));
  const managed = new Map([
    [
      "adk-temporary-uploads",
      {
        id: "adk-temporary-uploads",
        enabled: true,
        conditions: { prefix: "temp/" },
        deleteObjectsTransition: { condition: { type: "Age", maxAge: 86400 } },
      },
    ],
    [
      "adk-quarantine-retention",
      {
        id: "adk-quarantine-retention",
        enabled: true,
        conditions: { prefix: "quarantine/" },
        deleteObjectsTransition: {
          condition: { type: "Age", maxAge: 2592000 },
        },
      },
    ],
    [
      "adk-abandoned-multipart",
      {
        id: "adk-abandoned-multipart",
        enabled: true,
        conditions: { prefix: "" },
        abortMultipartUploadsTransition: {
          condition: { type: "Age", maxAge: 86400 },
        },
      },
    ],
  ]);
  const rules = (current?.rules || []).filter((rule) => !managed.has(rule.id));
  rules.push(...managed.values());
  await cf(path, { method: "PUT", body: JSON.stringify({ rules }) });
  console.log(`Configured R2 lifecycle rules for ${bucketName}.`);
}

async function bindPagesProject() {
  const projects = await cf(`/accounts/${accountId}/pages/projects`);
  const project =
    projects.find((entry) => entry.name === requestedProject) ||
    projects.find((entry) => entry.name.includes("aliko"));
  if (!project)
    throw new Error(
      `Cloudflare Pages project “${requestedProject}” was not found.`,
    );
  const production = project.deployment_configs?.production ?? {};
  const preview = project.deployment_configs?.preview ?? {};
  await cf(`/accounts/${accountId}/pages/projects/${project.name}`, {
    method: "PATCH",
    body: JSON.stringify({
      deployment_configs: {
        production: {
          r2_buckets: { ...production.r2_buckets, MEDIA: { name: bucketName } },
          env_vars: {
            ...production.env_vars,
            PUBLIC_CONVEX_URL: {
              type: "plain_text",
              value: "https://gallant-husky-352.eu-west-1.convex.cloud",
            },
            CONVEX_HTTP_ACTIONS_URL: {
              type: "plain_text",
              value: "https://gallant-husky-352.eu-west-1.convex.site",
            },
          },
        },
        preview: {
          r2_buckets: {
            ...preview.r2_buckets,
            MEDIA: { name: previewBucketName },
          },
          env_vars: {
            ...preview.env_vars,
            PUBLIC_CONVEX_URL: {
              type: "plain_text",
              value:
                process.env.CONVEX_STAGING_URL ||
                "https://gallant-husky-352.eu-west-1.convex.cloud",
            },
            CONVEX_HTTP_ACTIONS_URL: {
              type: "plain_text",
              value:
                process.env.CONVEX_STAGING_HTTP_URL ||
                "https://gallant-husky-352.eu-west-1.convex.site",
            },
          },
        },
      },
    }),
  });
  console.log(
    `Configured separate production and preview MEDIA buckets on ${project.name}.`,
  );
}

async function ensureZoneRules(zone) {
  const customPhase = "http_request_firewall_custom";
  let custom;
  try {
    custom = await cf(
      `/zones/${zone.id}/rulesets/phases/${customPhase}/entrypoint`,
    );
  } catch {
    custom = null;
  }
  const customDescription = "[ADK] Block sensitive path probes";
  if (!custom?.rules?.some((rule) => rule.description === customDescription)) {
    const endpoint = custom
      ? `/zones/${zone.id}/rulesets/${custom.id}/rules`
      : `/zones/${zone.id}/rulesets`;
    const body = custom
      ? {
          action: "block",
          description: customDescription,
          enabled: true,
          expression:
            '(http.request.uri.path contains "/.env") or (http.request.uri.path contains "/.git") or (http.request.uri.path contains "/wp-admin") or (http.request.uri.path contains "/xmlrpc.php")',
        }
      : {
          name: "Aliko Diamond Key security rules",
          kind: "zone",
          phase: customPhase,
          rules: [
            {
              action: "block",
              description: customDescription,
              enabled: true,
              expression:
                '(http.request.uri.path contains "/.env") or (http.request.uri.path contains "/.git") or (http.request.uri.path contains "/wp-admin") or (http.request.uri.path contains "/xmlrpc.php")',
            },
          ],
        };
    await cf(endpoint, { method: "POST", body: JSON.stringify(body) });
  }

  const ratePhase = "http_ratelimit";
  // HTML challenges cannot be answered by JSON fetches or module/image requests. Keep rate
  // limiting and WAF inspection; skip only legacy interactive challenge products.
  const apiDescription = "[ADK] Keep JSON APIs free of HTML challenges";
  const refreshedCustom = await cf(
    `/zones/${zone.id}/rulesets/phases/${customPhase}/entrypoint`,
  );
  const existingApiRule = refreshedCustom.rules?.find(
    (rule) => rule.description === apiDescription,
  );
  await cf(
    `/zones/${zone.id}/rulesets/${refreshedCustom.id}/rules${existingApiRule ? `/${existingApiRule.id}` : ""}`,
    {
      method: existingApiRule ? "PATCH" : "POST",
      body: JSON.stringify({
        description: apiDescription,
        action: "skip",
        enabled: true,
        expression:
          'starts_with(http.request.uri.path, "/api/") or (http.request.uri.path in {"/auth" "/admin" "/admin-login"}) or starts_with(http.request.uri.path, "/auth/") or starts_with(http.request.uri.path, "/admin/") or starts_with(http.request.uri.path, "/dashboard/") or starts_with(http.request.uri.path, "/checkout/") or ((http.request.method in {"GET" "HEAD"}) and (starts_with(http.request.uri.path, "/_app/") or starts_with(http.request.uri.path, "/images/") or starts_with(http.request.uri.path, "/fonts/") or starts_with(http.request.uri.path, "/icons/") or starts_with(http.request.uri.path, "/og/") or starts_with(http.request.uri.path, "/Frontend UI Images/") or starts_with(http.request.uri.path, "/Frontend%20UI%20Images/") or http.request.uri.path in {"/adk-logo.png" "/logo.png" "/favicon.svg" "/apple-touch-icon.png" "/sw.js" "/favicon.png" "/favicon.ico" "/manifest.webmanifest" "/service-worker.js"}))',
        action_parameters: { products: ["securityLevel", "bic"] },
        logging: { enabled: true },
      }),
    },
  );
  let rate;
  try {
    rate = await cf(
      `/zones/${zone.id}/rulesets/phases/${ratePhase}/entrypoint`,
    );
  } catch {
    rate = null;
  }
  const rateDescription = "[ADK] Rate limit authentication and uploads";
  if (!rate?.rules?.some((rule) => rule.description === rateDescription)) {
    const rule = {
      action: "block",
      description: rateDescription,
      enabled: true,
      expression:
        '(http.request.method in {"POST" "PUT" "PATCH"}) and ((http.request.uri.path in {"/login" "/register" "/api/auth/session" "/api/media/upload"}) or starts_with(http.request.uri.path, "/auth/"))',
      ratelimit: {
        characteristics: ["cf.colo.id", "ip.src"],
        period: 10,
        requests_per_period: 10,
        mitigation_timeout: 10,
      },
    };
    const endpoint = rate
      ? `/zones/${zone.id}/rulesets/${rate.id}/rules`
      : `/zones/${zone.id}/rulesets`;
    const body = rate
      ? rule
      : {
          name: "Aliko Diamond Key rate limits",
          kind: "zone",
          phase: ratePhase,
          rules: [rule],
        };
    await cf(endpoint, { method: "POST", body: JSON.stringify(body) });
  }
  const currentRule = rate?.rules?.find(
    (rule) => rule.description === rateDescription,
  );
  if (currentRule)
    await cf(`/zones/${zone.id}/rulesets/${rate.id}/rules/${currentRule.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        action: "block",
        description: rateDescription,
        enabled: true,
        expression:
          '(http.request.method in {"POST" "PUT" "PATCH"}) and ((http.request.uri.path in {"/login" "/register" "/api/auth/session" "/api/media/upload"}) or starts_with(http.request.uri.path, "/auth/"))',
        ratelimit: {
          characteristics: ["cf.colo.id", "ip.src"],
          period: 10,
          requests_per_period: 10,
          mitigation_timeout: 10,
        },
      }),
    });
  console.log(`Configured WAF protection for ${zone.name}.`);
}

async function main() {
  // Account-owned tokens use the account-scoped verifier. New Cloudflare
  // account tokens carry the cfat_ prefix and are rejected by /user/tokens.
  await cf(`/accounts/${accountId}/tokens/verify`);
  console.log("Cloudflare API token verified.");
  const failures = [];
  try {
    await ensureBucket();
    await ensureBucket(previewBucketName);
    await ensureLifecyclePolicy();
    await bindPagesProject();
  } catch (error) {
    failures.push(`R2/Pages: ${error.message}`);
  }
  try {
    const zones = await cf(
      `/zones?account.id=${accountId}&status=active&per_page=50`,
    );
    if (!zones.length)
      console.warn(
        "No active zone was found; WAF rules require a domain in this account.",
      );
    for (const zone of zones) await ensureZoneRules(zone);
  } catch (error) {
    failures.push(`WAF: ${error.message}`);
  }
  if (failures.length) throw new Error(failures.join("\n"));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
