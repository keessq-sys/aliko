<script lang="ts">
  import { api } from "$lib/convex/_generated/api";
  import { useQuery, runMutation } from "$lib/convex/queries";
  import { getTranslation } from "$lib/i18n";
  const adkT = getTranslation();
  let cursor: string | null = null,
    error = "",
    notice = "",
    busy = false,
    email = false,
    device = false,
    broadcasts = false,
    seeded = false;
  const channels = useQuery(
    api.engagement.channelActivity,
    {},
    () =>
      (error = "Delivery records could not be loaded. Please try again later."),
  );
  const prefs = useQuery(
    api.engagement.preferences,
    {},
    () => (error = "Preferences could not be loaded. Please try again later."),
  );
  $: inbox = useQuery(
    api.engagement.inbox,
    {
      paginationOpts: { cursor, numItems: 30 },
    },
    () =>
      (error = "Notifications could not be loaded. Please try again later."),
  );
  $: if ($prefs && !seeded) {
    email = $prefs.email;
    device = $prefs.device;
    broadcasts = $prefs.broadcasts;
    seeded = true;
  }
  async function save() {
    busy = true;
    error = "";
    notice = "";
    try {
      await runMutation(api.engagement.savePreferences, {
        email,
        device,
        broadcasts,
      });
      notice = "Notification preferences saved.";
    } catch {
      error = "Preferences could not be saved. Please retry.";
    } finally {
      busy = false;
    }
  }
  async function enableDevice() {
    busy = true;
    error = "";
    try {
      if (!$prefs?.pushConfigured || !$prefs.vapidPublicKey)
        throw new Error("Device alerts are not configured yet.");
      if (
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      )
        throw new Error(
          "This browser does not support device alerts. On iPhone, install the app first.",
        );
      const permission = await Notification.requestPermission();
      if (permission !== "granted")
        throw new Error(
          "Device permission was not granted. You can change it in browser settings.",
        );
      await navigator.serviceWorker.register("/sw.js");
      const registration = await navigator.serviceWorker.ready;
      const key = $prefs.vapidPublicKey;
      const bytes = Uint8Array.from(
        atob(
          key.replace(/-/g, "+").replace(/_/g, "/") +
            "=".repeat((4 - (key.length % 4)) % 4),
        ),
        (c) => c.charCodeAt(0),
      );
      const sub =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: bytes,
        }));
      const payload = sub.toJSON();
      await runMutation(api.engagement.subscribe, {
        endpoint: sub.endpoint,
        p256dh: payload.keys!.p256dh,
        auth: payload.keys!.auth,
      });
      device = true;
      await runMutation(api.engagement.savePreferences, {
        email,
        device: true,
        broadcasts,
      });
      notice = "Device registered. Use Send test alert to check delivery.";
    } catch (e) {
      error = e instanceof Error ? e.message : "Device registration failed";
    } finally {
      busy = false;
    }
  }
  async function disableDevice() {
    busy = true;
    error = "";
    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.getRegistration("/");
        const sub = await registration?.pushManager.getSubscription();
        if (sub) {
          await runMutation(api.engagement.removeDevice, {
            endpoint: sub.endpoint,
          });
          await sub.unsubscribe();
        }
      }
      device = false;
      await runMutation(api.engagement.savePreferences, {
        email,
        device: false,
        broadcasts,
      });
      notice = "Device alerts disabled.";
    } catch {
      error = "Device alerts could not be disabled. Please retry.";
    } finally {
      busy = false;
    }
  }
  async function read(id: any) {
    try {
      await runMutation(api.engagement.markRead, { id });
    } catch {
      error = "Notification could not be marked as read.";
    }
  }
  async function readAll() {
    busy = true;
    try {
      await runMutation(api.engagement.markAllRead, {});
      notice = "Up to 100 unread alerts marked read. Repeat if more remain.";
    } catch {
      error = "Notifications could not be updated.";
    } finally {
      busy = false;
    }
  }
  async function test() {
    busy = true;
    error = "";
    try {
      await runMutation(api.engagement.testAlert, {});
      notice = "Test alert saved. External delivery runs asynchronously.";
    } catch {
      error = "Test alert could not be created. Please retry later.";
    } finally {
      busy = false;
    }
  }
</script>

