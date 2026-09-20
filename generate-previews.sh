#!/usr/bin/env bash
# Generates static HTML previews of the running dev server into preview/
set -u
BASE="http://127.0.0.1:5199"
OUT="preview"
mkdir -p "$OUT"

# route_url|output_file
PAGES=(
  "/|index.html"
  "/properties|properties.html"
  "/properties/prop-001|property-detail.html"
  "/map|map.html"
  "/agents|agents.html"
  "/auth|auth.html"
  "/login|login.html"
  "/register/agent|register-agent.html"
  "/register/manager|register-manager.html"
  "/request|request.html"
  "/services|services.html"
  "/services/interior-design|service-interior-design.html"
  "/services/turkish-tiles-supply|service-turkish-tiles.html"
  "/services/smart-home-installation|service-smart-home.html"
  "/services/construction-services|service-construction.html"
  "/dashboard/agent|dashboard-agent.html"
  "/dashboard/manager|dashboard-manager.html"
  "/dashboard/client|dashboard-client.html"
  "/admin|admin-dashboard.html"
  "/admin/requests|admin-requests.html"
  "/admin/services|admin-services.html"
  "/admin/agents|admin-agents.html"
  "/admin/managers|admin-managers.html"
  "/admin/users|admin-users.html"
  "/admin/plots|admin-plots.html"
  "/admin/projects|admin-projects.html"
  "/admin/documents|admin-documents.html"
  "/admin/notifications|admin-notifications.html"
  "/admin/whatsapp|admin-whatsapp.html"
  "/admin/milestones|admin-milestones.html"
  "/admin/settings|admin-settings.html"
  "/legal/track|legal-track.html"
)

pass=0; fail=0; failed_list=""
for entry in "${PAGES[@]}"; do
  url="${entry%%|*}"
  file="${entry##*|}"
  code=$(curl -s -o "$OUT/$file" -w "%{http_code}" --max-time 60 "$BASE$url")
  size=$(wc -c < "$OUT/$file" 2>/dev/null | tr -d ' ')
  if [ "$code" = "200" ] && [ "${size:-0}" -gt 500 ]; then
    echo "OK   $url -> $file ($size bytes)"
    pass=$((pass+1))
  else
    echo "FAIL $url (HTTP $code, $size bytes) -> $file"
    fail=$((fail+1)); failed_list="$failed_list $url"
  fi
done

echo "----------------------------------------"
echo "Previews: $pass OK, $fail failed"
[ -n "$failed_list" ] && echo "Failed:$failed_list"
exit $fail
