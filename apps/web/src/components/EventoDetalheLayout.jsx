
import React, { useState } from 'react';
import { useParams, useLocation, useNavigate, Outlet, Link } from 'react-router-dom';
import { useAppData } from '@/store/AppDataContext.jsx';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ArrowLeft, Calendar, UserCheck, AlertCircle, AlertTriangle, Pencil, CircleCheck, CircleAlert, Lock, Clock3, Building2, LogIn, MoreVertical, ChevronRight } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge.jsx';
import { enrichFornecedoresWithNormas, getIntelligentEventChecklist, getOperationalRiskIndicator } from '@/utils/rules.js';
import { getOperationalAlerts } from '@/utils/alerts.js';
import EventFormWizardDialog from '@/components/EventFormWizardDialog.jsx';

const DOC_CONTRATO = ['contrato assinado'];
const DOC_PLANO = ['plano do evento'];

const normalize = (text) => String(text || '').toLowerCase();

const hasDoc = (docs, names) => {
  return (docs || []).some((doc) => {
    const status = normalize(doc.status);
    const isOk = status.includes('anexado') || status.includes('conferido');
    const nome = normalize(doc.name);
    return isOk && names.some((n) => nome.includes(n));
  });
};

const getStatusStyle = (status) => {
  if (status === 'Concluído') return 'bg-[hsl(var(--status-approved)/0.12)] text-[hsl(var(--status-approved))] border-[hsl(var(--status-approved)/0.35)]';
  if (status === 'Atenção') return 'bg-warning/15 text-warning border-warning/40';
  if (status === 'Bloqueado') return 'bg-destructive/10 text-destructive border-destructive/30';
  return 'bg-muted text-muted-foreground border-border';
};

const getStatusIcon = (status) => {
  if (status === 'Concluído') return CircleCheck;
  if (status === 'Atenção') return CircleAlert;
  if (status === 'Bloqueado') return Lock;
  return Clock3;
};

