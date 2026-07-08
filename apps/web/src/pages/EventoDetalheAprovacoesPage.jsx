
import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminSidebar } from '@/components/Sidebar.jsx';
import Header from '@/components/Header.jsx';
import EventoDetalheLayout from '@/components/EventoDetalheLayout.jsx';
import AdminTable from '@/components/AdminTable.jsx';
import AlertBadge from '@/components/AlertBadge.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useAppData } from '@/store/AppDataContext.jsx';
import { enrichFornecedoresWithNormas } from '@/utils/rules.js';
import { getOperationalAlerts } from '@/utils/alerts.js';
import { CheckCircle, ShieldBan, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const EventoDetalheAprovacoesPage = () => {
  const navigate = useNavigate();
  const { eventoId } = useParams();
  const { adminMockData, getEventById, approvePerson, rejectPerson, requestPersonCorrection, blockPerson, approveSupplier, requestSupplierCorrection, blockSupplier } = useAppData();
  const evento = getEventById(eventoId) || adminMockData.eventos[0];
  const [solicitacoesReuso, setSolicitacoesReuso] = useState([]);
  const storageKey = useMemo(() => `evento_${evento.id}_reutilizacao_equipe`, [evento.id]);

  const saveSolicitacoesReuso = (updated) => {
    setSolicitacoesReuso(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  useEffect(() => {
    const raw = localStorage.getItem(storageKey);

    if (!raw) {
      setSolicitacoesReuso([]);
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      setSolicitacoesReuso(Array.isArray(parsed) ? parsed : []);
    } catch {
      setSolicitacoesReuso([]);
    }
  }, [storageKey]);

  const aprovacoesReuso = useMemo(() => {
    const getIniciais = (nome) =>
      String(nome || '')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((parte) => parte.charAt(0).toUpperCase())
        .join('');

    return solicitacoesReuso.flatMap((solicitacao, idxSolicitacao) =>
      (solicitacao.pessoasSelecionadas || [])
        .filter((pessoa) => {
          const statusAtual = pessoa.statusAprovacaoEventoAtual || 'Aguardando aprovação administrativa';
          return statusAtual === 'Aguardando aprovação administrativa';
        })
        .map((pessoa, idxPessoa) => ({
        id: `reuso-${solicitacao.id || idxSolicitacao}-${pessoa.id || idxPessoa}`,
        isReuso: true,
        solicitacaoId: solicitacao.id,
        pessoaId: pessoa.id,
        nome: pessoa.nome,
        iniciais: getIniciais(pessoa.nome),
        cpf: pessoa.cpf,
        fornecedor: solicitacao?.fornecedor?.nome || 'Fornecedor não identificado',
        funcao: pessoa.funcao,
        acesso: pessoa.tipoAcesso || solicitacao.tipoAcesso || 'A definir',
        periodo: pessoa.periodo || solicitacao.periodo || '-',
        alertas: [
          'Reaproveitamento de cadastro',
          pessoa.statusConfirmacaoDados || 'Precisa confirmar dados',
          pessoa.statusAprovacaoEventoAtual || 'Aguardando aprovação administrativa',
          pessoa.novoAceiteNormasPendente ? 'Novo aceite das normas pendente' : null
        ].filter(Boolean)
      }))
    );
  }, [solicitacoesReuso]);

  const aprovacoesPadraoEvento = useMemo(() => {
    return (adminMockData.aprovacoes || []).filter((aprovacao) => aprovacao.eventId === eventoId);
  }, [adminMockData.aprovacoes, eventoId]);

  const aprovacoes = [...aprovacoesReuso, ...aprovacoesPadraoEvento];
  const filaAguardando = aprovacoes.filter((item) => String(item.nome || '').length > 0);
  const fornecedoresPendentes = filaAguardando.filter((item) => item.itemType === 'supplier');
  const pessoasPendentes = filaAguardando.filter((item) => item.itemType !== 'supplier');
  const historicoDecisoesReuso = useMemo(
    () =>
      solicitacoesReuso
        .flatMap((solicitacao) =>
          (solicitacao.pessoasSelecionadas || [])
            .filter((pessoa) => {
              const status = pessoa.statusAprovacaoEventoAtual || '';
              return status === 'Aprovado' || status === 'Rejeitado';
            })
            .map((pessoa) => ({
              id: `hist-${solicitacao.id}-${pessoa.id}`,
              pessoa: pessoa.nome,
              cpf: pessoa.cpf,
              fornecedor: solicitacao?.fornecedor?.nome || 'Fornecedor não identificado',
              decisao: pessoa.statusAprovacaoEventoAtual,
              dataHora: pessoa.dataDecisaoAprovacao || '-',
              tipoAcesso: pessoa.tipoAcesso || solicitacao.tipoAcesso || 'A definir',
              periodo: pessoa.periodo || solicitacao.periodo || '-'
            }))
        )
        .sort((a, b) => String(b.dataHora).localeCompare(String(a.dataHora))),
    [solicitacoesReuso]
  );
  const fornecedoresComNormas = enrichFornecedoresWithNormas(adminMockData.fornecedores, adminMockData.normas);
  const operationalAlerts = getOperationalAlerts(
    evento,
    fornecedoresComNormas,
    adminMockData.pessoas,
    adminMockData.convites,
    adminMockData.taxas
  );

  const pendenciasBloqueantes = operationalAlerts.filter((item) => item.gravidade === 'critica' || item.gravidade === 'alta');

  const maskCpf = (cpf) => {
    const digits = String(cpf || '').replace(/\D/g, '');
    if (digits.length < 11) return cpf;
    return `***.***.***-${digits.slice(-2)}`;
  };

  const severityDotClass = {
    critica: 'bg-destructive',
    alta: 'bg-destructive',
    media: 'bg-warning',
    baixa: 'bg-primary'
  };

  const handleReusoDecision = (row, decision) => {
    const updated = solicitacoesReuso.map((solicitacao) => {
      if (solicitacao.id !== row.solicitacaoId) return solicitacao;

      const pessoasAtualizadas = (solicitacao.pessoasSelecionadas || []).map((pessoa) => {
        if (pessoa.id !== row.pessoaId) return pessoa;

        return {
          ...pessoa,
          statusAprovacaoEventoAtual: decision === 'approve' ? 'Aprovado' : 'Rejeitado',
          dataDecisaoAprovacao: new Date().toLocaleString('pt-BR')
        };
      });

      return {
        ...solicitacao,
        pessoasSelecionadas: pessoasAtualizadas,
        status: pessoasAtualizadas.some((p) => (p.statusAprovacaoEventoAtual || '').includes('Aguardando'))
          ? 'Parcialmente avaliado'
          : 'Concluído'
      };
    });

    saveSolicitacoesReuso(updated);

    if (decision === 'approve') {
      toast.success(`${row.nome} aprovado(a) para o evento atual.`);
      return;
    }

    toast.error(`${row.nome} rejeitado(a) para o evento atual.`);
  };

  const handleApprovalAction = (row, decision) => {
    if (row.isReuso) {
      handleReusoDecision(row, decision);
      return;
    }

    if (row.itemType === 'supplier') {
      if (!row.supplierId) {
        toast.info('Fornecedor sem vínculo para atualização automática.');
        return;
      }

      if (decision === 'approve') {
        approveSupplier(row.supplierId);
        toast.success(`${row.nome} aprovado(a) na fila administrativa.`);
        return;
      }

      blockSupplier(row.supplierId);
      toast.error(`${row.nome} bloqueado(a).`);
      return;
    }

    if (!row.personId) {
      toast.info('Pessoa sem vínculo para atualização automática.');
      return;
    }

    if (decision === 'approve') {
      approvePerson(row.personId);
      toast.success(`${row.nome} aprovado(a) na fila administrativa.`);
      return;
    }

    rejectPerson(row.personId, 'Reprovado na fila administrativa');
    toast.error(`${row.nome} rejeitado(a).`);
  };

  const handleCorrection = (row) => {
    if (row.itemType === 'supplier') {
      if (!row.supplierId) return;
      requestSupplierCorrection(row.supplierId, 'Corrigir dados cadastrais e reenviar para avaliação.');
      toast.success('Correção solicitada ao fornecedor.');
      return;
    }

    if (!row.personId) return;
    requestPersonCorrection(row.personId, 'Corrigir documentos e reenviar para avaliação.');
    toast.success('Correção solicitada ao fornecedor.');
  };

  const handleBlock = (row) => {
    if (row.itemType === 'supplier') {
      if (!row.supplierId) return;
      blockSupplier(row.supplierId);
      toast.error('Fornecedor bloqueado na fila de aprovação.');
      return;
    }

    if (!row.personId) return;
    blockPerson(row.personId);
    toast.error('Pessoa bloqueada na fila de aprovação.');
  };

  return (
    <>
      <Helmet>
        <title>Aprovações - Detalhes do Evento</title>
      </Helmet>
      
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <EventoDetalheLayout>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">Fila de Aprovação</h2>
                <p className="text-sm text-muted-foreground">Cadastros e pendências que aguardam decisão da administração.</p>
              </div>

              <Card className="border-border shadow-sm">
                <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Itens aguardando decisão: {filaAguardando.length}</p>
                    <p className="text-xs text-muted-foreground">Pendências bloqueantes: {pendenciasBloqueantes.length}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => navigate(`/admin/eventos/${eventoId}/documentos`)}>
                    Ver pendências do evento
                  </Button>
                </CardContent>
              </Card>

              {aprovacoesReuso.length > 0 && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <p className="text-sm font-semibold text-foreground">
                    {aprovacoesReuso.length} pessoa(s) reaproveitada(s) aguardando aprovação administrativa no evento atual.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    A liberação para guarita só acontece após aprovação desta fila.
                  </p>
                </div>
              )}

              {historicoDecisoesReuso.length > 0 && (
                <Card className="border-border shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Histórico de decisões do reaproveitamento</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {historicoDecisoesReuso.slice(0, 8).map((registro) => (
                      <div key={registro.id} className="rounded-md border border-border bg-muted/20 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-medium text-foreground">
                            {registro.pessoa} • {registro.cpf}
                          </p>
                          <Badge variant="outline" className={registro.decisao === 'Aprovado' ? 'bg-[hsl(var(--status-approved)/0.12)] text-[hsl(var(--status-approved))] border-[hsl(var(--status-approved)/0.35)]' : 'bg-destructive/10 text-destructive border-destructive/25'}>
                            {registro.decisao}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {registro.fornecedor} • {registro.tipoAcesso} • {registro.periodo}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Decisão registrada em {registro.dataHora}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Pendências que impedem liberação</h3>
                  <span className="text-xs text-muted-foreground">{pendenciasBloqueantes.length} itens</span>
                </div>

                <div className="space-y-2">
                  {pendenciasBloqueantes.slice(0, 4).map((alerta, idx) => (
                    <div key={`${alerta.tipo}-${idx}`} className="p-3 bg-muted/20 rounded-md border border-border flex items-start gap-3">
                      <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${severityDotClass[alerta.gravidade] || 'bg-warning'}`}></div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{alerta.mensagem}</p>
                        <p className="text-xs text-muted-foreground mt-1">Ação sugerida: {alerta.acaoSugerida}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Card className="border-border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Fornecedores aguardando decisão</CardTitle>
                </CardHeader>
                <CardContent>
                  <AdminTable>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead>Fornecedor</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Origem</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Pendência</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fornecedoresPendentes.length === 0 ? (
                          <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">Nenhum fornecedor aguardando decisão.</TableCell></TableRow>
                        ) : fornecedoresPendentes.map((apr) => (
                          <TableRow key={apr.id}>
                            <TableCell className="font-medium">{apr.nome}</TableCell>
                            <TableCell>{apr.acesso || '-'}</TableCell>
                            <TableCell>{String(apr.origem || '').includes('locat') ? 'Indicado pelo locatário' : 'Criado pela administração'}</TableCell>
                            <TableCell><Badge variant="outline">Aguardando aprovação</Badge></TableCell>
                            <TableCell className="text-xs text-muted-foreground">{apr.alertas?.join(' | ') || '-'}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="outline" onClick={() => navigate(`/admin/eventos/${eventoId}/fornecedores`)}>Ver detalhes</Button>
                                <Button size="sm" variant="outline" onClick={() => handleCorrection(apr)}>Solicitar correção</Button>
                                <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => handleApprovalAction(apr, 'reject')}><XCircle className="w-4 h-4 mr-1.5" /> Reprovar</Button>
                                <Button size="sm" className="bg-[hsl(var(--status-approved))] text-white hover:bg-[hsl(var(--status-approved)/0.9)]" onClick={() => handleApprovalAction(apr, 'approve')}><CheckCircle className="w-4 h-4 mr-1.5" /> Aprovar</Button>
                                <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleBlock(apr)}><ShieldBan className="w-4 h-4 mr-1.5" /> Bloquear</Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </AdminTable>
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Pessoas aguardando decisão</CardTitle>
                </CardHeader>
                <CardContent>
                  <AdminTable>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="w-16">Foto</TableHead>
                          <TableHead>Pessoa</TableHead>
                          <TableHead>Fornecedor</TableHead>
                          <TableHead>Função</TableHead>
                          <TableHead>Tipo de acesso</TableHead>
                          <TableHead>Período solicitado</TableHead>
                          <TableHead>Alertas</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pessoasPendentes.length === 0 ? (
                          <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-6">Nenhuma pessoa aguardando decisão.</TableCell></TableRow>
                        ) : pessoasPendentes.map((apr) => (
                          <TableRow key={apr.id} className="group">
                            <TableCell>
                              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-sm">{apr.iniciais}</div>
                            </TableCell>
                            <TableCell>
                              <p className="font-medium text-foreground">{apr.nome}</p>
                              <p className="text-xs text-muted-foreground">{maskCpf(apr.cpf)}</p>
                            </TableCell>
                            <TableCell>{apr.fornecedor}</TableCell>
                            <TableCell>{apr.funcao}</TableCell>
                            <TableCell>{apr.acesso}</TableCell>
                            <TableCell>{apr.periodo}</TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1 items-start">
                                {(apr.alertas || []).map((alerta, idx) => (<AlertBadge key={idx} alert={alerta} />))}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="outline" onClick={() => navigate(`/admin/eventos/${eventoId}/pessoas`)}>Ver detalhes</Button>
                                <Button size="sm" variant="outline" onClick={() => handleCorrection(apr)}>Solicitar correção</Button>
                                <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => handleApprovalAction(apr, 'reject')}><XCircle className="w-4 h-4 mr-1.5" /> Reprovar</Button>
                                <Button size="sm" className="bg-[hsl(var(--status-approved))] text-white hover:bg-[hsl(var(--status-approved)/0.9)]" onClick={() => handleApprovalAction(apr, 'approve')}><CheckCircle className="w-4 h-4 mr-1.5" /> Aprovar</Button>
                                <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleBlock(apr)}><ShieldBan className="w-4 h-4 mr-1.5" /> Bloquear</Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </AdminTable>
                </CardContent>
              </Card>
            </motion.div>
          </EventoDetalheLayout>
        </div>
      </div>
    </>
  );
};

export default EventoDetalheAprovacoesPage;
