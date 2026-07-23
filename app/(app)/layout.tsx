import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { getSessionUser } from "@/lib/data";

// Every authenticated page is per-user and reads cookies, so never prerender.
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");

  return (
    <div className="flex min-h-screen">
      <Sidebar email={user.email} />
      <main className="flex-1 px-6 py-8 lg:px-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
