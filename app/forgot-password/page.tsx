import { redirect } from "next/navigation";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";
import { getSessionUser } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");
  return <ForgotPasswordForm />;
}
