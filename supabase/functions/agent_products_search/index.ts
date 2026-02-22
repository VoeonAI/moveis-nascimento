import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, x-agent-token, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get agent token from header
    const agentToken = req.headers.get('x-agent-token')
    
    if (!agentToken) {
      return new Response(
        JSON.stringify({ error: 'Missing x-agent-token header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Validate token and check scopes
    const { data: tokenData, error: tokenError } = await supabase
      .from('agent_tokens')
      .select('*')
      .eq('token_hash', agentToken)
      .eq('active', true)
      .single()

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ error: 'Invalid or inactive token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if token has products:read scope
    if (!tokenData.scopes.includes('products:read')) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update last_used_at
    await supabase
      .from('agent_tokens')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', tokenData.id)

    // Parse query params
    const url = new URL(req.url)
    const q = url.searchParams.get('q') || ''
    const category = url.searchParams.get('category') || ''
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50)

    // Get public site URL from env
    const publicSiteUrl = Deno.env.get('PUBLIC_SITE_URL') || ''

    // Build category filter
    let categorySlugs: string[] = []
    
    if (category) {
      // Check if category is a root category (parent_id is null)
      const { data: categoryData } = await supabase
        .from('categories')
        .select('id, slug, parent_id')
        .eq('slug', category)
        .single()
      
      if (categoryData) {
        if (!categoryData.parent_id) {
          // Root category: include all subcategories
          const { data: subCategories } = await supabase
            .from('categories')
            .select('slug')
            .eq('parent_id', categoryData.id)
          
          categorySlugs = [categoryData.slug]
          if (subCategories) {
            categorySlugs = categorySlugs.concat(subCategories.map((sc: any) => sc.slug))
          }
        } else {
          // Subcategory: use only this category
          categorySlugs = [categoryData.slug]
        }
      }
    }

    // Build query
    let query = supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        active,
        images,
        product_categories (
          categories (id, name, slug)
        )
      `)
      .eq('active', true)
      .limit(limit)

    // Filter by category (using contains for array of slugs)
    if (categorySlugs.length > 0) {
      query = query.contains('product_categories.categories.slug', categorySlugs)
    }

    // Filter by search query
    if (q) {
      query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`)
    }

    const { data: products, error } = await query

    if (error) throw error

    // Transform response
    const transformedProducts = (products || []).map(product => {
      // Get first image if available
      const image = product.images && product.images.length > 0 ? product.images[0] : null
      
      // Get category info (first category)
      const categoryInfo = product.product_categories?.[0]?.categories || null
      
      // Truncate description to 200 chars
      const shortDescription = product.description 
        ? (product.description.length > 200 
            ? product.description.substring(0, 200) + '...' 
            : product.description)
        : ''

      // Build public URL
      const publicUrl = publicSiteUrl 
        ? `${publicSiteUrl}/product/${product.id}`
        : `/product/${product.id}`

      return {
        id: product.id,
        name: product.name,
        short_description: shortDescription,
        category_slug: categoryInfo?.slug || null,
        category_name: categoryInfo?.name || null,
        image,
        public_url: publicUrl,
      }
    })

    return new Response(
      JSON.stringify({
        ok: true,
        products: transformedProducts,
        count: transformedProducts.length,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[agent_products_search] Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})