import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  isInitializeRequest,
} from '@modelcontextprotocol/sdk/types.js';

const PORT = Number(process.env.PORT || process.env.MCP_PORT || 3030);
const HOST = process.env.MCP_HOST || '0.0.0.0';
const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const MCP_AUTH_TOKEN = process.env.MCP_AUTH_TOKEN || '';
const PUBLIC_SITE_URL = (process.env.PUBLIC_SITE_URL || '').replace(/\/$/, '');

const REST_URL = SUPABASE_URL ? `${SUPABASE_URL}/rest/v1` : '';
const transports = new Map();

const ORDER_STAGE_LABELS = {
  order_created: 'Pedido Criado',
  preparing_order: 'Preparando Pedido',
  assembly: 'Em Montagem',
  ready_to_ship: 'Pronto para Envio',
  delivery_route: 'Em Rota de Entrega',
  delivered: 'Entregue',
  canceled: 'Cancelado',
};

const tools = [
  {
    name: 'search_products',
    description: 'Busca produtos ativos no catalogo por termo, categoria e limite.',
    inputSchema: {
      type: 'object',
      properties: {
        q: {
          type: 'string',
          description: 'Texto livre da busca. Ex: guarda-roupa branco, sofa retratil, mesa de jantar',
        },
      },
    },
  },
  {
    name: 'get_product_details',
    description: 'Busca detalhes de um produto especifico por ID.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'UUID do produto.' },
      },
    },
  },
  {
    name: 'register_customer_interest',
    description: 'Cria ou reutiliza lead pelo telefone e registra interesse do cliente na timeline.',
    inputSchema: {
      type: 'object',
      properties: {
        customer_name: { type: 'string', description: 'Nome do cliente, se conhecido.' },
        customer_phone: { type: 'string', description: 'Telefone do cliente em qualquer formato.' },
        message: { type: 'string', description: 'Resumo claro do interesse do cliente.' },
        product_id: { type: 'string', description: 'UUID do produto, se houver.' },
        product_name: { type: 'string', description: 'Nome do produto, se houver.' },
        category_slug: { type: 'string', description: 'Slug da categoria, se houver.' },
        intent: { type: 'string', description: 'Intencao de negocio. Padrao catalog_interest.' },
        source: { type: 'string', description: 'Origem. Padrao n8n.' },
      },
    },
  },
  {
    name: 'add_lead_note',
    description: 'Adiciona uma nota na timeline de um lead existente.',
    inputSchema: {
      type: 'object',
      properties: {
        lead_id: { type: 'string', description: 'UUID do lead.' },
        message: { type: 'string', description: 'Nota a registrar.' },
      },
    },
  },
  {
    name: 'find_lead_by_phone',
    description: 'Busca um lead/cliente existente pelo telefone ou WhatsApp, sem criar ou alterar dados.',
    inputSchema: {
      type: 'object',
      properties: {
        phone: {
          type: 'string',
          description: 'Telefone ou WhatsApp do cliente. Ex: 47999999999',
        },
      },
    },
  },
  {
    name: 'get_customer_commercial_history',
    description: 'Busca o historico comercial completo do cliente pelo telefone, incluindo lead, oportunidades e pedidos.',
    inputSchema: {
      type: 'object',
      properties: {
        phone: {
          type: 'string',
          description: 'Telefone ou WhatsApp do cliente. Ex: 47999999999',
        },
      },
    },
  },
  {
    name: 'get_category_link',
    description: 'Busca o link publico de uma categoria do catalogo por termo generico.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Categoria ou termo generico buscado pelo cliente. Ex: guarda roupa, sofa, mesa, painel',
        },
      },
    },
  },
  {
    name: 'get_customer_memory',
    description: 'Busca a memoria longa comercial de um cliente pelo telefone.',
    inputSchema: {
      type: 'object',
      properties: {
        phone: {
          type: 'string',
          description: 'Telefone ou WhatsApp do cliente. Ex: 47999999999',
        },
      },
    },
  },
  {
    name: 'add_memory_event',
    description: 'Registra um evento relevante de memoria longa comercial do cliente.',
    inputSchema: {
      type: 'object',
      properties: {
        phone: {
          type: 'string',
          description: 'Telefone ou WhatsApp do cliente. Ex: 47999999999',
        },
        message: {
          type: 'string',
          description: 'Fato relevante para lembrar no futuro. Ex: cliente prefere moveis claros',
        },
        message_type: {
          type: 'string',
          description: 'Tipo do evento. Ex: preference, family, budget, urgency, product_interest, objection, location',
        },
        session_id: {
          type: 'string',
          description: 'ID da sessao/conversa, se disponivel',
        },
        metadata: {
          type: 'string',
          description: 'JSON opcional em texto com detalhes estruturados. Ex: {"color":"branco"}',
        },
      },
    },
  },
  {
    name: 'request_human_attendant',
    description: 'Registra o pedido de atendimento humano, cria/reutiliza lead quando necessario e marca o lead como talking_human.',
    inputSchema: {
      type: 'object',
      properties: {
        lead_id: { type: 'string', description: 'UUID do lead, se ja conhecido.' },
        customer_name: { type: 'string', description: 'Nome do cliente, se conhecido.' },
        customer_phone: { type: 'string', description: 'Telefone do cliente. Obrigatorio se lead_id nao for informado.' },
        message: { type: 'string', description: 'Mensagem/resumo do motivo para atendimento humano.' },
        product_id: { type: 'string', description: 'UUID do produto relacionado, se houver.' },
      },
    },
  },
  {
    name: 'find_recent_orders_by_phone',
    description: 'Busca pedidos recentes dos ultimos 90 dias pelo telefone do cliente.',
    inputSchema: {
      type: 'object',
      properties: {
        phone: { type: 'string', description: 'Telefone do cliente em qualquer formato.' },
      },
    },
  },
  {
    name: 'get_order_status',
    description: 'Consulta o status de um pedido especifico por order_id.',
    inputSchema: {
      type: 'object',
      properties: {
        order_id: { type: 'string', description: 'UUID do pedido.' },
      },
    },
  },
  {
    name: 'search_installers',
    description: 'Busca montadores ativos, opcionalmente por cidade.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

function sendJson(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type, x-mcp-token',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  });
  res.end(JSON.stringify(body));
}

function isAuthorized(req) {
  if (!MCP_AUTH_TOKEN) return false;
  const authorization = req.headers.authorization || '';
  const mcpToken = req.headers['x-mcp-token'] || '';
  return authorization === `Bearer ${MCP_AUTH_TOKEN}` || mcpToken === MCP_AUTH_TOKEN;
}

function unauthorized(res) {
  const message = MCP_AUTH_TOKEN ? 'Unauthorized MCP request' : 'MCP_AUTH_TOKEN is required';
  sendJson(res, 401, { error: message });
}

function assertSupabaseConfig() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  }
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1024 * 1024) {
        req.destroy();
        reject(new Error('Request body too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : null);
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function asToolContent(data) {
  return {
    content: [
      {
        type: 'text',
        text: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
      },
    ],
  };
}

function clampLimit(value, fallback = 10) {
  const limit = Number(value === undefined || value === null || value === '' ? fallback : value);
  if (!Number.isFinite(limit)) return fallback;
  return Math.max(1, Math.min(50, Math.trunc(limit)));
}

function cleanString(value, fallback = '') {
  if (value === undefined || value === null) return fallback;
  return String(value).trim();
}

function optionalString(value) {
  const cleaned = cleanString(value);
  return cleaned || undefined;
}

function normalizeCategory(value) {
  const category = cleanString(value);
  if (!category || category.toLowerCase() === 'all' || category.toLowerCase() === 'todos') return '';
  return category;
}

function normalizeBrazilPhone(input = '') {
  const digits = String(input).replace(/\D/g, '');
  let canonical = digits;

  if (digits.length === 10 || digits.length === 11) {
    canonical = `55${digits}`;
  } else if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    canonical = digits;
  }

  const variants = new Set();
  if (canonical) variants.add(canonical);

  const withoutCountryCode = canonical.startsWith('55') && (canonical.length === 12 || canonical.length === 13)
    ? canonical.slice(2)
    : canonical;

  if (withoutCountryCode) variants.add(withoutCountryCode);
  if (withoutCountryCode.length === 11) variants.add(withoutCountryCode.slice(-11));

  return {
    canonical,
    variants: [...variants],
  };
}

function phoneVariantsFilter(variants) {
  return `in.(${variants.join(',')})`;
}

function publicProductUrl(id) {
  return PUBLIC_SITE_URL ? `${PUBLIC_SITE_URL}/product/${id}` : `/product/${id}`;
}

function publicCatalogSearchUrl(term) {
  return PUBLIC_SITE_URL && term ? `${PUBLIC_SITE_URL}/catalog?search=${encodeURIComponent(term)}` : null;
}

function truncate(text, max = 200) {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function tableUrl(table, params = {}) {
  const url = new URL(`${REST_URL}/${table}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && String(value) !== '') {
      url.searchParams.set(key, String(value));
    }
  }
  return url;
}

async function rest(table, { method = 'GET', params = {}, body, prefer } = {}) {
  assertSupabaseConfig();

  const response = await fetch(tableUrl(table, params), {
    method,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    const message = data?.message || data?.error || `Supabase REST ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

async function selectRows(table, params) {
  return await rest(table, { params });
}

async function selectOne(table, params) {
  const rows = await selectRows(table, { ...params, limit: 1 });
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

async function insertOne(table, body) {
  const rows = await rest(table, {
    method: 'POST',
    body,
    prefer: 'return=representation',
  });
  return Array.isArray(rows) ? rows[0] : rows;
}

async function updateRows(table, params, body, returnRepresentation = false) {
  return await rest(table, {
    method: 'PATCH',
    params,
    body,
    prefer: returnRepresentation ? 'return=representation' : 'return=minimal',
  });
}

function firstCategory(product) {
  const link = product?.product_categories?.[0];
  return Array.isArray(link?.categories) ? link.categories[0] : link?.categories || null;
}

function productCategories(product) {
  return (product?.product_categories || [])
    .map((pc) => (Array.isArray(pc.categories) ? pc.categories[0] : pc.categories))
    .filter(Boolean);
}

function normalizeLookupText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function categorySearchTerms(query) {
  const normalized = normalizeLookupText(query);
  const terms = new Set([normalized]);

  const aliases = [
    {
      match: ['guarda roupa', 'guarda roupas', 'guarda-roupa', 'guarda-roupas', 'roupeiro', 'roupeiros'],
      terms: ['guarda roupa', 'guarda roupas', 'guarda-roupa', 'guarda-roupas', 'roupeiro', 'roupeiros'],
    },
    {
      match: ['sofa', 'sofas'],
      terms: ['sofa', 'sofas'],
    },
    {
      match: ['painel tv', 'painel para tv', 'painel', 'paineis', 'painels'],
      terms: ['painel', 'paineis', 'painels', 'painel tv', 'painel para tv'],
    },
  ];

  for (const alias of aliases) {
    if (alias.match.some((item) => normalized.includes(normalizeLookupText(item)))) {
      alias.terms.forEach((item) => terms.add(normalizeLookupText(item)));
    }
  }

  return [...terms].filter(Boolean);
}

function categoryMatchScore(category, terms) {
  const name = normalizeLookupText(category.name);
  const slug = normalizeLookupText(category.slug);
  let score = 0;

  for (const term of terms) {
    if (!term) continue;
    if (name === term || slug === term) score = Math.max(score, 100);
    if (name.startsWith(term) || slug.startsWith(term)) score = Math.max(score, 80);
    if (name.includes(term) || slug.includes(term)) score = Math.max(score, 60);
    if (term.includes(name) || term.includes(slug)) score = Math.max(score, 45);
  }

  return score;
}

async function countActiveProductsForCategory(categoryId) {
  if (!categoryId) return 0;

  try {
    const children = await selectRows('categories', {
      select: 'id',
      parent_id: `eq.${categoryId}`,
      active: 'eq.true',
      limit: 500,
    });
    const categoryIds = [categoryId, ...((children || []).map((category) => category.id).filter(Boolean))];
    const links = await selectRows('product_categories', {
      select: 'product_id',
      category_id: `in.(${categoryIds.join(',')})`,
      limit: 1000,
    });
    const productIds = [...new Set((links || []).map((link) => link.product_id).filter(Boolean))];
    if (productIds.length === 0) return 0;

    const products = await selectRows('products', {
      select: 'id',
      id: `in.(${productIds.join(',')})`,
      active: 'eq.true',
      limit: productIds.length,
    });
    return Array.isArray(products) ? products.length : 0;
  } catch {
    try {
      const products = await selectRows('products', {
        select: 'id',
        category_id: `eq.${categoryId}`,
        active: 'eq.true',
        limit: 1000,
      });
      return Array.isArray(products) ? products.length : 0;
    } catch {
      return 0;
    }
  }
}

async function countActiveProductsByText(terms) {
  const products = await selectRows('products', {
    select: 'id,name,description,product_categories(categories(id,name,slug))',
    active: 'eq.true',
    limit: 1000,
  });

  const matchingIds = new Set();
  for (const product of products || []) {
    const haystack = normalizeLookupText([
      product.name,
      product.description,
      ...productCategories(product).flatMap((category) => [category.name, category.slug]),
    ].filter(Boolean).join(' '));

    if (terms.some((term) => haystack.includes(normalizeLookupText(term)))) {
      matchingIds.add(product.id);
    }
  }

  return matchingIds.size;
}

async function getCategorySlugs(category) {
  if (!category) return [];
  const categoryData = await selectOne('categories', {
    select: 'id,slug,parent_id',
    slug: `eq.${category}`,
  });
  if (!categoryData) return [category];
  if (categoryData.parent_id) return [categoryData.slug];

  const children = await selectRows('categories', {
    select: 'slug',
    parent_id: `eq.${categoryData.id}`,
  });
  return [categoryData.slug, ...(children || []).map((item) => item.slug)];
}

function transformProductSummary(product) {
  const category = firstCategory(product);
  const image = Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null;
  return {
    id: product.id,
    name: product.name,
    short_description: truncate(product.description),
    category_slug: category?.slug || null,
    category_name: category?.name || null,
    image,
    public_url: publicProductUrl(product.id),
  };
}

function transformProductDetails(product) {
  const metadata = product.metadata || {};
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    images: product.images || [],
    categories: productCategories(product).map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
    })),
    public_url: publicProductUrl(product.id),
    raw: { metadata },
    private: {
      internal_code: metadata.internal_code || metadata.sku || null,
      price: metadata.price || metadata.pricing?.price || null,
      currency: metadata.currency || 'BRL',
      payment_terms: metadata.payment_terms || metadata.pricing?.terms || null,
      notes: metadata.notes || null,
      dimensions: metadata.dimensions || null,
      stock_status: metadata.stock_status || metadata.stock || 'sob_consulta',
    },
  };
}

async function searchProducts(args) {
  const limit = clampLimit(args.limit, 5);
  const q = cleanString(args.q);
  const category = normalizeCategory(args.category || 'all');
  const categorySlugs = await getCategorySlugs(category);

  const params = {
    select: 'id,name,description,active,images,metadata,product_categories(categories(id,name,slug))',
    active: 'eq.true',
    order: 'created_at.desc',
    limit: categorySlugs.length > 0 ? 50 : limit,
  };

  if (q) {
    const safeQ = q.replace(/[%(),]/g, ' ');
    params.or = `(name.ilike.*${safeQ}*,description.ilike.*${safeQ}*)`;
  }

  let products = await selectRows('products', params);
  if (categorySlugs.length > 0) {
    products = products.filter((product) => {
      const slugs = productCategories(product).map((category) => category.slug);
      return slugs.some((slug) => categorySlugs.includes(slug));
    }).slice(0, limit);
  }

  const transformed = (products || []).slice(0, limit).map(transformProductSummary);
  return { ok: true, products: transformed, count: transformed.length };
}

async function getProductDetails(args) {
  const id = cleanString(args.id);
  if (!id) return { ok: false, error: 'Missing id parameter' };
  const product = await selectOne('products', {
    select: 'id,name,description,active,images,metadata,product_categories(categories(id,name,slug))',
    id: `eq.${id}`,
    active: 'eq.true',
  });
  if (!product) return { ok: false, error: 'Product not found' };
  return { ok: true, product: transformProductDetails(product) };
}

async function getCategoryLink(args) {
  const query = normalizeLookupText(args.query);
  if (!query) {
    return { ok: true, found: false, category: null, suggestions: [] };
  }

  const terms = categorySearchTerms(query);
  const categories = await selectRows('categories', {
    select: 'id,name,slug,active,sort_order,parent_id',
    active: 'eq.true',
    order: 'sort_order.asc,name.asc',
    limit: 500,
  });

  const ranked = (categories || [])
    .map((category) => ({
      category,
      score: categoryMatchScore(category, terms),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.category.sort_order || 0) - (b.category.sort_order || 0);
    });

  const best = ranked[0]?.category || null;
  if (!best) {
    return { ok: true, found: false, category: null, suggestions: [] };
  }

  let productCount = await countActiveProductsForCategory(best.id);
  if (productCount === 0) {
    productCount = await countActiveProductsByText(categorySearchTerms(`${best.name} ${best.slug} ${query}`));
  }

  return {
    ok: true,
    found: true,
    category: {
      id: best.id,
      name: best.name,
      slug: best.slug,
      url: publicCatalogSearchUrl(best.name),
      product_count: productCount,
    },
  };
}

async function registerCustomerInterest(args) {
  const customerPhone = cleanString(args.customer_phone);
  const message = cleanString(args.message);
  if (!customerPhone) return { ok: false, error: 'Missing required field: customer_phone' };
  if (!message) return { ok: false, error: 'Missing required field: message' };

  const now = new Date().toISOString();
  const source = optionalString(args.source) || 'n8n';
  const customerName = optionalString(args.customer_name);
  const { canonical: normalizedPhone, variants: phoneVariants } = normalizeBrazilPhone(customerPhone);
  const existingLead = await selectOne('leads', {
    select: '*',
    phone: phoneVariantsFilter(phoneVariants),
    archived: 'is.false',
    order: 'created_at.asc',
  });

  let lead = existingLead;
  let created = false;

  if (!lead) {
    lead = await insertOne('leads', {
      name: customerName || 'Cliente (sem nome)',
      phone: normalizedPhone,
      channel: source === 'n8n' ? 'ai_assistant' : 'site',
      status: 'new_interest',
      last_activity_at: now,
    });
    created = true;
  } else {
    const patch = { last_activity_at: now };
    if (customerName && String(lead.name || '').includes('(sem nome)')) {
      patch.name = customerName;
    }
    await updateRows('leads', { id: `eq.${lead.id}` }, patch);
    lead = { ...lead, ...patch };
  }

  const context = {
    intent: optionalString(args.intent) || 'catalog_interest',
    product_id: optionalString(args.product_id),
    product_name: optionalString(args.product_name),
    category_slug: optionalString(args.category_slug),
  };
  const timelineMessage = customerName
    ? `${customerName} expressou interesse via ${source === 'n8n' ? 'Assistente IA' : 'Site AI'}: ${message}`
    : `Cliente expressou interesse via ${source === 'n8n' ? 'Assistente IA' : 'Site AI'}: ${message}`;

  let timelineCreated = false;
  try {
    await insertOne('lead_timeline', {
      lead_id: lead.id,
      type: 'note',
      message: timelineMessage,
      meta: { source, context, ...context },
      created_by: null,
    });
    timelineCreated = true;
  } catch (error) {
    console.error('[register_customer_interest] Timeline insert failed:', error.message);
  }

  return {
    ok: true,
    message: created ? 'Lead created successfully' : 'Lead found and updated',
    lead_id: lead.id,
    created,
    timeline_created: timelineCreated,
    lead: {
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      channel: lead.channel,
      status: lead.status,
    },
  };
}

async function addLeadNote(args) {
  const leadId = cleanString(args.lead_id);
  const message = cleanString(args.message);
  if (!leadId) return { ok: false, error: 'Missing required field: lead_id' };
  if (!message) return { ok: false, error: 'Missing required field: message' };

  const lead = await selectOne('leads', { select: 'id', id: `eq.${leadId}` });
  if (!lead) return { ok: false, error: 'Lead not found' };

  const note = await insertOne('lead_timeline', {
    lead_id: leadId,
    type: 'note',
    message,
    meta: { created_by: 'agent' },
    created_by: null,
  });

  await updateRows('leads', { id: `eq.${leadId}` }, { last_activity_at: new Date().toISOString() });

  return {
    ok: true,
    message: 'Lead note added successfully',
    lead_id: leadId,
    note: {
      id: note?.id,
      message: note?.message || message,
      created_at: note?.created_at || null,
    },
  };
}

async function findLeadByPhone(args) {
  const phone = cleanString(args.phone);
  if (!phone) return { ok: false, error: 'Missing required parameter: phone' };

  const { variants: phoneVariants } = normalizeBrazilPhone(phone);
  const lead = await selectOne('leads', {
    select: 'id,name,phone,channel,status,created_at,last_activity_at,archived',
    phone: phoneVariantsFilter(phoneVariants),
    archived: 'is.false',
    order: 'created_at.asc',
  });

  if (!lead) {
    return {
      ok: true,
      found: false,
      lead: null,
      timeline: [],
    };
  }

  const timeline = await selectRows('lead_timeline', {
    select: 'id,lead_id,type,message,meta,created_at',
    lead_id: `eq.${lead.id}`,
    order: 'created_at.desc',
    limit: 5,
  });

  return {
    ok: true,
    found: true,
    lead,
    timeline: timeline || [],
  };
}

async function getCustomerCommercialHistory(args) {
  const phone = cleanString(args.phone);
  if (!phone) return { ok: false, error: 'Missing required parameter: phone' };

  const { variants: phoneVariants } = normalizeBrazilPhone(phone);
  const lead = await selectOne('leads', {
    select: 'id,name,phone,channel,status,notes,archived,created_at,updated_at',
    phone: phoneVariantsFilter(phoneVariants),
    order: 'created_at.asc',
  });

  const opportunities = lead
    ? await selectRows('opportunities', {
        select: 'id,lead_id,product_id,stage,value,assigned_to,archived,created_at,updated_at',
        lead_id: `eq.${lead.id}`,
        order: 'created_at.desc',
      })
    : [];

  const opportunityIds = (opportunities || []).map((opportunity) => opportunity.id).filter(Boolean);
  const orderSelect = 'id,opportunity_id,lead_id,current_stage,customer_name,customer_phone,delivery_date,delivery_address,internal_code,notes,created_at,updated_at';
  const orderQueries = [
    selectRows('orders', {
      select: orderSelect,
      customer_phone: phoneVariantsFilter(phoneVariants),
      order: 'created_at.desc',
    }),
  ];

  if (lead) {
    orderQueries.push(
      selectRows('orders', {
        select: orderSelect,
        lead_id: `eq.${lead.id}`,
        order: 'created_at.desc',
      }),
    );
  }

  if (opportunityIds.length > 0) {
    orderQueries.push(
      selectRows('orders', {
        select: orderSelect,
        opportunity_id: `in.(${opportunityIds.join(',')})`,
        order: 'created_at.desc',
      }),
    );
  }

  const orderResults = await Promise.all(orderQueries);
  const ordersById = new Map();
  for (const order of orderResults.flat()) {
    if (order?.id) ordersById.set(order.id, order);
  }

  const orders = [...ordersById.values()]
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .map((order) => ({
      ...order,
      order_stage: order.current_stage,
    }));
  const sortedOpportunities = [...(opportunities || [])].sort(
    (a, b) => new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime(),
  );
  const wonOpportunities = sortedOpportunities.filter((opportunity) => opportunity.stage === 'won');
  const found = Boolean(lead || orders.length > 0);

  return {
    ok: true,
    found,
    lead: lead || null,
    has_purchased: wonOpportunities.length > 0 || orders.length > 0,
    opportunities: sortedOpportunities,
    won_opportunities: wonOpportunities,
    orders,
    summary: {
      total_opportunities: sortedOpportunities.length,
      total_won: wonOpportunities.length,
      total_orders: orders.length,
      latest_order_status: orders[0]?.current_stage || null,
      latest_commercial_stage: sortedOpportunities[0]?.stage || null,
    },
  };
}

async function getCustomerMemory(args) {
  const phone = cleanString(args.phone);
  if (!phone) return { ok: false, error: 'Missing required parameter: phone' };

  const { variants: phoneVariants } = normalizeBrazilPhone(phone);
  const memory = await selectOne('memory_consolidated', {
    select: '*',
    phone: phoneVariantsFilter(phoneVariants),
  });

  const events = await selectRows('memory_events', {
    select: '*',
    phone: phoneVariantsFilter(phoneVariants),
    order: 'created_at.desc',
    limit: 10,
  });

  return {
    ok: true,
    found: Boolean(memory || (events && events.length > 0)),
    memory: memory || null,
    events: events || [],
  };
}

function parseMemoryMetadata(value) {
  const metadata = cleanString(value);
  if (!metadata) return {};

  try {
    const parsed = JSON.parse(metadata);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    return { raw: metadata };
  } catch {
    return { raw: metadata };
  }
}

async function addMemoryEvent(args) {
  const phone = cleanString(args.phone);
  const message = cleanString(args.message);
  const messageType = cleanString(args.message_type);

  if (!phone) return { ok: false, error: 'Missing required field: phone' };
  if (!message) return { ok: false, error: 'Missing required field: message' };
  if (!messageType) return { ok: false, error: 'Missing required field: message_type' };

  const event = await insertOne('memory_events', {
    phone: normalizeBrazilPhone(phone).canonical,
    message,
    message_type: messageType,
    session_id: optionalString(args.session_id) || null,
    metadata: parseMemoryMetadata(args.metadata),
  });

  return {
    ok: true,
    event,
  };
}

async function updateLeadStatus(leadId, status) {
  const lead = await selectOne('leads', { select: 'id,status', id: `eq.${leadId}` });
  if (!lead) return { ok: false, error: 'Lead not found' };

  await updateRows('leads', { id: `eq.${leadId}` }, {
    status,
    last_activity_at: new Date().toISOString(),
  });

  if (lead.status !== status) {
    try {
      await insertOne('lead_timeline', {
        lead_id: leadId,
        type: 'note',
        message: `Status alterado de ${lead.status} para ${status}`,
        meta: { from_status: lead.status, to_status: status, updated_by: 'agent' },
        created_by: null,
      });
    } catch (error) {
      console.error('[updateLeadStatus] Timeline insert failed:', error.message);
    }
  }

  return {
    ok: true,
    message: 'Lead status updated successfully',
    lead_id: leadId,
    old_status: lead.status,
    new_status: status,
  };
}

function getTimeZoneParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
    weekday: 'short',
  }).formatToParts(date);

  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

