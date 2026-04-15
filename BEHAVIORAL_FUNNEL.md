# Funil Comportamental - Dashboard

## Visão Geral

O Funil Comportamental é uma nova visualização no dashboard que combina dados de cliques (`funnel_events`) e oportunidades (`opportunities`) para mostrar o comportamento real dos usuários e sua conversão ao longo do pipeline.

## Diferença entre Funil de Oportunidades e Funil Comportamental

| Aspecto | Funil de Oportunidades | Funil Comportamental |
|---------|------------------------|----------------------|
| **Fonte** | Apenas `opportunities` | `funnel_events` + `opportunities` |
| **Foco** | Pipeline comercial | Comportamento do usuário |
| **Etapas** | 5 (talking_ai → won) | 5 (cliques → won) |
| **Visual** | Gráfico de barras | Funil visual com % de conversão |
| **Propósito** | Monitorar vendas | Analisar engajamento |

## Estrutura do Funil Comportamental

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. CLIQUES (interest_click)                                     │
│    Fonte: funnel_events                                          │
│    Regra: COUNT(*) WHERE event_type = 'interest_click'          │
│    Cor: azul (#3b82f6)                                          │
│    Quando: Usuário clica em botão de interesse                 │
└────────────────────────────────────┬────────────────────────────┘
                                     │ (32.7% de conversão)
                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. INTERESSE (total opportunities)                              │
│    Fonte: opportunities                                         │
│    Regra: COUNT(*) WHERE archived = FALSE                      │
│    Cor: verde (#22c55e)                                         │
│    Quando: Lead/Opportunity é criada                           │
└────────────────────────────────────┬────────────────────────────┘
                                     │ (61.2% de conversão)
                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. CONVERSANDO COM IA (talking_ai)                              │
│    Fonte: opportunities                                         │
│    Regra: COUNT(*) WHERE stage = 'talking_ai'                  │
│    Cor: roxo (#a855f7)                                          │
│    Quando: IA está conversando com o lead                       │
└────────────────────────────────────┬────────────────────────────┘
                                     │ (13.3% de conversão)
                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. CONVERSANDO COM HUMANO (talking_human)                      │
│    Fonte: opportunities                                         │
│    Regra: COUNT(*) WHERE stage = 'talking_human'                │
│    Cor: laranja (#f97316)                                       │
│    Quando: Lead foi escalado para atendente                   │
└────────────────────────────────────┬────────────────────────────┘
                                     │ (350% de conversão*)
                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. GANHO (won)                                                  │
│    Fonte: opportunities                                         │
│    Regra: COUNT(*) WHERE stage = 'won'                         │
│    Cor: amarelo (#eab308)                                       │
│    Quando: Venda foi realizada                                 │
└─────────────────────────────────────────────────────────────────┘

* A taxa pode ser >100% pois conversas podem ocorrer em paralelo
```

## Dados Exemplo

Com base nos dados atuais do sistema:

| Etapa | Quantidade | Cor |
|-------|------------|-----|
| Cliques | 3 | Azul |
| Interesse | 49 | Verde |
| Conversando com IA | 30 | Roxo |
| Conversando com Humano | 4 | Laranja |
| Ganho | 14 | Amarelo |

**Taxas de Conversão:**
- Cliques → Interesse: 32.7%
- Interesse → IA: 61.2%
- IA → Humano: 13.3%
- Humano → Ganho: 350%
- **Conversão Global: 28.6%**

## Implementação

### 1. Interface TypeScript

Arquivo: `src/services/dashboardService.ts`

```typescript
export interface BehavioralFunnel {
  stage: string;
  count: number;
  label: string;
  color: string;
}
```

### 2. Serviço de Dados

Arquivo: `src/services/dashboardService.ts`

```typescript
async getBehavioralFunnel(period: PeriodType = 'last_30_days'): Promise<BehavioralFunnel[]> {
  // 1. Buscar cliques de funnel_events
  const { data: clicksData } = await supabase
    .from('funnel_events')
    .select('event_type')
    .eq('event_type', 'interest_click')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString());

  const interestClicks = clicksData?.length || 0;

  // 2. Buscar opportunities e agrupar por stage
  const { data: oppsData } = await supabase
    .from('opportunities')
    .select('stage')
    .eq('archived', false)
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString());

  // Contar por estágio
  const funnel = (oppsData || []).reduce((acc, opp) => {
    acc[opp.stage] = (acc[opp.stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return [
    { stage: 'interest_click', count: interestClicks, label: 'Cliques', color: '#3b82f6' },
    { stage: 'interest', count: totalInterests, label: 'Interesse', color: '#22c55e' },
    { stage: 'talking_ai', count: talkingAi, label: 'Conversando com IA', color: '#a855f7' },
    { stage: 'talking_human', count: talkingHuman, label: 'Conversando com Humano', color: '#f97316' },
    { stage: 'won', count: won, label: 'Ganho', color: '#eab308' },
  ];
}
```

### 3. Componente Visual

Arquivo: `src/components/analytics/BehavioralFunnel.tsx`

Características:
- **Barras horizontais coloridas** mostrando volume por etapa
- **Setas entre etapas** indicando fluxo
- **% de conversão** calculado automaticamente entre cada etapa
- **Conversão global** no título (primeira → última etapa)
- **Resumo numérico** no rodapé

### 4. Integração no Dashboard

Arquivo: `src/pages/app/Dashboard.tsx`

```typescript
// Import
import BehavioralFunnel from '@/components/analytics/BehavioralFunnel';
import { dashboardService, BehavioralFunnel as BehavioralFunnelType } from '@/services/dashboardService';

// Estado
const [behavioralFunnel, setBehavioralFunnel] = useState<BehavioralFunnelType[]>([]);

// Carregamento de dados
const [overviewData, metricsData, funnelData, behavioralData, pipelineData, evolutionData] = await Promise.all([
  dashboardService.getSystemOverview(),
  dashboardService.getMetrics(period),
  dashboardService.getOpportunityFunnel(period),
  dashboardService.getBehavioralFunnel(period),  // ← Novo
  dashboardService.getOrdersPipeline(period),
  dashboardService.getEvolutionByPeriod(period),
]);

setBehavioralFunnel(behavioralData);

// Renderização
<BehavioralFunnel funnelData={behavioralFunnel} loading={loading} />
```

## Visualização no Dashboard

O Funil Comportamental aparece logo após os cards principais, antes dos gráficos de barras do pipeline comercial:

```
┌─────────────────────────────────────────────────────────────┐
│ Cards de Métricas (Produtos, Leads, Oportunidades, etc.)    │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ Funil Comportamental ← NOVO                                  │
│ Cliques ████████████ 3                                       │
│ └─> 32.7% de conversão (3 → 49)                             │
│ Interesse ████████████████████████████████ 49                │
│ └─> 61.2% de conversão (49 → 30)                           │
│ Conversando com IA ████████████████████████ 30              │
│ └─> 13.3% de conversão (30 → 4)                            │
│ Conversando com Humano ████ 4                                │
│ └─> 350% de conversão (4 → 14)                              │
│ Ganho ████████████████ 14                                    │
├─────────────────────────────────────────────────────────────┤
│ Total: 3 | Conversões: 14 | Taxa Global: 28.6%             │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ Funil de Oportunidades (Gráfico de barras)                  │
└─────────────────────────────────────────────────────────────┘
```

## Consultas SQL Úteis

### Dados Completos do Funil Comportamental

```sql
SELECT 
  'Cliques' as etapa, 
  COUNT(*) as count 
FROM funnel_events 
WHERE event_type = 'interest_click'

UNION ALL

SELECT 
  'Interesse' as etapa, 
  COUNT(*) as count 
FROM opportunities 
WHERE archived = FALSE

UNION ALL

SELECT 
  'Conversando com IA' as etapa, 
  COUNT(*) as count 
FROM opportunities 
WHERE stage = 'talking_ai' AND archived = FALSE

UNION ALL

SELECT 
  'Conversando com Humano' as etapa, 
  COUNT(*) as count 
FROM opportunities 
WHERE stage = 'talking_human' AND archived = FALSE

UNION ALL

SELECT 
  'Ganho' as etapa, 
  COUNT(*) as count 
FROM opportunities 
WHERE stage = 'won' AND archived = FALSE;
```

### Taxas de Conversão por Etapa

```sql
WITH funnel AS (
  SELECT
    (SELECT COUNT(*) FROM funnel_events WHERE event_type = 'interest_click') as cliques,
    (SELECT COUNT(*) FROM opportunities WHERE archived = FALSE) as interesse,
    (SELECT COUNT(*) FROM opportunities WHERE stage = 'talking_ai' AND archived = FALSE) as talking_ai,
    (SELECT COUNT(*) FROM opportunities WHERE stage = 'talking_human' AND archived = FALSE) as talking_human,
    (SELECT COUNT(*) FROM opportunities WHERE stage = 'won' AND archived = FALSE) as won
)
SELECT
  cliques,
  interesse,
  talking_ai,
  talking_human,
  won,
  ROUND((interesse::FLOAT / NULLIF(cliques, 0)) * 100, 1) as cliques_to_interesse,
  ROUND((talking_ai::FLOAT / NULLIF(interesse, 0)) * 100, 1) as interesse_to_ai,
  ROUND((talking_human::FLOAT / NULLIF(talking_ai, 0)) * 100, 1) as ai_to_human,
  ROUND((won::FLOAT / NULLIF(talking_human, 0)) * 100, 1) as human_to_won,
  ROUND((won::FLOAT / NULLIF(cliques, 0)) * 100, 1) as global_conversion
FROM funnel;
```

### Dados por Período

```sql
-- Últimos 30 dias
SELECT 
  stage,
  COUNT(*) as count
FROM (
  SELECT 'interest_click' as stage, created_at
  FROM funnel_events
  WHERE event_type = 'interest_click'
    AND created_at >= NOW() - INTERVAL '30 days'
  
  UNION ALL
  
  SELECT 'interest' as stage, created_at
  FROM opportunities
  WHERE archived = FALSE
    AND created_at >= NOW() - INTERVAL '30 days'
  
  UNION ALL
  
  SELECT 'talking_ai' as stage, created_at
  FROM opportunities
  WHERE stage = 'talking_ai'
    AND archived = FALSE
    AND created_at >= NOW() - INTERVAL '30 days'
  
  UNION ALL
  
  SELECT 'talking_human' as stage, created_at
  FROM opportunities
  WHERE stage = 'talking_human'
    AND archived = FALSE
    AND created_at >= NOW() - INTERVAL '30 days'
  
  UNION ALL
  
  SELECT 'won' as stage, created_at
  FROM opportunities
  WHERE stage = 'won'
    AND archived = FALSE
    AND created_at >= NOW() - INTERVAL '30 days'
) combined
GROUP BY stage
ORDER BY 
  CASE stage
    WHEN 'interest_click' THEN 1
    WHEN 'interest' THEN 2
    WHEN 'talking_ai' THEN 3
    WHEN 'talking_human' THEN 4
    WHEN 'won' THEN 5
  END;
```

## Análises Possíveis

### 1. Análise de Engajamento
- **Baixa taxa cliques → interesse**: Usuários clicam mas não convertem para leads
  - Ação: Otimizar CTAs, melhorar formulário, reduzir atrito

- **Alta taxa cliques → interesse**: Usuários engajados
  - Ação: Aumentar tráfego, investir em marketing

### 2. Análise de Conclusão
- **Baixa taxa interesse → IA**: Leads não são atendidos
  - Ação: Revisar configuração da IA, verificar webhook

- **Alta taxa interesse → IA**: IA funcionando bem
  - Ação: Expandir uso da IA para mais leads

### 3. Análise de Escalonamento
- **Baixa taxa IA → Humano**: Leads travados com IA
  - Ação: Ajustar critérios de escalonamento

- **Alta taxa IA → Humano**: Leads sendo bem triados
  - Ação: Otimizar recursos humanos

### 4. Análise de Fechamento
- **Baixa taxa Humano → Ganho**: Perdendo negócios
  - Ação: Treinar equipe, melhorar follow-up

- **Alta taxa Humano → Ganho**: Equipe eficiente
  - Ação: Expandir equipe, aumentar volume

## Próximas Evoluções

1. **Adicionar `product_id`**: Métricas de funil por produto
2. **Comparar com Funil Comercial**: Paralelo entre comportamento e vendas
3. **Tendência temporal**: Evolução do funil ao longo do tempo
4. **Segmentação por categoria**: Funil comportamental por tipo de produto
5. **Alertas automáticos**: Notificações quando taxas caem abaixo do esperado
6. **Previsão de conversão**: Estimar quantos cliques virarão vendas

## Regras de Implementação

✅ **NÃO alterar pipeline existente** → Funil Comportamental é adicional  
✅ **NÃO alterar CRM** → Usa dados já existentes  
✅ **NÃO alterar banco** → Sem novas tabelas  
✅ **NÃO mexer no Core** → Apenas visual e dados  
✅ **Apenas duplicar e adaptar** → Baseado em OpportunityFunnel  
✅ **Usar dados existentes** → funnel_events + opportunities  
✅ **Mostrar comportamento real** → Cliques → Conversão  
