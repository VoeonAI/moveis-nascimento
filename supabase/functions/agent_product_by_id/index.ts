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

    // Get product ID from URL
    const url = new URL(req.url)
    const productId = url.searchParams.get('id')

    if (!productId) {
      return new Response(
        JSON.stringify({ error: 'Missing id parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get public site URL from env
    const publicSiteUrl = Deno.env.get('PUBLIC_SITE_URL') || ''

    // Fetch product
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        active,
        images,
        metadata,
        product_categories (
          categories (id, name, slug)
        )
      `)
      .eq('id', productId)
      .eq('active', true)
      .single()

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Product not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!product) {
      return new Response(
        JSON.stringify({ error: 'Product not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Transform response
    const categories = product.product_categories?.map((pc: any) => ({
      id: pc.categories.id,
      name: pc.categories.name,
      slug: pc.categories.slug,
    })) || []

    const transformedProduct = {
      id: product.id,
      name: product.name,
      description: product.description,
      images: product.images || [],
      categories,
      public_url: publicSiteUrl 
        ? `${publicSiteUrl}/product/${product.id}`
        : `/product/${product.id}`,
    }

    return new Response(
      JSON.stringify({
        ok: true,
        product: transformedProduct,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[agent_product_by_id] Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})