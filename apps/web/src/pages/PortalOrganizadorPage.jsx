import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useAppData } from '@/store/AppDataContext.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import ActionMenu from '@/components/ActionMenu.jsx';
import StatusBadge from '@/components/StatusBadge.jsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, Copy, Mail, MessageCircle, Plus, RefreshCw, UserRoundSearch, XCircle } from 'lucide-react';

const INITIAL_FORM = {
  fornecedor: '',
  categoria: 'Montadora',
  responsavel: '',
  email: '',
  whatsapp: '',
  observacoes: ''
};

const CATEGORIES = [
  'Montadora',
  'Segurança',
  'Limpeza',
  'Alimentação',
  'Audiovisual',
  'Expositor',
  'Prestador de serviço',
  'Outro'
];

const toIsoDate = (brDate) => {
  const [day, month, year] = String(brDate || '').split('/');
  if (!day || !month || !year) return '';
  return `${year}-${month}-${day}`;
};

const isExpired = (brDate) => {
  const iso = toIsoDate(brDate);
  if (!iso) return false;
  const inviteDate = new Date(`${iso}T23:59:59`);
  return inviteDate.getTime() < Date.now();
};

const getDisplayStatus = (invite) => {
  const status = String(invite?.status || '').toLowerCase();
  if (status === 'cancelado' || status === 'usado' || status === 'expirado') return invite.status;
  if (isExpired(invite?.validade)) return 'Expirado';
  return invite?.status || 'Criado';
};

const createSupplierInviteCode = (name) => {
  const prefix = String(name || 'FOR')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 4) || 'FOR';

  return `${prefix}-FOR-${Math.floor(100 + Math.random() * 900)}`;
};

const buildInviteLink = (code) => {
  if (!code) return '';
  const base = window.location.origin;
  return `${base}/validar-convite?codigo=${encodeURIComponent(code)}`;
};

const toBrDate = (value) => {
  if (!value) return '';
  if (String(value).includes('/')) return String(value);
  const [year, month, day] = String(value).split('-');
  if (!year || !month || !day) return String(value);
  return `${day}/${month}/${year}`;
};

const formatPeriodValue = (periodValue) => {
  if (!periodValue) return '-';
  if (typeof periodValue === 'string') return periodValue;
  if (typeof periodValue === 'object') {
    const inicio = toBrDate(periodValue.inicio);
    const fim = toBrDate(periodValue.fim);
    if (inicio && fim) return `${inicio} a ${fim}`;
    if (inicio) return inicio;
    if (fim) return fim;
  }
  return '-';
};

