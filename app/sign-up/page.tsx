import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { getSessionUser } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SignUpPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");
  return <AuthForm mode="signup" />;
}
