import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminSidebar } from '@/components/Sidebar.jsx';
import Header from '@/components/Header.jsx';
import EventoDetalheLayout from '@/components/EventoDetalheLayout.jsx';
import AdminTable from '@/components/AdminTable.jsx';
import StatusBadge from '@/components/StatusBadge.jsx';
import ActionMenu from '@/components/ActionMenu.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppData } from '@/store/AppDataContext.jsx';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Mail, Plus, MessageCircle, UserRoundSearch, XCircle, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const INITIAL_FORM = {
  fornecedor: '',
  email: '',
  whatsapp: '',
  categoria: 'Montadora',
  validade: '',
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

const toBrDate = (isoDate) => {
  if (!isoDate) return '-';
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) return '-';
  return `${day}/${month}/${year}`;
};

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

const createInviteCode = (name, suffix = 'FOR') => {
  const prefix = String(name || 'INV')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 4) || 'INV';

  return `${prefix}-${suffix}-${Math.floor(100 + Math.random() * 900)}`;
};

const getDisplayStatus = (invite) => {
  const status = String(invite?.status || '').toLowerCase();
  if (status === 'cancelado' || status === 'usado' || status === 'expirado') return invite.status;
  if (isExpired(invite?.validade)) return 'Expirado';
  return invite?.status || 'Criado';
};

const buildInviteLink = (code) => {
  if (!code) return '';
  const base = window.location.origin;
  return `${base}/validar-convite?codigo=${encodeURIComponent(code)}`;
};

