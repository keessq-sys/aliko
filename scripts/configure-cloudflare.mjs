const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const token = process.env.CLOUDFLARE_API_TOKEN;
const bucketName = process.env.R2_BUCKET_NAME || 'aliko-diamond-key-media';
const requestedProject = process.env.CLOUDFLARE_PAGES_PROJECT || 'aliko';

if (!accountId || !token) {
  console.error('Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN before running this command.');
  process.exit(1);
}

const base = 'https://api.cloudflare.com/client/v4';
const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

async function cf(path, init = {}) {
  const response = await fetch(`${base}${path}`, { ...init, headers: { ...headers, ...(init.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.success === false) {
    const details = body.errors?.map((entry) => entry.message).join('; ') || `${response.status} ${response.statusText}`;
    throw new Error(`${path}: ${details}`);
  }
  return body.result;
}

async function ensureBucket() {
  const buckets = await cf(`/accounts/${accountId}/r2/buckets`);
  if (buckets?.buckets?.some((bucket) => bucket.name === bucketName)) return;
  await cf(`/accounts/${accountId}/r2/buckets`, { method: 'POST', body: JSON.stringify({ name: bucketName }) });
  console.log(`Created R2 bucket ${bucketName}.`);
}

async function bindPagesProject() {
  const projects = await cf(`/accounts/${accountId}/pages/projects`);
  const project = projects.find((entry) => entry.name === requestedProject) || projects.find((entry) => entry.name.includes('aliko'));
  if (!project) throw new Error(`Cloudflare Pages project “${requestedProject}” was not found.`);
  const bind = { MEDIA: { name: bucketName } };
  await cf(`/accounts/${accountId}/pages/projects/${project.name}`, {
    method: 'PATCH',
    body: JSON.stringify({ deployment_configs: { production: { r2_buckets: bind }, preview: { r2_buckets: bind } } }),
  });
  console.log(`Bound ${bucketName} as MEDIA on ${project.name} production and preview deployments.`);
}

async function ensureZoneRules(zone) {
  const customPhase = 'http_request_firewall_custom';
  let custom;
  try { custom = await cf(`/zones/${zone.id}/rulesets/phases/${customPhase}/entrypoint`); } catch { custom = null; }
  const customDescription = '[ADK] Block sensitive path probes';
  if (!custom?.rules?.some((rule) => rule.description === customDescription)) {
    const endpoint = custom ? `/zones/${zone.id}/rulesets/${custom.id}/rules` : `/zones/${zone.id}/rulesets`;
    const body = custom ? {
      action: 'block', description: customDescription, enabled: true,
      expression: '(http.request.uri.path contains "/.env") or (http.request.uri.path contains "/.git") or (http.request.uri.path contains "/wp-admin") or (http.request.uri.path contains "/xmlrpc.php")',
    } : {
      name: 'Aliko Diamond Key security rules', kind: 'zone', phase: customPhase,
      rules: [{ action: 'block', description: customDescription, enabled: true, expression: '(http.request.uri.path contains "/.env") or (http.request.uri.path contains "/.git") or (http.request.uri.path contains "/wp-admin") or (http.request.uri.path contains "/xmlrpc.php")' }],
    };
    await cf(endpoint, { method: 'POST', body: JSON.stringify(body) });
  }

  const ratePhase = 'http_ratelimit';
  let rate;
  try { rate = await cf(`/zones/${zone.id}/rulesets/phases/${ratePhase}/entrypoint`); } catch { rate = null; }
  const rateDescription = '[ADK] Rate limit authentication and uploads';
  if (!rate?.rules?.some((rule) => rule.description === rateDescription)) {
    const rule = {
      action: 'block', description: rateDescription, enabled: true,
      expression: '(http.request.uri.path in {"/login" "/register" "/api/media/upload"}) or starts_with(http.request.uri.path, "/auth/")',
      ratelimit: { characteristics: ['cf.colo.id', 'ip.src'], period: 10, requests_per_period: 10, mitigation_timeout: 10 },
    };
    const endpoint = rate ? `/zones/${zone.id}/rulesets/${rate.id}/rules` : `/zones/${zone.id}/rulesets`;
    const body = rate ? rule : { name: 'Aliko Diamond Key rate limits', kind: 'zone', phase: ratePhase, rules: [rule] };
    await cf(endpoint, { method: 'POST', body: JSON.stringify(body) });
  }
  console.log(`Configured WAF protection for ${zone.name}.`);
}

async function main() {
  // Account-owned tokens use the account-scoped verifier. New Cloudflare
  // account tokens carry the cfat_ prefix and are rejected by /user/tokens.
  await cf(`/accounts/${accountId}/tokens/verify`);
  console.log('Cloudflare API token verified.');
  const failures = [];
  try {
    await ensureBucket();
    await bindPagesProject();
  } catch (error) {
    failures.push(`R2/Pages: ${error.message}`);
  }
  try {
    const zones = await cf(`/zones?account.id=${accountId}&status=active&per_page=50`);
    if (!zones.length) console.warn('No active zone was found; WAF rules require a domain in this account.');
    for (const zone of zones) await ensureZoneRules(zone);
  } catch (error) {
    failures.push(`WAF: ${error.message}`);
  }
  if (failures.length) throw new Error(failures.join('\n'));
}

main().catch((error) => { console.error(error.message); process.exit(1); });
