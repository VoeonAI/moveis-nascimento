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

export interface BestSellingProduct {
  id: string;
  name: string;
  category_name: string | null;
  sales_count: number;
}

export interface ProductConversion {
  id: string;
  name: string;
  category_name: string | null;
  opportunities_count: number;
  sales_count: number;
  conversion_rate: number;
}

export interface ProductsOverview {
  totalActiveProducts: number;
  productsWithOpportunities: number;
  productsWithoutActivity: number;
}

export interface SalesOverview {
  totalSales: number;
  averageConversionRate: number;
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

  async getSalesOverview(): Promise<SalesOverview> {
    try {
      // Get total delivered orders
      const { count: totalSales, error: salesError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('current_stage', 'delivered');

      if (salesError) {
        console.error('[productsIntelligenceService.getSalesOverview] sales:', salesError.message);
      }

      // Get conversion data
      const { data: conversions, error: conversionError } = await supabase
        .from('opportunities')
        .select('product_id')
        .not('product_id', 'is', null);

      if (conversionError) {
        console.error('[productsIntelligenceService.getSalesOverview] conversions:', conversionError.message);
      }

      // Calculate average conversion rate
      let averageConversionRate = 0;
      if (conversions && conversions.length > 0) {
        const productIds = [...new Set(conversions.map(c => c.product_id))];
        
        // Get sales per product
        const { data: orders } = await supabase
          .from('orders')
          .select('opportunity_id')
          .eq('current_stage', 'delivered');

        const opportunityIds = orders?.map(o => o.opportunity_id) || [];
        
        // Get product for each opportunity
        const { data: oppsWithProduct } = await supabase
          .from('opportunities')
          .select('product_id')
          .in('id', opportunityIds);

        const soldProductIds = oppsWithProduct?.map(o => o.product_id) || [];
        
        if (productIds.length > 0) {
          averageConversionRate = (soldProductIds.length / productIds.length) * 100;
        }
      }

      return {
        totalSales: totalSales || 0,
        averageConversionRate: Math.round(averageConversionRate * 100) / 100,
      };
    } catch (error) {
      console.error('[productsIntelligenceService.getSalesOverview]', error);
      return {
        totalSales: 0,
        averageConversionRate: 0,
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

  async getBestSellingProducts(limit: number = 10): Promise<BestSellingProduct[]> {
    try {
      // Get delivered orders with product info
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          opportunities (
            product_id,
            products (
              id,
              name,
              product_categories (
                categories (name)
              )
            )
          )
        `)
        .eq('current_stage', 'delivered');

      if (error) throw error;

      // Group by product and count sales
      const productSales = (data || []).reduce((acc, order) => {
        const product = order.opportunities?.products;
        if (!product) return acc;

        if (!acc[product.id]) {
          acc[product.id] = {
            id: product.id,
            name: product.name,
            category_name: product.product_categories?.[0]?.categories?.name || 'Sem categoria',
            sales_count: 0,
          };
        }
        
        acc[product.id].sales_count++;
        return acc;
      }, {} as Record<string, BestSellingProduct>);

      // Sort by sales count and limit
      return Object.values(productSales)
        .sort((a, b) => b.sales_count - a.sales_count)
        .slice(0, limit);
    } catch (error) {
      console.error('[productsIntelligenceService.getBestSellingProducts]', error);
      return [];
    }
  },

  async getConversionByProduct(): Promise<ProductConversion[]> {
    try {
      // Get all opportunities with product info
      const { data: opportunities, error: oppsError } = await supabase
        .from('opportunities')
        .select(`
          id,
          product_id,
          products (
            id,
            name,
            product_categories (
              categories (name)
            )
          )
        `)
        .not('product_id', 'is', null);

      if (oppsError) throw oppsError;

      // Get all delivered orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('opportunity_id')
        .eq('current_stage', 'delivered');

      if (ordersError) throw ordersError;

      // Create set of delivered opportunity IDs
      const deliveredOppIds = new Set(orders?.map(o => o.opportunity_id) || []);

      // Group by product and calculate conversion
      const productConversions = (opportunities || []).reduce((acc, opp) => {
        const product = opp.products;
        if (!product) return acc;

        if (!acc[product.id]) {
          acc[product.id] = {
            id: product.id,
            name: product.name,
            category_name: product.product_categories?.[0]?.categories?.name || 'Sem categoria',
            opportunities_count: 0,
            sales_count: 0,
            conversion_rate: 0,
          };
        }
        
        acc[product.id].opportunities_count++;
        
        if (deliveredOppIds.has(opp.id)) {
          acc[product.id].sales_count++;
        }
        
        return acc;
      }, {} as Record<string, ProductConversion>);

      // Calculate conversion rates
      Object.values(productConversions).forEach(product => {
        if (product.opportunities_count > 0) {
          product.conversion_rate = (product.sales_count / product.opportunities_count) * 100;
        }
      });

      // Sort by sales count
      return Object.values(productConversions)
        .sort((a, b) => b.sales_count - a.sales_count);
    } catch (error) {
      console.error('[productsIntelligenceService.getConversionByProduct]', error);
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