function localDateTimeToUtc(year, month, day, hour, minute, timeZone) {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
  const parts = getTimeZoneParts(new Date(utcGuess), timeZone);
  const representedAsUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return new Date(utcGuess - (representedAsUtc - utcGuess));
}

function calculateHumanFollowUpAt(now = new Date()) {
  const timeZone = 'America/Sao_Paulo';
  const parts = getTimeZoneParts(now, timeZone);
  const weekday = parts.weekday;
  const hour = Number(parts.hour);
  const isWeekend = weekday === 'Sat' || weekday === 'Sun';

  if (!isWeekend && hour < 18) return now.toISOString();

  const localDate = new Date(Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
  ));

  do {
    localDate.setUTCDate(localDate.getUTCDate() + 1);
  } while (localDate.getUTCDay() === 0 || localDate.getUTCDay() === 6);

  return localDateTimeToUtc(
    localDate.getUTCFullYear(),
    localDate.getUTCMonth() + 1,
    localDate.getUTCDate(),
    9,
    0,
    timeZone,
  ).toISOString();
}

async function requestHumanAttendant(args) {
  let leadId = cleanString(args.lead_id);
  let interest = null;

  if (!leadId) {
    const customerPhone = cleanString(args.customer_phone);
    if (!customerPhone) {
      return { ok: false, error: 'customer_phone is required when lead_id is not provided' };
    }

    interest = await registerCustomerInterest({
      customer_name: optionalString(args.customer_name),
      customer_phone: customerPhone,
      message: cleanString(args.message, 'Cliente solicitou atendimento humano') || 'Cliente solicitou atendimento humano',
      source: 'n8n',
      intent: 'human_handoff',
      product_id: optionalString(args.product_id),
    });

    leadId = interest?.lead_id || '';
  }

  if (!leadId) return { ok: false, error: 'Unable to determine lead_id for human handoff', interest };

  const status = await updateLeadStatus(leadId, 'talking_human');
  let followUp = null;

  if (status?.ok) {
    const now = new Date();
    const followUpAt = calculateHumanFollowUpAt(now);

    try {
      await updateRows('leads', { id: `eq.${leadId}` }, {
        follow_up_needed: true,
        follow_up_at: followUpAt,
        last_activity_at: now.toISOString(),
      });

      const event = await insertOne('lead_timeline', {
        lead_id: leadId,
        type: 'followup_set',
        message: 'Follow-up criado automaticamente após solicitação de atendimento humano',
        meta: {
          follow_up_at: followUpAt,
          source: 'mcp',
          reason: 'human_attendant_requested',
        },
        created_by: null,
      });

      followUp = {
        created: true,
        follow_up_needed: true,
        follow_up_at: followUpAt,
        event_id: event?.id || null,
      };
    } catch (error) {
      console.error('[requestHumanAttendant] Follow-up creation failed:', error.message);
      followUp = {
        created: false,
        error: error.message || String(error),
      };
    }
  }

  return {
    ok: Boolean(status?.ok),
    lead_id: leadId,
    message: status?.ok ? 'Lead marked for human attendance' : status?.error || 'Failed to update lead status',
    interest,
    status,
    follow_up: followUp,
  };
}

