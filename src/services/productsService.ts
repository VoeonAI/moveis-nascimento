import { supabase } from '@/core/supabaseClient';
import { Category } from './categoriesService';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  is_public: boolean;
  active: boolean;
  images: any[];
  metadata: any;
  created_at: string;
  categories?: Category[];
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
          id, name, description, images, metadata, active,
          product_categories (
            categories (*)
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
        console.error('[productsService.listPublicProducts]', error.message);
        return [];
      }

      // Transform data to include categories array
      return (data || []).map(product => ({
        ...product,
        categories: product.product_categories?.map((pc: any) => pc.categories) || [],
      }));
    } catch (error) {
      console.error('[productsService.listPublicProducts]', error);
      return [];
    }
  },

  async getProductById(id: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id, name, description, images, metadata, active,
          product_categories (
            categories (*)
          )
        `)
        .eq('id', id)
        .eq('active', true)
        .single();

      if (error) {
        console.error('[productsService.getProductById]', error.message);
        return null;
      }
      if (!data) return null;

      return {
        ...data,
        categories: data.product_categories?.map((pc: any) => pc.categories) || [],
      };
    } catch (error) {
      console.error('[productsService.getProductById]', error);
      return null;
    }
  },

  async listAllProducts(filter?: ProductsFilter): Promise<Product[]> {
    try {
      let query = supabase
        .from('products')
        .select(`
          id, name, description, images, metadata, active,
          product_categories (
            categories (*)
          )
        `)
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
        console.error('[productsService.listAllProducts]', error.message);
        return [];
      }

      // Transform data to include categories array
      return (data || []).map(product => ({
        ...product,
        categories: product.product_categories?.map((pc: any) => pc.categories) || [],
      }));
    } catch (error) {
      console.error('[productsService.listAllProducts]', error);
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