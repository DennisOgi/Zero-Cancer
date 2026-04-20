import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { getDB } from "../lib/db";
import { THonoApp } from "../lib/types";
import { authMiddleware } from "../middleware/auth.middleware";

const blogApp = new Hono<THonoApp>();

// ============================================
// VALIDATION SCHEMAS
// ============================================

const createPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  excerpt: z.string().min(1, "Excerpt is required"),
  content: z.string().min(1, "Content is required"),
  coverImage: z.string().url().optional(),
  categoryIds: z.array(z.string()).min(1, "At least one category is required"),
  published: z.boolean().default(false),
});

const updatePostSchema = z.object({
  title: z.string().min(1).optional(),
  excerpt: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  coverImage: z.string().url().optional().nullable(),
  categoryIds: z.array(z.string()).optional(),
  published: z.boolean().optional(),
});

const listPostsQuerySchema = z.object({
  page: z.string().transform(Number).default("1"),
  pageSize: z.string().transform(Number).default("20"),
  category: z.string().optional(),
  search: z.string().optional(),
  published: z.string().transform((val) => val === "true").optional(),
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate URL-friendly slug from title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Ensure slug is unique by appending number if needed
 */
async function ensureUniqueSlug(db: any, baseSlug: string, excludeId?: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await db.blogPost.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing || (excludeId && existing.id === excludeId)) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

// ============================================
// PUBLIC ENDPOINTS
// ============================================

/**
 * GET /api/v1/blog
 * List all published blog posts (paginated)
 */
blogApp.get(
  "/",
  zValidator("query", listPostsQuerySchema),
  async (c) => {
    try {
      const db = getDB(c);
      const { page, pageSize, category, search } = c.req.valid("query");

      const skip = (page - 1) * pageSize;

      // Build where clause
      const where: any = {
        published: true,
      };

      if (category) {
        where.categories = {
          some: {
            category: {
              slug: category,
            },
          },
        };
      }

      if (search) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { excerpt: { contains: search, mode: "insensitive" } },
        ];
      }

      // Get posts
      const [posts, total] = await Promise.all([
        db.blogPost.findMany({
          where,
          include: {
            author: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
            categories: {
              include: {
                category: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },
          },
          orderBy: { publishedAt: "desc" },
          skip,
          take: pageSize,
        }),
        db.blogPost.count({ where }),
      ]);

      return c.json({
        ok: true,
        data: {
          posts: posts.map((post) => ({
            ...post,
            categories: post.categories.map((pc) => pc.category),
          })),
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
          },
        },
      });
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      return c.json(
        {
          ok: false,
          error: "Failed to fetch blog posts",
        },
        500
      );
    }
  }
);

/**
 * GET /api/v1/blog/categories
 * List all blog categories
 */
