
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { User, FileText } from 'lucide-react';
import { toast } from 'sonner';

const GuaritaSolicitacaoModal = ({ isOpen, onClose, person, onSubmit }) => {
  const [motivo, setMotivo] = useState('');
  const [urgencia, setUrgencia] = useState('media');
  const [validade, setValidade] = useState('');
  const [observacao, setObservacao] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!motivo || !validade) {
      toast.error('Preencha os campos obrigatórios (Motivo e Validade).');
      return;
    }

    const solicitacaoData = {
      id: `sol-${Date.now()}`,
      personId: person.id,
      pessoa: person.nome,
      motivo,
      urgencia,
      validade,
      observacao,
      dataEnvio: new Date().toLocaleString(),
      status: 'pendente'
    };

    onSubmit(solicitacaoData);
    
    // Reset form
    setMotivo('');
    setUrgencia('media');
    setValidade('');
    setObservacao('');
  };

  if (!person) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Solicitar Liberação Administrativa</DialogTitle>
          <DialogDescription>
            Envie uma solicitação para a administração do evento analisar o acesso de {person.nome}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-2">
          {/* Pre-filled Data */}
          <div className="grid grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg border border-border">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Pessoa</Label>
              <div className="font-medium flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                {person.nome}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">CPF</Label>
              <div className="font-medium text-sm">{person.cpf}</div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Fornecedor</Label>
              <div className="font-medium text-sm">{person.fornecedor}</div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Evento</Label>
              <div className="font-medium text-sm truncate" title={person.evento}>{person.evento}</div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="motivo" className="text-foreground">Motivo da solicitação <span className="text-destructive">*</span></Label>
              <Select value={motivo} onValueChange={setMotivo} required>
                <SelectTrigger id="motivo" className="w-full bg-background">
                  <SelectValue placeholder="Selecione o motivo da pendência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pessoa_nao_cadastrada">Pessoa não cadastrada</SelectItem>
                  <SelectItem value="cadastro_pendente">Cadastro pendente</SelectItem>
                  <SelectItem value="foto_ausente">Foto ausente</SelectItem>
                  <SelectItem value="cpf_divergente">CPF divergente</SelectItem>
                  <SelectItem value="taxa_pendente">Taxa pendente</SelectItem>
                  <SelectItem value="fornecedor_nao_aprovado">Fornecedor não aprovado</SelectItem>
                  <SelectItem value="fora_do_periodo">Fora do período autorizado</SelectItem>
                  <SelectItem value="autorizacao_emergencial">Autorização emergencial solicitada</SelectItem>
                  <SelectItem value="divergencia_dados">Divergência de nome/documento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nível de urgência</Label>
              <RadioGroup value={urgencia} onValueChange={setUrgencia} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="baixa" id="urg-baixa" />
                  <Label htmlFor="urg-baixa" className="font-normal cursor-pointer">Baixa</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="media" id="urg-media" />
                  <Label htmlFor="urg-media" className="font-normal cursor-pointer">Média</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="alta" id="urg-alta" />
                  <Label htmlFor="urg-alta" className="font-normal cursor-pointer">Alta</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="urgente" id="urg-urgente" />
                  <Label htmlFor="urg-urgente" className="font-normal cursor-pointer text-destructive font-medium">Urgente</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="validade" className="text-foreground">Validade solicitada <span className="text-destructive">*</span></Label>
              <Select value={validade} onValueChange={setValidade} required>
                <SelectTrigger id="validade" className="w-full bg-background">
                  <SelectValue placeholder="Selecione o tempo de liberação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="uma_entrada">Uma entrada (Acesso único)</SelectItem>
                  <SelectItem value="somente_hoje">Somente hoje</SelectItem>
                  <SelectItem value="montagem">Período de Montagem</SelectItem>
                  <SelectItem value="evento">Dias de Evento</SelectItem>
                  <SelectItem value="desmontagem">Desmontagem</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacao">Observação da guarita (Opcional)</Label>
              <Textarea 
                id="observacao" 
                placeholder="Descreva algum detalhe adicional, quem autorizou verbalmente, placa do veículo, etc."
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                className="h-20 bg-background"
              />
            </div>

            {/* Simulated Attachment */}
            <div className="space-y-2 border border-dashed border-border rounded-lg p-4 bg-background flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-2">
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Captura de Documento</p>
              <p className="text-xs text-muted-foreground">Nenhuma foto anexada. (Simulação)</p>
              <Button type="button" variant="outline" size="sm" className="mt-2" disabled>
                Tirar Foto
              </Button>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="bg-[#fb923c] hover:bg-[#f97316] text-white">Enviar Solicitação</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GuaritaSolicitacaoModal;
