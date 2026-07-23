import { getPreferences } from "@/lib/data";
import { SettingsForm } from "@/components/SettingsForm";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";

export default async function SettingsPage() {
  const preferences = await getPreferences();

  return (
    <div className="space-y-6">
      <header>
        <p className="label">Settings</p>
        <h1 className="mt-1 text-2xl font-semibold text-content">Alert preferences</h1>
      </header>
      <SettingsForm preferences={preferences} />
      <ChangePasswordForm />
    </div>
  );
}