const EventoDetalheConvitesPage = () => {
  const navigate = useNavigate();
  const { eventoId } = useParams();
  const {
    adminMockData,
    getEventById,
    createInvitation,
    createOrganizerInvitation,
    patchInvitation,
    updateInvitationStatus
  } = useAppData();
  const [openDialog, setOpenDialog] = useState(false);
  const [newInviteForm, setNewInviteForm] = useState(INITIAL_FORM);
  const evento = getEventById(eventoId);

  const convitesEvento = useMemo(() => {
    return adminMockData.convites
      .filter((item) => item.eventId === eventoId);
  }, [adminMockData.convites, eventoId]);

  const conviteOrganizador = useMemo(
    () => convitesEvento.find((item) => item.inviteType === 'organizer') || null,
    [convitesEvento]
  );

  const convitesFornecedores = useMemo(
    () => convitesEvento.filter((item) => item.inviteType !== 'organizer'),
    [convitesEvento]
  );

  const supplierByInvitationId = useMemo(() => {
    const map = new Map();
    (adminMockData.fornecedores || []).forEach((supplier) => {
      if (supplier.invitationId) map.set(supplier.invitationId, supplier);
    });
    return map;
  }, [adminMockData.fornecedores]);

  const handleChangeForm = (field, value) => {
    setNewInviteForm((prev) => ({ ...prev, [field]: value }));
  };

  const openCreateDialog = () => {
    setNewInviteForm(INITIAL_FORM);
    setOpenDialog(true);
  };

  const handleSubmitInvite = () => {
    const fornecedor = newInviteForm.fornecedor.trim() || 'Fornecedor a definir';
    const email = newInviteForm.email.trim();

    if (!email || !newInviteForm.validade) {
      toast.error('Preencha e-mail e validade para gerar o convite.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Informe um e-mail valido.');
      return;
    }

    createInvitation(eventoId, {
      inviteType: 'supplier',
      origem: 'administracao',
      fornecedor,
      email,
      whatsapp: newInviteForm.whatsapp.trim(),
      categoria: newInviteForm.categoria,
      codigo: createInviteCode(fornecedor),
      validade: toBrDate(newInviteForm.validade),
      status: 'Criado',
      observacoes: newInviteForm.observacoes.trim()
    });
    toast.success('Convite de fornecedor gerado com sucesso.');

    setOpenDialog(false);
    setNewInviteForm(INITIAL_FORM);
  };

  const sendInvite = (invite) => {
    patchInvitation(invite.id, { status: 'Enviado' });
    toast.success('Convite enviado com sucesso.');
  };

  const resendInvite = (invite) => {
    patchInvitation(invite.id, { status: 'Enviado' });
    toast.info(`Convite reenviado para ${invite.email || 'destinatário'}.`);
  };

  const copyInviteLink = async (invite) => {
    await navigator.clipboard.writeText(buildInviteLink(invite.codigo));
    toast.success('Link do convite copiado.');
  };

  const copyWhatsappMessage = async (invite) => {
    const destinationText = invite.inviteType === 'organizer'
      ? 'Acessar Portal do Organizador'
      : 'Continuar cadastro de fornecedor';
    const msg = `Olá! Seu convite para o evento ${evento?.nome || ''} é ${invite.codigo}. Validade: ${invite.validade}. Link: ${buildInviteLink(invite.codigo)} | Ação: ${destinationText}.`;
    await navigator.clipboard.writeText(msg);
    toast.success('Mensagem de WhatsApp copiada.');
  };

  const ensureAndSendOrganizerInvite = () => {
    const currentInvite = conviteOrganizador || createOrganizerInvitation(eventoId, {
      organizador: evento?.organizador || 'Locatário/Organizador',
      responsavel: '',
      status: 'Criado',
      codigo: createInviteCode(evento?.organizador || 'ORG', 'ORG')
    });

    if (!currentInvite) {
      toast.error('Não foi possível criar o convite do organizador.');
      return;
    }

    patchInvitation(currentInvite.id, { status: 'Enviado' });
    toast.success('Convite do locatário/organizador enviado.');
  };

  const openOrganizerPortal = () => {
    if (!conviteOrganizador) {
      toast.info('Envie o convite do organizador antes de acessar o portal.');
      return;
    }

    navigate('/portal-organizador', {
      state: {
        invitationId: conviteOrganizador.id
      }
    });
  };

  return (
    <>
      <Helmet>
        <title>Convites - Detalhes do Evento</title>
      </Helmet>

      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <EventoDetalheLayout>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Convites</h2>
                  <p className="text-sm text-muted-foreground">Gerencie os acessos do locatário e dos fornecedores.</p>
                </div>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={openCreateDialog}>
                  <Plus className="w-4 h-4 mr-2" /> Novo convite de fornecedor
                </Button>
              </div>

              <Card className="border-border shadow-none">
                <CardContent className="p-4 space-y-4">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Locatário</h3>
                  </div>
                  <AdminTable>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead>Locatário</TableHead>
                          <TableHead>Contato</TableHead>
                          <TableHead>Convite</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">{conviteOrganizador?.organizador || evento?.organizador || 'Locatário/Organizador não vinculado'}</TableCell>
                          <TableCell>
                            <div className="space-y-1 text-xs leading-tight">
                              <p className="text-foreground"><span className="text-muted-foreground">Resp:</span> {conviteOrganizador?.responsavel || '-'}</p>
                              <p className="text-muted-foreground break-all"><span>E-mail:</span> {conviteOrganizador?.email || '-'}</p>
                              <p className="text-muted-foreground"><span>WhatsApp:</span> {conviteOrganizador?.whatsapp || '-'}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {conviteOrganizador?.codigo ? (
                              <span className="font-mono text-xs text-foreground">{conviteOrganizador.codigo}</span>
                            ) : (
                              <Badge variant="outline">Aguardando envio</Badge>
                            )}
                          </TableCell>
                          <TableCell><StatusBadge status={conviteOrganizador ? getDisplayStatus(conviteOrganizador) : 'Criado'} /></TableCell>
                          <TableCell className="text-right">
                            <ActionMenu actions={[
                              {
                                label: 'Ver detalhes',
                                icon: UserRoundSearch,
                                onClick: () => toast.info(`Código: ${conviteOrganizador?.codigo || '-'} | Validade: ${conviteOrganizador?.validade || '-'}`)
                              },
                              { label: 'Enviar convite', icon: Mail, onClick: () => ensureAndSendOrganizerInvite() },
                              {
                                label: 'Copiar link',
                                icon: Copy,
                                onClick: async () => {
                                  if (!conviteOrganizador) {
                                    toast.info('Envie o convite para gerar o link.');
                                    return;
                                  }
                                  await copyInviteLink(conviteOrganizador);
                                }
                              },
                              {
                                label: 'Copiar mensagem WhatsApp',
                                icon: MessageCircle,
                                onClick: async () => {
                                  if (!conviteOrganizador) {
                                    toast.info('Envie o convite para gerar a mensagem.');
                                    return;
                                  }
                                  await copyWhatsappMessage(conviteOrganizador);
                                }
                              },
                              {
                                label: 'Reenviar convite',
                                icon: Mail,
                                onClick: () => {
                                  if (!conviteOrganizador) {
                                    ensureAndSendOrganizerInvite();
                                    return;
                                  }
                                  resendInvite(conviteOrganizador);
                                }
                              },
                              {
                                label: 'Cancelar convite',
                                icon: XCircle,
                                destructive: true,
                                onClick: () => {
                                  if (!conviteOrganizador) {
                                    toast.info('Nenhum convite do organizador para cancelar.');
                                    return;
                                  }
                                  updateInvitationStatus(conviteOrganizador.id, 'Cancelado');
                                  toast.warning('Convite cancelado.');
                                }
                              },
                              {
                                label: 'Acessar portal do organizador',
                                icon: ExternalLink,
                                onClick: openOrganizerPortal
                              }
                            ]} />
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </AdminTable>
                </CardContent>
              </Card>

              <Card className="border-border shadow-none">
                <CardContent className="p-4 space-y-4">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Fornecedores convidados</h3>
                  </div>
                  <AdminTable>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead>Fornecedor</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Contato</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {convitesFornecedores.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                              Nenhum convite de fornecedor foi criado para este evento.
                            </TableCell>
                          </TableRow>
                        ) : convitesFornecedores.map((inv) => (
                          <TableRow key={inv.id}>
                            <TableCell className="font-medium">{inv.fornecedor || inv.supplierName || '-'}</TableCell>
                            <TableCell>{inv.categoria || '-'}</TableCell>
                            <TableCell>
                              <div className="space-y-1 text-xs leading-tight">
                                <p className="text-foreground"><span className="text-muted-foreground">Resp:</span> {inv.responsavel || '-'}</p>
                                <p className="text-muted-foreground break-all"><span>E-mail:</span> {inv.email || inv.supplierEmail || '-'}</p>
                                <p className="text-muted-foreground"><span>WhatsApp:</span> {inv.whatsapp || inv.supplierWhatsapp || '-'}</p>
                              </div>
                            </TableCell>
                            <TableCell><StatusBadge status={getDisplayStatus(inv)} /></TableCell>
                            <TableCell className="text-right">
                              <ActionMenu actions={[
                                {
                                  label: 'Ver detalhes',
                                  icon: UserRoundSearch,
                                  onClick: () => toast.info(`Código: ${inv.codigo || '-'} | Validade: ${inv.validade || '-'} | Origem: ${inv.origem === 'indicado_pelo_locatario' ? 'Indicado pelo locatário' : 'Criado pela administração'}`)
                                },
                                { label: 'Copiar link', icon: Copy, onClick: () => copyInviteLink(inv) },
                                { label: 'Copiar mensagem WhatsApp', icon: MessageCircle, onClick: () => copyWhatsappMessage(inv) },
                                { label: 'Reenviar convite', icon: Mail, onClick: () => resendInvite(inv) },
                                {
                                  label: 'Cancelar convite',
                                  icon: XCircle,
                                  destructive: true,
                                  onClick: () => {
                                    updateInvitationStatus(inv.id, 'Cancelado');
                                    toast.warning('Convite cancelado.');
                                  }
                                },
                                {
                                  label: 'Ver cadastro do fornecedor',
                                  icon: UserRoundSearch,
                                  onClick: () => {
                                    const supplier = supplierByInvitationId.get(inv.id);
                                    if (!supplier) {
                                      toast.info('Fornecedor ainda não concluiu o cadastro.');
                                      return;
                                    }
                                    navigate(`/admin/eventos/${eventoId}/fornecedores`);
                                  }
                                }
                              ]} />
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

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar convite de fornecedor</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar um convite de fornecedor para este evento.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="convite-fornecedor">Nome do fornecedor (opcional)</Label>
              <Input
                id="convite-fornecedor"
                value={newInviteForm.fornecedor}
                onChange={(event) => handleChangeForm('fornecedor', event.target.value)}
                placeholder="Ex.: Seguranca Total Ltda"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="convite-email">E-mail</Label>
                <Input
                  id="convite-email"
                  type="email"
                  value={newInviteForm.email}
                  onChange={(event) => handleChangeForm('email', event.target.value)}
                  placeholder="contato@empresa.com.br"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="convite-whatsapp">WhatsApp</Label>
                <Input
                  id="convite-whatsapp"
                  value={newInviteForm.whatsapp}
                  onChange={(event) => handleChangeForm('whatsapp', event.target.value)}
                  placeholder="(47) 99999-9999"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="convite-categoria">Categoria prevista</Label>
                <select
                  id="convite-categoria"
                  value={newInviteForm.categoria}
                  onChange={(event) => handleChangeForm('categoria', event.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="convite-validade">Validade</Label>
                <Input
                  id="convite-validade"
                  type="date"
                  value={newInviteForm.validade}
                  onChange={(event) => handleChangeForm('validade', event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="convite-observacoes">Observações</Label>
              <Input
                id="convite-observacoes"
                value={newInviteForm.observacoes}
                onChange={(event) => handleChangeForm('observacoes', event.target.value)}
                placeholder="Mensagem interna para o convite"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>Cancelar</Button>
            <Button onClick={handleSubmitInvite}>Gerar convite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EventoDetalheConvitesPage;
