export type WorkspaceLink = {
  href: string;
  label: string;
  emoji: string;
  badge?: string;
};
export type WorkspaceGroup = { label: string; items: WorkspaceLink[] };
export const adminGroups: WorkspaceGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", emoji: "📊" },
      { href: "/admin/notifications", label: "Notifications", emoji: "🔔" },
    ],
  },
  {
    label: "Service Requests",
    items: [
      {
        href: "/admin/requests",
        label: "Requests Inbox",
        emoji: "📥",
        badge: "new",
      },
      { href: "/admin/messages", label: "Conversations", emoji: "💬" },
      { href: "/admin/finance", label: "Reconciliation", emoji: "💳" },
      { href: "/admin/enquiries", label: "Enquiries", emoji: "✉️" },
      { href: "/admin/services", label: "Services Catalog", emoji: "🛠️" },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/admin/agents", label: "Agent Approvals", emoji: "🤝" },
      { href: "/admin/managers", label: "Manager Approvals", emoji: "🏢" },
      { href: "/admin/newsletter", label: "Newsletter consent", emoji: "✉️" },
      { href: "/admin/users", label: "Users & Roles", emoji: "👥" },
    ],
  },
  {
    label: "Properties",
    items: [
      { href: "/admin/properties", label: "Properties", emoji: "🏠" },
      { href: "/admin/projects", label: "Projects & Estates", emoji: "🏗️" },
      {
        href: "/admin/plots",
        label: "Plot Verification",
        emoji: "📍",
        badge: "unverified",
      },
    ],
  },
  {
    label: "Legal & Sales",
    items: [
      { href: "/admin/bookings", label: "Bookings", emoji: "📆" },
      { href: "/admin/documents", label: "Legal Documents", emoji: "📄" },
      { href: "/admin/whatsapp", label: "WhatsApp Queue", emoji: "💬" },
    ],
  },
  {
    label: "Construction",
    items: [{ href: "/admin/milestones", label: "Milestones", emoji: "🏗️" }],
  },
  {
    label: "System",
    items: [
      { href: "/admin/content", label: "Content Review", emoji: "📝" },
      { href: "/admin/subscriptions", label: "Subscriptions", emoji: "💎" },
      { href: "/admin/settings", label: "Settings", emoji: "⚙️" },
    ],
  },
];
const sections: Record<string, Array<[string, string, string]>> = {
  CLIENT: [
    ["bookings", "My Bookings", "📆"],
    ["requests", "My Requests", "📥"],
    ["saved", "Saved", "❤️"],
    ["viewings", "Viewings", "🏠"],
    ["documents", "Documents", "📄"],
    ["messages", "Messages", "💬"],
    ["profile", "Profile", "👤"],
  ],
  AGENT: [
    ["overview", "Overview", "📊"],
    ["listings", "My Listings", "🏠"],
    ["leads", "My Leads", "🤝"],
    ["referrals", "Service Referrals", "🔗"],
    ["commissions", "Commissions", "💳"],
    ["schedule", "Schedule", "📆"],
    ["messages", "Messages", "💬"],
    ["settings", "Settings", "⚙️"],
  ],
  ESTATE_MANAGER: [
    ["overview", "Overview", "📊"],
    ["properties", "My Properties", "🏢"],
    ["tenants", "Tenants", "👥"],
    ["facility", "Facility & Maintenance", "🛠️"],
    ["agents", "My Agents", "🤝"],
    ["financials", "Financials", "💳"],
    ["documents", "Documents", "📄"],
    ["reports", "Reports", "📈"],
    ["settings", "Settings", "⚙️"],
  ],
};
export function dashboardFor(role: string) {
  return role === "ADMIN"
    ? "/admin"
    : role === "AGENT"
      ? "/dashboard/agent"
      : role === "ESTATE_MANAGER"
        ? "/dashboard/manager"
        : "/dashboard/client";
}
export function workspaceGroups(role: string): WorkspaceGroup[] {
  const dashboard = dashboardFor(role);
  const groups =
    role === "ADMIN"
      ? adminGroups
      : [
          {
            label: "Dashboard",
            items: (sections[role] ?? sections.CLIENT).map(
              ([id, label, emoji]) => ({
                href: `${dashboard}#${id}`,
                label,
                emoji,
              }),
            ),
          },
        ];
  return [
    ...groups,
    {
      label: "Your account",
      items: [
        { href: "/dashboard/account", label: "My profile", emoji: "👤" },
        {
          href: "/dashboard/subscriptions",
          label: "Manage subscription",
          emoji: "💎",
        },
        { href: "/dashboard/payments", label: "My payments", emoji: "💳" },
        {
          href: "/dashboard/messages",
          label: "Company conversations",
          emoji: "✉️",
        },
        ...(role === "ESTATE_MANAGER"
          ? [
              {
                href: "/dashboard/operations",
                label: "Leases and financial ledger",
                emoji: "📒",
              },
            ]
          : []),
      ],
    },
    {
      label: "Explore Aliko",
      items: [
        { href: "/properties", label: "Property catalogue", emoji: "🏠" },
        { href: "/services", label: "Services", emoji: "🛠️" },
        { href: "/", label: "Website home", emoji: "🌍" },
      ],
    },
  ];
}
export function isWorkspaceActive(href: string, url: URL) {
  const target = new URL(href, url.origin);
  return target.hash
    ? url.pathname === target.pathname && url.hash === target.hash
    : target.pathname === "/admin"
      ? url.pathname === "/admin"
      : url.pathname === target.pathname ||
        url.pathname.startsWith(target.pathname + "/");
}
