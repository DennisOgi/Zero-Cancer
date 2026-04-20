# Blog Integration Plan - ZeroCancer

**Created:** April 9, 2026  
**Status:** Ready for Implementation

---

## 📊 Current Project State Analysis

### ✅ What Already Exists:

1. **Navigation & Layout:**
   - ✅ Navbar component with logo and navigation
   - ✅ Footer component (already has "Blog" placeholder link)
   - ✅ Responsive design system
   - ✅ Landing page structure

2. **Design System:**
   - ✅ Tailwind CSS with custom theme
   - ✅ Color scheme: Primary (dark), Secondary, Muted
   - ✅ Montserrat font family
   - ✅ Consistent spacing and radius variables
   - ✅ Responsive utilities

3. **Backend Infrastructure:**
   - ✅ Hono.js API framework
   - ✅ Prisma ORM with SQLite
   - ✅ Authentication system (JWT)
   - ✅ Admin role exists
   - ✅ File upload system (Cloudinary)
   - ✅ Category system pattern (ScreeningTypeCategory)

4. **Frontend Infrastructure:**
   - ✅ TanStack Router
   - ✅ React Query for data fetching
   - ✅ Form handling (react-hook-form + zod)
   - ✅ UI components (shadcn/ui)
   - ✅ Public routes structure

---

## 🎯 Blog Design Requirements (from Screenshots)

### Blog Home Page:
1. **Hero/Featured Section:**
   - Large background image with dark overlay
   - Category badges (e.g., "PREVENTION & AWARENESS")
   - Large title text (white)
   - Date display
   - Short excerpt
   - "Read" button (outlined style)

2. **Article Grid:**
   - 3-column responsive grid
   - Card design with:
     - Featured image
     - Date
     - Title
     - Excerpt
     - Hover effects

### Article Detail Page:
1. **Hero Section:**
   - Full-width background image
   - Category badges overlay
   - Centered title
   - Introduction paragraph

2. **Content Section:**
   - Clean white background
   - Typography hierarchy
   - Section headings
   - Proper spacing
   - Inline links

---

## 🏗️ Implementation Plan

### Phase 1: Database Schema (30 minutes)

**New Models:**

```prisma
model BlogPost {
  id            String    @id @default(uuid())
  title         String
  slug          String    @unique
  excerpt       String
  content       String    // Markdown or HTML
  coverImage    String?   // Cloudinary URL
  authorId      String
  published     Boolean   @default(false)
  publishedAt   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  author        Admins    @relation(fields: [authorId], references: [id])
  categories    BlogPostCategory[]
  
  @@index([published, publishedAt])
  @@index([slug])
}

model BlogCategory {
  id          String    @id @default(uuid())
  name        String    @unique
  slug        String    @unique
  description String?
  
  posts       BlogPostCategory[]
}

model BlogPostCategory {
  id         String   @id @default(uuid())
  postId     String
  categoryId String
  
  post       BlogPost     @relation(fields: [postId], references: [id], onDelete: Cascade)
  category   BlogCategory @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  
  @@unique([postId, categoryId])
}
```

**Seed Categories:**
- "PREVENTION & AWARENESS"
- "ASK THE EXPERT"
- "SURVIVOR STORIES"
- "EARLY DETECTION"
- "COMMUNITY"

---

### Phase 2: Backend API (2 hours)

**File:** `apps/backend/src/api/blog.ts`

**Public Endpoints:**
```typescript
GET  /api/v1/blog                    // List published posts (paginated)
GET  /api/v1/blog/:slug              // Get single post by slug
GET  /api/v1/blog/categories         // List all categories
GET  /api/v1/blog/category/:slug     // Posts by category
```

**Admin Endpoints:**
```typescript
POST   /api/v1/admin/blog            // Create post
PUT    /api/v1/admin/blog/:id        // Update post
DELETE /api/v1/admin/blog/:id        // Delete post
GET    /api/v1/admin/blog            // List all posts (including drafts)
POST   /api/v1/admin/blog/:id/publish // Publish post
```

**Features:**
- Pagination (20 posts per page)
- Category filtering
- Search by title
- Draft/published status
- Slug auto-generation from title
- Image upload via Cloudinary

