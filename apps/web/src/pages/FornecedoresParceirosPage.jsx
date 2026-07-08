import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { AdminSidebar } from '@/components/Sidebar.jsx';
import Header from '@/components/Header.jsx';
import AdminTable from '@/components/AdminTable.jsx';
import ActionMenu from '@/components/ActionMenu.jsx';
import StatusBadge from '@/components/StatusBadge.jsx';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Building2, Eye, Edit, Link2, ShieldBan, Power, History, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';

const INITIAL_FORM = {
  documentoTipoPessoa: 'PJ',
  razaoSocial: '',
  nomeFantasia: '',
  documento: '',
  categoria: 'Montadora',
  classificacao: 'Parceiro recorrente',
  statusAdministrativo: 'Ativo',
  responsavel: '',
  cargoResponsavel: '',
  email: '',
  whatsapp: '',
  servicosPrestados: '',
  observacoes: '',
  podeMontagem: true,
  podeEvento: true,
  podeDesmontagem: true,
  exigeAprovacaoCadaEvento: true,
  exigeAceiteNormasCadaEvento: true,
  contratoPrestacao: '',
  documentosCadastrais: '',
  certidoes: '',
  validadeDocumentos: '',
  observacoesDocumentos: ''
};

const STEP_TITLES = [
  'Dados da empresa',
  'Responsável',
  'Dados operacionais',
  'Documentos'
];

const STATUS_PRIORITY = {
  Bloqueado: 0,
  'Documentação pendente': 1,
  'Aguardando atualização cadastral': 2,
  Inativo: 3,
  Ativo: 4
};

