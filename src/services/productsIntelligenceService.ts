import { supabase } from '@/core/supabaseClient';

export interface MostWorkedProduct {
  id: string;
  name: string;
  category_name: string | null;
  opportunity_count: number;
}

export interface ProductWithoutActivity {
  id: string;
  name: string;
  category_name: string | null;
}

export interface CategoryDistribution {
  category_name: string;
  opportunity_count: number;
}

export interface ProductsOverview {
  totalActiveProducts: number;
  productsWithOpportunities: number;
  productsWithoutActivity: number;
}

export const productsIntelligenceService = {
  async getOverview(): Promise<ProductsOverview> {
    try {
      // Get total active products
      const { count: totalActiveProducts, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('active', true);

      if (productsError) {
        console.error('[productsIntelligenceService.getOverview] products:', productsError.message);
      }

      // Get products with opportunities
      const { count: productsWithOpportunities, error: oppsError } = await supabase
        .from('opportunities')
        .select('product_id', { count: 'exact', head: true })
        .not('product_id', 'is', null);

      if (oppsError) {
        console.error('[productsIntelligenceService.getOverview] opportunities:', oppsError.message);
      }

      // Products without activity = total active - with opportunities
      const productsWithoutActivity = (totalActiveProducts || 0) - (productsWithOpportunities || 0);

      return {
        totalActiveProducts: totalActiveProducts || 0,
        productsWithOpportunities: productsWithOpportunities || 0,
        productsWithoutActivity: Math.max(0, productsWithoutActivity),
      };
    } catch (error) {
      console.error('[productsIntelligenceService.getOverview]', error);
      return {
        totalActiveProducts: 0,
        productsWithOpportunities: 0,
        productsWithoutActivity: 0,
      };
    }
  },

  async getMostWorkedProducts(limit: number = 10): Promise<MostWorkedProduct[]> {
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select(`
          product_id,
          products (
            id,
            name,
            product_categories (
              categories (name)
            )
          )
        `)
        .not('product_id', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by product and count opportunities
      const productCounts = (data || []).reduce((acc, opp) => {
        const productId = opp.product_id;
        const product = opp.products;
        
        if (!product) return acc;

        if (!acc[productId]) {
          acc[productId] = {
            id: product.id,
            name: product.name,
            category_name: product.product_categories?.[0]?.categories?.name || 'Sem categoria',
            opportunity_count: 0,
          };
        }
        
        acc[productId].opportunity_count++;
        return acc;
      }, {} as Record<string, MostWorkedProduct>);

      // Sort by opportunity count and limit
      return Object.values(productCounts)
        .sort((a, b) => b.opportunity_count - a.opportunity_count)
        .slice(0, limit);
    } catch (error) {
      console.error('[productsIntelligenceService.getMostWorkedProducts]', error);
      return [];
    }
  },

  async getProductsWithoutActivity(): Promise<ProductWithoutActivity[]> {
    try {
      // Get all active products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select(`
          id,
          name,
          product_categories (
            categories (name)
          )
        `)
        .eq('active', true)
        .order('name', { ascending: true });

      if (productsError) throw productsError;

      // Get all products with opportunities
      const { data: opportunities, error: oppsError } = await supabase
        .from('opportunities')
        .select('product_id')
        .not('product_id', 'is', null);

      if (oppsError) throw oppsError;

      // Create set of product IDs with opportunities
      const productIdsWithOpps = new Set(
        (opportunities || []).map(o => o.product_id)
      );

      // Filter products without opportunities
      return (products || [])
        .filter(p => !productIdsWithOpps.has(p.id))
        .map(p => ({
          id: p.id,
          name: p.name,
          category_name: p.product_categories?.[0]?.categories?.name || 'Sem categoria',
        }));
    } catch (error) {
      console.error('[productsIntelligenceService.getProductsWithoutActivity]', error);
      return [];
    }
  },

  async getCategoryDistribution(): Promise<CategoryDistribution[]> {
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select(`
          product_id,
          products (
            product_categories (
              categories (id, name)
            )
          )
        `)
        .not('product_id', 'is', null);

      if (error) throw error;

      // Group by category
      const categoryCounts = (data || []).reduce((acc, opp) => {
        const categories = opp.products?.product_categories || [];
        
        categories.forEach(pc => {
          const category = pc.categories;
          if (!category) return;

          if (!acc[category.id]) {
            acc[category.id] = {
              category_name: category.name,
              opportunity_count: 0,
            };
          }
          
          acc[category.id].opportunity_count++;
        });
        
        return acc;
      }, {} as Record<string, CategoryDistribution>);

      // Sort by opportunity count
      return Object.values(categoryCounts)
        .sort((a, b) => b.opportunity_count - a.opportunity_count);
    } catch (error) {
      console.error('[productsIntelligenceService.getCategoryDistribution]', error);
      return [];
    }
  },
};