const EventoDetalheLayout = ({ children }) => {
  const { eventoId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { adminMockData, getEventById, updateEvent } = useAppData();
  
  const evento = getEventById(eventoId);
  const fornecedoresComNormas = enrichFornecedoresWithNormas(adminMockData.fornecedores, adminMockData.normas);
  const operationalAlerts = evento
    ? getOperationalAlerts(
      evento,
      fornecedoresComNormas,
      adminMockData.pessoas,
      adminMockData.convites,
      adminMockData.taxas
    )
    : [];

  const riscoOperacional = evento
    ? getOperationalRiskIndicator(
      evento,
      adminMockData.fornecedores,
      adminMockData.pessoas,
      adminMockData.convites,
      adminMockData.taxas,
      {
        normas: adminMockData.normas,
        aprovacoes: adminMockData.aprovacoes,
        guarita: adminMockData.guarita,
        fornecedoresComNormas,
        operationalAlerts
      }
    )
    : null;
  
  // Extract current tab from pathname
  const currentTab = location.pathname.split('/').pop();
  const [openRiskDetails, setOpenRiskDetails] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [showAllSteps, setShowAllSteps] = useState(false);
  const tabLabelMap = {
    convites: 'Convites',
    fornecedores: 'Fornecedores',
    pessoas: 'Equipes',
    aprovacoes: 'Aprovações',
    documentos: 'Documentos',
    taxas: 'Taxas',
    normas: 'Normas',
    guarita: 'Guarita',
    historico: 'Histórico'
  };
  const currentTabLabel = tabLabelMap[currentTab] || 'Visão geral';

  if (!evento) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Evento não encontrado</h2>
        <Button onClick={() => navigate('/admin/eventos')}>Voltar para Eventos</Button>
      </div>
    );
  }

  const handleTabChange = (value) => {
    navigate(`/admin/eventos/${eventoId}/${value}`);
  };

  const riskBadgeClass = {
    Baixo: 'border-[hsl(var(--status-approved)/0.3)] bg-[hsl(var(--status-approved)/0.12)] text-[hsl(var(--status-approved))]',
    Medio: 'border-[hsl(var(--status-pending)/0.3)] bg-[hsl(var(--status-pending)/0.12)] text-[hsl(var(--status-pending))]',
    Alto: 'border-[hsl(var(--warning)/0.3)] bg-[hsl(var(--warning)/0.12)] text-[hsl(var(--warning))]',
    Critico: 'border-[hsl(var(--status-blocked)/0.3)] bg-[hsl(var(--status-blocked)/0.12)] text-[hsl(var(--status-blocked))]'
  };

  const riskCardClass = {
    Baixo: 'bg-[hsl(var(--status-approved)/0.08)] border-[hsl(var(--status-approved)/0.25)]',
    Medio: 'bg-card border-border',
    Alto: 'bg-[hsl(var(--warning)/0.08)] border-[hsl(var(--warning)/0.25)]',
    Critico: 'bg-[hsl(var(--status-blocked)/0.08)] border-[hsl(var(--status-blocked)/0.25)]'
  };

  const handleOpenCriticalPending = () => {
    if (!riscoOperacional?.acaoDireta?.aba) return;
    navigate(`/admin/eventos/${eventoId}/${riscoOperacional.acaoDireta.aba}`);
  };

  const eventSuppliers = adminMockData.fornecedores.filter((item) => item.eventId === eventoId);
  const eventPeople = adminMockData.pessoas.filter((item) => item.eventId === eventoId);
  const eventInvites = adminMockData.convites.filter((item) => item.eventId === eventoId);
  const eventApprovals = adminMockData.aprovacoes.filter((item) => item.eventId === eventoId);
  const eventDocs = adminMockData.documentos.filter((item) => item.eventId === eventoId);
  const eventAccessLogs = adminMockData.guarita.filter((item) => item.eventId === eventoId || item.evento === evento.nome);

  const checklist = getIntelligentEventChecklist(
    evento,
    eventSuppliers,
    eventPeople,
    eventInvites,
    adminMockData.taxas.filter((item) => item.eventId === eventoId),
    {
      normas: adminMockData.normas,
      documents: eventDocs,
      aprovacoes: eventApprovals,
      operationalAlerts
    }
  );

  const etapas = [
    {
      id: 'dados',
      nome: 'Dados do evento',
      status: evento.organizador && evento.periodos ? 'Concluído' : (evento.organizador ? 'Atenção' : 'Pendente'),
      onClick: () => setOpenEditDialog(true)
    },
    {
      id: 'docs',
      nome: 'Documentos',
      status: hasDoc(eventDocs, DOC_CONTRATO) && hasDoc(eventDocs, DOC_PLANO)
        ? 'Concluído'
        : (hasDoc(eventDocs, DOC_CONTRATO) || hasDoc(eventDocs, DOC_PLANO) ? 'Atenção' : 'Pendente'),
      onClick: () => navigate(`/admin/eventos/${eventoId}/documentos`)
    },
    {
      id: 'convites',
      nome: 'Convites e links',
      status: eventInvites.length === 0 ? 'Pendente' : (eventInvites.some((item) => normalize(item.status) === 'cancelado') ? 'Atenção' : 'Concluído'),
      onClick: () => navigate(`/admin/eventos/${eventoId}/convites`)
    },
    {
      id: 'fornecedores',
      nome: 'Empresas do evento',
      status: eventSuppliers.length === 0
        ? 'Pendente'
        : (eventSuppliers.some((item) => normalize(item.statusCadastral) === 'bloqueado') ? 'Atenção' : 'Concluído'),
      onClick: () => navigate(`/admin/eventos/${eventoId}/fornecedores`)
    },
    {
      id: 'pessoas',
      nome: 'Equipes credenciadas',
      status: eventPeople.length === 0 ? 'Pendente' : (eventPeople.some((item) => normalize(item.status).includes('aguardando')) ? 'Atenção' : 'Concluído'),
      onClick: () => navigate(`/admin/eventos/${eventoId}/pessoas`)
    },
    {
      id: 'aprovacao',
      nome: 'Fila de aprovação',
      status: eventApprovals.length > 0 ? 'Pendente' : (eventPeople.length > 0 ? 'Concluído' : 'Pendente'),
      onClick: () => navigate(`/admin/eventos/${eventoId}/aprovacoes`)
    },
    {
      id: 'guarita',
      nome: 'Lista da guarita',
      status: checklist.guarita.isOk ? 'Concluído' : (evento.exigirPlanoAntesGuarita && !hasDoc(eventDocs, DOC_PLANO) ? 'Bloqueado' : 'Pendente'),
      onClick: () => navigate(`/admin/eventos/${eventoId}/guarita`)
    }
  ];

  const nextAction = (() => {
    if (!hasDoc(eventDocs, DOC_CONTRATO)) {
      return { texto: 'Anexar contrato assinado', botao: 'Anexar contrato', aba: 'documentos' };
    }
    if (!evento.periodos) {
      return { texto: 'Definir períodos de montagem, evento e desmontagem', botao: 'Editar períodos', customAction: () => setOpenEditDialog(true) };
    }
    if (!hasDoc(eventDocs, DOC_PLANO)) {
      return { texto: 'Anexar plano do evento', botao: 'Anexar plano', aba: 'documentos' };
    }
    if (eventInvites.length === 0) {
      return { texto: 'Gerar convites para fornecedores', botao: 'Gerar convite', aba: 'convites' };
    }
    if (eventApprovals.length > 0) {
      return { texto: 'Aprovar pessoas pendentes', botao: 'Ir para aprovações', aba: 'aprovacoes' };
    }
    return { texto: 'Liberar lista para guarita', botao: 'Liberar lista', aba: 'documentos' };
  })();

  const runNextAction = () => {
    if (nextAction.customAction) {
      nextAction.customAction();
      return;
    }
    if (!nextAction.aba) return;
    navigate(`/admin/eventos/${eventoId}/${nextAction.aba}`);
  };

  const handleSaveEvent = (payload) => {
    updateEvent(eventoId, payload);
    setOpenEditDialog(false);
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-card border-b border-border">
        <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-7 2xl:p-8">
          <Link to="/admin/eventos" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Eventos
          </Link>
          
          <div className="rounded-lg border border-border bg-card/80 p-4">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{evento.nome}</h1>
                  <StatusBadge status={evento.status} />
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {evento.periodo}
                  </div>
                  <span className="text-border">•</span>
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-foreground">Fase:</span> {evento.faseAtual}
                  </div>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setOpenEditDialog(true)}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Editar evento
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-border text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Cadastros:</span>
                <span className="font-semibold text-foreground">{evento.pessoasCadastradas}</span>
              </div>
              <span className="text-border">|</span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Pendências:</span>
                <span className="font-semibold text-foreground">{evento.pendencias}</span>
              </div>
              <span className="text-border">|</span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Fornecedores:</span>
                <span className="font-semibold text-foreground">{eventSuppliers.length}</span>
              </div>
              <span className="text-border">|</span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Liberados:</span>
                <span className="font-semibold text-foreground">{evento.pessoasLiberadasGuarita ?? evento.pessoasLiberadas ?? 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8">
          {riscoOperacional && (
            <div className={`mb-2 rounded-md border px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-sm ${riskCardClass[riscoOperacional.nivel] || 'bg-card border-border'}`}>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">Risco: {riscoOperacional.nivel}</span>
                </div>
                <span className="text-border">•</span>
                <span className="text-muted-foreground">Prontidão: <span className="font-semibold text-foreground">{riscoOperacional.percentualProntidao}%</span></span>
                <span className="text-border">•</span>
                <span className="text-muted-foreground"><span className="font-semibold text-foreground">{riscoOperacional.principaisMotivos.length}</span> pendências críticas</span>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setOpenRiskDetails(true)}>
                Ver detalhes
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          )}

          <Card className="mb-2 border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Próxima ação recomendada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3 border-b border-border">
                <p className="text-sm text-foreground">{nextAction.texto}</p>
                <Button size="sm" onClick={runNextAction}>{nextAction.botao}</Button>
              </div>
              <div className="space-y-2">
                {eventApprovals.length > 0 && (
                  <button 
                    onClick={() => navigate(`/admin/eventos/${eventoId}/aprovacoes`)}
                    className="flex items-center justify-between w-full text-sm text-muted-foreground hover:text-foreground transition-colors group"
                  >
                    <span>Pessoas aguardando aprovação: <span className="font-semibold text-foreground">{eventApprovals.length}</span></span>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                )}
                {eventSuppliers.filter(f => !f.aceiteNormas).length > 0 && (
                  <button 
                    onClick={() => navigate(`/admin/eventos/${eventoId}/fornecedores`)}
                    className="flex items-center justify-between w-full text-sm text-muted-foreground hover:text-foreground transition-colors group"
                  >
                    <span>Fornecedores sem aceite de normas: <span className="font-semibold text-foreground">{eventSuppliers.filter(f => !f.aceiteNormas).length}</span></span>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                )}
                {eventPeople.filter(p => normalize(p.status).includes('aguardando')).length > 0 && (
                  <button 
                    onClick={() => navigate(`/admin/eventos/${eventoId}/pessoas`)}
                    className="flex items-center justify-between w-full text-sm text-muted-foreground hover:text-foreground transition-colors group"
                  >
                    <span>Cadastros pendentes: <span className="font-semibold text-foreground">{eventPeople.filter(p => normalize(p.status).includes('aguardando')).length}</span></span>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="mb-2 border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Progresso do credenciamento</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowAllSteps(!showAllSteps)}
                  className="text-xs"
                >
                  {showAllSteps ? 'Ocultar' : 'Ver todas'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(showAllSteps ? etapas : etapas.filter(e => e.status !== 'Concluído').slice(0, 3)).map((etapa) => {
                  const Icon = getStatusIcon(etapa.status);
                  return (
                    <button
                      key={etapa.id}
                      type="button"
                      onClick={etapa.onClick}
                      className="w-full flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2 text-left hover:bg-muted/30 transition-colors group"
                    >
                      <span className="text-sm font-medium text-foreground">{etapa.nome}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-xs ${getStatusStyle(etapa.status)}`}>
                          <Icon className="w-3 h-3 mr-1" />
                          {etapa.status}
                        </Badge>
                        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="w-full h-auto flex flex-wrap justify-start gap-1 border-b border-border bg-transparent p-0">
              <TabsTrigger value="convites">Convites</TabsTrigger>
              <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
              <TabsTrigger value="pessoas">Equipes</TabsTrigger>
              <span className="self-center px-2 text-border">|</span>
              <TabsTrigger value="aprovacoes">Aprovações</TabsTrigger>
              <TabsTrigger value="documentos">Documentos</TabsTrigger>
              <TabsTrigger value="taxas">Taxas</TabsTrigger>
              <TabsTrigger value="normas">Normas</TabsTrigger>
              <span className="self-center px-2 text-border">|</span>
              <TabsTrigger value="guarita">Guarita</TabsTrigger>
              <TabsTrigger value="historico">Histórico</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <main className="flex-1 p-4 md:p-6 lg:p-7 2xl:p-8 max-w-[1600px] w-full mx-auto">
        {children ?? <Outlet />}
      </main>

      <Dialog open={openRiskDetails} onOpenChange={setOpenRiskDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Motivos do risco operacional</DialogTitle>
            <DialogDescription>Principais pontos para decisão e ação imediata.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Motivos</p>
              <ul className="space-y-1">
                {riscoOperacional?.principaisMotivos?.map((motivo, idx) => (
                  <li key={`motivo-risco-evento-${idx}`} className="text-sm text-foreground">• {motivo}</li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Ações recomendadas</p>
              <ul className="space-y-1">
                {riscoOperacional?.acoesRecomendadas?.map((acao, idx) => (
                  <li key={`acao-risco-evento-${idx}`} className="text-sm text-muted-foreground">• {acao}</li>
                ))}
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <EventFormWizardDialog
        open={openEditDialog}
        onOpenChange={setOpenEditDialog}
        onSubmit={handleSaveEvent}
        initialValues={evento}
        title="Editar evento"
        description="Atualize dados gerais, períodos, espaços locados e regras iniciais do evento."
      />
    </div>
  );
};

export default EventoDetalheLayout;
