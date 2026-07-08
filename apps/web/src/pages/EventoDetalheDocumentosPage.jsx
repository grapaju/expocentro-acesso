import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminSidebar } from '@/components/Sidebar.jsx';
import Header from '@/components/Header.jsx';
import EventoDetalheLayout from '@/components/EventoDetalheLayout.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, FileText, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useAppData } from '@/store/AppDataContext.jsx';
import { enrichFornecedoresWithNormas, getIntelligentEventChecklist } from '@/utils/rules.js';
import { getOperationalAlerts } from '@/utils/alerts.js';

const DOCS = [
  { name: 'Contrato assinado', bloqueiaConvite: true, bloqueiaGuarita: true },
  { name: 'Plano do evento', bloqueiaConvite: false, bloqueiaGuarita: true },
  { name: 'Planta/layout', bloqueiaConvite: false, bloqueiaGuarita: false },
  { name: 'Alvará eventual', bloqueiaConvite: false, bloqueiaGuarita: true },
  { name: 'ART', bloqueiaConvite: false, bloqueiaGuarita: true },
  { name: 'ECAD', bloqueiaConvite: false, bloqueiaGuarita: false },
  { name: 'Outros documentos', bloqueiaConvite: false, bloqueiaGuarita: false }
];

const toStorageKey = (eventoId) => `evento_${eventoId}_docs_v2`;

const normalize = (text) => String(text || '').toLowerCase();

const defaultDocs = (eventoId) => {
  return DOCS.map((doc) => ({
    id: `${eventoId}-${normalize(doc.name).replace(/[^a-z0-9]+/g, '-')}`,
    eventId: eventoId,
    name: doc.name,
    status: 'pendente',
    date: null,
    bloqueiaConvite: doc.bloqueiaConvite,
    bloqueiaGuarita: doc.bloqueiaGuarita
  }));
};

const statusBadge = {
  pendente: 'bg-muted text-muted-foreground border-border',
  anexado: 'bg-primary/15 text-primary border-primary/40',
  conferido: 'bg-[hsl(var(--status-approved)/0.12)] text-[hsl(var(--status-approved))] border-[hsl(var(--status-approved)/0.35)]',
  nao_se_aplica: 'bg-warning/15 text-warning border-warning/40'
};

const statusLabel = {
  pendente: 'Pendente',
  anexado: 'Anexado',
  conferido: 'Conferido',
  nao_se_aplica: 'Não se aplica'
};

const checklistActionByItem = {
  'abertura-contrato': { label: 'Anexar contrato', route: 'documentos' },
  'abertura-periodos': { label: 'Editar períodos', route: 'convites' },
  'abertura-espacos': { label: 'Editar espaços', route: 'convites' },
  'guarita-plano': { label: 'Anexar plano', route: 'documentos' },
  'guarita-pessoas': { label: 'Ir para aprovações', route: 'aprovacoes' }
};

