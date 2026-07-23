import { getSubscriptions, getPreferences } from "@/lib/data";
import { SubscriptionsManager } from "@/components/SubscriptionsManager";

export default async function SubscriptionsPage() {
  const [subscriptions, preferences] = await Promise.all([
    getSubscriptions(),
    getPreferences(),
  ]);

  return <SubscriptionsManager subscriptions={subscriptions} currency={preferences.currency} />;
}
