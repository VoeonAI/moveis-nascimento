import { supabase } from '@/core/supabaseClient';

export interface Category {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export const categoriesService = {
  async listCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
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
    const { data, error } = await supabase
      .from('product_categories')
      .select('categories(*)')
      .eq('product_id', productId);

    if (error) throw error;
    return data?.map(pc => pc.categories as Category) || [];
  },
};