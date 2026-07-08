
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { StatusBadge, FunctionIcon, AccessTypeIcon } from '@/components/PortalUI.jsx';
import { AlertTriangle, User, Calendar, MapPin, Phone, FileText } from 'lucide-react';

const PessoasDetalhesModal = ({ person, isOpen, onClose, onEdit }) => {
  if (!person) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhes da Pessoa</DialogTitle>
          <DialogDescription>
            Informações completas do cadastro
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
          <div className="flex flex-col items-center space-y-4 border-b md:border-b-0 md:border-r border-border pb-6 md:pb-0 md:pr-6">
            <div className={`w-32 h-32 rounded-2xl flex items-center justify-center text-4xl font-bold ${person.avatarBg || 'bg-slate-100 text-slate-700'}`}>
              {person.nome.charAt(0)}
            </div>
            <StatusBadge status={person.status} />
            
            {person.temPendencia && (
              <div className="bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 p-3 rounded-lg text-sm flex items-start gap-2 w-full">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{person.motivoPendencia}</span>
              </div>
            )}
          </div>

          <div className="md:col-span-2 space-y-5">
            <div>
              <h3 className="text-xl font-bold text-foreground mb-1">{person.nome}</h3>
              <div className="flex items-center text-muted-foreground gap-2 text-sm">
                <FunctionIcon functionName={person.funcao} className="w-4 h-4" />
                <span>{person.funcao}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">CPF</span>
                <p className="text-sm font-medium text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  {person.cpf}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">RG</span>
                <p className="text-sm font-medium text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  {person.rg || 'Não informado'}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Telefone</span>
                <p className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  {person.telefone || 'Não informado'}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Cadastro</span>
                <p className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  {new Date(person.dataCadastro).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-border space-y-4">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Acesso Solicitado</span>
                <div className="flex items-center gap-4">
                  <AccessTypeIcon type={person.tipoAcesso} className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-foreground bg-muted px-2 py-1 rounded-md">{person.periodoSolicitado}</span>
                </div>
              </div>

              {person.observacoes && (
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Observações</span>
                  <p className="text-sm text-foreground bg-muted/50 p-3 rounded-lg border border-border">
                    {person.observacoes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-border pt-4 sm:justify-between">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          {(person.status === 'Rascunho' || person.status === 'Correção solicitada') && (
            <Button onClick={onEdit} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Editar Cadastro
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PessoasDetalhesModal;
