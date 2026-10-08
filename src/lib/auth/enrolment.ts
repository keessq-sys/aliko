import { getConvexClient } from "convex-svelte";
import { synchronizeSession, fetchSessionToken } from "$lib/convex/session";
export async function completeEnrolment(payload: unknown) {
  const submit = async () => {
    const response = await fetch("/api/auth/enrolment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (result.accountReady) {
      const client = getConvexClient();
      client.setAuth(fetchSessionToken);
      void synchronizeSession(client).catch(() => {});
      localStorage.setItem("adk-session-changed", String(Date.now()));
    }
    return { ...result, ok: response.ok };
  };
  return navigator.locks
    ? navigator.locks.request("adk-account-session", submit)
    : submit();
}
