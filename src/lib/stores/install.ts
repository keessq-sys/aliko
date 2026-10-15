import { writable } from "svelte/store";
export const installPrompt = writable<any>(null);
export const appInstalled = writable(false);
export function initialiseInstallation() {
  appInstalled.set(
    matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true,
  );
  const capture = (event: Event) => {
    event.preventDefault();
    installPrompt.set(event);
  };
  const done = () => {
    appInstalled.set(true);
    installPrompt.set(null);
  };
  window.addEventListener("beforeinstallprompt", capture);
  window.addEventListener("appinstalled", done);
  if ("serviceWorker" in navigator && window.isSecureContext)
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
  return () => {
    window.removeEventListener("beforeinstallprompt", capture);
    window.removeEventListener("appinstalled", done);
  };
}