async function findRecentOrdersByPhone(args) {
  const phone = cleanString(args.phone);
  if (!phone) return { ok: false, error: 'Missing required parameter: phone' };

  const { variants: phoneVariants } = normalizeBrazilPhone(phone);
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const orders = await selectRows('orders', {
    select: 'id,customer_phone,current_stage,created_at,updated_at,internal_code',
    customer_phone: phoneVariantsFilter(phoneVariants),
    created_at: `gte.${ninetyDaysAgo.toISOString()}`,
    order: 'created_at.desc',
    limit: 50,
  });

  const transformed = (orders || []).map((order) => {
    const label = ORDER_STAGE_LABELS[order.current_stage] || order.current_stage;
    return {
      order_id: order.id,
      product_name: order.internal_code || label,
      created_at: order.created_at,
      order_stage: order.current_stage,
      updated_at: order.updated_at,
    };
  });

  return { ok: true, orders: transformed, count: transformed.length };
}

async function getOrderStatus(args) {
  const orderId = cleanString(args.order_id);
  if (!orderId) return { ok: false, error: 'Missing required parameter: order_id' };

  const order = await selectOne('orders', {
    select: 'id,current_stage,updated_at,internal_code,created_at',
    id: `eq.${orderId}`,
  });
  if (!order) return { ok: false, error: 'Order not found' };

  const label = ORDER_STAGE_LABELS[order.current_stage] || order.current_stage;
  return {
    ok: true,
    order: {
      order_id: order.id,
      status: order.current_stage,
      label,
      updated_at: order.updated_at,
      product_name: order.internal_code || label,
    },
  };
}

