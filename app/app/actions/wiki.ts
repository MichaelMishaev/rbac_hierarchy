'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { wikiCache, WIKI_CACHE_KEYS } from '@/lib/cache/wiki-cache';
import { withServerActionErrorHandler } from '@/lib/server-action-error-handler';

// ============================================
// TYPE DEFINITIONS
// ============================================

export type WikiCategoryWithPages = {
  id: string;
  name: string;
  nameEn: string;
  slug: string;
  description: string | null;
  icon: string | null;
  order: number;
  pageCount: number;
  pages: {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    tags: string[];
    viewCount: number;
    order: number;
  }[];
};

export type WikiPageFull = {
  id: string;
  title: string;
  titleEn: string | null;
  slug: string;
  content: string;
  excerpt: string | null;
  tags: string[];
  category: {
    id: string;
    name: string;
    slug: string;
  };
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type WikiSearchResult = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  categoryName: string;
  categorySlug: string;
  tags: string[];
  matchedIn: 'title' | 'content' | 'tags';
};

// ============================================
// AUTHORIZATION HELPERS
// ============================================

async function requireSuperAdmin() {
  const user = await getCurrentUser();

  if (!user || user.role !== 'SUPERADMIN') {
    throw new Error('Unauthorized: Wiki access is restricted to SuperAdmins only');
  }

  return user;
}

// ============================================
// CATEGORY ACTIONS
// ============================================

/**
 * Get all wiki categories with their pages
 * SuperAdmin only
 * 🚀 OPTIMIZED: Uses caching + efficient query with _count
 */
export async function getWikiCategories(): Promise<{
  success: boolean;
  categories?: WikiCategoryWithPages[];
  error?: string;
}> {
  return withServerActionErrorHandler(async () => {
    await requireSuperAdmin();

    // 🚀 PERFORMANCE: Use cache with 5-minute TTL
    const categories = await wikiCache.get(
      WIKI_CACHE_KEYS.categories(),
      async () => {
        // 🚀 PERFORMANCE: Use _count to avoid loading all page data (fixes N+1 query)
        const categoriesData = await prisma.wikiCategory.findMany({
          where: { isActive: true },
          orderBy: { order: 'asc' },
          select: {
            id: true,
            name: true,
            nameEn: true,
            slug: true,
            description: true,
            icon: true,
            order: true,
            _count: {
              select: {
                pages: {
                  where: { isPublished: true },
                },
              },
            },
            pages: {
              where: { isPublished: true },
              orderBy: { order: 'asc' },
              select: {
                id: true,
                title: true,
                slug: true,
                excerpt: true,
                tags: true,
                viewCount: true,
                order: true,
              },
            },
          },
        });

        return categoriesData.map((cat) => ({
          id: cat.id,
          name: cat.name,
          nameEn: cat.nameEn,
          slug: cat.slug,
          description: cat.description,
          icon: cat.icon,
          order: cat.order,
          pageCount: cat._count.pages,
          pages: cat.pages,
        }));
      }
    );

    return { success: true, categories };
  }, 'getWikiCategories');
}

/**
 * Get single category with all its pages
 */
export async function getWikiCategory(slug: string): Promise<{
  success: boolean;
  category?: WikiCategoryWithPages;
  error?: string;
}> {
  return withServerActionErrorHandler(async () => {
    await requireSuperAdmin();

    const category = await prisma.wikiCategory.findUnique({
      where: { slug },
      include: {
        pages: {
          where: { isPublished: true },
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            tags: true,
            viewCount: true,
            order: true,
          },
        },
      },
    });

    if (!category) {
      return { success: false, error: 'Category not found' };
    }

    const categoryWithCount = {
      id: category.id,
      name: category.name,
      nameEn: category.nameEn,
      slug: category.slug,
      description: category.description,
      icon: category.icon,
      order: category.order,
      pageCount: category.pages.length,
      pages: category.pages,
    };

    return { success: true, category: categoryWithCount };
  }, 'getWikiCategory');
}

// ============================================
// PAGE ACTIONS
// ============================================

/**
 * Get single wiki page by slug
 */
