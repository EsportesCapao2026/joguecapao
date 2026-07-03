"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, ADMIN_ROLE_COOKIE_NAME } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

function limparSenha(valor: unknown) {
  return String(valor ?? "")
    .trim()
    .replace(/^["']|["']$/g, "");
}

export async function loginAdmin(formData: FormData) {
  const password =
    limparSenha(formData.get("password")) ||
    limparSenha(formData.get("adminPassword")) ||
    limparSenha(formData.get("masterPassword"));

  const sessionSecret = limparSenha(process.env.SESSION_SECRET);

  const supabase = getSupabaseAdmin();

  // 1. Buscar a senha do admin salva no banco de dados
  const { data: adminConfig } = await supabase
    .from("configuracoes")
    .select("valor")
    .eq("chave", "admin_password")
    .maybeSingle();

  const adminPasswordBanco = adminConfig?.valor?.password;
  const adminPassword = adminPasswordBanco
    ? limparSenha(adminPasswordBanco)
    : limparSenha(process.env.ADMIN_PASSWORD);

  // 2. Buscar a senha do master salva no banco de dados
  const { data: masterConfig } = await supabase
    .from("configuracoes")
    .select("valor")
    .eq("chave", "master_password")
    .maybeSingle();

  const masterPasswordBanco = masterConfig?.valor?.password;
  const masterPassword = masterPasswordBanco
    ? limparSenha(masterPasswordBanco)
    : limparSenha(process.env.MASTER_PASSWORD);

  const adminOk = password === adminPassword;
  const masterOk = password === masterPassword;

  if (!sessionSecret || (!adminOk && !masterOk)) {
    redirect("/admin?erro=1");
  }

  const role = masterOk ? "master" : "admin";

  const cookieStore = await cookies();

  cookieStore.set(ADMIN_COOKIE_NAME, sessionSecret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  cookieStore.set(ADMIN_ROLE_COOKIE_NAME, role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  redirect("/admin/dashboard");
}
