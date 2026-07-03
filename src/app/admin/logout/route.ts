import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, ADMIN_ROLE_COOKIE_NAME } from "@/lib/adminAuth";

export async function GET() {
  const cookieStore = await cookies();

  cookieStore.delete(ADMIN_COOKIE_NAME);
  cookieStore.delete(ADMIN_ROLE_COOKIE_NAME);

  redirect("/admin");
}
