
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const StatusBadge = ({ status, className }) => {
  const normalizedStatus = status?.toLowerCase() || '';

  const getStatusColor = () => {
    if (['aprovado', 'ativo', 'paga', 'usado', 'entrada autorizada', 'liberado para guarita', 'liberado', 'conferido'].includes(normalizedStatus)) {
      return 'bg-[hsl(var(--status-approved)/0.15)] text-[hsl(var(--status-approved))] border-[hsl(var(--status-approved)/0.3)]';
    }
    if (['criado', 'enviado', 'aguardando cadastro', 'aguardando aprovacao', 'aguardando aprovação', 'aguardando_aprovacao', 'aguardando_avaliacao', 'cadastro enviado', 'correcao solicitada', 'correção solicitada', 'correcao_solicitada', 'indicado', 'convite enviado'].includes(normalizedStatus)) {
      return 'bg-[hsl(var(--status-pending)/0.15)] text-[hsl(var(--status-pending))] border-[hsl(var(--status-pending)/0.3)]';
    }
    if (['em análise', 'em analise', 'atenção', 'atencao'].includes(normalizedStatus)) {
      return 'bg-[hsl(var(--status-pending)/0.15)] text-[hsl(var(--status-pending))] border-[hsl(var(--status-pending)/0.3)]';
    }
    if (['bloqueado', 'reprovado', 'atrasada', 'cancelado', 'crítico', 'critico'].includes(normalizedStatus)) {
      return 'bg-[hsl(var(--status-blocked)/0.15)] text-[hsl(var(--status-blocked))] border-[hsl(var(--status-blocked)/0.3)]';
    }
    if (['pendente', 'rascunho', 'expirado', 'não anexado', 'nao anexado'].includes(normalizedStatus)) {
      return 'bg-[hsl(var(--status-pending)/0.15)] text-[hsl(var(--status-pending))] border-[hsl(var(--status-pending)/0.3)]';
    }
    if (['isento', 'em breve', 'informação', 'informacao', 'cadastro aberto'].includes(normalizedStatus)) {
      return 'bg-[hsl(var(--status-expired)/0.15)] text-[hsl(var(--status-expired))] border-[hsl(var(--status-expired)/0.3)]';
    }
    return 'bg-muted text-muted-foreground border-border';
  };

  return (
    <Badge variant="outline" className={cn(`font-medium whitespace-nowrap ${getStatusColor()}`, className)}>
      {status || 'Desconhecido'}
    </Badge>
  );
};

export default StatusBadge;
