import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { getSessionUser } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");
  const { reset } = await searchParams;
  return (
    <AuthForm
      mode="signin"
      notice={reset ? "Password updated — sign in with your new password." : undefined}
    />
  );
}
