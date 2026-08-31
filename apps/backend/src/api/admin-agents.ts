import type { TErrorResponse } from "@zerocancer/shared/types";
import { Hono } from "hono";
import { getAgentNetworkConfig } from "../lib/agent-network-config";
import { getSupabaseClient } from "../lib/supabase";
import { THonoApp } from "../lib/types";
import { authMiddleware } from "../middleware/auth.middleware";

export const adminAgentsApp = new Hono<THonoApp>();

adminAgentsApp.use("*", authMiddleware(["admin"]));

// GET /api/v1/admin/agents
adminAgentsApp.get("/", async (c) => {
  const supabase = getSupabaseClient(c);
  const config = getAgentNetworkConfig(c.env || {});

  const { data: agents, error } = await supabase
    .from("AgentProfile")
    .select("*")
    .order("createdAt", { ascending: false })
    .limit(200);

  if (error) {
    return c.json<TErrorResponse>({ ok: false, error: error.message }, 500);
  }

  const userIds = (agents || []).map((a: any) => a.userId);
  let usersById: Record<string, any> = {};
  if (userIds.length) {
    const { data: users } = await supabase
      .from("User")
      .select("id, fullName, email, phone")
      .in("id", userIds);
    usersById = Object.fromEntries((users || []).map((u: any) => [u.id, u]));
  }

  const enriched = (agents || []).map((a: any) => ({
    ...a,
    user: usersById[a.userId] || null,
  }));

  return c.json({
    ok: true,
    data: { agents: enriched, config },
  });
});

// GET /api/v1/admin/agents/commissions
adminAgentsApp.get("/commissions", async (c) => {
  const supabase = getSupabaseClient(c);
  const { data, error } = await supabase
    .from("Commission")
    .select("*")
    .order("createdAt", { ascending: false })
    .limit(200);
  if (error) {
    return c.json<TErrorResponse>({ ok: false, error: error.message }, 500);
  }
  return c.json({ ok: true, data: data || [] });
});

// GET /api/v1/admin/agents/savings
adminAgentsApp.get("/savings", async (c) => {
  const supabase = getSupabaseClient(c);
  const { data, error } = await supabase
    .from("SavingsPlan")
    .select("*")
    .order("createdAt", { ascending: false })
    .limit(200);
  if (error) {
    return c.json<TErrorResponse>({ ok: false, error: error.message }, 500);
  }
  return c.json({ ok: true, data: data || [] });
});

// POST /api/v1/admin/agents/:id/suspend
adminAgentsApp.post("/:id/suspend", async (c) => {
  const supabase = getSupabaseClient(c);
  const id = c.req.param("id");
  const { error } = await supabase
    .from("AgentProfile")
    .update({ status: "SUSPENDED", updatedAt: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    return c.json<TErrorResponse>({ ok: false, error: error.message }, 500);
  }
  return c.json({ ok: true, message: "Agent suspended" });
});

// POST /api/v1/admin/agents/:id/activate
adminAgentsApp.post("/:id/activate", async (c) => {
  const supabase = getSupabaseClient(c);
  const id = c.req.param("id");
  const { error } = await supabase
    .from("AgentProfile")
    .update({ status: "ACTIVE", updatedAt: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    return c.json<TErrorResponse>({ ok: false, error: error.message }, 500);
  }
  return c.json({ ok: true, message: "Agent activated" });
});

// POST /api/v1/admin/agents/commissions/:id/void
adminAgentsApp.post("/commissions/:id/void", async (c) => {
  const supabase = getSupabaseClient(c);
  const id = c.req.param("id");
  const { error } = await supabase
    .from("Commission")
    .update({ status: "VOID", updatedAt: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    return c.json<TErrorResponse>({ ok: false, error: error.message }, 500);
  }
  return c.json({ ok: true, message: "Commission voided" });
});
