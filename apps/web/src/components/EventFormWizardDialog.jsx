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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

const WIZARD_STEPS = [
  { id: 'gerais', label: 'Dados gerais' },
  { id: 'periodos', label: 'Períodos' },
  { id: 'espacos', label: 'Espaços locados' },
  { id: 'regras', label: 'Regras iniciais' }
];

const ESPACOS_PADRAO = [
  'Pavilhão Norte',
  'Pavilhão Sul',
  'Credenciamento',
  'Praça de Alimentação',
  'Auditório Torre Norte',
  'Auditório Torre Sul',
  'Estacionamento',
  'Outros'
];

const INITIAL_FORM = {
  nome: '',
  organizador: '',
  responsavelLocatario: '',
  telefoneWhatsApp: '',
  email: '',
  statusContrato: 'Pendente',
  status: 'Ativo',
  periodos: {
    montagemInicio: '',
    montagemFim: '',
    eventoInicio: '',
    eventoFim: '',
    desmontagemInicio: '',
    desmontagemFim: ''
  },
  espacosLocados: [],
  permitirCredenciamentoAgora: true,
  exigirContratoAntesConvite: true,
  exigirPlanoAntesGuarita: true,
  regraTaxa: 'nao_definida'
};

const toIsoDate = (brDate) => {
  const [day, month, year] = String(brDate || '').split('/');
  if (!day || !month || !year) return '';
  return `${year}-${month}-${day}`;
};

const toBrDate = (isoDate) => {
  if (!isoDate) return '';
  const [year, month, day] = String(isoDate).split('-');
  if (!year || !month || !day) return '';
  return `${day}/${month}/${year}`;
};

const parsePeriodoMacro = (periodo) => {
  const [inicio, fim] = String(periodo || '').split(' a ');
  return {
    inicio: toIsoDate(inicio),
    fim: toIsoDate(fim)
  };
};

const buildInitialFromEvent = (eventData) => {
  if (!eventData) return INITIAL_FORM;

  const periodoMacro = parsePeriodoMacro(eventData.periodo);
  const periodos = eventData.periodos || {};

  return {
    ...INITIAL_FORM,
    ...eventData,
    nome: eventData.nome || '',
    organizador: eventData.organizador || '',
    responsavelLocatario: eventData.responsavelLocatario || '',
    telefoneWhatsApp: eventData.telefoneWhatsApp || '',
    email: eventData.email || '',
    statusContrato: eventData.statusContrato || 'Pendente',
    status: eventData.status || 'Ativo',
    periodos: {
      montagemInicio: periodos.montagem?.inicio || periodoMacro.inicio,
      montagemFim: periodos.montagem?.fim || periodoMacro.fim,
      eventoInicio: periodos.evento?.inicio || periodoMacro.inicio,
      eventoFim: periodos.evento?.fim || periodoMacro.fim,
      desmontagemInicio: periodos.desmontagem?.inicio || periodoMacro.inicio,
      desmontagemFim: periodos.desmontagem?.fim || periodoMacro.fim
    },
    espacosLocados: Array.isArray(eventData.espacosLocados) ? eventData.espacosLocados : [],
    permitirCredenciamentoAgora: eventData.permitirCredenciamentoAgora !== false,
    exigirContratoAntesConvite: eventData.exigirContratoAntesConvite !== false,
    exigirPlanoAntesGuarita: eventData.exigirPlanoAntesGuarita !== false,
    regraTaxa: eventData.regraTaxa || 'nao_definida'
  };
};

