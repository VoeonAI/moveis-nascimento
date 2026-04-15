# Tracking do Funil de Conversão

## Visão Geral

Sistema de tracking do funil de conversão usando `funnel_events` para cliques de interesse e `opportunities` para o restante do pipeline.

## Arquitetura

### Fontes de Dados

**1. funnel_events** - Eventos de clique de interesse
```sql
CREATE TABLE funnel_events (
  id UUID PRIMARY KEY,
  event_type TEXT NOT NULL,  -- 'interest_click'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**2. opportunities** - Pipeline de vendas
```sql
CREATE TABLE opportunities (
  id UUID PRIMARY KEY,
  lead_id UUID NOT NULL,
  product_id UUID,
  stage TEXT NOT NULL,  -- 'talking_ai', 'talking_human', 'won', 'lost'
  value NUMERIC,
  assigned_to UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  archived BOOLEAN DEFAULT FALSE
);
```

## Funil de Conversão

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. CLIQUE DE INTERESSE (interest_click)                         │
│    Fonte: funnel_events                                         │
│    Evento: event_type = 'interest_click'                       │
│    Quando: Usuário clica em "Gostei", "Quais as condições?"     │
└────────────────────────────────────┬────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. MENSAGEM ENVIADA (message_sent)                              │
│    Fonte: opportunities                                         │
│    Regra: COUNT(*) de opportunities (não arquivadas)            │
│    Quando: Lead é criado no sistema                             │
└────────────────────────────────────┬────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. CONVERSANDO COM IA (talking_ai)                              │
│    Fonte: opportunities                                         │
│    Regra: COUNT(*) WHERE stage = 'talking_ai'                   │
│    Quando: Lead está sendo tratado pela IA                       │
└────────────────────────────────────┬────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. CONVERSANDO COM HUMANO (talking_human)                      │
│    Fonte: opportunities                                         │
│    Regra: COUNT(*) WHERE stage = 'talking_human'                │
│    Quando: Lead foi escalado para atendente humano             │
└────────────────────────────────────┬────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. GANHO (won)                                                  │
│    Fonte: opportunities                                         │
│    Regra: COUNT(*) WHERE stage = 'won'                          │
│    Quando: Venda foi realizada                                 │
└─────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ LOST (lost)                                                     │
│    Fonte: opportunities                                         │
│    Regra: COUNT(*) WHERE stage = 'lost'                         │
│    Quando: Lead não converteu                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Uso

### 1. Importar a função

```typescript
import { trackEvent } from '@/services/funnelTrackingService';
```

### 2. Registrar clique de interesse

```typescript
// Registrar clique de interesse (único evento registrado manualmente)
trackEvent('interest_click');
```

**Observação:** O evento `message_sent` não é mais registrado manualmente. O funil usa `opportunities` como fonte para esse estágio e todos os subsequentes.

### 3. Buscar métricas do funil

```typescript
import { getFunnelMetrics, getConversionRates } from '@/services/funnelTrackingService';

// Métricas completas do funil
const metrics = await getFunnelMetrics();
// Resultado: {
//   interestClicks: 150,
//   messageSent: 49,
//   talkingAi: 30,
//   talkingHuman: 4,
//   won: 14,
//   lost: 1,
//   totalOpportunities: 49
// }

// Taxas de conversão
const rates = await getConversionRates();
// Resultado: {
//   interestToMessage: 32.67,  // 49 / 150
//   messageToAi: 61.22,        // 30 / 49
//   aiToHuman: 13.33,          // 4 / 30
//   humanToWon: 350.00,        // 14 / 4 (pode ser >100% por fluxo paralelo)
//   overallConversion: 9.33    // 14 / 150
// }
```

## Componente de Dashboard

Componente `FunnelMetrics` disponível em `src/components/analytics/FunnelMetrics.tsx`:

```typescript
import FunnelMetrics from '@/components/analytics/FunnelMetrics';

<FunnelMetrics />
```

### Métricas Exibidas

```
┌──────────┬──────────┬───────────┬───────────────┬─────────┬──────────┐
│  Cliques │ Mensagens│  Con. IA  │ Con. Humano  │  Ganho  │ Perdido  │
│  🖱️ 150  │  💬 49   │  🤖 30    │  👥 4         │  🏆 14  │  ❌ 1    │
│Interesse │  Leads   │Conversando│ Negociação   │ Vendas  │ Não conv.│
└──────────┴──────────┴───────────┴───────────────┴─────────┴──────────┘

