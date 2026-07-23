import { getSessionUser, getCurrentProfile } from "@/lib/auth";
import { query } from "@/lib/db";
import { rowToSubscription, profileToPreferences } from "@/lib/mappers";
import { DEFAULT_PREFERENCES } from "@/lib/catalog";
import type { Preferences, ProfileRow, Subscription, SubscriptionRow } from "@/lib/types";

export { getSessionUser };
export type { SessionUser } from "@/lib/auth";

export async function getPreferences(): Promise<Preferences> {
  const profile = await getCurrentProfile();
  if (!profile) return { ...DEFAULT_PREFERENCES };
  return profileToPreferences(profile);
}

export async function getProfile(): Promise<ProfileRow | null> {
  return getCurrentProfile();
}

export async function getSubscriptions(): Promise<Subscription[]> {
  const user = await getSessionUser();
  if (!user) return [];
  const rows = await query<SubscriptionRow>(
    "select * from subscriptions where user_id = $1 order by created_at asc",
    [user.id]
  );
  return rows.map(rowToSubscription);
}
