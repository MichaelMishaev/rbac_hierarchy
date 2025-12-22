'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

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
 */
export async function getWikiCategories(): Promise<{
  success: boolean;
  categories?: WikiCategoryWithPages[];
  error?: string;
}> {
  try {
    await requireSuperAdmin();

    const categories = await prisma.wikiCategory.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
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

    const categoriesWithCount = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      nameEn: cat.nameEn,
      slug: cat.slug,
      description: cat.description,
      icon: cat.icon,
      order: cat.order,
      pageCount: cat.pages.length,
      pages: cat.pages,
    }));

    return { success: true, categories: categoriesWithCount };
  } catch (error) {
    console.error('Error fetching wiki categories:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch wiki categories',
    };
  }
}

/**
 * Get single category with all its pages
 */
export async function getWikiCategory(slug: string): Promise<{
  success: boolean;
  category?: WikiCategoryWithPages;
  error?: string;
}> {
  try {
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
  } catch (error) {
    console.error('Error fetching wiki category:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch wiki category',
    };
  }
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
  try {
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
  } catch (error) {
    console.error('Error fetching wiki page:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch wiki page',
    };
  }
}

/**
 * Increment page view count
 */
export async function incrementWikiPageView(pageId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const user = await requireSuperAdmin();

    await prisma.wikiPage.update({
      where: { id: pageId },
      data: {
        viewCount: { increment: 1 },
        lastViewedBy: user.id,
        lastViewedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error incrementing page view:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to increment view count',
    };
  }
}

/**
 * Get popular pages (most viewed)
 */
export async function getPopularWikiPages(limit: number = 5): Promise<{
  success: boolean;
  pages?: WikiSearchResult[];
  error?: string;
}> {
  try {
    await requireSuperAdmin();

    const pages = await prisma.wikiPage.findMany({
      where: { isPublished: true },
      orderBy: { viewCount: 'desc' },
      take: limit,
      include: {
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });

    const results: WikiSearchResult[] = pages.map((page) => ({
      id: page.id,
      title: page.title,
      slug: page.slug,
      excerpt: page.excerpt,
      categoryName: page.category.name,
      categorySlug: page.category.slug,
      tags: page.tags,
      matchedIn: 'title' as const,
    }));

    return { success: true, pages: results };
  } catch (error) {
    console.error('Error fetching popular pages:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch popular pages',
    };
  }
}

/**
 * Get recently viewed pages
 */
export async function getRecentWikiPages(limit: number = 5): Promise<{
  success: boolean;
  pages?: WikiSearchResult[];
  error?: string;
}> {
  try {
    const user = await requireSuperAdmin();

    const pages = await prisma.wikiPage.findMany({
      where: {
        isPublished: true,
        lastViewedBy: user.id,
        lastViewedAt: { not: null },
      },
      orderBy: { lastViewedAt: 'desc' },
      take: limit,
      include: {
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });

    const results: WikiSearchResult[] = pages.map((page) => ({
      id: page.id,
      title: page.title,
      slug: page.slug,
      excerpt: page.excerpt,
      categoryName: page.category.name,
      categorySlug: page.category.slug,
      tags: page.tags,
      matchedIn: 'title' as const,
    }));

    return { success: true, pages: results };
  } catch (error) {
    console.error('Error fetching recent pages:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch recent pages',
    };
  }
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
  try {
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
  } catch (error) {
    console.error('Error searching wiki:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search wiki',
    };
  }
}

/**
 * Get pages by tag
 */
export async function getWikiPagesByTag(tag: string): Promise<{
  success: boolean;
  pages?: WikiSearchResult[];
  error?: string;
}> {
  try {
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
  } catch (error) {
    console.error('Error fetching pages by tag:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch pages by tag',
    };
  }
}