async function searchInstallers(args) {
  const params = {
    select: 'id,name,phone,city,bio,photo_url,active,sort_order',
    active: 'eq.true',
    order: 'sort_order.asc,created_at.desc',
    limit: clampLimit(args.limit, 5),
  };
  const city = cleanString(args.city);
  if (city) params.city = `ilike.*${city.replace(/[%*]/g, '')}*`;

  const installers = await selectRows('installers', params);
  const transformed = (installers || []).map((installer) => ({
    id: installer.id,
    name: installer.name,
    phone: installer.phone,
    city: installer.city || null,
    bio: installer.bio || null,
    photo_url: installer.photo_url || null,
  }));

  return { ok: true, assemblers: transformed, count: transformed.length };
}

async function executeTool(name, args = {}) {
  switch (name) {
    case 'search_products':
      return await searchProducts(args);
    case 'get_product_details':
      return await getProductDetails(args);
    case 'register_customer_interest':
      return await registerCustomerInterest(args);
    case 'add_lead_note':
      return await addLeadNote(args);
    case 'find_lead_by_phone':
      return await findLeadByPhone(args);
    case 'get_customer_commercial_history':
      return await getCustomerCommercialHistory(args);
    case 'get_category_link':
      return await getCategoryLink(args);
    case 'get_customer_memory':
      return await getCustomerMemory(args);
    case 'add_memory_event':
      return await addMemoryEvent(args);
    case 'request_human_attendant':
      return await requestHumanAttendant(args);
    case 'find_recent_orders_by_phone':
      return await findRecentOrdersByPhone(args);
    case 'get_order_status':
      return await getOrderStatus(args);
    case 'search_installers':
      return await searchInstallers(args);
    default:
      return { ok: false, error: `Unknown tool: ${name}` };
  }
}

