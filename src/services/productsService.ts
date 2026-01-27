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
    let query = supabase
      .from('products')
      .select(`
        *,
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

    if (error) throw error;

    // Transform data to include categories array
    return (data || []).map(product => ({
      ...product,
      categories: product.product_categories?.map((pc: any) => pc.categories) || [],
    }));
  },

  async getProductById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_categories (
          categories (*)
        )
      `)
      .eq('id', id)
      .eq('active', true)
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      ...data,
      categories: data.product_categories?.map((pc: any) => pc.categories) || [],
    };
  },

  async listAllProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
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