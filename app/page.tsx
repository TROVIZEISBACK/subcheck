import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getSessionUser();
  redirect(user ? "/dashboard" : "/sign-in");
}
