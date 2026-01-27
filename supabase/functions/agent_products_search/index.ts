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
    const limit = parseInt(url.searchParams.get('limit') || '10')

    // Build query
    let query = supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        price,
        active,
        product_categories (
          categories (slug)
        )
      `)
      .eq('active', true)
      .limit(limit)

    // Filter by category
    if (category) {
      query = query.contains('product_categories.categories.slug', category)
    }

    // Filter by search query
    if (q) {
      query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`)
    }

    const { data: products, error } = await query

    if (error) throw error

    // Transform response
    const transformedProducts = (products || []).map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      category_slug: product.product_categories?.[0]?.categories?.slug || null,
      site_url: `/product/${product.id}`,
    }))

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