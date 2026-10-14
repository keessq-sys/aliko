import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import {
  adminGroups,
  workspaceGroups,
  isWorkspaceActive,
} from "../../src/lib/navigation/workspace";
describe("canonical workspace navigation", () => {
  it("has no duplicate targets and retains every administrative route", () => {
    const items = workspaceGroups("ADMIN").flatMap((group) => group.items);
    expect(new Set(items.map((item) => item.href)).size).toBe(items.length);
    for (const item of adminGroups.flatMap((group) => group.items)) {
      expect(existsSync(`src/routes${item.href}/+page.svelte`)).toBe(true);
      expect(items.filter((link) => link.href === item.href)).toHaveLength(1);
    }
    expect(
      items.filter((item) => item.label === "Manage subscription"),
    ).toHaveLength(1);
  });
  it("keeps administrator routes out of client and professional menus", () => {
    for (const role of ["CLIENT", "AGENT", "ESTATE_MANAGER"]) {
      const items = workspaceGroups(role).flatMap((group) => group.items);
      expect(items.some((item) => item.href.startsWith("/admin"))).toBe(false);
      expect(new Set(items.map((item) => item.href)).size).toBe(items.length);
    }
  });
  it("selects only the actual page or dashboard tab", () => {
    expect(
      isWorkspaceActive(
        "/admin",
        new URL("https://adk.example/admin/whatsapp"),
      ),
    ).toBe(false);
    expect(
      isWorkspaceActive(
        "/admin/whatsapp",
        new URL("https://adk.example/admin/whatsapp"),
      ),
    ).toBe(true);
    expect(
      isWorkspaceActive(
        "/dashboard/agent#leads",
        new URL("https://adk.example/dashboard/agent#listings"),
      ),
    ).toBe(false);
    expect(
      isWorkspaceActive(
        "/dashboard/agent#leads",
        new URL("https://adk.example/dashboard/agent#leads"),
      ),
    ).toBe(true);
  });
});