const EventFormWizardDialog = ({
  open,
  onOpenChange,
  onSubmit,
  initialValues,
  title = 'Cadastro de evento',
  description = 'Preencha os dados do evento em etapas.'
}) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState(INITIAL_FORM);

  useEffect(() => {
    if (!open) return;
    setStepIndex(0);
    setForm(buildInitialFromEvent(initialValues));
  }, [open, initialValues]);

  const isLastStep = stepIndex === WIZARD_STEPS.length - 1;

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updatePeriodoField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      periodos: {
        ...prev.periodos,
        [field]: value
      }
    }));
  };

  const toggleEspaco = (espaco, checked) => {
    setForm((prev) => {
      const current = new Set(prev.espacosLocados || []);
      if (checked) current.add(espaco);
      else current.delete(espaco);
      return {
        ...prev,
        espacosLocados: Array.from(current)
      };
    });
  };

  const validationError = useMemo(() => {
    if (stepIndex === 0) {
      if (!form.nome.trim() || !form.organizador.trim() || !form.email.trim()) {
        return 'Preencha nome, organizador e e-mail.';
      }
    }

    if (stepIndex === 1) {
      const p = form.periodos;
      if (!p.montagemInicio || !p.montagemFim || !p.eventoInicio || !p.eventoFim || !p.desmontagemInicio || !p.desmontagemFim) {
        return 'Preencha todos os períodos.';
      }
    }

    return '';
  }, [form, stepIndex]);

  const handleNext = () => {
    if (validationError) return;
    setStepIndex((prev) => Math.min(prev + 1, WIZARD_STEPS.length - 1));
  };

  const handleSubmit = () => {
    if (validationError) return;

    const payload = {
      nome: form.nome.trim(),
      organizador: form.organizador.trim(),
      responsavelLocatario: form.responsavelLocatario.trim(),
      telefoneWhatsApp: form.telefoneWhatsApp.trim(),
      email: form.email.trim(),
      statusContrato: form.statusContrato,
      status: form.status,
      faseAtual: form.status === 'Encerrado' ? 'Cadastro encerrado' : (form.permitirCredenciamentoAgora ? 'Cadastro aberto' : 'Em análise'),
      faseNova: form.status === 'Encerrado' ? 'Cadastro encerrado' : (form.permitirCredenciamentoAgora ? 'Cadastro aberto' : 'Em análise'),
      periodo: `${toBrDate(form.periodos.eventoInicio)} a ${toBrDate(form.periodos.eventoFim)}`,
      periodos: {
        montagem: { inicio: form.periodos.montagemInicio, fim: form.periodos.montagemFim },
        evento: { inicio: form.periodos.eventoInicio, fim: form.periodos.eventoFim },
        desmontagem: { inicio: form.periodos.desmontagemInicio, fim: form.periodos.desmontagemFim }
      },
      espacosLocados: form.espacosLocados,
      espacosLocadosDefinidos: form.espacosLocados.length > 0,
      permitirCredenciamentoAgora: form.permitirCredenciamentoAgora,
      exigirContratoAntesConvite: form.exigirContratoAntesConvite,
      exigirPlanoAntesGuarita: form.exigirPlanoAntesGuarita,
      regrasTaxaDefinidas: form.regraTaxa !== 'nao_definida',
      taxaNaoDefinida: form.regraTaxa === 'nao_definida',
      regraTaxa: form.regraTaxa
    };

    onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {WIZARD_STEPS.map((step, index) => (
              <button
                key={step.id}
                type="button"
                onClick={() => setStepIndex(index)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                  index === stepIndex ? 'bg-foreground text-background border-foreground' : 'bg-muted text-muted-foreground border-border'
                }`}
              >
                {index + 1}. {step.label}
              </button>
            ))}
          </div>

          {stepIndex === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="ev-nome">Nome do evento</Label>
                <Input id="ev-nome" value={form.nome} onChange={(event) => updateField('nome', event.target.value)} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="ev-organizador">Organizador/locatário</Label>
                <Input id="ev-organizador" value={form.organizador} onChange={(event) => updateField('organizador', event.target.value)} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="ev-responsavel">Responsável do locatário</Label>
                <Input id="ev-responsavel" value={form.responsavelLocatario} onChange={(event) => updateField('responsavelLocatario', event.target.value)} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="ev-telefone">Telefone/WhatsApp</Label>
                <Input id="ev-telefone" value={form.telefoneWhatsApp} onChange={(event) => updateField('telefoneWhatsApp', event.target.value)} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="ev-email">E-mail</Label>
                <Input id="ev-email" type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="ev-contrato">Status do contrato</Label>
                <select id="ev-contrato" value={form.statusContrato} onChange={(event) => updateField('statusContrato', event.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  <option value="Pendente">Pendente</option>
                  <option value="Assinado">Assinado</option>
                  <option value="Em revisão">Em revisão</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="ev-status">Status do evento</Label>
                <select id="ev-status" value={form.status} onChange={(event) => updateField('status', event.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  <option value="Ativo">Ativo</option>
                  <option value="Pendente">Pendente</option>
                  <option value="Encerrado">Encerrado</option>
                </select>
              </div>
            </div>
          )}

          {stepIndex === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="montagem-inicio">Início da montagem</Label>
                <Input id="montagem-inicio" type="date" value={form.periodos.montagemInicio} onChange={(event) => updatePeriodoField('montagemInicio', event.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="montagem-fim">Fim da montagem</Label>
                <Input id="montagem-fim" type="date" value={form.periodos.montagemFim} onChange={(event) => updatePeriodoField('montagemFim', event.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="evento-inicio">Início do evento</Label>
                <Input id="evento-inicio" type="date" value={form.periodos.eventoInicio} onChange={(event) => updatePeriodoField('eventoInicio', event.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="evento-fim">Fim do evento</Label>
                <Input id="evento-fim" type="date" value={form.periodos.eventoFim} onChange={(event) => updatePeriodoField('eventoFim', event.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="desmontagem-inicio">Início da desmontagem</Label>
                <Input id="desmontagem-inicio" type="date" value={form.periodos.desmontagemInicio} onChange={(event) => updatePeriodoField('desmontagemInicio', event.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="desmontagem-fim">Fim da desmontagem</Label>
                <Input id="desmontagem-fim" type="date" value={form.periodos.desmontagemFim} onChange={(event) => updatePeriodoField('desmontagemFim', event.target.value)} />
              </div>
            </div>
          )}

          {stepIndex === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {ESPACOS_PADRAO.map((espaco) => {
                const checked = (form.espacosLocados || []).includes(espaco);
                return (
                  <label key={espaco} className="flex items-center gap-2 rounded-md border border-border p-2 text-sm">
                    <Checkbox checked={checked} onCheckedChange={(value) => toggleEspaco(espaco, Boolean(value))} />
                    <span>{espaco}</span>
                  </label>
                );
              })}
            </div>
          )}

          {stepIndex === 3 && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>Permitir credenciamento agora?</Label>
                  <select value={String(form.permitirCredenciamentoAgora)} onChange={(event) => updateField('permitirCredenciamentoAgora', event.target.value === 'true')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    <option value="true">Sim</option>
                    <option value="false">Não</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Exigir contrato antes de gerar convite?</Label>
                  <select value={String(form.exigirContratoAntesConvite)} onChange={(event) => updateField('exigirContratoAntesConvite', event.target.value === 'true')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    <option value="true">Sim</option>
                    <option value="false">Não</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Exigir plano antes de liberar guarita?</Label>
                  <select value={String(form.exigirPlanoAntesGuarita)} onChange={(event) => updateField('exigirPlanoAntesGuarita', event.target.value === 'true')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    <option value="true">Sim</option>
                    <option value="false">Não</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Label>Regra de taxa</Label>
                <select value={form.regraTaxa} onChange={(event) => updateField('regraTaxa', event.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  <option value="nao_definida">Não definida</option>
                  <option value="por_pessoa">Por pessoa</option>
                  <option value="por_fornecedor">Por fornecedor</option>
                  <option value="por_evento">Por evento</option>
                  <option value="isento">Isento</option>
                </select>
              </div>
            </div>
          )}

          {validationError ? <p className="text-xs text-destructive">{validationError}</p> : null}
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" disabled={stepIndex === 0} onClick={() => setStepIndex((prev) => Math.max(prev - 1, 0))}>
              Voltar
            </Button>
            {isLastStep ? (
              <Button onClick={handleSubmit}>Salvar evento</Button>
            ) : (
              <Button onClick={handleNext}>Próxima etapa</Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EventFormWizardDialog;