function createMcpServer() {
  const server = new Server(
    {
      name: 'moveis-nascimento-assistant-mcp',
      version: '2.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      console.log(
        '[MCP tool input]',
        request.params?.name,
        JSON.stringify(request.params?.arguments, null, 2),
      );
      const result = await executeTool(request.params?.name, request.params?.arguments || {});
      return asToolContent(result);
    } catch (error) {
      console.error('[tools/call]', error);
      return asToolContent({ ok: false, error: error.message || String(error) });
    }
  });

  return server;
}

async function handleSse(req, res) {
  if (!isAuthorized(req)) return unauthorized(res);

  const transport = new SSEServerTransport('/messages', res);
  transports.set(transport.sessionId, transport);

  res.on('close', () => {
    transports.delete(transport.sessionId);
  });

  const server = createMcpServer();
  await server.connect(transport);
}

async function handleMessages(req, res, url) {
  if (!isAuthorized(req)) return unauthorized(res);

  const sessionId = url.searchParams.get('sessionId');
  const transport = transports.get(sessionId);

  if (!(transport instanceof SSEServerTransport)) {
    return sendJson(res, 400, {
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Bad Request: No SSE transport found for sessionId',
      },
      id: null,
    });
  }

  try {
    const body = await readJson(req);
    await transport.handlePostMessage(req, res, body);
  } catch (error) {
    sendJson(res, 400, { error: error.message || String(error) });
  }
}

