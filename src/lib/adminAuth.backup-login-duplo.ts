export const ADMIN_COOKIE_NAME = "joguecapao_admin_session";

export function isAdminSessionValid(cookieValue?: string) {
  if (!cookieValue) return false;

  const sessionSecret = process.env.SESSION_SECRET;

  if (!sessionSecret) {
    return false;
  }

  return cookieValue === sessionSecret;
}