const FornecedoresParceirosPage = () => {
  const navigate = useNavigate();
  const {
    adminMockData,
    events,
    createPartnerSupplier,
    updatePartnerSupplier,
    setPartnerSupplierStatus,
    linkPartnerSuppliersToEvent,
    SUPPLIER_CATEGORIES,
    ADMIN_CLASSIFICATIONS,
    PARTNER_STATUSES
  } = useAppData();

  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [classificationFilter, setClassificationFilter] = useState('TODOS');
  const [statusFilter, setStatusFilter] = useState('TODOS');

  const parceiros = useMemo(() => adminMockData.fornecedoresParceiros || [], [adminMockData.fornecedoresParceiros]);

  const parceirosFiltrados = useMemo(() => {
    const q = search.toLowerCase().trim();
    const filteredByQuickFilters = parceiros.filter((item) => {
      if (classificationFilter !== 'TODOS' && item.classificacao !== classificationFilter) return false;
      if (statusFilter !== 'TODOS' && item.statusAdministrativo !== statusFilter) return false;
      return true;
    });

    if (!q) return filteredByQuickFilters;

    const bySearch = filteredByQuickFilters.filter((item) => {
      const fields = [item.nome, item.categoria, item.classificacao, item.responsavel, item.cnpjCpf];
      return fields.some((field) => String(field || '').toLowerCase().includes(q));
    });

    return bySearch;
  }, [parceiros, search, classificationFilter, statusFilter]);

  const parceirosOrdenados = useMemo(() => {
    const getPendingDocumentsCount = (item) => {
      return (item.documentos || []).filter((doc) => String(doc.status || '').toLowerCase() === 'pendente').length;
    };

    const sorted = [...parceirosFiltrados].sort((a, b) => {
      const statusA = STATUS_PRIORITY[a.statusAdministrativo] ?? 99;
      const statusB = STATUS_PRIORITY[b.statusAdministrativo] ?? 99;
      if (statusA !== statusB) return statusA - statusB;

      const pendingDocsA = getPendingDocumentsCount(a);
      const pendingDocsB = getPendingDocumentsCount(b);
      if (pendingDocsA !== pendingDocsB) return pendingDocsB - pendingDocsA;

      return String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR');
    });

    return sorted;
  }, [parceirosFiltrados]);

  const stats = useMemo(() => {
    const ativos = parceiros.filter((item) => item.statusAdministrativo === 'Ativo').length;
    const recorrentes = parceiros.filter((item) => item.classificacao === 'Parceiro recorrente').length;
    const oficiais = parceiros.filter((item) => item.classificacao === 'Oficial').length;
    const obrigatorios = parceiros.filter((item) => item.classificacao === 'Obrigatório').length;
    const docsPendentes = parceiros.filter((item) => item.statusAdministrativo === 'Documentação pendente').length;

    return { ativos, recorrentes, oficiais, obrigatorios, docsPendentes };
  }, [parceiros]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(INITIAL_FORM);
    setFormStep(1);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (partner) => {
    setEditingId(partner.id);
    setFormData({
      ...INITIAL_FORM,
      ...partner,
      documento: partner.cnpjCpf || partner.documento || '',
      contratoPrestacao: partner.documentos?.find((doc) => doc.tipo === 'Contrato de prestação')?.nome || '',
      documentosCadastrais: partner.documentos?.find((doc) => doc.tipo === 'Documentos cadastrais')?.nome || '',
      certidoes: partner.documentos?.find((doc) => doc.tipo === 'Certidões')?.nome || ''
    });
    setFormStep(1);
    setIsFormOpen(true);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep = () => {
    if (formStep === 1) {
      if (!formData.razaoSocial.trim() || !formData.documento.trim()) {
        toast.error('Preencha razão social/nome e CNPJ/CPF.');
        return false;
      }
    }

    if (formStep === 2) {
      if (!formData.responsavel.trim() || !formData.email.trim()) {
        toast.error('Preencha responsável e e-mail.');
        return false;
      }
    }

    return true;
  };

  const handleNextStep = () => {
    if (!validateStep()) return;
    setFormStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrevStep = () => {
    setFormStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSavePartner = () => {
    const payload = {
      documentoTipoPessoa: formData.documentoTipoPessoa,
      razaoSocial: formData.razaoSocial,
      nomeFantasia: formData.nomeFantasia,
      documento: formData.documento,
      categoria: formData.categoria,
      classificacao: formData.classificacao,
      statusAdministrativo: formData.statusAdministrativo,
      responsavel: formData.responsavel,
      cargoResponsavel: formData.cargoResponsavel,
      email: formData.email,
      whatsapp: formData.whatsapp,
      servicosPrestados: formData.servicosPrestados,
      observacoes: formData.observacoes,
      podeMontagem: formData.podeMontagem,
      podeEvento: formData.podeEvento,
      podeDesmontagem: formData.podeDesmontagem,
      exigeAprovacaoCadaEvento: formData.exigeAprovacaoCadaEvento,
      exigeAceiteNormasCadaEvento: formData.exigeAceiteNormasCadaEvento,
      documentos: [
        { id: `doc-contrato-${Date.now()}`, tipo: 'Contrato de prestação', nome: formData.contratoPrestacao || 'Não informado', status: formData.contratoPrestacao ? 'Ok' : 'Pendente' },
        { id: `doc-cadastro-${Date.now()}`, tipo: 'Documentos cadastrais', nome: formData.documentosCadastrais || 'Não informado', status: formData.documentosCadastrais ? 'Ok' : 'Pendente' },
        { id: `doc-certidoes-${Date.now()}`, tipo: 'Certidões', nome: formData.certidoes || 'Não informado', status: formData.certidoes ? 'Ok' : 'Pendente' }
      ],
      validadeDocumentos: formData.validadeDocumentos,
      observacoesDocumentos: formData.observacoesDocumentos
    };

    if (editingId) {
      updatePartnerSupplier(editingId, payload);
      toast.success('Fornecedor parceiro atualizado.');
    } else {
      createPartnerSupplier(payload);
      toast.success('Fornecedor parceiro cadastrado.');
    }

    setIsFormOpen(false);
  };

  const handleOpenLink = (partner) => {
    setSelectedPartner(partner);
    setSelectedEventId(events?.[0]?.id || '');
    setLinkDialogOpen(true);
  };

  const handleConfirmLink = () => {
    if (!selectedPartner || !selectedEventId) {
      toast.error('Selecione um evento para vincular.');
      return;
    }

    const selectedTeam = Array.isArray(selectedPartner.equipeBase) ? selectedPartner.equipeBase : [];
    linkPartnerSuppliersToEvent(selectedEventId, {
      partnerIds: [selectedPartner.id],
      tipoAcesso: 'Evento',
      precisaAceitarNormas: true,
      precisaEnviarEquipe: true,
      selectedPeopleByPartner: {
        [selectedPartner.id]: selectedTeam
      }
    });

    toast.success('Fornecedor parceiro vinculado ao evento.');
    setLinkDialogOpen(false);
  };

  return (
    <>
      <Helmet>
        <title>Fornecedores Parceiros - Expocentro Acesso</title>
      </Helmet>

      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <Header />

          <main className="flex-1 p-6 md:p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h1 className="page-title">Fornecedores Parceiros</h1>
                  <p className="page-subtitle">Cadastre e gerencie fornecedores recorrentes que podem ser vinculados aos eventos do Expocentro.</p>
                </div>
                <Button onClick={handleOpenCreate}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar fornecedor parceiro
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
                <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Fornecedores ativos</p><p className="text-2xl font-bold">{stats.ativos}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Parceiros recorrentes</p><p className="text-2xl font-bold">{stats.recorrentes}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Oficiais</p><p className="text-2xl font-bold">{stats.oficiais}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Obrigatórios</p><p className="text-2xl font-bold">{stats.obrigatorios}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Com documentos pendentes</p><p className="text-2xl font-bold">{stats.docsPendentes}</p></CardContent></Card>
              </div>

              <div className="relative max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome, categoria ou classificação" />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant={classificationFilter === 'TODOS' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setClassificationFilter('TODOS')}
                >
                  Classificação: Todas
                </Button>
                <Button
                  variant={classificationFilter === 'Parceiro recorrente' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setClassificationFilter('Parceiro recorrente')}
                >
                  Parceiros recorrentes
                </Button>
                <Button
                  variant={classificationFilter === 'Oficial' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setClassificationFilter('Oficial')}
                >
                  Oficiais
                </Button>
                <Button
                  variant={classificationFilter === 'Obrigatório' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setClassificationFilter('Obrigatório')}
                >
                  Obrigatórios
                </Button>
                <Button
                  variant={classificationFilter === 'Prestador fixo' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setClassificationFilter('Prestador fixo')}
                >
                  Prestadores fixos
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant={statusFilter === 'TODOS' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('TODOS')}
                >
                  Status: Todos
                </Button>
                <Button
                  variant={statusFilter === 'Ativo' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('Ativo')}
                >
                  Ativos
                </Button>
                <Button
                  variant={statusFilter === 'Documentação pendente' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('Documentação pendente')}
                >
                  Docs pendentes
                </Button>
                <Button
                  variant={statusFilter === 'Bloqueado' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('Bloqueado')}
                >
                  Bloqueados
                </Button>
                <Button
                  variant={statusFilter === 'Inativo' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('Inativo')}
                >
                  Inativos
                </Button>
              </div>

              <AdminTable>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>CNPJ/CPF</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Classificação administrativa</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>E-mail/WhatsApp</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Eventos vinculados</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parceirosOrdenados.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground py-8">Nenhum fornecedor parceiro encontrado.</TableCell>
                      </TableRow>
                    ) : parceirosOrdenados.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <p className="font-medium text-foreground">{item.nome}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.eventosVinculados?.length || 0} vínculo(s) em evento
                          </p>
                          {(item.eventosVinculados || []).slice(0, 2).map((eventLink) => (
                            <p key={`${item.id}-${eventLink.eventId}`} className="text-[11px] text-muted-foreground">
                              • {eventLink.eventName}
                            </p>
                          ))}
                        </TableCell>
                        <TableCell>{item.cnpjCpf || '-'}</TableCell>
                        <TableCell>{item.categoria}</TableCell>
                        <TableCell>{item.classificacao}</TableCell>
                        <TableCell>
                          <p className="text-sm text-foreground">{item.responsavel || '-'}</p>
                          <p className="text-xs text-muted-foreground">{item.cargoResponsavel || '-'}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-xs text-muted-foreground break-all">{item.email || '-'}</p>
                          <p className="text-xs text-muted-foreground">{item.whatsapp || '-'}</p>
                        </TableCell>
                        <TableCell><StatusBadge status={item.statusAdministrativo} /></TableCell>
                        <TableCell className="text-center">{item.eventosVinculados?.length || 0}</TableCell>
                        <TableCell className="text-right">
                          <ActionMenu
                            actions={[
                              {
                                label: 'Ver detalhes',
                                icon: Eye,
                                onClick: () => navigate(`/admin/fornecedores-parceiros/${item.id}`)
                              },
                              {
                                label: 'Editar cadastro',
                                icon: Edit,
                                onClick: () => handleOpenEdit(item)
                              },
                              {
                                label: 'Vincular a evento',
                                icon: Link2,
                                onClick: () => handleOpenLink(item)
                              },
                              {
                                label: 'Bloquear',
                                icon: ShieldBan,
                                destructive: true,
                                onClick: () => {
                                  setPartnerSupplierStatus(item.id, 'Bloqueado');
                                  toast.warning('Fornecedor parceiro bloqueado.');
                                }
                              },
                              {
                                label: 'Inativar',
                                icon: Power,
                                onClick: () => {
                                  setPartnerSupplierStatus(item.id, 'Inativo');
                                  toast.info('Fornecedor parceiro inativado.');
                                }
                              },
                              {
                                label: 'Ver histórico',
                                icon: History,
                                onClick: () => navigate(`/admin/fornecedores-parceiros/${item.id}#historico`)
                              }
                            ]}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AdminTable>
            </div>
          </main>
        </div>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar fornecedor parceiro' : 'Adicionar fornecedor parceiro'}</DialogTitle>
            <DialogDescription>Etapa {formStep} de 4: {STEP_TITLES[formStep - 1]}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {formStep === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Tipo de pessoa</Label>
                  <select className="w-full h-9 rounded-md border border-input bg-background px-3" value={formData.documentoTipoPessoa} onChange={(e) => handleChange('documentoTipoPessoa', e.target.value)}>
                    <option value="PJ">Pessoa jurídica</option>
                    <option value="PF">Pessoa física</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Razão social ou nome completo</Label>
                  <Input value={formData.razaoSocial} onChange={(e) => handleChange('razaoSocial', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Nome fantasia</Label>
                  <Input value={formData.nomeFantasia} onChange={(e) => handleChange('nomeFantasia', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ ou CPF</Label>
                  <Input value={formData.documento} onChange={(e) => handleChange('documento', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <select className="w-full h-9 rounded-md border border-input bg-background px-3" value={formData.categoria} onChange={(e) => handleChange('categoria', e.target.value)}>
                    {SUPPLIER_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Classificação administrativa</Label>
                  <select className="w-full h-9 rounded-md border border-input bg-background px-3" value={formData.classificacao} onChange={(e) => handleChange('classificacao', e.target.value)}>
                    {ADMIN_CLASSIFICATIONS.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Status</Label>
                  <select className="w-full h-9 rounded-md border border-input bg-background px-3" value={formData.statusAdministrativo} onChange={(e) => handleChange('statusAdministrativo', e.target.value)}>
                    {PARTNER_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>
              </div>
            )}

            {formStep === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Nome do responsável</Label>
                  <Input value={formData.responsavel} onChange={(e) => handleChange('responsavel', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Cargo/função</Label>
                  <Input value={formData.cargoResponsavel} onChange={(e) => handleChange('cargoResponsavel', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp</Label>
                  <Input value={formData.whatsapp} onChange={(e) => handleChange('whatsapp', e.target.value)} />
                </div>
              </div>
            )}

            {formStep === 3 && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Serviços prestados</Label>
                  <Textarea value={formData.servicosPrestados} onChange={(e) => handleChange('servicosPrestados', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea value={formData.observacoes} onChange={(e) => handleChange('observacoes', e.target.value)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 text-sm"><Checkbox checked={formData.podeMontagem} onCheckedChange={(checked) => handleChange('podeMontagem', Boolean(checked))} /> Pode atuar em montagem?</label>
                  <label className="flex items-center gap-2 text-sm"><Checkbox checked={formData.podeEvento} onCheckedChange={(checked) => handleChange('podeEvento', Boolean(checked))} /> Pode atuar durante o evento?</label>
                  <label className="flex items-center gap-2 text-sm"><Checkbox checked={formData.podeDesmontagem} onCheckedChange={(checked) => handleChange('podeDesmontagem', Boolean(checked))} /> Pode atuar na desmontagem?</label>
                  <label className="flex items-center gap-2 text-sm"><Checkbox checked={formData.exigeAprovacaoCadaEvento} onCheckedChange={(checked) => handleChange('exigeAprovacaoCadaEvento', Boolean(checked))} /> Exige aprovação a cada evento?</label>
                  <label className="flex items-center gap-2 text-sm md:col-span-2"><Checkbox checked={formData.exigeAceiteNormasCadaEvento} onCheckedChange={(checked) => handleChange('exigeAceiteNormasCadaEvento', Boolean(checked))} /> Exige aceite de normas a cada evento?</label>
                </div>
              </div>
            )}

            {formStep === 4 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2 md:col-span-2">
                  <Label>Contrato de prestação, se houver</Label>
                  <Input value={formData.contratoPrestacao} onChange={(e) => handleChange('contratoPrestacao', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Documentos cadastrais</Label>
                  <Input value={formData.documentosCadastrais} onChange={(e) => handleChange('documentosCadastrais', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Certidões, se aplicável</Label>
                  <Input value={formData.certidoes} onChange={(e) => handleChange('certidoes', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Validade dos documentos</Label>
                  <Input value={formData.validadeDocumentos} onChange={(e) => handleChange('validadeDocumentos', e.target.value)} placeholder="dd/mm/aaaa" />
                </div>
                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Input value={formData.observacoesDocumentos} onChange={(e) => handleChange('observacoesDocumentos', e.target.value)} />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
            {formStep > 1 && <Button variant="outline" onClick={handlePrevStep}>Voltar</Button>}
            {formStep < 4 ? <Button onClick={handleNextStep}>Próxima etapa</Button> : <Button onClick={handleSavePartner}>Salvar fornecedor parceiro</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular fornecedor parceiro</DialogTitle>
            <DialogDescription>Selecione o evento para vincular este fornecedor na operação atual.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-md border border-border bg-muted/20 p-3 text-sm">
              <p className="font-medium text-foreground">{selectedPartner?.nome}</p>
              <p className="text-xs text-muted-foreground">{selectedPartner?.categoria} • {selectedPartner?.classificacao}</p>
            </div>
            <div className="space-y-2">
              <Label>Evento</Label>
              <select className="w-full h-9 rounded-md border border-input bg-background px-3" value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)}>
                {events.map((evt) => <option key={evt.id} value={evt.id}>{evt.nome}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleConfirmLink}><Building2 className="w-4 h-4 mr-2" />Vincular ao evento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FornecedoresParceirosPage;