async function handleMcp(req, res) {
  if (!isAuthorized(req)) return unauthorized(res);

  try {
    const sessionId = req.headers['mcp-session-id'];
    let transport = sessionId ? transports.get(sessionId) : null;

    if (transport && !(transport instanceof StreamableHTTPServerTransport)) {
      return sendJson(res, 400, {
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: Session exists but uses a different transport protocol',
        },
        id: null,
      });
    }

    let body;
    if (req.method === 'POST') {
      body = await readJson(req);
    }

    if (!transport) {
      if (req.method !== 'POST' || !isInitializeRequest(body)) {
        return sendJson(res, 400, {
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Bad Request: No valid session ID provided',
          },
          id: null,
        });
      }

      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (newSessionId) => {
          transports.set(newSessionId, transport);
        },
      });

      transport.onclose = () => {
        if (transport.sessionId) transports.delete(transport.sessionId);
      };

      const server = createMcpServer();
      await server.connect(transport);
    }

    await transport.handleRequest(req, res, body);
  } catch (error) {
    console.error('[mcp]', error);
    if (!res.headersSent) {
      sendJson(res, 500, {
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      });
    }
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, content-type, x-mcp-token',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    });
    res.end();
    return;
  }

  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/health')) {
    return sendJson(res, 200, {
      ok: true,
      name: 'moveis-nascimento-assistant-mcp',
      mode: 'supabase-rest',
      sse_endpoint: '/sse',
      tools: tools.map((tool) => tool.name),
      auth_required: true,
      auth_configured: Boolean(MCP_AUTH_TOKEN),
      supabase_configured: Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY),
    });
  }

  if (req.method === 'GET' && url.pathname === '/sse') return handleSse(req, res);
  if (req.method === 'POST' && url.pathname === '/messages') return handleMessages(req, res, url);
  if ((req.method === 'GET' || req.method === 'POST' || req.method === 'DELETE') && url.pathname === '/mcp') {
    return handleMcp(req, res);
  }

  return sendJson(res, 404, { error: 'Not found' });
});

server.listen(PORT, HOST, () => {
  console.log(`MCP server listening on http://${HOST}:${PORT}`);
  console.log(`SSE endpoint: http://${HOST}:${PORT}/sse`);
  console.log('Mode: direct Supabase REST');
  if (!SUPABASE_URL) console.warn('Warning: SUPABASE_URL is not configured.');
  if (!SUPABASE_SERVICE_ROLE_KEY) console.warn('Warning: SUPABASE_SERVICE_ROLE_KEY is not configured.');
  if (!MCP_AUTH_TOKEN) console.warn('Warning: MCP_AUTH_TOKEN is required; protected endpoints will reject requests.');
});