---

### Phase 3: Frontend Routes (1 hour)

**Public Routes:**
```
/blog                    → Blog home page
/blog/:slug              → Article detail page
/blog/category/:slug     → Category filtered posts
```

**Admin Routes:**
```
/admin/blog              → Blog management dashboard
/admin/blog/new          → Create new post
/admin/blog/:id/edit     → Edit post
```

**Route Files:**
```
apps/frontend/src/routes/(public)/blog/
  ├── index.tsx          (Blog home)
  ├── $slug.tsx          (Article detail)
  └── category.$slug.tsx (Category page)

apps/frontend/src/routes/admin/blog/
  ├── index.tsx          (Blog list)
  ├── new.tsx            (Create post)
  └── $id.edit.tsx       (Edit post)
```

---

### Phase 4: Frontend Components (3 hours)

**Blog Components:**
```
apps/frontend/src/components/Blog/
  ├── BlogHero.tsx           (Featured article hero)
  ├── BlogCard.tsx           (Article card for grid)
  ├── BlogGrid.tsx           (Grid layout)
  ├── BlogArticle.tsx        (Full article view)
  ├── BlogCategoryBadge.tsx  (Category badge)
  └── BlogSearch.tsx         (Search component)
```

**Admin Components:**
```
apps/frontend/src/components/AdminPage/Blog/
  ├── BlogList.tsx           (Admin blog list)
  ├── BlogEditor.tsx         (Rich text editor)
  ├── BlogForm.tsx           (Create/edit form)
  └── BlogPreview.tsx        (Preview before publish)
```

**Shared Components to Reuse:**
- Button (from shadcn/ui)
- Card (from shadcn/ui)
- Badge (from shadcn/ui)
- Form components (from shadcn/ui)

---

### Phase 5: Styling & Design (2 hours)

**Design Tokens (matching screenshots):**
```css
/* Blog-specific styles */
.blog-hero {
  background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5));
  min-height: 500px;
}

.blog-category-badge {
  background: rgba(255,255,255,0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.3);
}

.blog-card {
  transition: transform 0.3s ease;
}

.blog-card:hover {
  transform: translateY(-8px);
}
```

**Typography:**
- Hero title: text-4xl md:text-5xl font-bold
- Article title: text-3xl md:text-4xl font-bold
- Body text: text-base leading-relaxed
- Date: text-sm text-muted-foreground

---

### Phase 6: Integration Points (1 hour)

**1. Update Navbar:**
```tsx
// Add Blog link to Navbar.tsx
<Link to="/blog">Blog</Link>
```

**2. Update Footer:**
```tsx
// Update Footer.tsx blog link
<Link to="/blog" className="block hover:text-primary">
  Blog
</Link>
```

**3. Add to Landing Page (Optional):**
```tsx
// Add "Latest Articles" section to LandingPage
<BlogPreviewSection />
```

---

### Phase 7: Content Management (1 hour)

**Rich Text Editor Options:**

**Option 1: Markdown (Recommended)**
- Use `react-markdown` for rendering
- Simple editor with preview
- Easy to store and version control
- Lightweight

**Option 2: Rich Text Editor**
- Use TipTap or Quill
- WYSIWYG experience
- More complex but user-friendly
- Store as HTML

**Recommendation:** Start with Markdown, upgrade to rich editor if needed

---

## 📦 Dependencies to Install

```bash
# Backend
pnpm add slugify          # Auto-generate slugs

# Frontend
pnpm add react-markdown   # Markdown rendering
pnpm add remark-gfm       # GitHub Flavored Markdown
pnpm add rehype-raw       # Allow HTML in markdown
pnpm add date-fns         # Date formatting
```

---

## 🎨 Design Specifications

