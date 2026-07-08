import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Users } from 'lucide-react';

const ACCESS_TYPES = ['Montagem', 'Evento', 'Desmontagem', 'Todos os períodos'];

const ReutilizarEquipeExistenteModal = ({
  open,
  onOpenChange,
  fornecedor,
  previousEvents,
  teamHistory,
  currentEvento,
  onSubmit
}) => {
  const [selectedEventoAnteriorId, setSelectedEventoAnteriorId] = useState('');
  const [selectedPeopleIds, setSelectedPeopleIds] = useState([]);
  const [tipoAcesso, setTipoAcesso] = useState('');
  const [periodo, setPeriodo] = useState('');
  const [confirmouPeriodo, setConfirmouPeriodo] = useState(false);
  const [exigirNovoAceiteNormas, setExigirNovoAceiteNormas] = useState(true);

  useEffect(() => {
    if (!open) {
      setSelectedEventoAnteriorId('');
      setSelectedPeopleIds([]);
      setTipoAcesso('');
      setPeriodo('');
      setConfirmouPeriodo(false);
      setExigirNovoAceiteNormas(true);
    }
  }, [open]);

  const pessoasDisponiveis = useMemo(() => {
    if (!fornecedor || !selectedEventoAnteriorId) return [];

    const supplierRefs = [fornecedor.id, fornecedor.partnerSupplierId].filter(Boolean);

    const historico = teamHistory.find(
      (item) => supplierRefs.includes(item.fornecedorId) && item.eventoId === selectedEventoAnteriorId
    );

    return historico?.pessoas || [];
  }, [fornecedor, selectedEventoAnteriorId, teamHistory]);

  const eventoAnteriorSelecionado = useMemo(
    () => previousEvents.find((evento) => evento.id === selectedEventoAnteriorId),
    [previousEvents, selectedEventoAnteriorId]
  );

  const canSubmit =
    Boolean(selectedEventoAnteriorId) &&
    selectedPeopleIds.length > 0 &&
    Boolean(tipoAcesso) &&
    Boolean(periodo.trim()) &&
    confirmouPeriodo;

  const togglePessoa = (personId) => {
    setSelectedPeopleIds((prev) =>
      prev.includes(personId) ? prev.filter((id) => id !== personId) : [...prev, personId]
    );
  };

  const handleSubmit = () => {
    if (!canSubmit || !fornecedor) return;

    const pessoasSelecionadas = pessoasDisponiveis
      .filter((pessoa) => selectedPeopleIds.includes(pessoa.id))
      .map((pessoa) => ({
        ...pessoa,
        tipoAcesso,
        periodo,
        statusConfirmacaoDados: 'Precisa confirmar dados',
        statusAprovacaoEventoAtual: 'Aguardando aprovação administrativa',
        periodoConfirmado: true,
        novoAceiteNormasPendente: exigirNovoAceiteNormas
      }));

    onSubmit({
      fornecedor: {
        id: fornecedor.id,
        nome: fornecedor.nome,
        classificacao: fornecedor.classificacao,
        categoria: fornecedor.categoria,
        responsavel: fornecedor.responsavel
      },
      eventoAtual: {
        id: currentEvento?.id,
        nome: currentEvento?.nome
      },
      eventoAnterior: {
        id: eventoAnteriorSelecionado?.id,
        nome: eventoAnteriorSelecionado?.nome
      },
      tipoAcesso,
      periodo,
      exigirNovoAceiteNormas,
      pessoasSelecionadas
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Reutilizar equipe existente</DialogTitle>
          <DialogDescription>
            Reaproveite dados cadastrais de fornecedores com classificação administrativa elegível
            e vincule a equipe no evento atual com nova validação de acesso e normas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="evento-anterior">Selecionar evento anterior</Label>
              <Select value={selectedEventoAnteriorId} onValueChange={setSelectedEventoAnteriorId}>
                <SelectTrigger id="evento-anterior">
                  <SelectValue placeholder="Escolha um evento" />
                </SelectTrigger>
                <SelectContent>
                  {previousEvents.map((evento) => (
                    <SelectItem key={evento.id} value={evento.id}>
                      {evento.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo-acesso">Definir tipo de acesso</Label>
              <Select value={tipoAcesso} onValueChange={setTipoAcesso}>
                <SelectTrigger id="tipo-acesso">
                  <SelectValue placeholder="Selecione o tipo de acesso" />
                </SelectTrigger>
                <SelectContent>
                  {ACCESS_TYPES.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="periodo">Definir período</Label>
            <Input
              id="periodo"
              value={periodo}
              onChange={(event) => setPeriodo(event.target.value)}
              placeholder="Ex.: 15/07 a 18/07"
            />
            <div className="flex items-start gap-2 pt-1">
              <Checkbox
                id="confirmar-periodo"
                checked={confirmouPeriodo}
                onCheckedChange={(checked) => setConfirmouPeriodo(Boolean(checked))}
              />
              <Label htmlFor="confirmar-periodo" className="text-sm leading-5">
                Confirmo novo período de acesso para o evento atual.
              </Label>
            </div>
            <div className="flex items-start gap-2">
              <Checkbox
                id="novo-aceite-normas"
                checked={exigirNovoAceiteNormas}
                onCheckedChange={(checked) => setExigirNovoAceiteNormas(Boolean(checked))}
              />
              <Label htmlFor="novo-aceite-normas" className="text-sm leading-5">
                Exigir novo aceite das normas do evento atual.
              </Label>
            </div>
          </div>

          <div className="rounded-lg border border-border p-4 bg-muted/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Selecionar pessoas da equipe já cadastrada</p>
              </div>
              <Badge variant="outline">{selectedPeopleIds.length} selecionada(s)</Badge>
            </div>

            {pessoasDisponiveis.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Selecione um evento anterior para listar a equipe já cadastrada deste fornecedor.
              </p>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {pessoasDisponiveis.map((pessoa) => (
                  <div key={pessoa.id} className="flex items-start justify-between gap-3 rounded-md border border-border bg-background p-3">
                    <div className="flex items-start gap-2">
                      <Checkbox
                        id={`pessoa-${pessoa.id}`}
                        checked={selectedPeopleIds.includes(pessoa.id)}
                        onCheckedChange={() => togglePessoa(pessoa.id)}
                      />
                      <div>
                        <Label htmlFor={`pessoa-${pessoa.id}`} className="text-sm font-medium cursor-pointer">
                          {pessoa.nome}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {pessoa.cpf} • {pessoa.funcao}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                      Precisa confirmar dados
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-warning/40 bg-warning/10 p-3">
            <p className="text-xs text-foreground flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 text-warning" />
              Mesmo com reaproveitamento de cadastro, a liberação para guarita depende da aprovação administrativa no evento atual.
            </p>
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            Enviar para aprovação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReutilizarEquipeExistenteModal;
