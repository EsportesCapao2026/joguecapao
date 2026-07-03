import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const ADMIN_COOKIE_NAME = "joguecapao_admin_session";
export const ADMIN_ROLE_COOKIE_NAME = "joguecapao_admin_role";

export type AdminRole = "admin" | "master";

export function isAdminSessionValid(cookieValue?: string) {
  if (!cookieValue) return false;

  const sessionSecret = process.env.SESSION_SECRET;

  if (!sessionSecret) {
    return false;
  }

  return cookieValue === sessionSecret;
}

export function getAdminRole(roleCookie?: string): AdminRole {
  if (roleCookie === "master") return "master";
  return "admin";
}

export function isMasterRole(roleCookie?: string) {
  return roleCookie === "master";
}

export async function exigirMaster() {
  const cookieStore = await cookies();
  const sessaoValid = isAdminSessionValid(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
  const role = cookieStore.get(ADMIN_ROLE_COOKIE_NAME)?.value;

  if (!sessaoValid || role !== "master") {
    redirect("/admin/dashboard?erro=privilegio");
  }
}

export async function obterRoleAtual(): Promise<AdminRole> {
  const cookieStore = await cookies();
  const role = cookieStore.get(ADMIN_ROLE_COOKIE_NAME)?.value;
  return role === "master" ? "master" : "admin";
}