const EventoDetalheDocumentosPage = () => {
  const { eventoId } = useParams();
  const navigate = useNavigate();
  const { adminMockData, getEventById } = useAppData();
  const evento = getEventById(eventoId) || adminMockData.eventos[0];

  const [expandedChecklist, setExpandedChecklist] = useState({ abertura: false, guarita: false });
  const [docs, setDocs] = useState(() => {
    try {
      const raw = localStorage.getItem(toStorageKey(eventoId));
      if (!raw) return defaultDocs(eventoId);
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultDocs(eventoId);
    } catch {
      return defaultDocs(eventoId);
    }
  });

  const persistDocs = (next) => {
    setDocs(next);
    localStorage.setItem(toStorageKey(eventoId), JSON.stringify(next));
  };

  const setDocStatus = (docId, status) => {
    const next = docs.map((doc) => {
      if (doc.id !== docId) return doc;
      const hasDate = status === 'anexado' || status === 'conferido';
      return {
        ...doc,
        status,
        date: hasDate ? new Date().toLocaleDateString('pt-BR') : null
      };
    });
    persistDocs(next);
  };

  const fornecedoresComNormas = enrichFornecedoresWithNormas(adminMockData.fornecedores, adminMockData.normas);
  const operationalAlerts = getOperationalAlerts(
    evento,
    fornecedoresComNormas,
    adminMockData.pessoas.filter((item) => item.eventId === eventoId),
    adminMockData.convites.filter((item) => item.eventId === eventoId),
    adminMockData.taxas.filter((item) => item.eventId === eventoId)
  );

  const checklist = getIntelligentEventChecklist(
    evento,
    fornecedoresComNormas,
    adminMockData.pessoas.filter((item) => item.eventId === eventoId),
    adminMockData.convites.filter((item) => item.eventId === eventoId),
    adminMockData.taxas.filter((item) => item.eventId === eventoId),
    {
      normas: adminMockData.normas,
      documents: docs,
      aprovacoes: adminMockData.aprovacoes.filter((item) => item.eventId === eventoId),
      operationalAlerts
    }
  );

  const checklistCards = [
    { key: 'abertura', data: checklist.abertura },
    { key: 'guarita', data: checklist.guarita }
  ];

  const handleChecklistAction = (item) => {
    const action = checklistActionByItem[item.id];
    if (!action) {
      toast.info('Ação disponível no fluxo principal do evento.');
      return;
    }
    navigate(`/admin/eventos/${eventoId}/${action.route}`);
  };

  return (
    <>
      <Helmet>
        <title>Documentos e Liberação - Detalhes do Evento</title>
      </Helmet>

      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <EventoDetalheLayout>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-8">
              <section className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Documentos e Liberação</h2>
                  <p className="text-sm text-muted-foreground">Gestão documental com impacto direto em convites e liberação da guarita.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {docs.map((doc) => (
                    <Card key={doc.id} className="border-border shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" />
                          {doc.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={statusBadge[doc.status] || statusBadge.pendente}>
                            {statusLabel[doc.status] || 'Pendente'}
                          </Badge>
                          {doc.date ? <span className="text-xs text-muted-foreground">{doc.date}</span> : null}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex flex-wrap gap-2 text-[11px]">
                          <Badge variant="outline" className={doc.bloqueiaConvite ? 'border-warning text-warning' : ''}>
                            {doc.bloqueiaConvite ? 'Bloqueia convite' : 'Não bloqueia convite'}
                          </Badge>
                          <Badge variant="outline" className={doc.bloqueiaGuarita ? 'border-destructive text-destructive' : ''}>
                            {doc.bloqueiaGuarita ? 'Bloqueia guarita' : 'Não bloqueia guarita'}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => setDocStatus(doc.id, 'anexado')}>
                            <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
                            Anexar
                          </Button>
                          {(doc.status === 'anexado' || doc.status === 'conferido') ? (
                            <Button size="sm" variant="outline" onClick={() => toast.info('Visualização simulada do documento anexado.') }>
                              <Eye className="w-3.5 h-3.5 mr-1.5" />
                              Ver
                            </Button>
                          ) : null}
                          {doc.status !== 'conferido' ? (
                            <Button size="sm" variant="outline" onClick={() => setDocStatus(doc.id, 'conferido')}>Conferir</Button>
                          ) : null}
                          <Button size="sm" variant="ghost" onClick={() => setDocStatus(doc.id, 'nao_se_aplica')}>Marcar não se aplica</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>

              <section className="space-y-3">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Checklists de liberação</h2>
                  <p className="text-sm text-muted-foreground">Resumo compacto com acesso rápido às pendências críticas.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {checklistCards.map((entry) => {
                    const data = entry.data;
                    const isExpanded = expandedChecklist[entry.key];
                    return (
                      <Card key={entry.key} className="border-border shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{data.titulo}</CardTitle>
                          <CardDescription>
                            {data.percentualConclusao}% concluído • {data.faltantes.length} pendência(s)
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${data.percentualConclusao}%` }} />
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setExpandedChecklist((prev) => ({ ...prev, [entry.key]: !prev[entry.key] }))}
                          >
                            {isExpanded ? 'Ocultar checklist' : 'Ver checklist'}
                          </Button>

                          {isExpanded ? (
                            <div className="space-y-2">
                              {data.itens.map((item) => {
                                const customAction = checklistActionByItem[item.id];
                                return (
                                  <div key={item.id} className="rounded-md border border-border p-3 bg-background/70">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                                      <Badge variant="outline" className={statusBadge[item.status] || statusBadge.pendente}>{item.status}</Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">{item.detalhe}</p>
                                    {customAction ? (
                                      <Button size="sm" variant="ghost" className="mt-2" onClick={() => handleChecklistAction(item)}>
                                        {customAction.label}
                                      </Button>
                                    ) : null}
                                  </div>
                                );
                              })}
                            </div>
                          ) : null}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>
            </motion.div>
          </EventoDetalheLayout>
        </div>
      </div>
    </>
  );
};

export default EventoDetalheDocumentosPage;
