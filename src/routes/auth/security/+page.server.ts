import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
// Retired authenticator screen: retain safe redirects for existing bookmarks.
export const load: PageServerLoad = async ({ parent }) => {
  const data = await parent();
  throw redirect(
    303,
    data.session?.user?.role === "ADMIN" ? "/admin" : "/auth/admin",
  );
};
