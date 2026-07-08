import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { AdminSidebar } from '@/components/Sidebar.jsx';
import Header from '@/components/Header.jsx';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Building2, CheckCircle2, Clock, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useAppData } from '@/store/AppDataContext.jsx';
import { enrichFornecedoresWithNormas } from '@/utils/rules.js';
import { getOperationalAlerts } from '@/utils/alerts.js';

const FILTER_OPTIONS = [
  { id: 'todas', label: 'Todas' },
  { id: 'critica', label: 'Críticas' },
  { id: 'alta', label: 'Alta' },
  { id: 'media', label: 'Média' },
  { id: 'baixa', label: 'Baixa' },
  { id: 'resolvidas', label: 'Resolvidas' }
];

const SEVERITY_ORDER = {
  critica: 4,
  alta: 3,
  media: 2,
  baixa: 1
};

const badgeClassBySeverity = {
  critica: 'bg-destructive text-destructive-foreground hover:bg-destructive',
  alta: 'bg-orange-600 text-white hover:bg-orange-600',
  media: 'bg-warning text-warning-foreground hover:bg-warning',
  baixa: 'bg-primary/20 text-primary hover:bg-primary/20'
};

const STATUS_LABEL = {
  aberta: 'aberta',
  em_analise: 'em análise',
  corrigida: 'corrigida',
  ignorada: 'ignorada/autorizada'
};

const RESOLVED_STATUS = new Set(['corrigida', 'ignorada']);

const TYPE_MAPPING = {
  evento_sem_contrato_anexado: 'event_missing_contract',
  evento_sem_plano_anexado: 'event_missing_plan',
  evento_sem_periodos_definidos: 'event_missing_periods',
  pessoa_fora_periodo_autorizado: 'person_outside_period',
  fornecedor_sem_aceite_normas: 'supplier_missing_terms',
  taxa_pendente: 'fee_pending',
  cpf_duplicado_mesmo_evento: 'duplicated_cpf',
  cpf_duplicado_fornecedores_diferentes: 'duplicated_cpf',
  evento_sem_espacos_locados: 'event_missing_spaces'
};

const ACTION_BY_TYPE = {
  event_missing_contract: { button: 'Anexar contrato' },
  event_missing_plan: { button: 'Anexar plano' },
  event_missing_periods: { button: 'Editar períodos' },
  event_missing_spaces: { button: 'Editar espaços' },
  person_outside_period: { button: 'Revisar pessoa' },
  supplier_missing_terms: { button: 'Solicitar aceite' },
  fee_pending: { button: 'Ver taxa' },
  duplicated_cpf: { button: 'Conferir CPF' }
};

const mockFornecedores = [
  { id: 1, fornecedor: 'Luz & Som', documento: '12.345.678/0001-90', categoria: 'Audiovisual', classificacao: 'Temporário', status: 'Aguardando avaliação' },
  { id: 2, fornecedor: 'Segurança Máxima', documento: '98.765.432/0001-10', categoria: 'Segurança', classificacao: 'Parceiro recorrente', status: 'Aprovado' }
];

const normalize = (value) => String(value || '').toLowerCase();

const toPendingId = (alerta, index, eventId) => {
  const canonicalType = TYPE_MAPPING[alerta.tipo] || alerta.tipo;
  const related = alerta.entidadeRelacionada || {};
  const relatedKey = related.id || related.valor || related.nome || `idx-${index}`;
  return `${eventId}-${canonicalType}-${String(relatedKey).replace(/\s+/g, '-').toLowerCase()}`;
};

const sortBySeverityAndTitle = (list) => {
  return [...list].sort((a, b) => {
    const bySeverity = (SEVERITY_ORDER[b.gravidade] || 0) - (SEVERITY_ORDER[a.gravidade] || 0);
    if (bySeverity !== 0) return bySeverity;
    return String(a.titulo || '').localeCompare(String(b.titulo || ''), 'pt-BR');
  });
};

