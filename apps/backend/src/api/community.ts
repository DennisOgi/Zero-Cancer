import { zValidator } from "@hono/zod-validator";
import {
  associationSchema,
  getCommunitiesQuerySchema,
  groupSchema,
} from "@zerocancer/shared";
import { Hono } from "hono";
import { getDB } from "../lib/db";
import { THonoApp } from "../lib/types";
import { authMiddleware } from "../middleware/auth.middleware";

export const communityApp = new Hono<THonoApp>();

// GET /api/v1/community/associations - List associations
communityApp.get(
  "/associations",
  zValidator("query", getCommunitiesQuerySchema),
  async (c) => {
    const db = getDB(c);
    const { page = 1, pageSize = 20, search } = c.req.valid("query");

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [associations, total] = await Promise.all([
      db.association.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { name: "asc" },
      }),
      db.association.count({ where }),
    ]);

    return c.json({
      ok: true,
      data: {
        associations,
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  }
);

// POST /api/v1/community/associations - Create association (Admin only)
communityApp.post(
  "/associations",
  authMiddleware(["admin"]),
  zValidator("json", associationSchema),
  async (c) => {
    const db = getDB(c);
    const data = c.req.valid("json");

    const association = await db.association.create({
      data: {
        name: data.name,
        description: data.description,
      },
    });

    return c.json({ ok: true, data: association }, 201);
  }
);

// GET /api/v1/community/groups - List groups
communityApp.get(
  "/groups",
  zValidator("query", getCommunitiesQuerySchema),
  async (c) => {
    const db = getDB(c);
    const { page = 1, pageSize = 20, search } = c.req.valid("query");

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [groups, total] = await Promise.all([
      db.group.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { name: "asc" },
      }),
      db.group.count({ where }),
    ]);

    return c.json({
      ok: true,
      data: {
        groups,
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  }
);

// POST /api/v1/community/groups - Create group (Admin only)
communityApp.post(
  "/groups",
  authMiddleware(["admin"]),
  zValidator("json", groupSchema),
  async (c) => {
    const db = getDB(c);
    const data = c.req.valid("json");

    const group = await db.group.create({
      data: {
        name: data.name,
        description: data.description,
      },
    });

    return c.json({ ok: true, data: group }, 201);
  }
);

export default communityApp;
