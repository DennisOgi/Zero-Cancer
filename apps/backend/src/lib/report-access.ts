const TOKEN_TTL_MS = 90 * 24 * 60 * 60 * 1000;

export function generateReportAccessToken(): {
  accessToken: string;
  accessTokenExpiresAt: string;
} {
  const accessToken = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  return {
    accessToken,
    accessTokenExpiresAt: new Date(Date.now() + TOKEN_TTL_MS).toISOString(),
  };
}

export function isReportAccessTokenValid(report: {
  accessToken?: string | null;
  accessTokenExpiresAt?: string | null;
}): boolean {
  if (!report.accessToken) return false;
  if (!report.accessTokenExpiresAt) return true;
  return new Date(report.accessTokenExpiresAt).getTime() > Date.now();
}