┌─────────────────────────────────────────────────────────────┐
│ Taxa de Conversão Global                                      │
│                                                               │
│ 9.33%                                                         │
│ De cliques até vendas                                         │
│                                                               │
│ Cliques → Mensagens      32.67%                              │
│ Mensagens → IA           61.22%                              │
│ IA → Humano             13.33%                              │
│ Humano → Vendas         350.00%                              │
└─────────────────────────────────────────────────────────────┘
```

## Implementação nos Componentes

### ProductDetail.tsx

```typescript
// Ao abrir modal de contato
const handleInterestClick = () => {
  console.log('[ProductDetail] Interest clicked for product:', product?.id);
  
  // Registra interesse de forma não-bloqueante
  if (product?.id) {
    trackProductInterest(product.id);  // Tracking por produto
  }
  
  // Registra evento do funil (único evento manual)
  trackEvent('interest_click');
  
  // Abre o modal imediatamente
  setModalOpen(true);
};
```

## Console Logs (Desenvolvimento)

```
[FunnelTracking] trackEvent called
[FunnelTracking] Event type: interest_click
[FunnelTracking] Payload: { event_type: 'interest_click' }
[FunnelTracking] ✅ Event tracked successfully: interest_click
```

## Consultas SQL Úteis

### Total do funil completo

```sql
-- Cliques de interesse
SELECT COUNT(*) as interest_clicks
FROM funnel_events
WHERE event_type = 'interest_click';

-- Mensagens enviadas (todas as opportunities)
SELECT COUNT(*) as message_sent
FROM opportunities
WHERE archived = FALSE;

-- Por estágio
SELECT 
  stage,
  COUNT(*) as count
FROM opportunities
WHERE archived = FALSE
GROUP BY stage
ORDER BY count DESC;
```

### Taxa de conversão por estágio

```sql
WITH metrics AS (
  SELECT
    (SELECT COUNT(*) FROM funnel_events WHERE event_type = 'interest_click') as interests,
    (SELECT COUNT(*) FROM opportunities WHERE archived = FALSE) as messages,
    (SELECT COUNT(*) FROM opportunities WHERE stage = 'talking_ai' AND archived = FALSE) as ai,
    (SELECT COUNT(*) FROM opportunities WHERE stage = 'talking_human' AND archived = FALSE) as human,
    (SELECT COUNT(*) FROM opportunities WHERE stage = 'won' AND archived = FALSE) as won
)
SELECT
  interests,
  messages,
  ai,
  human,
  won,
  CASE WHEN interests > 0 THEN ROUND((messages::FLOAT / interests) * 100, 2) ELSE 0 END as interest_to_message,
  CASE WHEN messages > 0 THEN ROUND((ai::FLOAT / messages) * 100, 2) ELSE 0 END as message_to_ai,
  CASE WHEN ai > 0 THEN ROUND((human::FLOAT / ai) * 100, 2) ELSE 0 END as ai_to_human,
  CASE WHEN human > 0 THEN ROUND((won::FLOAT / human) * 100, 2) ELSE 0 END as human_to_won,
  CASE WHEN interests > 0 THEN ROUND((won::FLOAT / interests) * 100, 2) ELSE 0 END as overall_conversion
FROM metrics;
```

### Win Rate

```sql
SELECT 
  ROUND(
    (COUNT(*) FILTER (WHERE stage = 'won')::FLOAT / 
     COUNT(*) FILTER (WHERE stage IN ('won', 'lost'))) * 100,
    2
  ) as win_rate
FROM opportunities
WHERE archived = FALSE;
```

## Evolução do Funil

### Antes (Modelo Simplificado)
```
interest_click → message_sent
```
Fonte: `funnel_events` para ambos os estágios

### Depois (Modelo Realista)
```
interest_click → message_sent → talking_ai → talking_human → won
```
Fonte: `funnel_events` para cliques + `opportunities` para o restante

## Diferenças Principais

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Fonte de dados** | Apenas `funnel_events` | `funnel_events` + `opportunities` |
| **message_sent** | Evento manual | Contagem de `opportunities` |
| **Estágios do funil** | 2 (clique → mensagem) | 5 (clique → mensagem → IA → humano → venda) |
| **Alinhamento** | Desconectado do CRM | Alinhado com pipeline real |
| **Duplicação** | Risco de duplicar eventos | Zero duplicação (fonte única) |

## Próximas Evoluções

1. **Adicionar `product_id`** → Métricas por produto
2. **Segmentação por período** → Métricas por dia/semana/mês
3. **Dashboard completo** → Gráficos de tendência
4. **Análise de tempo** → Tempo médio por estágio
5. **Filtros avançados** → Por categoria, usuário, etc.

## Remover Logs Temporários

Após validação em produção, remova os console.logs de `funnelTrackingService.ts`:

```typescript
// Remover logs de debugging:
console.log('[FunnelTracking] trackEvent called');
console.log('[FunnelTracking] Event type:', eventType);
console.log('[FunnelTracking] Payload:', { event_type: eventType });
console.log('[FunnelTracking] Supabase response:');
// ... e outros logs de debug
```