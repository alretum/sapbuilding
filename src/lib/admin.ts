// Lightweight gate for SAP-facing admin actions (creating company challenges).
// If ADMIN_KEY is set, requests must send a matching `x-admin-key` header.
// If it's unset (e.g. local dev), admin is open — set it in production.
export function isAdminAuthorized(req: Request): boolean {
  const required = process.env.ADMIN_KEY;
  if (!required) return true;
  return req.headers.get("x-admin-key") === required;
}
