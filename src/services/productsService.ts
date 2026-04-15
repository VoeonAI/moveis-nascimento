import { supabase } from '@/core/supabaseClient';
import { Category } from './categoriesService';

export interface ProductVariantImage {
  id: string;
  variant_id: string;
  image_url: string;
  sort_order: number;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  slug: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  images?: ProductVariantImage[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price?: number;
  image_url?: string;
  is_public?: boolean;
  is_active?: boolean;
  active: boolean;
  images: any[];
  metadata: any;
  featured: boolean;
  on_promotion: boolean;
  created_at: string;
  categories?: Category[];
  variants?: ProductVariant[];
}

export interface ProductsFilter {
  q?: string;
  categorySlug?: string;
}

export const productsService = {
  async listPublicProducts(filter?: ProductsFilter): Promise<Product[]> {
    try {
      let query = supabase
        .from('products')
        .select(`
          id, name, description, images, metadata, active, featured, on_promotion,
          product_categories (
            categories (*)
          ),
          product_variants (
            id, product_id, name, slug, is_default, created_at, updated_at,
            product_variant_images (
              id, variant_id, image_url, sort_order, created_at
            )
          )
        `)
        .eq('active', true)
        .order('created_at', { ascending: false });

      // Filter by category slug
      if (filter?.categorySlug) {
        query = query.contains('product_categories.categories.slug', filter.categorySlug);
      }

      // Filter by search query (name or description)
      if (filter?.q) {
        query = query.or(`name.ilike.%${filter.q}%,description.ilike.%${filter.q}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[productsService.listPublicProducts] Query error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        return [];
      }

      // Transform data to include categories array and variants
      return (data || []).map((product: any) => {
        // Transform variants
        const variants = (product.product_variants || []).map((v: any) => ({
          ...v,
          images: v.product_variant_images || [],
          product_variant_images: undefined,
        }));

        // Sort variants: default first, then by name
        variants.sort((a: ProductVariant, b: ProductVariant) => {
          if (a.is_default) return -1;
          if (b.is_default) return 1;
          return a.name.localeCompare(b.name);
        });

        // Sort images within each variant
        variants.forEach((v: ProductVariant) => {
          if (v.images) {
            v.images.sort((a, b) => a.sort_order - b.sort_order);
          }
        });

        return {
          id: product.id,
          name: product.name,
          description: product.description,
          images: product.images,
          metadata: product.metadata,
          active: product.active,
          featured: product.featured,
          on_promotion: product.on_promotion,
          created_at: product.created_at,
          categories: product.product_categories?.map((pc: any) => pc.categories) || [],
          variants,
        };
      });
    } catch (error: any) {
      console.error('[productsService.listPublicProducts] Unexpected error:', error);
      return [];
    }
  },

  async getProductById(id: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id, name, description, images, metadata, active, featured, on_promotion, created_at,
          product_categories (
            categories (*)
          ),
          product_variants (
            id, product_id, name, slug, is_default, created_at, updated_at,
            product_variant_images (
              id, variant_id, image_url, sort_order, created_at
            )
          )
        `)
        .eq('id', id)
        .eq('active', true)
        .single();

      if (error) {
        console.error('[productsService.getProductById] Query error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        return null;
      }
      if (!data) return null;

      // Transform variants to include images array
      const variants = (data.product_variants || []).map((v: any) => ({
        ...v,
        images: v.product_variant_images || [],
        product_variant_images: undefined, // Remove nested property
      }));

      // Sort variants: default first, then by name
      variants.sort((a: ProductVariant, b: ProductVariant) => {
        if (a.is_default) return -1;
        if (b.is_default) return 1;
        return a.name.localeCompare(b.name);
      });

      // Sort images within each variant by sort_order
      variants.forEach((v: ProductVariant) => {
        if (v.images) {
          v.images.sort((a, b) => a.sort_order - b.sort_order);
        }
      });

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        images: data.images,
        metadata: data.metadata,
        active: data.active,
        featured: data.featured,
        on_promotion: data.on_promotion,
        created_at: data.created_at,
        categories: data.product_categories?.map((pc: any) => pc.categories) || [],
        variants,
      };
    } catch (error: any) {
      console.error('[productsService.getProductById] Unexpected error:', error);
      return null;
    }
  },

  async listAllProducts(filter?: ProductsFilter): Promise<Product[]> {
    try {
      let query = supabase
        .from('products')
        .select(`
          id, name, description, images, metadata, active, featured, on_promotion,
          product_categories (
            categories (*)
          ),
          product_variants (
            id, product_id, name, slug, is_default, created_at, updated_at,
            product_variant_images (
              id, variant_id, image_url, sort_order, created_at
            )
          )
        `)
        .eq('active', true)
        .order('created_at', { ascending: false });

      // Filter by category slug
      if (filter?.categorySlug) {
        query = query.contains('product_categories.categories.slug', filter.categorySlug);
      }

      // Filter by search query
      if (filter?.q) {
        query = query.or(`name.ilike.%${filter.q}%,description.ilike.%${filter.q}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[productsService.listAllProducts] Query error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        return [];
      }

      // Transform data to include categories array and variants
      return (data || []).map((product: any) => {
        // Transform variants
        const variants = (product.product_variants || []).map((v: any) => ({
          ...v,
          images: v.product_variant_images || [],
          product_variant_images: undefined,
        }));

        // Sort variants: default first, then by name
        variants.sort((a: ProductVariant, b: ProductVariant) => {
          if (a.is_default) return -1;
          if (b.is_default) return 1;
          return a.name.localeCompare(b.name);
        });

        // Sort images within each variant
        variants.forEach((v: ProductVariant) => {
          if (v.images) {
            v.images.sort((a, b) => a.sort_order - b.sort_order);
          }
        });

        return {
          id: product.id,
          name: product.name,
          description: product.description,
          images: product.images,
          metadata: product.metadata,
          active: product.active,
          featured: product.featured,
          on_promotion: product.on_promotion,
          created_at: product.created_at,
          categories: product.product_categories?.map((pc: any) => pc.categories) || [],
          variants,
        };
      });
    } catch (error: any) {
      console.error('[productsService.listAllProducts] Unexpected error:', error);
      return [];
    }
  },

  async createProduct(product: Omit<Product, 'id' | 'created_at'>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update(product)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};