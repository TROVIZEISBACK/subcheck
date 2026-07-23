import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";
import { getSessionUser } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");
  const { token } = await searchParams;
  return <ResetPasswordForm token={token ?? ""} />;
}
