# Tracking Simplificado do Funil de Conversão

## Visão Geral

Sistema de tracking global para medir o funil de conversão do sistema, sem complexidade por produto.

## Arquitetura

### Tabela: `funnel_events`

```sql
CREATE TABLE funnel_events (
  id UUID PRIMARY KEY,
  event_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Eventos Disponíveis

| `event_type` | Descrição | Quando é disparado |
|--------------|-----------|-------------------|
| `interest_click` | Usuário clicou em botão de interesse | Ao abrir modal de contato |
| `message_sent` | Mensagem enviada via webhook | Ao submeter formulário de contato |

## Uso

### 1. Importar a função

```typescript
import { trackEvent } from '@/services/funnelTrackingService';
```

### 2. Registrar evento

```typescript
// Registrar clique de interesse
trackEvent('interest_click');

// Registrar envio de mensagem
trackEvent('message_sent');
```

### 3. Buscar métricas

```typescript
import { getEventsCountByType, getConversionRate, getEventsByPeriod } from '@/services/funnelTrackingService';

// Contagem total por tipo
const counts = await getEventsCountByType();
// Resultado: { interest_click: 150, message_sent: 30 }

// Contagem por período (últimos N dias)
const last7Days = await getEventsByPeriod(7);
// Resultado: { interest_click: 45, message_sent: 12 }

// Taxa de conversão
const rate = await getConversionRate();
// Resultado: 20.0 (20%)
```

## Funil de Conversão

```
┌─────────────────────────────────────────────────┐
│ 1. Interesse (interest_click)                    │
│    Usuário clica em botão de interesse          │
│    e abre modal de contato                       │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│ 2. Mensagem (message_sent)                      │
│    Usuário preenche formulário e submite        │
│    (webhook disparado, lead gerado)              │
└─────────────────────────────────────────────────┘
```

## Taxa de Conversão

```
Taxa de Conversão = (message_sent / interest_click) × 100
```

### Exemplo

```
- 100 usuários clicaram em "Gostei" (interest_click)
- 20 usuários enviaram mensagem (message_sent)
- Taxa de Conversão = (20 / 100) × 100 = 20%
```

## Dashboard

Componente `FunnelMetrics` disponível em `src/components/analytics/FunnelMetrics.tsx`:

```typescript
import FunnelMetrics from '@/components/analytics/FunnelMetrics';

<FunnelMetrics />
```

### Métricas Exibidas

- **Interesses**: Total de cliques em botões de interesse
- **Mensagens**: Total de mensagens enviadas
- **Taxa de Conversão**: % de interesses que viraram mensagens
- **Últimos 7 Dias**: Resumo do período

## Implementação nos Componentes

### ProductDetail.tsx

```typescript
// Ao abrir modal de contato
const handleInterestClick = () => {
  trackProductInterest(product.id);  // Tracking por produto
  trackEvent('interest_click');      // Tracking global do funil
  setModalOpen(true);
};

// Ao enviar mensagem via webhook
const handleSubmit = async () => {
  // ... lógica de envio do webhook
  
  // Webhook disparado com sucesso
  showSuccess('Mensagem enviada!');
  trackEvent('message_sent');  // Tracking global do funil
  
  setModalOpen(false);
};
```

## Console Logs

Durante desenvolvimento, os seguintes logs aparecem no console:

```
[FunnelTracking] Tracking event: interest_click
[FunnelTracking] Event tracked successfully: interest_click

[FunnelTracking] Tracking event: message_sent
[FunnelTracking] Event tracked successfully: message_sent
```

## Segurança e Performance

- ✅ **Non-blocking**: Tracking não bloqueia UI
- ✅ **Silent errors**: Erros são logados mas não afetam UX
- ✅ **Simplificado**: Sem product_id, apenas eventos globais
- ✅ **Público**: Usuários não autenticados podem registrar eventos
- ✅ **Indexado**: Consultas otimizadas com índices

## Próximas Evoluções

1. **Adicionar `product_id`**: Para métricas por produto
2. **Novos eventos**: WhatsApp, telefone, etc.
3. **Dashboard completo**: Gráficos e visualizações avançadas
4. **Análise de tempo**: Tempo entre eventos
5. **Funil por categoria**: Segmentação por tipo de produto

## Consultas SQL Úteis

### Total de eventos por tipo

```sql
SELECT event_type, COUNT(*) as count
FROM funnel_events
GROUP BY event_type
ORDER BY count DESC;
```

### Eventos por dia

```sql
SELECT 
  DATE(created_at) as date,
  event_type,
  COUNT(*) as count
FROM funnel_events
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at), event_type
ORDER BY date DESC, event_type;
```

### Taxa de conversão por período

```sql
WITH metrics AS (
  SELECT
    COUNT(*) FILTER (WHERE event_type = 'interest_click') as interests,
    COUNT(*) FILTER (WHERE event_type = 'message_sent') as messages
  FROM funnel_events
  WHERE created_at >= NOW() - INTERVAL '7 days'
)
SELECT
  interests,
  messages,
  CASE 
    WHEN interests > 0 THEN ROUND((messages::FLOAT / interests) * 100, 2)
    ELSE 0
  END as conversion_rate
FROM metrics;
```

## Remover Logs Temporários

Após validação em produção, remova os console.logs de `funnelTrackingService.ts`:

```typescript
// Remover estas linhas:
console.log('[FunnelTracking] Tracking event:', eventType);
console.log('[FunnelTracking] Event tracked successfully:', eventType);
console.error('[FunnelTracking] Error tracking event:', error);
```
