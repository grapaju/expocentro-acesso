
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Building2, Calendar, ShieldAlert, Clock, LogIn, LogOut } from 'lucide-react';

const GuaritaDetalhesModal = ({ isOpen, onClose, person }) => {
  if (!person) return null;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'liberado': return <Badge className="bg-muted/50 text-foreground">Liberado</Badge>;
      case 'pendente': return <Badge className="bg-muted/40 text-foreground">Cadastro Pendente</Badge>;
      case 'bloqueado': return <Badge variant="destructive">Bloqueado</Badge>;
      case 'fora_do_periodo': return <Badge variant="outline" className="text-muted-foreground border-border">Fora do Período</Badge>;
      case 'pagamento_pendente': return <Badge variant="outline" className="text-foreground border-border">Pagamento Pendente</Badge>;
      default: return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-3">
            Detalhes do Acesso
            {getStatusBadge(person.status)}
          </DialogTitle>
          <DialogDescription>
            Informações completas do credenciamento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-muted/40 flex items-center justify-center text-foreground font-bold text-xl">
              {person.avatar}
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">{person.nome}</h3>
              <p className="text-muted-foreground font-mono">{person.cpf}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Building2 className="w-3 h-3"/> Fornecedor</p>
              <p className="font-medium text-sm">{person.fornecedor}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3"/> Evento</p>
              <p className="font-medium text-sm">{person.evento}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><User className="w-3 h-3"/> Função</p>
              <p className="font-medium text-sm">{person.funcao}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><ShieldAlert className="w-3 h-3"/> Tipo de Acesso</p>
              <p className="font-medium text-sm">{person.tipoAcesso}</p>
            </div>
          </div>

          <div className="bg-muted p-4 rounded-lg space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Período Autorizado
            </h4>
            <p className="text-sm">{person.periodoAutorizado}</p>
          </div>

          <div className="border-t border-border pt-4">
            <h4 className="text-sm font-semibold mb-3">Registros Hoje</h4>
            <div className="flex flex-col gap-2">
              {person.entradaRegistrada ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LogIn className="w-4 h-4 text-accent" />
                  <span>Entrada registrada: <span className="font-medium text-foreground">{person.dataHoraEntrada || 'Hoje'}</span></span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground opacity-60">
                  <LogIn className="w-4 h-4" />
                  <span>Nenhuma entrada registrada</span>
                </div>
              )}
              
              {person.saidaRegistrada ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LogOut className="w-4 h-4 text-[#fb923c]" />
                  <span>Saída registrada: <span className="font-medium text-foreground">{person.dataHoraSaida || 'Hoje'}</span></span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground opacity-60">
                  <LogOut className="w-4 h-4" />
                  <span>Nenhuma saída registrada</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GuaritaDetalhesModal;
