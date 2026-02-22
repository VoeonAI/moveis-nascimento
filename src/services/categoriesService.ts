import { supabase } from '@/core/supabaseClient';

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
}

export const categoriesService = {
  async listCategories(): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('[categoriesService.listCategories]', error.message);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('[categoriesService.listCategories]', error);
      return [];
    }
  },

  async listActiveCategories(): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('[categoriesService.listActiveCategories]', error.message);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('[categoriesService.listActiveCategories]', error);
      return [];
    }
  },

  async getCategoryTree(): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      const categories = data || [];
      // Simple flat list for now, UI can handle hierarchy
      return categories;
    } catch (error) {
      console.error('[categoriesService.getCategoryTree]', error);
      return [];
    }
  },

  async upsertCategory(category: Partial<Category> & { name: string; slug: string }): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .upsert(category)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteCategory(id: string): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async setProductCategories(productId: string, categoryIds: string[]): Promise<void> {
    // First, remove all existing categories for this product
    await supabase
      .from('product_categories')
      .delete()
      .eq('product_id', productId);

    // Then insert new associations
    if (categoryIds.length > 0) {
      const { error } = await supabase
        .from('product_categories')
        .insert(
          categoryIds.map(categoryId => ({
            product_id: productId,
            category_id: categoryId,
          }))
        );

      if (error) throw error;
    }
  },

  async getProductCategories(productId: string): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('categories(*)')
        .eq('product_id', productId);

      if (error) {
        console.error('[categoriesService.getProductCategories]', error.message);
        return [];
      }
      return data?.map(pc => pc.categories as Category) || [];
    } catch (error) {
      console.error('[categoriesService.getProductCategories]', error);
      return [];
    }
  },
};