const CentralCredenciamentoPage = () => {
  const navigate = useNavigate();
  const { adminMockData } = useAppData();
  const eventoPrincipal = adminMockData.eventos[0];

  const fornecedoresComNormas = enrichFornecedoresWithNormas(adminMockData.fornecedores, adminMockData.normas);
  const operationalAlertsBase = getOperationalAlerts(
    eventoPrincipal,
    fornecedoresComNormas,
    adminMockData.pessoas,
    adminMockData.convites,
    adminMockData.taxas
  );

  const [activeFilter, setActiveFilter] = useState('todas');
  const [activeTab, setActiveTab] = useState('pendencias');
  const [auditTrail, setAuditTrail] = useState([]);
  const [auditDateStart, setAuditDateStart] = useState('');
  const [auditDateEnd, setAuditDateEnd] = useState('');
  const [pendingStateMap, setPendingStateMap] = useState({});

  const auditStorageKey = `evento_${eventoPrincipal?.id}_credenciamento_auditoria_admin`;
  const pendingStorageKey = `evento_${eventoPrincipal?.id}_credenciamento_pending_v2`;

  const operationalAlerts = useMemo(() => {
    const result = [...operationalAlertsBase];

    if (eventoPrincipal && eventoPrincipal.espacosLocadosDefinidos !== true) {
      result.push({
        tipo: 'evento_sem_espacos_locados',
        gravidade: 'media',
        mensagem: `Evento ${eventoPrincipal.nome} sem espaços locados definidos.`,
        entidadeRelacionada: { tipo: 'evento', id: eventoPrincipal.id, nome: eventoPrincipal.nome },
        acaoSugerida: 'Definir espaços locados antes da operação.'
      });
    }

    return result;
  }, [operationalAlertsBase, eventoPrincipal]);

  const currentPendingBase = useMemo(() => {
    return operationalAlerts.map((alerta, index) => {
      const canonicalType = TYPE_MAPPING[alerta.tipo] || alerta.tipo;
      const related = alerta.entidadeRelacionada || {};
      const id = toPendingId(alerta, index, eventoPrincipal?.id || 'evento');

      return {
        id,
        tipoOriginal: alerta.tipo,
        tipo: canonicalType,
        titulo: alerta.mensagem,
        gravidade: alerta.gravidade,
        acaoSugerida: alerta.acaoSugerida,
        eventId: eventoPrincipal?.id,
        eventName: eventoPrincipal?.nome,
        personId: related.tipo === 'pessoa' ? related.id : null,
        supplierId: related.tipo === 'fornecedor' ? related.id : null,
        cpf: related.tipo === 'cpf' ? related.valor : null,
        relatedLabel: related.nome || related.fornecedor || related.valor || null
      };
    });
  }, [operationalAlerts, eventoPrincipal]);

  useEffect(() => {
    const raw = localStorage.getItem(auditStorageKey);
    if (!raw) {
      setAuditTrail([]);
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      setAuditTrail(Array.isArray(parsed) ? parsed : []);
    } catch {
      setAuditTrail([]);
    }
  }, [auditStorageKey]);

  useEffect(() => {
    const raw = localStorage.getItem(pendingStorageKey);
    if (!raw) {
      setPendingStateMap({});
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      setPendingStateMap(parsed && typeof parsed === 'object' ? parsed : {});
    } catch {
      setPendingStateMap({});
    }
  }, [pendingStorageKey]);

  useEffect(() => {
    if (currentPendingBase.length === 0) return;

    setPendingStateMap((prev) => {
      const next = { ...prev };
      let changed = false;

      currentPendingBase.forEach((item) => {
        const entry = next[item.id];

        if (!entry) {
          next[item.id] = {
            ...item,
            status: 'aberta',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          changed = true;
          return;
        }

        const reabrir = RESOLVED_STATUS.has(entry.status);
        const merged = {
          ...entry,
          ...item,
          status: reabrir ? 'aberta' : (entry.status || 'aberta'),
          updatedAt: reabrir ? new Date().toISOString() : entry.updatedAt
        };

        if (JSON.stringify(merged) !== JSON.stringify(entry)) {
          next[item.id] = merged;
          changed = true;
        }
      });

      if (changed) {
        localStorage.setItem(pendingStorageKey, JSON.stringify(next));
      }

      return changed ? next : prev;
    });
  }, [currentPendingBase, pendingStorageKey]);

  const appendAudit = (entry) => {
    const item = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      dataHora: new Date().toLocaleString('pt-BR'),
      createdAt: new Date().toISOString(),
      usuario: 'Administrador',
      ...entry
    };

    const updated = [item, ...auditTrail];
    setAuditTrail(updated);
    localStorage.setItem(auditStorageKey, JSON.stringify(updated));
  };

  const updatePendingStatus = (pending, status, actionText) => {
    setPendingStateMap((prev) => {
      const next = {
        ...prev,
        [pending.id]: {
          ...(prev[pending.id] || pending),
          ...pending,
          status,
          updatedAt: new Date().toISOString()
        }
      };

      localStorage.setItem(pendingStorageKey, JSON.stringify(next));
      return next;
    });

    appendAudit({
      pendencia: pending.titulo,
      tipoPendencia: pending.tipo,
      statusPendencia: STATUS_LABEL[status] || status,
      acao: actionText,
      evento: pending.eventName || 'Evento não informado',
      relacionado: pending.relatedLabel || '-'
    });
  };

  const pendingItems = useMemo(() => {
    const currentIds = new Set(currentPendingBase.map((item) => item.id));

    const current = currentPendingBase.map((item) => {
      const state = pendingStateMap[item.id] || {};
      return {
        ...item,
        status: state.status || 'aberta',
        updatedAt: state.updatedAt
      };
    });

    const archivedResolved = Object.values(pendingStateMap).filter((item) => {
      if (!item?.id) return false;
      if (currentIds.has(item.id)) return false;
      return RESOLVED_STATUS.has(item.status);
    });

    return [...current, ...archivedResolved];
  }, [currentPendingBase, pendingStateMap]);

  const openPendingCount = pendingItems.filter((item) => item.status === 'aberta').length;

  const summaryCards = [
    {
      id: 'fornecedores',
      icon: Building2,
      label: 'Fornecedores pendentes',
      value: String(adminMockData.fornecedores.filter((item) => normalize(item.statusCadastral).includes('aguardando')).length)
    },
    {
      id: 'pessoas',
      icon: Users,
      label: 'Pessoas pendentes',
      value: String(adminMockData.pessoas.filter((item) => normalize(item.status).includes('aguardando')).length)
    },
    {
      id: 'criticas',
      icon: AlertTriangle,
      label: 'Pendências críticas abertas',
      value: String(pendingItems.filter((item) => item.status === 'aberta' && item.gravidade === 'critica').length)
    },
    {
      id: 'aprovacoes',
      icon: Clock,
      label: 'Pendências abertas',
      value: String(openPendingCount)
    }
  ];

  const pendenciasFiltradas = useMemo(() => {
    const list = pendingItems.filter((item) => {
      if (activeFilter === 'resolvidas') return RESOLVED_STATUS.has(item.status);
      if (activeFilter === 'todas') return item.status === 'aberta';
      return item.status === 'aberta' && item.gravidade === activeFilter;
    });

    return sortBySeverityAndTitle(list);
  }, [activeFilter, pendingItems]);

  const parseAuditDate = (entry) => {
    if (entry?.createdAt) {
      const isoDate = new Date(entry.createdAt);
      if (!Number.isNaN(isoDate.getTime())) return isoDate;
    }

    const raw = String(entry?.dataHora || '').trim();
    if (!raw) return null;

    const [datePart, timePart = '00:00:00'] = raw.split(' ');
    const [day, month, year] = datePart.split('/').map((v) => Number(v));
    if (!day || !month || !year) return null;

    const [hour = 0, minute = 0, second = 0] = timePart.split(':').map((v) => Number(v));
    return new Date(year, month - 1, day, hour, minute, second);
  };

  const filteredAuditTrail = useMemo(() => {
    const startDate = auditDateStart ? new Date(`${auditDateStart}T00:00:00`) : null;
    const endDate = auditDateEnd ? new Date(`${auditDateEnd}T23:59:59`) : null;

    return auditTrail.filter((entry) => {
      const entryDate = parseAuditDate(entry);
      if (!entryDate) return true;

      if (startDate && entryDate < startDate) return false;
      if (endDate && entryDate > endDate) return false;
      return true;
    });
  }, [auditTrail, auditDateStart, auditDateEnd]);

  const clearAuditFilters = () => {
    setAuditDateStart('');
    setAuditDateEnd('');
  };

  const buildDestination = (pending) => {
    const base = `/admin/eventos/${pending.eventId}`;

    if (pending.tipo === 'event_missing_contract') return `${base}/documentos?highlightDoc=contrato`;
    if (pending.tipo === 'event_missing_plan') return `${base}/documentos?highlightDoc=plano`;
    if (pending.tipo === 'event_missing_periods') return `${base}/convites?openEditEvent=1&editEventStep=periodos`;
    if (pending.tipo === 'event_missing_spaces') return `${base}/convites?openEditEvent=1&editEventStep=espacos`;
    if (pending.tipo === 'person_outside_period') return `${base}/pessoas?personId=${pending.personId || ''}&openPerson=1`;
    if (pending.tipo === 'supplier_missing_terms') return `${base}/normas?supplierId=${pending.supplierId || ''}`;
    if (pending.tipo === 'fee_pending') return `${base}/taxas?supplierId=${pending.supplierId || ''}`;
    if (pending.tipo === 'duplicated_cpf') return `${base}/pessoas?cpf=${pending.cpf || ''}`;

    return `${base}/aprovacoes`;
  };

  const handlePrimaryAction = (pending) => {
    const button = ACTION_BY_TYPE[pending.tipo]?.button || 'Gerenciar pendência';

    if (pending.status === 'aberta') {
      updatePendingStatus(pending, 'em_analise', `${button} iniciado por Administrador.`);
    }

    navigate(buildDestination(pending));
  };

  const markResolved = (pending) => {
    updatePendingStatus(
      pending,
      'corrigida',
      `${ACTION_BY_TYPE[pending.tipo]?.button || 'Ação'} concluída por Administrador. Pendência '${pending.titulo}' resolvida.`
    );
    toast.success('Pendência marcada como corrigida.');
  };

  const markIgnored = (pending) => {
    updatePendingStatus(
      pending,
      'ignorada',
      `Autorização excepcional registrada por Administrador para a pendência '${pending.titulo}'.`
    );
    toast.success('Pendência marcada como ignorada/autorizada excepcionalmente.');
  };

  const reopenPending = (pending) => {
    updatePendingStatus(pending, 'aberta', `Pendência '${pending.titulo}' reaberta por Administrador.`);
    toast.success('Pendência reaberta para a fila principal.');
  };

  const exportAuditCsv = () => {
    if (filteredAuditTrail.length === 0) {
      toast.info('Não há registros para exportar com os filtros atuais.');
      return;
    }

    const escapeCsv = (value) => {
      const text = String(value ?? '');
      return `"${text.replace(/"/g, '""')}"`;
    };

    const header = ['Data/Hora', 'Pendência', 'Usuário', 'Ação', 'Evento', 'Relacionado', 'Status'];
    const lines = filteredAuditTrail.map((item) => [
      item.dataHora,
      item.pendencia,
      item.usuario,
      item.acao,
      item.evento,
      item.relacionado,
      item.statusPendencia || '-'
    ]);

    const csvContent = [header, ...lines]
      .map((row) => row.map(escapeCsv).join(';'))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `auditoria-credenciamento-${eventoPrincipal?.id || 'evento'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('CSV da auditoria exportado com sucesso.');
  };

  return (
    <>
      <Helmet>
        <title>Central de Credenciamento - Expocentro</title>
      </Helmet>
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-4 md:p-6 2xl:p-10 overflow-y-auto">
            <div className="max-w-7xl 2xl:max-w-[88rem] mx-auto space-y-5 2xl:space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Central de Credenciamento</h1>
                <p className="text-muted-foreground mt-1">Fila inteligente de pendências com destino direto para correção.</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3">
                {summaryCards.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Card key={item.id} className="border-border bg-card/85 shadow-none">
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-[11px] font-medium text-muted-foreground">{item.label}</p>
                          <p className="text-xl font-semibold text-foreground tabular-nums">{item.value}</p>
                        </div>
                        <div className="w-9 h-9 rounded-md flex items-center justify-center bg-muted/30 border border-border">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Card className="border-border shadow-sm">
                <CardContent className="p-4 md:p-5 space-y-4">
                  <div className="rounded-lg border border-border bg-secondary/35 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Solicitações de portaria e liberações em tempo real</p>
                      <p className="text-xs text-muted-foreground">A operação da guarita foi separada em uma central exclusiva.</p>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link to="/admin/guarita">Abrir Central da Guarita</Link>
                    </Button>
                  </div>

                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">Pendências com ação sugerida</h2>
                      <p className="text-xs text-muted-foreground">Por padrão, apenas pendências abertas ficam visíveis.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {FILTER_OPTIONS.map((item) => (
                        <Button
                          key={item.id}
                          size="sm"
                          variant={activeFilter === item.id ? 'default' : 'outline'}
                          onClick={() => setActiveFilter(item.id)}
                        >
                          {item.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {pendenciasFiltradas.length > 0 ? (
                      pendenciasFiltradas.map((pendencia) => {
                        const isResolved = RESOLVED_STATUS.has(pendencia.status);
                        return (
                          <div key={pendencia.id} className="rounded-lg border border-border bg-card/80 p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div className="min-w-0 space-y-1">
                              <p className="text-sm font-medium text-foreground truncate">{pendencia.titulo}</p>
                              <p className="text-xs text-muted-foreground">Ação: {pendencia.acaoSugerida}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 shrink-0 justify-end">
                              <Badge className={badgeClassBySeverity[pendencia.gravidade] || badgeClassBySeverity.media}>
                                {pendencia.gravidade}
                              </Badge>
                              <Badge variant="outline" className="capitalize">{STATUS_LABEL[pendencia.status] || pendencia.status}</Badge>

                              {isResolved ? (
                                <Button size="sm" variant="outline" onClick={() => reopenPending(pendencia)}>Reabrir</Button>
                              ) : (
                                <>
                                  <Button size="sm" variant="outline" onClick={() => handlePrimaryAction(pendencia)}>
                                    {ACTION_BY_TYPE[pendencia.tipo]?.button || 'Gerenciar'}
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => markResolved(pendencia)}>Marcar corrigida</Button>
                                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => markIgnored(pendencia)}>Autorizar exceção</Button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                        Nenhuma pendência encontrada para este filtro.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm">
                <CardContent className="p-0">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="px-4 md:px-6 pt-4 md:pt-6 pb-2 border-b border-border">
                      <TabsList className="bg-muted/55 inline-flex h-auto min-w-0 flex-wrap gap-1">
                        <TabsTrigger value="pendencias">Pendências</TabsTrigger>
                        <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
                        <TabsTrigger value="pessoas">Pessoas / Equipes</TabsTrigger>
                        <TabsTrigger value="aprovacoes">Aprovações</TabsTrigger>
                        <TabsTrigger value="historico">Histórico de Decisões</TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="pendencias" className="p-4 md:p-6 m-0">
                      <div className="rounded-lg border border-border overflow-hidden">
                        <Table className="table-vertical-only text-sm">
                          <TableHeader className="bg-muted/50">
                            <TableRow>
                              <TableHead>Título</TableHead>
                              <TableHead>Gravidade</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Ação sugerida</TableHead>
                              <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sortBySeverityAndTitle(pendingItems).slice(0, 16).map((item) => {
                              const isResolved = RESOLVED_STATUS.has(item.status);
                              return (
                                <TableRow key={item.id}>
                                  <TableCell className="font-medium">{item.titulo}</TableCell>
                                  <TableCell>
                                    <Badge className={badgeClassBySeverity[item.gravidade] || badgeClassBySeverity.media}>
                                      {item.gravidade}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="capitalize">{STATUS_LABEL[item.status] || item.status}</Badge>
                                  </TableCell>
                                  <TableCell className="text-muted-foreground">{item.acaoSugerida}</TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                      {isResolved ? (
                                        <Button size="sm" variant="outline" onClick={() => reopenPending(item)}>Reabrir</Button>
                                      ) : (
                                        <>
                                          <Button size="sm" variant="outline" onClick={() => handlePrimaryAction(item)}>{ACTION_BY_TYPE[item.tipo]?.button || 'Gerenciar'}</Button>
                                          <Button size="sm" variant="ghost" onClick={() => markResolved(item)}>Corrigida</Button>
                                        </>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>

                    <TabsContent value="fornecedores" className="p-4 md:p-6 m-0">
                      <div className="rounded-lg border border-border overflow-hidden">
                        <Table className="table-vertical-only text-sm">
                          <TableHeader className="bg-muted/50">
                            <TableRow>
                              <TableHead>Fornecedor</TableHead>
                              <TableHead>CNPJ/CPF</TableHead>
                              <TableHead>Categoria</TableHead>
                              <TableHead>Classificação</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {mockFornecedores.map((row) => (
                              <TableRow key={row.id}>
                                <TableCell className="font-medium">{row.fornecedor}</TableCell>
                                <TableCell className="font-mono">{row.documento}</TableCell>
                                <TableCell>{row.categoria}</TableCell>
                                <TableCell>{row.classificacao}</TableCell>
                                <TableCell>
                                  <Badge variant={row.status === 'Aprovado' ? 'default' : 'outline'}>{row.status}</Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>

                    <TabsContent value="pessoas" className="p-4 md:p-6 m-0">
                      <div className="rounded-lg border border-border overflow-hidden">
                        <Table className="table-vertical-only text-sm">
                          <TableHeader className="bg-muted/50">
                            <TableRow>
                              <TableHead>Nome</TableHead>
                              <TableHead>Fornecedor</TableHead>
                              <TableHead>Função</TableHead>
                              <TableHead>Tipo de acesso</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {adminMockData.pessoas.map((pessoa) => (
                              <TableRow key={pessoa.id}>
                                <TableCell className="font-medium">{pessoa.nome}</TableCell>
                                <TableCell>{pessoa.fornecedor}</TableCell>
                                <TableCell>{pessoa.funcao}</TableCell>
                                <TableCell>{pessoa.tipoAcesso}</TableCell>
                                <TableCell><Badge variant="outline">{pessoa.status}</Badge></TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>

                    <TabsContent value="aprovacoes" className="p-4 md:p-6 m-0">
                      <div className="rounded-lg border border-border overflow-hidden">
                        <Table className="table-vertical-only text-sm">
                          <TableHeader className="bg-muted/50">
                            <TableRow>
                              <TableHead>Nome</TableHead>
                              <TableHead>Fornecedor</TableHead>
                              <TableHead>Função</TableHead>
                              <TableHead>Alertas</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {adminMockData.aprovacoes.map((row) => (
                              <TableRow key={row.id}>
                                <TableCell className="font-medium">{row.nome}</TableCell>
                                <TableCell>{row.fornecedor}</TableCell>
                                <TableCell>{row.funcao}</TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-1">
                                    {row.alertas.map((alerta, index) => (
                                      <Badge key={`${row.id}-alerta-${index}`} variant="outline">{alerta}</Badge>
                                    ))}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>

                    <TabsContent value="historico" className="p-4 md:p-6 m-0 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto_auto] gap-3">
                        <div className="space-y-1">
                          <Label htmlFor="audit-date-start">Data inicial</Label>
                          <Input
                            id="audit-date-start"
                            type="date"
                            value={auditDateStart}
                            onChange={(event) => setAuditDateStart(event.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="audit-date-end">Data final</Label>
                          <Input
                            id="audit-date-end"
                            type="date"
                            value={auditDateEnd}
                            onChange={(event) => setAuditDateEnd(event.target.value)}
                          />
                        </div>
                        <Button variant="outline" onClick={clearAuditFilters} className="self-end">Limpar</Button>
                        <Button onClick={exportAuditCsv} className="self-end">Exportar CSV</Button>
                      </div>

                      <div className="rounded-lg border border-border overflow-hidden">
                        <Table className="table-vertical-only text-sm">
                          <TableHeader className="bg-muted/50">
                            <TableRow>
                              <TableHead>Data/Hora</TableHead>
                              <TableHead>Pendência</TableHead>
                              <TableHead>Usuário</TableHead>
                              <TableHead>Ação</TableHead>
                              <TableHead>Evento</TableHead>
                              <TableHead>Relacionado</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredAuditTrail.length > 0 ? (
                              filteredAuditTrail.slice(0, 40).map((item) => (
                                <TableRow key={item.id}>
                                  <TableCell className="text-muted-foreground">{item.dataHora}</TableCell>
                                  <TableCell className="font-medium">{item.pendencia}</TableCell>
                                  <TableCell>{item.usuario}</TableCell>
                                  <TableCell className="text-muted-foreground">{item.acao}</TableCell>
                                  <TableCell>{item.evento}</TableCell>
                                  <TableCell className="text-muted-foreground">{item.relacionado}</TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                                  Nenhum registro encontrado para o período filtrado.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default CentralCredenciamentoPage;
