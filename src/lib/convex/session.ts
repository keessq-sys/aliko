import type { ConvexClient } from "convex/browser";

let pending: Promise<string | null> | undefined;
export function fetchSessionToken({
  forceRefreshToken,
}: {
  forceRefreshToken: boolean;
}) {
  if (!pending) {
    pending = fetch(
      `/api/auth/session${forceRefreshToken ? "?refresh=1" : ""}`,
      { cache: "no-store" },
    )
      .then(async (response) => {
        if (!response.ok)
          throw new Error(
            "Your session could not be verified. Please try again.",
          );
        return (await response.json()).token as string | null;
      })
      .finally(() => {
        pending = undefined;
      });
  }
  return pending;
}
export async function synchronizeSession(client: ConvexClient): Promise<void> {
  // Finish any anonymous lookup started before the sign-in cookies arrived.
  // The following setAuth must fetch the newly established session.
  await pending?.catch(() => {});
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () =>
        reject(
          new Error("Could not connect your account. Please retry signing in."),
        ),
      15000,
    );
    client.setAuth(fetchSessionToken, (authenticated) => {
      clearTimeout(timeout);
      if (authenticated) resolve();
      else reject(new Error("Your session has expired. Please sign in again."));
    });
  });
}
