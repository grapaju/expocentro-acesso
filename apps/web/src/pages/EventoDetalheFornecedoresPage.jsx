
import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminSidebar } from '@/components/Sidebar.jsx';
import Header from '@/components/Header.jsx';
import EventoDetalheLayout from '@/components/EventoDetalheLayout.jsx';
import AdminTable from '@/components/AdminTable.jsx';
import StatusBadge from '@/components/StatusBadge.jsx';
import ActionMenu from '@/components/ActionMenu.jsx';
import ReutilizarEquipeExistenteModal from '@/components/ReutilizarEquipeExistenteModal.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { useAppData } from '@/store/AppDataContext.jsx';
import { Eye, Edit, ShieldBan, Repeat, Plus, Mail, Users, Handshake, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const CLASSIFICACOES_REUSO = ['oficial', 'parceiro recorrente', 'prestador fixo'];

const EventoDetalheFornecedoresPage = () => {
  const navigate = useNavigate();
  const { eventoId } = useParams();
  const {
    adminMockData,
    blockSupplier,
    approveSupplier,
    changeSupplierClassification,
    linkPartnerSuppliersToEvent,
    createManualEventSupplier
  } = useAppData();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFornecedor, setSelectedFornecedor] = useState(null);
  const [solicitacoesReuso, setSolicitacoesReuso] = useState([]);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [partnerLinkDialogOpen, setPartnerLinkDialogOpen] = useState(false);
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [partnerSearch, setPartnerSearch] = useState('');
  const [selectedPartnerIds, setSelectedPartnerIds] = useState([]);
  const [tipoAcessoVinculo, setTipoAcessoVinculo] = useState('Evento');
  const [precisaAceitarNormas, setPrecisaAceitarNormas] = useState(true);
  const [precisaEnviarEquipe, setPrecisaEnviarEquipe] = useState(true);
  const [manualForm, setManualForm] = useState({
    nome: '',
    categoria: 'Outro',
    classificacao: 'Temporário',
    responsavel: '',
    email: '',
    whatsapp: ''
  });

  const fornecedores = useMemo(() => {
    const conviteEventMap = new Map((adminMockData.convites || []).map((convite) => [convite.id, convite.eventId]));
    return (adminMockData.fornecedores || []).filter((fornecedor) => {
      if (fornecedor.eventId) return fornecedor.eventId === eventoId;
      if (fornecedor.invitationId) return conviteEventMap.get(fornecedor.invitationId) === eventoId;
      return false;
    });
  }, [adminMockData.fornecedores, adminMockData.convites, eventoId]);

  const invitationById = useMemo(
    () => new Map((adminMockData.convites || []).map((convite) => [convite.id, convite])),
    [adminMockData.convites]
  );
  const partnerCandidates = useMemo(() => {
    const query = partnerSearch.toLowerCase().trim();
    const all = adminMockData.fornecedoresParceiros || [];
    if (!query) return all;

    return all.filter((item) => {
      const fields = [item.nome, item.categoria, item.classificacao];
      return fields.some((field) => String(field || '').toLowerCase().includes(query));
    });
  }, [adminMockData.fornecedoresParceiros, partnerSearch]);
  const eventoAtual = adminMockData.eventos.find((evento) => evento.id === eventoId) || adminMockData.eventos[0];
  const previousEvents = adminMockData.eventos.filter((evento) => evento.id !== eventoAtual?.id);

  const storageKey = useMemo(() => `evento_${eventoAtual?.id}_reutilizacao_equipe`, [eventoAtual?.id]);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (!saved) {
      setSolicitacoesReuso([]);
      return;
    }

    try {
      setSolicitacoesReuso(JSON.parse(saved));
    } catch {
      setSolicitacoesReuso([]);
    }
  }, [storageKey]);

  const isFornecedorElegivelReuso = (fornecedor) => {
    const classificacao = String(fornecedor?.classificacao || '').toLowerCase();
    return CLASSIFICACOES_REUSO.includes(classificacao);
  };

  const handleOpenReusoModal = (fornecedor) => {
    if (!isFornecedorElegivelReuso(fornecedor)) {
      toast.info('Reutilização disponível apenas para fornecedores Oficial, Parceiro recorrente ou Prestador fixo.');
      return;
    }

    setSelectedFornecedor(fornecedor);
    setModalOpen(true);
  };

  const handleSubmitReuso = (payload) => {
    const registro = {
      id: `reuso-${Date.now()}`,
      dataHora: new Date().toLocaleString('pt-BR'),
      status: 'Aguardando aprovação administrativa',
      ...payload
    };

    const updated = [registro, ...solicitacoesReuso];
    setSolicitacoesReuso(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));

    toast.success('Equipe reutilizada enviada para aprovação no evento atual.');
  };

  const togglePartnerSelection = (partnerId) => {
    setSelectedPartnerIds((prev) => (
      prev.includes(partnerId)
        ? prev.filter((id) => id !== partnerId)
        : [...prev, partnerId]
    ));
  };

  const handleLinkPartnerSuppliers = () => {
    if (selectedPartnerIds.length === 0) {
      toast.error('Selecione ao menos um fornecedor parceiro.');
      return;
    }

    const selectedPeopleByPartner = {};
    if (precisaEnviarEquipe) {
      (adminMockData.fornecedoresParceiros || []).forEach((partner) => {
        if (!selectedPartnerIds.includes(partner.id)) return;
        selectedPeopleByPartner[partner.id] = Array.isArray(partner.equipeBase) ? partner.equipeBase : [];
      });
    }

    const linked = linkPartnerSuppliersToEvent(eventoId, {
      partnerIds: selectedPartnerIds,
      tipoAcesso: tipoAcessoVinculo,
      precisaAceitarNormas,
      precisaEnviarEquipe,
      selectedPeopleByPartner
    });

    if (linked.length === 0) {
      toast.error('Não foi possível vincular os fornecedores selecionados.');
      return;
    }

    toast.success(`${linked.length} fornecedor(es) parceiro(s) vinculados ao evento.`);
    setSelectedPartnerIds([]);
    setPartnerSearch('');
    setPartnerLinkDialogOpen(false);
  };

  const handleCreateManualSupplier = () => {
    if (!manualForm.nome.trim()) {
      toast.error('Informe o nome do fornecedor.');
      return;
    }

    createManualEventSupplier(eventoId, manualForm);
    toast.success('Fornecedor cadastrado manualmente no evento.');
    setManualForm({
      nome: '',
      categoria: 'Outro',
      classificacao: 'Temporário',
      responsavel: '',
      email: '',
      whatsapp: ''
    });
    setManualDialogOpen(false);
  };

  return (
    <>
      <Helmet>
        <title>Fornecedores - Detalhes do Evento</title>
      </Helmet>
      
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <EventoDetalheLayout>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Fornecedores</h2>
                  <p className="text-sm text-muted-foreground">Fornecedores parceiros, obrigatórios, indicados e cadastrados deste evento.</p>
                </div>
                <Button onClick={() => setLinkDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Vincular fornecedor
                </Button>
              </div>

              {solicitacoesReuso.length > 0 && (
                <Card className="border-border shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Repeat className="w-4 h-4 text-primary" />
                      Reutilização de equipe enviada para aprovação
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {solicitacoesReuso.slice(0, 3).map((solicitacao) => (
                      <div key={solicitacao.id} className="rounded-md border border-border p-3 bg-muted/20">
                        <p className="text-sm font-medium text-foreground">
                          {solicitacao.fornecedor?.nome} • {solicitacao.pessoasSelecionadas?.length || 0} pessoa(s)
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Origem: {solicitacao.eventoAnterior?.nome} • Tipo: {solicitacao.tipoAcesso} • Período: {solicitacao.periodo}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Status: {solicitacao.status} • {solicitacao.dataHora}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <AdminTable>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Responsável / Contato</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Equipe</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fornecedores.map((forn) => (
                      <TableRow key={forn.id}>
                        <TableCell className="font-medium text-foreground">{forn.nome}</TableCell>
                        <TableCell>
                          <p className="text-sm text-foreground">{forn.categoria || '-'}</p>
                          <p className="text-xs text-muted-foreground">{forn.classificacao || '-'}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 items-start">
                            <span className="text-sm text-foreground">{forn.responsavel || '-'}</span>
                            <span className="text-xs text-muted-foreground">{forn.email || '-'}</span>
                            <span className="text-xs text-muted-foreground">{forn.whatsapp || '-'}</span>
                            {isFornecedorElegivelReuso(forn) && (
                              <Badge variant="outline" className="text-[10px] uppercase tracking-wider text-primary border-primary/40">
                                Reutilização habilitada
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 items-start">
                            <StatusBadge status={invitationById.get(forn.invitationId)?.status || forn.inviteStatus || 'Indicado'} />
                            <StatusBadge status={forn.registrationStatus || forn.statusCadastral} />
                          </div>
                        </TableCell>
                        <TableCell className="text-center tabular-nums font-medium">{forn.teamCount ?? forn.pessoas}</TableCell>
                        <TableCell className="text-right">
                          <ActionMenu actions={[
                            { label: 'Ver detalhes', icon: Eye, onClick: () => {} },
                            {
                              label: 'Editar cadastro',
                              icon: Edit,
                              onClick: () => {
                                const next = forn.classificacao === 'Parceiro recorrente' ? 'Temporario' : 'Parceiro recorrente';
                                changeSupplierClassification(forn.id, next);
                                toast.success(`Classificacao alterada para ${next}.`);
                              }
                            },
                            {
                              label: 'Aprovar fornecedor',
                              icon: Eye,
                              onClick: () => {
                                approveSupplier(forn.id);
                                toast.success('Fornecedor aprovado.');
                              }
                            },
                            { label: 'Solicitar correção', icon: Edit, onClick: () => toast.info('Use a fila de aprovação para solicitar correção formal.') },
                            { label: 'Reenviar convite', icon: Mail, onClick: () => toast.info('Use a aba Convites para reenviar o link.') },
                            { label: 'Ver equipe', icon: Users, onClick: () => navigate(`/admin/eventos/${eventoId}/pessoas`) },
                            { label: 'Ver taxa', icon: Handshake, onClick: () => navigate(`/admin/eventos/${eventoId}/taxas`) },
                            { label: 'Reutilizar equipe existente', icon: Repeat, onClick: () => handleOpenReusoModal(forn) },
                            {
                              label: 'Bloquear',
                              icon: ShieldBan,
                              destructive: true,
                              onClick: () => {
                                blockSupplier(forn.id);
                                toast.success('Fornecedor bloqueado.');
                              }
                            }
                          ]} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AdminTable>
            </motion.div>
          </EventoDetalheLayout>
        </div>
      </div>

      <ReutilizarEquipeExistenteModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        fornecedor={selectedFornecedor}
        previousEvents={previousEvents}
        teamHistory={adminMockData.equipesHistorico || []}
        currentEvento={eventoAtual}
        onSubmit={handleSubmitReuso}
      />

      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular fornecedor</DialogTitle>
            <DialogDescription>Escolha a forma de inclusão do fornecedor neste evento.</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                setLinkDialogOpen(false);
                setPartnerLinkDialogOpen(true);
              }}
            >
              Vincular fornecedor parceiro existente
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                setLinkDialogOpen(false);
                navigate(`/admin/eventos/${eventoId}/convites`);
              }}
            >
              Criar convite para fornecedor indicado
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                setLinkDialogOpen(false);
                setManualDialogOpen(true);
              }}
            >
              Cadastrar fornecedor manualmente
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={partnerLinkDialogOpen} onOpenChange={setPartnerLinkDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Vincular fornecedor parceiro existente</DialogTitle>
            <DialogDescription>
              Busque na base geral, selecione um ou mais fornecedores e configure regras de acesso para este evento.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                value={partnerSearch}
                onChange={(event) => setPartnerSearch(event.target.value)}
                placeholder="Buscar por nome, categoria ou classificação"
              />
            </div>

            <div className="rounded-md border border-border max-h-56 overflow-y-auto p-2 space-y-2">
              {partnerCandidates.length === 0 ? (
                <p className="text-sm text-muted-foreground p-2">Nenhum fornecedor parceiro encontrado.</p>
              ) : partnerCandidates.map((partner) => (
                <label key={partner.id} className="flex items-start gap-3 rounded-md border border-border p-3 cursor-pointer bg-background">
                  <Checkbox
                    checked={selectedPartnerIds.includes(partner.id)}
                    onCheckedChange={() => togglePartnerSelection(partner.id)}
                  />
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-foreground">{partner.nome}</p>
                    <p className="text-xs text-muted-foreground">{partner.categoria} • {partner.classificacao}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tipo de acesso no evento</Label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3"
                  value={tipoAcessoVinculo}
                  onChange={(event) => setTipoAcessoVinculo(event.target.value)}
                >
                  <option value="Montagem">Montagem</option>
                  <option value="Evento">Evento</option>
                  <option value="Desmontagem">Desmontagem</option>
                  <option value="Todos os períodos">Todos os períodos</option>
                </select>
              </div>

              <div className="space-y-2 rounded-md border border-border p-3 bg-muted/20">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={precisaAceitarNormas} onCheckedChange={(checked) => setPrecisaAceitarNormas(Boolean(checked))} />
                  Definir se precisa aceitar normas
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={precisaEnviarEquipe} onCheckedChange={(checked) => setPrecisaEnviarEquipe(Boolean(checked))} />
                  Definir se precisa enviar equipe
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPartnerLinkDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleLinkPartnerSuppliers}>Salvar vínculo no evento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={manualDialogOpen} onOpenChange={setManualDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastrar fornecedor manualmente</DialogTitle>
            <DialogDescription>Inclua um fornecedor diretamente neste evento.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2 md:col-span-2">
              <Label>Fornecedor</Label>
              <Input value={manualForm.nome} onChange={(event) => setManualForm((prev) => ({ ...prev, nome: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Input value={manualForm.categoria} onChange={(event) => setManualForm((prev) => ({ ...prev, categoria: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Classificação administrativa</Label>
              <Input value={manualForm.classificacao} onChange={(event) => setManualForm((prev) => ({ ...prev, classificacao: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Responsável</Label>
              <Input value={manualForm.responsavel} onChange={(event) => setManualForm((prev) => ({ ...prev, responsavel: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input value={manualForm.email} onChange={(event) => setManualForm((prev) => ({ ...prev, email: event.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>WhatsApp</Label>
              <Input value={manualForm.whatsapp} onChange={(event) => setManualForm((prev) => ({ ...prev, whatsapp: event.target.value }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setManualDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateManualSupplier}>Cadastrar fornecedor manualmente</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EventoDetalheFornecedoresPage;
