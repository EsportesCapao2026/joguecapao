"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME } from "@/lib/adminAuth";

export async function loginAdmin(formData: FormData) {
  const adminPassword = String(formData.get("adminPassword") ?? "");
  const masterPassword = String(formData.get("masterPassword") ?? "");

  const adminOk = adminPassword === process.env.ADMIN_PASSWORD;
  const masterOk = masterPassword === process.env.MASTER_PASSWORD;

  if (!adminOk || !masterOk) {
    redirect("/admin?erro=1");
  }

  const cookieStore = await cookies();

  cookieStore.set(ADMIN_COOKIE_NAME, process.env.SESSION_SECRET ?? "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  redirect("/admin/dashboard");
}
