/**
 * Locked production defaults for the agent / referral / save-to-screen network.
 * Overridable via Worker env when set.
 */
export const AGENT_NETWORK_DEFAULTS = {
  /** Flat NGN commission when a referred patient completes a center screen */
  SCREEN_COMMISSION_FLAT: 500,
  /** Flat NGN commission when a referred patient completes a home screen */
  HOME_SCREEN_COMMISSION_FLAT: 1000,
  /** Percent of sponsored campaign funding credited to inviting agent (0–100) */
  SPONSOR_COMMISSION_PERCENT: 5,
  /** Minimum Paystack deposit toward a savings plan (NGN) */
  SAVINGS_MIN_DEPOSIT: 500,
  /** Agents must have at least one COMPLETED appointment */
  REQUIRE_COMPLETED_SCREEN_TO_ACTIVATE: true,
  /** One-level referrals only */
  MAX_REFERRAL_DEPTH: 1,
  /** Default: referred woman allows referrer to earn unless she opts out */
  DEFAULT_COMMISSION_ALLOWED: true,
  /** Home screening enabled in v1 */
  HOME_SCREENING_ENABLED: true,
  /** Premium surcharge hint for home visits (NGN) — centers may override retail */
  HOME_VISIT_SURCHARGE_FLAT: 5000,
} as const;

export function getAgentNetworkConfig(
  env?: Record<string, string | undefined> | null
) {
  const source = env || {};
  const num = (key: string, fallback: number) => {
    const raw = source[key];
    if (raw == null || raw === "") return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
  };

  return {
    screenCommissionFlat: num(
      "AGENT_COMMISSION_SCREEN_FLAT",
      AGENT_NETWORK_DEFAULTS.SCREEN_COMMISSION_FLAT
    ),
    homeScreenCommissionFlat: num(
      "AGENT_COMMISSION_HOME_SCREEN_FLAT",
      AGENT_NETWORK_DEFAULTS.HOME_SCREEN_COMMISSION_FLAT
    ),
    sponsorCommissionPercent: num(
      "AGENT_COMMISSION_SPONSOR_PERCENT",
      AGENT_NETWORK_DEFAULTS.SPONSOR_COMMISSION_PERCENT
    ),
    savingsMinDeposit: num(
      "SAVINGS_MIN_DEPOSIT",
      AGENT_NETWORK_DEFAULTS.SAVINGS_MIN_DEPOSIT
    ),
    homeVisitSurchargeFlat: num(
      "HOME_VISIT_SURCHARGE_FLAT",
      AGENT_NETWORK_DEFAULTS.HOME_VISIT_SURCHARGE_FLAT
    ),
    homeScreeningEnabled:
      (source.HOME_SCREENING_ENABLED ?? "true").toLowerCase() !== "false",
    requireCompletedScreen:
      AGENT_NETWORK_DEFAULTS.REQUIRE_COMPLETED_SCREEN_TO_ACTIVATE,
    defaultCommissionAllowed:
      AGENT_NETWORK_DEFAULTS.DEFAULT_COMMISSION_ALLOWED,
  };
}