const PortalOrganizadorPage = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const {
    adminMockData,
    getEventById,
    getInvitationById,
    validateInvitationCode,
    createSupplierIndication,
    patchInvitation,
    cancelSupplierIndication
  } = useAppData();

  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);

  const invitation = useMemo(() => {
    const byState = location.state?.invitationId ? getInvitationById(location.state.invitationId) : null;
    if (byState) return byState;

    const code = searchParams.get('codigo');
    if (!code) return null;
    return validateInvitationCode(code);
  }, [location.state?.invitationId, searchParams, getInvitationById, validateInvitationCode]);

  const organizerInvitation = invitation?.inviteType === 'organizer' ? invitation : null;
  const event = organizerInvitation ? getEventById(organizerInvitation.eventId) : null;

  const supplierInvites = useMemo(() => {
    if (!event?.id) return [];
    return (adminMockData.convites || []).filter((item) => item.eventId === event.id && item.inviteType === 'supplier');
  }, [adminMockData.convites, event?.id]);

  const supplierByInvitationId = useMemo(() => {
    const map = new Map();
    (adminMockData.fornecedores || []).forEach((supplier) => {
      if (supplier.invitationId) map.set(supplier.invitationId, supplier);
    });
    return map;
  }, [adminMockData.fornecedores]);

  const indicatedSuppliers = useMemo(() => {
    if (!event?.id) return [];
    return (adminMockData.fornecedores || []).filter((supplier) => {
      if (supplier.eventId !== event.id) return false;
      return supplier.origin === 'indicado_pelo_locatario' || supplier.origem === 'indicado_pelo_locatario';
    });
  }, [adminMockData.fornecedores, event?.id]);

  const tableRows = useMemo(() => {
    return indicatedSuppliers.map((supplier) => {
      const invite = supplierByInvitationId.get(supplier.invitationId)
        || supplierInvites.find((item) => item.supplierId === supplier.id)
        || null;

      return {
        id: supplier.id,
        supplier,
        invite,
        fornecedor: supplier.nome,
        categoria: supplier.categoria,
        responsavel: supplier.responsavel,
        email: supplier.email,
        whatsapp: supplier.whatsapp,
        inviteStatus: invite ? getDisplayStatus(invite) : (supplier.inviteStatus || 'Indicado'),
        cadastroStatus: supplier.registrationStatus || supplier.statusCadastral || 'Aguardando cadastro',
        codigo: invite?.codigo || '-'
      };
    });
  }, [indicatedSuppliers, supplierByInvitationId, supplierInvites]);

  const stats = useMemo(() => {
    const total = tableRows.length;
    const enviados = tableRows.filter((row) => String(getDisplayStatus(row)).toLowerCase() === 'enviado').length;
    const cadastrados = tableRows.filter((row) => row.cadastroStatus !== 'Aguardando cadastro').length;
    const pendencias = tableRows.filter((row) => {
      const st = String(row.cadastroStatus || '').toLowerCase();
      return st.includes('aguardando') || st.includes('correcao') || st.includes('pendente');
    }).length;

    return {
      total,
      enviados,
      cadastrados,
      pendencias
    };
  }, [tableRows]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveIndication = () => {
    if (!event?.id) {
      toast.error('Evento não localizado para gerar o convite.');
      return;
    }

    if (!form.fornecedor.trim() || !form.email.trim() || !form.whatsapp.trim()) {
      toast.error('Preencha nome do fornecedor, e-mail e WhatsApp.');
      return;
    }

    createSupplierIndication(event.id, {
      fornecedor: form.fornecedor.trim(),
      categoria: form.categoria,
      responsavel: form.responsavel.trim(),
      email: form.email.trim(),
      whatsapp: form.whatsapp.trim(),
      observacoes: form.observacoes.trim(),
      status: 'Enviado',
      codigo: createSupplierInviteCode(form.fornecedor)
    });

    toast.success('Convite do fornecedor gerado com sucesso');
    setOpenDialog(false);
    setForm(INITIAL_FORM);
  };

  const ensureInviteCode = (invite) => {
    if (!invite) return '';
    const currentCode = String(invite.codigo || '').trim();
    if (currentCode) return currentCode;

    const generatedCode = createSupplierInviteCode(invite.fornecedor || invite.supplierName || 'FOR');
    const patchedInvite = patchInvitation(invite.id, { codigo: generatedCode });
    return String(patchedInvite?.codigo || generatedCode).trim();
  };

  const copyInviteLink = async (invite) => {
    const code = ensureInviteCode(invite);
    if (!code) {
      toast.error('Não foi possível gerar o código do convite.');
      return;
    }
    await navigator.clipboard.writeText(buildInviteLink(code));
    toast.success('Link do fornecedor copiado.');
  };

  const resendInvite = (invite) => {
    if (!invite) {
      toast.info('Convite ainda não disponível para este fornecedor.');
      return;
    }
    patchInvitation(invite.id, { status: 'Enviado' });
    toast.info(`Convite reenviado para ${invite.email || 'destinatário'}.`);
  };

  const regenerateInviteCode = async (invite) => {
    if (!invite) {
      toast.info('Convite ainda não disponível para este fornecedor.');
      return;
    }

    const newCode = createSupplierInviteCode(invite.fornecedor || invite.supplierName || 'FOR');
    const patched = patchInvitation(invite.id, {
      codigo: newCode,
      used: false,
      status: 'Enviado'
    });

    if (!patched?.codigo) {
      toast.error('Não foi possível regerar o código do convite.');
      return;
    }

    const freshLink = buildInviteLink(patched.codigo);
    if (!freshLink) {
      toast.success(`Novo código gerado: ${patched.codigo}`);
      return;
    }

    try {
      await navigator.clipboard.writeText(freshLink);
      toast.success(`Novo código gerado e link copiado: ${patched.codigo}`);
    } catch {
      toast.success(`Novo código gerado: ${patched.codigo}. Copie o link manualmente.`);
    }
  };

  if (!organizerInvitation || !event) {
    return (
      <>
        <Helmet>
          <title>Portal do Organizador - Expocentro Acesso</title>
        </Helmet>

        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <Card className="w-full max-w-xl border-border shadow-sm">
            <CardHeader>
              <CardTitle>Acesso não autorizado</CardTitle>
              <CardDescription>Este portal é exclusivo para convites do tipo organizador vinculados a um evento.</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-between gap-3">
              <Link to="/">
                <Button variant="outline">Voltar ao início</Button>
              </Link>
              <Link to="/validar-convite">
                <Button>Validar convite</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Portal do Organizador - Expocentro Acesso</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        <header className="bg-primary py-4 px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <Link to="/validar-convite">
              <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <StatusBadge status={event.faseNova || event.faseAtual || 'Cadastro aberto'} className="bg-primary-foreground/10 text-primary-foreground border-primary-foreground/30" />
          </div>
        </header>

        <main className="max-w-7xl mx-auto p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Portal do Organizador</h1>
              <p className="text-sm text-muted-foreground">Gerencie os fornecedores indicados para o evento.</p>
            </div>
            <Button onClick={() => setOpenDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Indicar fornecedor
            </Button>
          </div>

          <Card className="border-border shadow-none">
            <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Nome do evento</p>
                <p className="font-medium text-foreground">{event.nome}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Período do evento</p>
                <p className="font-medium text-foreground">{event.periodo || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Montagem</p>
                <p className="font-medium text-foreground">{formatPeriodValue(event.periodos?.montagem)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Desmontagem</p>
                <p className="font-medium text-foreground">{formatPeriodValue(event.periodos?.desmontagem)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Espaços locados</p>
                <p className="font-medium text-foreground">{event.espacosLocados || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status do credenciamento</p>
                <p className="font-medium text-foreground">{event.faseNova || event.faseAtual || '-'}</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="border-border shadow-none bg-muted/20"><CardContent className="p-3"><p className="text-xs text-muted-foreground">Fornecedores indicados</p><p className="text-xl font-semibold tabular-nums">{stats.total}</p></CardContent></Card>
            <Card className="border-border shadow-none bg-muted/20"><CardContent className="p-3"><p className="text-xs text-muted-foreground">Fornecedores com convite enviado</p><p className="text-xl font-semibold tabular-nums">{stats.enviados}</p></CardContent></Card>
            <Card className="border-border shadow-none bg-muted/20"><CardContent className="p-3"><p className="text-xs text-muted-foreground">Fornecedores cadastrados</p><p className="text-xl font-semibold tabular-nums">{stats.cadastrados}</p></CardContent></Card>
            <Card className="border-border shadow-none bg-muted/20"><CardContent className="p-3"><p className="text-xs text-muted-foreground">Pendências</p><p className="text-xl font-semibold tabular-nums">{stats.pendencias}</p></CardContent></Card>
          </div>

          <Card className="border-border shadow-none">
            <CardHeader>
              <CardTitle>Fornecedores indicados</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Status do convite</TableHead>
                    <TableHead>Status do cadastro</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        Nenhum fornecedor indicado até o momento.
                      </TableCell>
                    </TableRow>
                  ) : tableRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.fornecedor || '-'}</TableCell>
                      <TableCell>{row.categoria || '-'}</TableCell>
                      <TableCell>{row.responsavel || '-'}</TableCell>
                      <TableCell>{row.email || '-'}</TableCell>
                      <TableCell>{row.whatsapp || '-'}</TableCell>
                      <TableCell><StatusBadge status={row.inviteStatus} /></TableCell>
                      <TableCell><StatusBadge status={row.cadastroStatus} /></TableCell>
                      <TableCell className="text-right">
                        <ActionMenu actions={[
                          {
                            label: 'Copiar link do fornecedor',
                            icon: Copy,
                            onClick: () => {
                              if (!row.invite) {
                                toast.info('Convite ainda não disponível.');
                                return;
                              }
                              copyInviteLink(row.invite);
                            }
                          },
                          {
                            label: 'Reenviar convite',
                            icon: Mail,
                            onClick: () => resendInvite(row.invite)
                          },
                          {
                            label: 'Regerar código do convite',
                            icon: RefreshCw,
                            onClick: () => regenerateInviteCode(row.invite)
                          },
                          {
                            label: 'Copiar mensagem WhatsApp',
                            icon: MessageCircle,
                            onClick: async () => {
                              if (!row.invite) {
                                toast.info('Convite ainda não disponível.');
                                return;
                              }
                              const code = ensureInviteCode(row.invite);
                              if (!code) {
                                toast.error('Não foi possível gerar o código do convite.');
                                return;
                              }
                              const msg = `Olá! Seu convite para cadastro de fornecedor é ${code}. Link: ${buildInviteLink(code)}`;
                              await navigator.clipboard.writeText(msg);
                              toast.success('Mensagem de WhatsApp copiada.');
                            }
                          },
                          {
                            label: 'Ver status do cadastro',
                            icon: UserRoundSearch,
                            onClick: () => toast.info(`Status do convite: ${row.inviteStatus} | Status do cadastro: ${row.cadastroStatus}.`)
                          },
                          {
                            label: 'Cancelar indicação',
                            icon: XCircle,
                            onClick: () => {
                              cancelSupplierIndication(row.id);
                              toast.warning('Indicação cancelada com sucesso.');
                            }
                          }
                        ]} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Indicar fornecedor</DialogTitle>
            <DialogDescription>Preencha os dados para indicar um novo fornecedor para este evento.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fornecedor-nome">Nome do fornecedor</Label>
              <Input id="fornecedor-nome" value={form.fornecedor} onChange={(event) => handleChange('fornecedor', event.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fornecedor-categoria">Categoria prevista</Label>
              <select
                id="fornecedor-categoria"
                value={form.categoria}
                onChange={(event) => handleChange('categoria', event.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fornecedor-responsavel">Responsável (opcional)</Label>
              <Input id="fornecedor-responsavel" value={form.responsavel} onChange={(event) => handleChange('responsavel', event.target.value)} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="fornecedor-email">E-mail</Label>
                <Input id="fornecedor-email" type="email" value={form.email} onChange={(event) => handleChange('email', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fornecedor-whatsapp">WhatsApp</Label>
                <Input id="fornecedor-whatsapp" value={form.whatsapp} onChange={(event) => handleChange('whatsapp', event.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fornecedor-observacoes">Observações</Label>
              <Input id="fornecedor-observacoes" value={form.observacoes} onChange={(event) => handleChange('observacoes', event.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveIndication}>Salvar indicação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PortalOrganizadorPage;