### Colors (from screenshots):
- **Hero overlay:** rgba(0, 0, 0, 0.6)
- **Category badges:** Semi-transparent white with blur
- **Text on dark:** White (#FFFFFF)
- **Body text:** Current foreground color
- **Links:** Primary color with hover effect

### Spacing:
- Hero padding: py-20 md:py-32
- Grid gap: gap-8
- Card padding: p-6
- Section spacing: py-16

### Images:
- Hero image: Full width, min-height 500px
- Card image: Aspect ratio 16:9
- Image optimization: Use Cloudinary transformations

---

## 🔒 Security & Permissions

**Public Access:**
- ✅ View published posts
- ✅ View categories
- ✅ Search posts

**Admin Only:**
- ✅ Create posts
- ✅ Edit posts
- ✅ Delete posts
- ✅ Publish/unpublish
- ✅ Upload images

**Middleware:**
```typescript
// Protect admin blog routes
blogApp.use("/admin/*", authMiddleware(["admin"]));
```

---

## 📝 Sample Data Structure

**Blog Post Example:**
```json
{
  "id": "uuid",
  "title": "Unlocking the Path: Your Guide to HPV Testing for Cervical Cancer",
  "slug": "unlocking-path-hpv-testing-cervical-cancer",
  "excerpt": "In this guide, we uncover the vital aspects of an effective HPV test, shedding light on the importance of identifying high-risk strains and...",
  "content": "# The Ideal HPV Test\n\nThere are various types...",
  "coverImage": "https://res.cloudinary.com/.../hpv-testing.jpg",
  "published": true,
  "publishedAt": "2024-04-17T00:00:00Z",
  "categories": [
    {
      "name": "PREVENTION & AWARENESS",
      "slug": "prevention-awareness"
    },
    {
      "name": "ASK THE EXPERT",
      "slug": "ask-the-expert"
    }
  ]
}
```

---

## ✅ Testing Checklist

### Backend:
- [ ] Create blog post via API
- [ ] Update blog post
- [ ] Delete blog post
- [ ] Publish/unpublish post
- [ ] List published posts (pagination)
- [ ] Get single post by slug
- [ ] Filter by category
- [ ] Upload cover image

### Frontend:
- [ ] Blog home page loads
- [ ] Featured article displays correctly
- [ ] Article grid responsive
- [ ] Article detail page renders
- [ ] Markdown content renders properly
- [ ] Images load from Cloudinary
- [ ] Category filtering works
- [ ] Admin can create post
- [ ] Admin can edit post
- [ ] Admin can delete post

### Design:
- [ ] Matches screenshot design
- [ ] Responsive on mobile
- [ ] Hover effects work
- [ ] Typography consistent
- [ ] Images optimized
- [ ] Loading states
- [ ] Error states

---

## 🚀 Implementation Timeline

**Total Estimated Time: 10-12 hours**

| Phase | Task | Time | Priority |
|-------|------|------|----------|
| 1 | Database Schema | 30 min | High |
| 2 | Backend API | 2 hours | High |
| 3 | Frontend Routes | 1 hour | High |
| 4 | Frontend Components | 3 hours | High |
| 5 | Styling & Design | 2 hours | High |
| 6 | Integration | 1 hour | Medium |
| 7 | Content Management | 1 hour | Medium |
| 8 | Testing | 1 hour | High |
| 9 | Documentation | 30 min | Low |

---

## 📋 Post-Implementation Tasks

1. **Content Creation:**
   - Write initial blog posts
   - Source/create images
   - Set up categories

2. **SEO Optimization:**
   - Add meta tags
   - Generate sitemap
   - Add structured data

3. **Analytics:**
   - Track page views
   - Monitor popular posts
   - User engagement metrics

4. **Future Enhancements:**
   - Comments system
   - Social sharing
   - Related posts
   - Newsletter signup
   - RSS feed

---

## 🎯 Success Criteria

✅ Blog home page matches screenshot design  
✅ Article detail page matches screenshot design  
✅ Admin can create/edit/delete posts  
✅ Posts display correctly on all devices  
✅ Images load properly from Cloudinary  
✅ Navigation integrated seamlessly  
✅ Performance is good (< 2s load time)  
✅ No console errors  
✅ Accessible (WCAG AA)  

---

## 📞 Next Steps

1. **Review this plan** - Confirm approach
2. **Provide sample content** - Article text and images
3. **Start implementation** - Begin with Phase 1
4. **Iterative testing** - Test each phase
5. **Launch** - Deploy to production

---

**Ready to proceed?** Say "yes" and I'll start with Phase 1! 🚀