export async function getWikiPage(slug: string): Promise<{
  success: boolean;
  page?: WikiPageFull;
  error?: string;
}> {
  return withServerActionErrorHandler(async () => {
    await requireSuperAdmin();

    const page = await prisma.wikiPage.findUnique({
      where: { slug },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!page || !page.isPublished) {
      return { success: false, error: 'Page not found' };
    }

    return { success: true, page };
  }, 'getWikiPage');
}

/**
 * Increment page view count
 */
export async function incrementWikiPageView(pageId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  return withServerActionErrorHandler(async () => {
    const user = await requireSuperAdmin();

    await prisma.wikiPage.update({
      where: { id: pageId },
      data: {
        viewCount: { increment: 1 },
        lastViewedBy: user.id,
        lastViewedAt: new Date(),
      },
    });

    // 🚀 PERFORMANCE: Invalidate affected caches after mutation
    wikiCache.invalidatePattern(/^wiki:popular:/); // Popular pages (viewCount changed)
    wikiCache.invalidatePattern(new RegExp(`^wiki:recent:.*:${user.id}$`)); // User's recent pages

    return { success: true };
  }, 'incrementWikiPageView');
}

/**
 * Get popular pages (most viewed)
 * 🚀 OPTIMIZED: Uses caching with 5-minute TTL
 */
export async function getPopularWikiPages(limit: number = 5): Promise<{
  success: boolean;
  pages?: WikiSearchResult[];
  error?: string;
}> {
  return withServerActionErrorHandler(async () => {
    await requireSuperAdmin();

    // 🚀 PERFORMANCE: Use cache with limit-specific key
    const pages = await wikiCache.get(
      WIKI_CACHE_KEYS.popularPages(limit),
      async () => {
        const pagesData = await prisma.wikiPage.findMany({
          where: { isPublished: true },
          orderBy: { viewCount: 'desc' },
          take: limit,
          select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            tags: true,
            category: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        });

        return pagesData.map((page) => ({
          id: page.id,
          title: page.title,
          slug: page.slug,
          excerpt: page.excerpt,
          categoryName: page.category.name,
          categorySlug: page.category.slug,
          tags: page.tags,
          matchedIn: 'title' as const,
        }));
      }
    );

    return { success: true, pages };
  }, 'getPopularWikiPages');
}

/**
 * Get recently viewed pages
 * 🚀 OPTIMIZED: Uses caching with user-specific key
 */
export async function getRecentWikiPages(limit: number = 5): Promise<{
  success: boolean;
  pages?: WikiSearchResult[];
  error?: string;
}> {
  return withServerActionErrorHandler(async () => {
    const user = await requireSuperAdmin();

    // 🚀 PERFORMANCE: Use cache with user-specific key (shorter TTL for recent pages)
    const pages = await wikiCache.get(
      `${WIKI_CACHE_KEYS.recentPages(limit)}:${user.id}`,
      async () => {
        const pagesData = await prisma.wikiPage.findMany({
          where: {
            isPublished: true,
            lastViewedBy: user.id,
            lastViewedAt: { not: null },
          },
          orderBy: { lastViewedAt: 'desc' },
          take: limit,
          select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            tags: true,
            category: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        });

        return pagesData.map((page) => ({
          id: page.id,
          title: page.title,
          slug: page.slug,
          excerpt: page.excerpt,
          categoryName: page.category.name,
          categorySlug: page.category.slug,
          tags: page.tags,
          matchedIn: 'title' as const,
        }));
      },
      60000 // 1-minute TTL for recent pages (more dynamic)
    );

    return { success: true, pages };
  }, 'getRecentWikiPages');
}

// ============================================
// SEARCH ACTIONS
// ============================================

/**
 * Search wiki pages by title, content, or tags
 */
export async function searchWiki(query: string): Promise<{
  success: boolean;
  results?: WikiSearchResult[];
  error?: string;
}> {
  return withServerActionErrorHandler(async () => {
    await requireSuperAdmin();

    if (!query || query.trim().length === 0) {
      return { success: true, results: [] };
    }

    const searchTerm = query.trim().toLowerCase();

    // Search in title (highest priority)
    const titleMatches = await prisma.wikiPage.findMany({
      where: {
        isPublished: true,
        title: { contains: searchTerm, mode: 'insensitive' },
      },
      include: {
        category: {
          select: { name: true, slug: true },
        },
      },
      take: 20,
    });

    // Search in content
    const contentMatches = await prisma.wikiPage.findMany({
      where: {
        isPublished: true,
        content: { contains: searchTerm, mode: 'insensitive' },
        NOT: {
          id: { in: titleMatches.map((p) => p.id) },
        },
      },
      include: {
        category: {
          select: { name: true, slug: true },
        },
      },
      take: 20,
    });

    // Search in tags
    const tagMatches = await prisma.wikiPage.findMany({
      where: {
        isPublished: true,
        tags: { has: searchTerm },
        NOT: {
          id: { in: [...titleMatches.map((p) => p.id), ...contentMatches.map((p) => p.id)] },
        },
      },
      include: {
        category: {
          select: { name: true, slug: true },
        },
      },
      take: 20,
    });

    // Combine results with priority
    const results: WikiSearchResult[] = [
      ...titleMatches.map((page) => ({
        id: page.id,
        title: page.title,
        slug: page.slug,
        excerpt: page.excerpt,
        categoryName: page.category.name,
        categorySlug: page.category.slug,
        tags: page.tags,
        matchedIn: 'title' as const,
      })),
      ...contentMatches.map((page) => ({
        id: page.id,
        title: page.title,
        slug: page.slug,
        excerpt: page.excerpt,
        categoryName: page.category.name,
        categorySlug: page.category.slug,
        tags: page.tags,
        matchedIn: 'content' as const,
      })),
      ...tagMatches.map((page) => ({
        id: page.id,
        title: page.title,
        slug: page.slug,
        excerpt: page.excerpt,
        categoryName: page.category.name,
        categorySlug: page.category.slug,
        tags: page.tags,
        matchedIn: 'tags' as const,
      })),
    ];

    return { success: true, results };
  }, 'searchWiki');
}

/**
 * Get pages by tag
 */
export async function getWikiPagesByTag(tag: string): Promise<{
  success: boolean;
  pages?: WikiSearchResult[];
  error?: string;
}> {
  return withServerActionErrorHandler(async () => {
    await requireSuperAdmin();

    const pages = await prisma.wikiPage.findMany({
      where: {
        isPublished: true,
        tags: { has: tag },
      },
      include: {
        category: {
          select: { name: true, slug: true },
        },
      },
      orderBy: { viewCount: 'desc' },
    });

    const results: WikiSearchResult[] = pages.map((page) => ({
      id: page.id,
      title: page.title,
      slug: page.slug,
      excerpt: page.excerpt,
      categoryName: page.category.name,
      categorySlug: page.category.slug,
      tags: page.tags,
      matchedIn: 'tags' as const,
    }));

    return { success: true, pages: results };
  }, 'getWikiPagesByTag');
}
