export function resolveSignedByName(options: {
  signedByName?: string | null;
  signedByStaffEmail?: string | null;
}): string {
  const custom = options.signedByName?.trim();
  if (custom) return custom;

  const email = options.signedByStaffEmail?.trim();
  if (!email) return "Authorized staff";

  const local = email.split("@")[0] || email;
  return local
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatStaffLabel(email: string, role?: string | null): string {
  const name = resolveSignedByName({ signedByName: null, signedByStaffEmail: email });
  return role ? `${name} (${role})` : name;
}