blogApp.get("/categories", async (c) => {
  try {
    const db = getDB(c);

    const categories = await db.blogCategory.findMany({
      orderBy: { name: "asc" },
    });

    return c.json({
      ok: true,
      data: { categories },
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return c.json(
      {
        ok: false,
        error: "Failed to fetch categories",
      },
      500
    );
  }
});

/**
 * GET /api/v1/blog/:slug
 * Get single blog post by slug
 */
blogApp.get("/:slug", async (c) => {
  try {
    const db = getDB(c);
    const slug = c.req.param("slug");

    const post = await db.blogPost.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!post) {
      return c.json(
        {
          ok: false,
          error: "Blog post not found",
        },
        404
      );
    }

    // Only return published posts to non-admin users
    if (!post.published) {
      // Check if user is admin
      const jwtPayload = c.get("jwtPayload");
      if (!jwtPayload || jwtPayload.profile !== "ADMIN") {
        return c.json(
          {
            ok: false,
            error: "Blog post not found",
          },
          404
        );
      }
    }

    return c.json({
      ok: true,
      data: {
        post: {
          ...post,
          categories: post.categories.map((pc) => pc.category),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching blog post:", error);
    return c.json(
      {
        ok: false,
        error: "Failed to fetch blog post",
      },
      500
    );
  }
});

// ============================================
// ADMIN ENDPOINTS (Protected)
// ============================================

blogApp.use("/admin/*", authMiddleware(["admin"]));

/**
 * GET /api/v1/blog/admin/posts
 * List all blog posts (including drafts) for admin
 */
blogApp.get(
  "/admin/posts",
  zValidator("query", listPostsQuerySchema),
  async (c) => {
    try {
      const db = getDB(c);
      const { page, pageSize, category, search, published } = c.req.valid("query");

      const skip = (page - 1) * pageSize;

      // Build where clause
      const where: any = {};

      if (published !== undefined) {
        where.published = published;
      }

      if (category) {
        where.categories = {
          some: {
            category: {
              slug: category,
            },
          },
        };
      }

      if (search) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { excerpt: { contains: search, mode: "insensitive" } },
        ];
      }

      // Get posts
      const [posts, total] = await Promise.all([
        db.blogPost.findMany({
          where,
          include: {
            author: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
            categories: {
              include: {
                category: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: pageSize,
        }),
        db.blogPost.count({ where }),
      ]);

      return c.json({
        ok: true,
        data: {
          posts: posts.map((post) => ({
            ...post,
            categories: post.categories.map((pc) => pc.category),
          })),
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
          },
        },
      });
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      return c.json(
        {
          ok: false,
          error: "Failed to fetch blog posts",
        },
        500
      );
    }
  }
);

/**
 * POST /api/v1/blog/admin/posts
 * Create new blog post
 */
blogApp.post(
  "/admin/posts",
  zValidator("json", createPostSchema),
  async (c) => {
    try {
      const db = getDB(c);
      const jwtPayload = c.get("jwtPayload");
      const data = c.req.valid("json");

      // Generate slug from title
      const baseSlug = generateSlug(data.title);
      const slug = await ensureUniqueSlug(db, baseSlug);

      // Create post
      const post = await db.blogPost.create({
        data: {
          title: data.title,
          slug,
          excerpt: data.excerpt,
          content: data.content,
          coverImage: data.coverImage,
          authorId: jwtPayload.id,
          published: data.published,
          publishedAt: data.published ? new Date() : null,
        },
      });

      // Add categories
      if (data.categoryIds.length > 0) {
        await db.blogPostCategory.createMany({
          data: data.categoryIds.map((categoryId) => ({
            postId: post.id,
            categoryId,
          })),
        });
      }

      // Fetch complete post with relations
      const completePost = await db.blogPost.findUnique({
        where: { id: post.id },
        include: {
          author: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          categories: {
            include: {
              category: true,
            },
          },
        },
      });

      return c.json(
        {
          ok: true,
          data: {
            post: {
              ...completePost,
              categories: completePost!.categories.map((pc) => pc.category),
            },
          },
          message: "Blog post created successfully",
        },
        201
      );
    } catch (error) {
      console.error("Error creating blog post:", error);
      return c.json(
        {
          ok: false,
          error: "Failed to create blog post",
        },
        500
      );
    }
  }
);

/**
 * PUT /api/v1/blog/admin/posts/:id
 * Update blog post
 */
blogApp.put(
  "/admin/posts/:id",
  zValidator("json", updatePostSchema),
  async (c) => {
    try {
      const db = getDB(c);
      const postId = c.req.param("id");
      const data = c.req.valid("json");

      // Check if post exists
      const existingPost = await db.blogPost.findUnique({
        where: { id: postId },
      });

      if (!existingPost) {
        return c.json(
          {
            ok: false,
            error: "Blog post not found",
          },
          404
        );
      }

      // Generate new slug if title changed
      let slug = existingPost.slug;
      if (data.title && data.title !== existingPost.title) {
        const baseSlug = generateSlug(data.title);
        slug = await ensureUniqueSlug(db, baseSlug, postId);
      }

      // Update post
      const updateData: any = {
        ...data,
        slug,
      };

      // Set publishedAt if publishing for the first time
      if (data.published && !existingPost.published) {
        updateData.publishedAt = new Date();
      }

      const post = await db.blogPost.update({
        where: { id: postId },
        data: updateData,
      });

      // Update categories if provided
      if (data.categoryIds) {
        // Delete existing categories
        await db.blogPostCategory.deleteMany({
          where: { postId },
        });

        // Add new categories
        if (data.categoryIds.length > 0) {
          await db.blogPostCategory.createMany({
            data: data.categoryIds.map((categoryId) => ({
              postId,
              categoryId,
            })),
          });
        }
      }

      // Fetch complete post with relations
      const completePost = await db.blogPost.findUnique({
        where: { id: postId },
        include: {
          author: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          categories: {
            include: {
              category: true,
            },
          },
        },
      });

      return c.json({
        ok: true,
        data: {
          post: {
            ...completePost,
            categories: completePost!.categories.map((pc) => pc.category),
          },
        },
        message: "Blog post updated successfully",
      });
    } catch (error) {
      console.error("Error updating blog post:", error);
      return c.json(
        {
          ok: false,
          error: "Failed to update blog post",
        },
        500
      );
    }
  }
);

/**
 * DELETE /api/v1/blog/admin/posts/:id
 * Delete blog post
 */
blogApp.delete("/admin/posts/:id", async (c) => {
  try {
    const db = getDB(c);
    const postId = c.req.param("id");

    // Check if post exists
    const existingPost = await db.blogPost.findUnique({
      where: { id: postId },
    });

    if (!existingPost) {
      return c.json(
        {
          ok: false,
          error: "Blog post not found",
        },
        404
      );
    }

    // Delete post (categories will be deleted automatically due to cascade)
    await db.blogPost.delete({
      where: { id: postId },
    });

    return c.json({
      ok: true,
      message: "Blog post deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting blog post:", error);
    return c.json(
      {
        ok: false,
        error: "Failed to delete blog post",
      },
      500
    );
  }
});

/**
 * POST /api/v1/blog/admin/posts/:id/publish
 * Publish/unpublish blog post
 */
blogApp.post("/admin/posts/:id/publish", async (c) => {
  try {
    const db = getDB(c);
    const postId = c.req.param("id");

    // Check if post exists
    const existingPost = await db.blogPost.findUnique({
      where: { id: postId },
    });

    if (!existingPost) {
      return c.json(
        {
          ok: false,
          error: "Blog post not found",
        },
        404
      );
    }

    // Toggle published status
    const post = await db.blogPost.update({
      where: { id: postId },
      data: {
        published: !existingPost.published,
        publishedAt: !existingPost.published ? new Date() : existingPost.publishedAt,
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    return c.json({
      ok: true,
      data: {
        post: {
          ...post,
          categories: post.categories.map((pc) => pc.category),
        },
      },
      message: `Blog post ${post.published ? "published" : "unpublished"} successfully`,
    });
  } catch (error) {
    console.error("Error publishing blog post:", error);
    return c.json(
      {
        ok: false,
        error: "Failed to publish blog post",
      },
      500
    );
  }
});

export { blogApp };
