
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  AlertTriangle, Wrench, Zap, Shield, Sparkles, Speaker, 
  Lightbulb, Users, Package, User, Truck, HelpCircle,
  CalendarDays, Clock, ArrowRightLeft, CalendarRange
} from 'lucide-react';

export const StatusBadge = ({ status }) => {
  const statusMap = {
    'Aprovado': 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400',
    'Liberado para guarita': 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400',
    'Pendente': 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400',
    'Em análise': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
    'Enviado': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
    'Rascunho': 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300',
    'Correção solicitada': 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400',
    'Reprovado': 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400',
    'Bloqueado': 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400',
  };

  return (
    <Badge variant="outline" className={`font-medium ${statusMap[status] || 'bg-slate-100 text-slate-800'}`}>
      {status}
    </Badge>
  );
};

export const FunctionIcon = ({ functionName, className = "w-4 h-4" }) => {
  const iconMap = {
    'Montador': Wrench,
    'Eletricista': Zap,
    'Segurança': Shield,
    'Auxiliar de limpeza': Sparkles,
    'Técnico de som': Speaker,
    'Técnico de iluminação': Lightbulb,
    'Coordenador de equipe': Users,
    'Expositor': Package,
    'Recepcionista': User,
    'Motorista': Truck,
    'Outro': HelpCircle
  };
  
  const IconComponent = iconMap[functionName] || HelpCircle;
  return <IconComponent className={className} />;
};

export const AccessTypeIcon = ({ type, className = "w-4 h-4" }) => {
  const iconMap = {
    'Montagem': Wrench,
    'Evento': CalendarDays,
    'Desmontagem': ArrowRightLeft,
    'Todos os períodos': CalendarRange
  };
  
  const IconComponent = iconMap[type] || Clock;
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <IconComponent className={className} />
      <span>{type}</span>
    </div>
  );
};

export const PendencyIndicator = ({ hasPendency, message }) => {
  if (!hasPendency) return null;
  
  return (
    <div 
      className="inline-flex items-center justify-center p-1.5 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
      title={message || "Pendência encontrada"}
    >
      <AlertTriangle className="w-4 h-4" />
    </div>
  );
};

export const SummaryCard = ({ icon: Icon, title, value, colorClass }) => {
  return (
    <Card className="hover:shadow-md transition-all duration-200 border-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tabular-nums tracking-tight text-foreground">{value}</p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