<section class="notification-centre">
  <div class="workspace-overview-hero">
    <div>
      <div class="workspace-eyebrow">{$adkT("Your account")}</div>
      <h1>{$adkT("My notifications")}</h1>
      <p>
        {$adkT(
          "Private updates, conversations and activity, with control over how we contact you.",
        )}
      </p>
    </div>
    <span aria-hidden="true" class="workspace-empty-icon">🔔</span>
  </div>
  {#if error}<p role="alert" class="theme-form-error mb-4">
      {$adkT(error)}
    </p>{/if}{#if notice}<p role="status" class="theme-form-success mb-4">
      {$adkT(notice)}
    </p>{/if}
  <div class="notification-layout">
    <section class="workspace-panel">
      <div class="workspace-panel-heading">
        <h2>{$adkT("Inbox")}</h2>
        <button class="workspace-action" disabled={busy} on:click={readAll}
          >{$adkT("Mark all as read")}</button
        >
      </div>
      {#if $inbox === undefined}<div role="status" class="workspace-empty">
          {$adkT("Loading notifications…")}
        </div>{:else if !$inbox.page.length}<div class="workspace-empty">
          <span aria-hidden="true">✅</span>
          <h2>{$adkT("You’re all caught up")}</h2>
          <p>{$adkT("New private updates will appear here.")}</p>
        </div>{:else}<div>
          {#each $inbox.page as alert}<article
              class="alert-row"
              class:unread={!alert.readAt}
            >
              <div>
                <strong>{alert.title}</strong>
                <p>{alert.message}</p>
                <time datetime={new Date(alert.createdAt).toISOString()}
                  >{new Date(alert.createdAt).toLocaleString()}</time
                >
              </div>
              <div class="flex flex-wrap gap-2">
                <a
                  class="workspace-action"
                  href={alert.href}
                  on:click={() => read(alert._id)}>{$adkT("Open")}</a
                >{#if !alert.readAt}<button
                    type="button"
                    class="workspace-action"
                    on:click={() => read(alert._id)}
                    >{$adkT("Mark read")}</button
                  >{/if}
              </div>
            </article>{/each}
        </div>{/if}
      <div class="flex gap-3 p-4">
        <button
          class="workspace-action"
          disabled={!cursor}
          on:click={() => (cursor = null)}>{$adkT("Latest")}</button
        ><button
          class="workspace-action"
          disabled={!$inbox || $inbox.isDone}
          on:click={() => (cursor = $inbox?.continueCursor ?? null)}
          >{$adkT("Older updates")}</button
        >
      </div>
    </section>
    <section class="workspace-panel p-5 space-y-4">
      <h2>{$adkT("Alert preferences")}</h2>
      {#if !$prefs}<p role="status">{$adkT("Loading preferences…")}</p>{:else}<p
          class="workspace-description"
        >
          {$adkT(
            "In-app alerts are private. Email and device alerts are off until you opt in.",
          )}
        </p>
        <label class="flex gap-3 items-start"
          ><input type="checkbox" bind:checked={email} /><span
            >{$adkT("Email alerts")}<small class="block"
              >{$adkT(
                $prefs.emailConfigured
                  ? "Email channel configured"
                  : "Email channel awaiting configuration",
              )}</small
            ></span
          ></label
        ><label class="flex gap-3 items-start"
          ><input type="checkbox" bind:checked={broadcasts} /><span
            >{$adkT("Optional announcements by email or device")}</span
          ></label
        ><button
          class="workspace-action workspace-action-primary"
          disabled={busy}
          on:click={save}>{$adkT("Save preferences")}</button
        >
        <hr />
        <p>
          {$adkT(device ? "Device alerts enabled" : "Device alerts disabled")}
        </p>
        <button
          class="workspace-action"
          disabled={busy || !$prefs.pushConfigured}
          on:click={device ? disableDevice : enableDevice}
          >{$adkT(
            device ? "Disable device alerts" : "Enable device alerts",
          )}</button
        >{#if !$prefs.pushConfigured}<p class="workspace-description">
            {$adkT("Device alerts are not configured yet.")}
          </p>{/if}<button
          class="workspace-action"
          disabled={busy}
          on:click={test}>{$adkT("Send test alert")}</button
        >
        <p class="workspace-description">
          {$adkT(
            "Provider acceptance is recorded separately from delivery. Browser and operating-system settings can prevent device display.",
          )}
        </p>{/if}
    </section>
  </div>
  <section class="workspace-panel mt-6">
    <div class="workspace-panel-heading">
      <h2>{$adkT("Your channel activity")}</h2>
    </div>
    <div class="p-5 space-y-3">
      {#if $channels === undefined}<p role="status">
          {$adkT("Loading delivery records…")}
        </p>{:else if !$channels.length}<p class="workspace-description">
          {$adkT("No external delivery records yet.")}
        </p>{:else}{#each $channels as row}<div
            class="flex flex-wrap gap-3 justify-between"
          >
            <span>{row.channel} · {row.subject}</span><strong
              >{row.status}</strong
            >
          </div>{/each}{/if}
      <p class="workspace-description">
        {$adkT(
          "SENT means the provider accepted the notification. It does not confirm that you read it or that a device displayed it.",
        )}
      </p>
    </div>
  </section>
</section>

<style>
  .notification-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 320px;
    gap: 24px;
  }
  .alert-row {
    padding: 24px;
    border-bottom: 1px solid var(--workspace-line);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
  .alert-row > div:first-child {
    flex: 1;
    min-width: 200px;
  }
  .alert-row p {
    margin: 6px 0;
    color: var(--workspace-muted);
    overflow-wrap: anywhere;
  }
  .alert-row time {
    font-size: 12px;
    color: var(--workspace-muted);
  }
  .alert-row.unread {
    background: var(--workspace-tint);
  }
  small {
    font-size: 12px;
    color: var(--workspace-muted);
  }
  @media (max-width: 1100px) {
    .notification-layout {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  @media (max-width: 500px) {
    .alert-row {
      padding: 18px;
    }
  }
</style>
