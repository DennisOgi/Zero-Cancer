import { zValidator } from "@hono/zod-validator";
import {
  getScreeningTypeByIdSchema,
  getScreeningTypeByNameSchema,
  getScreeningTypesByCategoryParamSchema,
  getScreeningTypesByCategoryQuerySchema,
  getScreeningTypesQuerySchema,
} from "@zerocancer/shared";
import type {
  TErrorResponse,
  TGetScreeningTypeCategoriesResponse,
  TGetScreeningTypeResponse,
  TGetScreeningTypesResponse,
} from "@zerocancer/shared/types";
import { Hono } from "hono";
import { getDB } from "../lib/db";
import { THonoApp } from "../lib/types";

export const screeningTypesApp = new Hono<THonoApp>();

// GET /api/screening-types - paginated, filtered, searched list
screeningTypesApp.get(
  "/",
  zValidator("query", getScreeningTypesQuerySchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
  }),
  async (c) => {
    const db = getDB(c);
    const { page = 1, pageSize = 20, search } = c.req.valid("query");
    const where: any = { active: true };
    if (search) where.name = { contains: search, mode: "insensitive" };
    const [data, total] = await Promise.all([
      db.screeningType.findMany({
        where,
        select: {
          id: true,
          name: true,
          screeningTypeCategoryId: true,
          active: true,
        },
        orderBy: { name: "asc" },
        skip: (page! - 1) * pageSize!,
        take: pageSize!,
      }),
      db.screeningType.count({ where }),
    ]);
    return c.json<TGetScreeningTypesResponse>({
      ok: true,
      data: data!,
      page: page!,
      pageSize: pageSize!,
      total: total!,
      totalPages: Math.ceil(total / pageSize!),
    });
  }
);

// GET /api/screening-types/all - all active screening types (with optional search)
screeningTypesApp.get(
  "/all",
  zValidator("query", getScreeningTypesQuerySchema.partial(), (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
  }),
  async (c) => {
    const db = getDB(c);
    const { search } = c.req.valid("query");
    const where: any = { active: true };
    if (search) where.name = { contains: search, mode: "insensitive" };
    const data = await db.screeningType.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        screeningTypeCategoryId: true,
        active: true,
      },
      orderBy: { name: "asc" },
    });
    return c.json<TGetScreeningTypesResponse>({ ok: true, data: data! });
  }
);

// GET /api/screening-types/categories - list all unique categories (by relation)
screeningTypesApp.get("/categories", async (c) => {
  const db = getDB(c);
  const categories = await db.screeningTypeCategory.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return c.json<TGetScreeningTypeCategoriesResponse>({
    ok: true,
    data: categories!,
  });
});

// GET /api/screening-types/category/:categoryId - paginated, filtered, searched list by category
screeningTypesApp.get(
  "/category/:categoryId",
  zValidator("param", getScreeningTypesByCategoryParamSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
  }),
  zValidator(
    "query",
    getScreeningTypesByCategoryQuerySchema.partial(),
    (result, c) => {
      if (!result.success)
        return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
    }
  ),
  async (c) => {
    const db = getDB(c);
    const { search, page = 1, pageSize = 20 } = c.req.valid("query");
    const { categoryId } = c.req.valid("param");
    const where: any = { active: true, screeningTypeCategoryId: categoryId! };
    if (search) where.name = { contains: search, mode: "insensitive" };
    const [data, total] = await Promise.all([
      db.screeningType.findMany({
        where,
        select: {
          id: true,
          name: true,
          screeningTypeCategoryId: true,
          active: true,
        },
        orderBy: { name: "asc" },
        skip: (page! - 1) * pageSize!,
        take: pageSize!,
      }),
      db.screeningType.count({ where }),
    ]);
    return c.json<TGetScreeningTypesResponse>({
      ok: true,
      data: data!,
      page: page!,
      pageSize: pageSize!,
      total: total!,
      totalPages: Math.ceil(total / pageSize!),
    });
  }
);

// GET /api/screening-types/by-name/:name - get screening type by name
screeningTypesApp.get(
  "/by-name/:name",
  zValidator("param", getScreeningTypeByNameSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
  }),
  async (c) => {
    const db = getDB(c);
    const { name } = c.req.valid("param");
    const data = await db.screeningType.findFirst({
      where: { name: name! },
      select: {
        id: true,
        name: true,
        screeningTypeCategoryId: true,
        active: true,
      },
    });
    if (!data)
      return c.json<TErrorResponse>({ ok: false, error: "Not found" }, 404);
    return c.json<TGetScreeningTypeResponse>({ ok: true, data: data! });
  }
);

// GET /api/screening-types/:id - get screening type by id
screeningTypesApp.get(
  "/:id",
  zValidator("param", getScreeningTypeByIdSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
  }),
  async (c) => {
    const db = getDB(c);
    const { id } = c.req.valid("param");
    const data = await db.screeningType.findUnique({
      where: { id: id! },
      select: {
        id: true,
        name: true,
        screeningTypeCategoryId: true,
        active: true,
      },
    });
    if (!data)
      return c.json<TErrorResponse>({ ok: false, error: "Not found" }, 404);
    return c.json<TGetScreeningTypeResponse>({ ok: true, data: data! });
  }
);
