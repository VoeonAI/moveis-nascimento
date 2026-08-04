const DEFAULT_OG_IMAGE =
  'https://kbpkdnptzvsvoujirfwe.supabase.co/storage/v1/object/public/logo-variacoes/Mascote%203D%20-%20Moveis%20Nascimento.png';

const STORAGE_BUCKETS = ['product-images', 'products', 'images', 'produtos'];

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function shortDescription(value) {
  const text = String(value || 'Confira este produto da Móveis Nascimento.')
    .replace(/\s+/g, ' ')
    .trim();

  return text.length > 180 ? `${text.slice(0, 177).trimEnd()}...` : text;
}

function jsonForScript(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function publicSiteUrl(request) {
  const configuredUrl = process.env.PUBLIC_SITE_URL || process.env.VITE_PUBLIC_SITE_URL;
  if (configuredUrl) return configuredUrl.replace(/\/$/, '');

  const requestUrl = new URL(request.url);
  return `${requestUrl.protocol}//${requestUrl.host}`;
}

function firstImagePath(product) {
  const imageVariants = Array.isArray(product.product_image_variants)
    ? product.product_image_variants
    : [];
  const primaryVariant = imageVariants.find((image) => image?.is_primary && image?.image_url);

  if (primaryVariant?.image_url) return primaryVariant.image_url;
  const firstVariantImage = imageVariants.find((image) => image?.image_url);
  if (firstVariantImage?.image_url) return firstVariantImage.image_url;

  const images = Array.isArray(product.images) ? product.images : [];
  const firstImage = images.find((image) => {
    if (typeof image === 'string') return Boolean(image.trim());
    return Boolean(image?.image_url || image?.url);
  });
  if (typeof firstImage === 'string') return firstImage;
  if (firstImage && typeof firstImage === 'object') {
    return firstImage.image_url || firstImage.url || null;
  }

  return null;
}

function resolveProductImage(imagePath, supabaseUrl) {
  const source = String(imagePath || '').trim();
  if (!source) return DEFAULT_OG_IMAGE;
  if (/^https?:\/\//i.test(source)) return source;

  let bucket = 'product-images';
  let path = source.replace(/^\/+/, '');
  const matchedBucket = STORAGE_BUCKETS.find((candidate) => path.startsWith(`${candidate}/`));

  if (matchedBucket) {
    bucket = matchedBucket;
    path = path.slice(matchedBucket.length + 1);
  }

  if (!path) return DEFAULT_OG_IMAGE;

  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  return `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${bucket}/${encodedPath}`;
}

function errorPage(status, title, message) {
  return new Response(
    `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head><body><h1>${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p></body></html>`,
    {
      status,
      headers: { 'content-type': 'text/html; charset=utf-8', 'x-robots-tag': 'noindex' },
    },
  );
}

function logStep(step, details = {}) {
  console.log('[share-product]', step, details);
}

async function fetchSupabaseJson({ step, url, serviceRoleKey }) {
  logStep(step, { url: url.toString() });

  const response = await fetch(url, {
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
    },
  });

  logStep(`${step}:response`, { status: response.status, ok: response.ok });

  if (!response.ok) {
    const body = (await response.text()).slice(0, 500);
    console.error('[share-product] Supabase response error', {
      step,
      status: response.status,
      body,
    });
    throw new Error(`${step} failed with Supabase HTTP ${response.status}`);
  }

  return response.json();
}

export default {
  async fetch(request) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405, headers: { allow: 'GET, HEAD' } });
    }

    const requestUrl = new URL(request.url);
    const id = requestUrl.searchParams.get('id') || '';
    logStep('validate_env', { productId: id });
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      return errorPage(404, 'Produto não encontrado', 'O produto informado não está disponível.');
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    logStep('validate_env:values', {
      hasSupabaseUrl: Boolean(supabaseUrl),
      hasServiceRoleKey: Boolean(serviceRoleKey),
      serviceRoleKeyLength: serviceRoleKey?.length || 0,
    });
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('[share-product] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing');
      return errorPage(500, 'Compartilhamento indisponível', 'Não foi possível preparar a prévia deste produto.');
    }

    const productsUrl = new URL('/rest/v1/products', supabaseUrl);
    productsUrl.searchParams.set('select', 'id,name,description,images,active');
    productsUrl.searchParams.set('id', `eq.${id}`);
    productsUrl.searchParams.set('active', 'eq.true');
    productsUrl.searchParams.set('limit', '1');

    let product;
    try {
      const products = await fetchSupabaseJson({
        step: 'fetch_product',
        url: productsUrl,
        serviceRoleKey,
      });
      [product] = products;
    } catch (error) {
      console.error('[share-product] fetch_product error.message', error.message);
      console.error('[share-product] fetch_product error.stack', error.stack);
      return errorPage(502, 'Compartilhamento indisponível', 'Não foi possível consultar este produto agora.');
    }

    if (!product) {
      return errorPage(404, 'Produto não encontrado', 'O produto informado não está disponível.');
    }

    try {
      const variantsUrl = new URL('/rest/v1/product_variants', supabaseUrl);
      variantsUrl.searchParams.set('select', 'id,product_id,name,slug,is_default,created_at,updated_at');
      variantsUrl.searchParams.set('product_id', `eq.${id}`);

      const imageVariantsUrl = new URL('/rest/v1/product_image_variants', supabaseUrl);
      imageVariantsUrl.searchParams.set('select', 'id,product_id,image_url,variant_id,is_primary,created_at');
      imageVariantsUrl.searchParams.set('product_id', `eq.${id}`);

      const [, imageVariants] = await Promise.all([
        fetchSupabaseJson({ step: 'fetch_variants', url: variantsUrl, serviceRoleKey }),
        fetchSupabaseJson({ step: 'fetch_variants:image_variants', url: imageVariantsUrl, serviceRoleKey }),
      ]);
      product.product_image_variants = imageVariants;
    } catch (error) {
      console.error('[share-product] fetch_variants error.message', error.message);
      console.error('[share-product] fetch_variants error.stack', error.stack);
      return errorPage(502, 'Compartilhamento indisponível', 'Não foi possível consultar este produto agora.');
    }

    logStep('resolve_image');
    const siteUrl = publicSiteUrl(request);
    const productUrl = `${siteUrl}/product/${encodeURIComponent(product.id)}`;
    const shareUrl = `${siteUrl}/share/product/${encodeURIComponent(product.id)}`;
    const description = shortDescription(product.description);
    const imageUrl = resolveProductImage(firstImagePath(product), supabaseUrl);
    console.error('[share-product] Produto:', id);
    console.error('[share-product] Imagem:', imageUrl);
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description,
      image: imageUrl,
      url: productUrl,
    };

    logStep('build_html');
    const html = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(product.name)} | Móveis Nascimento</title>
    <meta name="description" content="${escapeHtml(description)}">
    <link rel="canonical" href="${escapeHtml(productUrl)}">
    <meta property="og:type" content="product">
    <meta property="og:title" content="${escapeHtml(product.name)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:image" content="${escapeHtml(imageUrl)}">
    <meta property="og:url" content="${escapeHtml(shareUrl)}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(product.name)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${escapeHtml(imageUrl)}">
    <script type="application/ld+json">${jsonForScript(jsonLd)}</script>
    <meta http-equiv="refresh" content="2;url=${escapeHtml(productUrl)}">
  </head>
  <body>
    <main>
      <h1>${escapeHtml(product.name)}</h1>
      <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(product.name)}" width="600">
      <p>${escapeHtml(description)}</p>
      <p><a href="${escapeHtml(productUrl)}">Ver produto</a></p>
    </main>
    <script>window.setTimeout(function(){ window.location.replace(${JSON.stringify(productUrl)}); }, 1500);</script>
  </body>
</html>`;

    return new Response(request.method === 'HEAD' ? null : html, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, s-maxage=300, stale-while-revalidate=86400',
      },
    });
  },
};
