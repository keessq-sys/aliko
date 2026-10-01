export interface Env {
  MEDIA_MAINTENANCE_SECRET: string;
  MAINTENANCE_URL: string;
}

async function run(env: Env) {
  for (let page = 0; page < 10; page++) {
    const response = await fetch(env.MAINTENANCE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.MEDIA_MAINTENANCE_SECRET}`,
        "User-Agent": "adk-media-maintenance/1.0",
      },
    });
    if (!response.ok)
      throw new Error(`Media maintenance returned HTTP ${response.status}`);
    const result = await response.json<{
      inspected: number;
      deleted: number;
      more: boolean;
    }>();
    console.log(JSON.stringify({ event: "media_maintenance", ...result }));
    if (!result.more) break;
  }
}

export default {
  async scheduled(
    _controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ) {
    ctx.waitUntil(run(env));
  },
  async fetch() {
    return new Response("Not found", { status: 404 });
  },
};
