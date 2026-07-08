
import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { AdminSidebar } from '@/components/Sidebar.jsx';
import Header from '@/components/Header.jsx';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import FilterCardGroup from '@/components/FilterCardGroup.jsx';
import AdminTable from '@/components/AdminTable.jsx';
import StatusBadge from '@/components/StatusBadge.jsx';
import ActionMenu from '@/components/ActionMenu.jsx';
import ConfirmDialog from '@/components/ConfirmDialog.jsx';
import EventFormWizardDialog from '@/components/EventFormWizardDialog.jsx';
import { useAppData } from '@/store/AppDataContext.jsx';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const PHASE_OPTIONS = ['Cadastro aberto', 'Em análise', 'Lista liberada', 'Cadastro encerrado'];

const EventosControlePage = () => {
  const navigate = useNavigate();
  const { events, createEvent, updateEvent, updateEventStatus } = useAppData();
  const [activeFilter, setActiveFilter] = useState('all');
  const [openNewEventDialog, setOpenNewEventDialog] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [eventToDelete, setEventToDelete] = useState(null);

  const openCreateDialog = () => {
    setEditingEventId(null);
    setOpenNewEventDialog(true);
  };

  const openEditDialog = (evento) => {
    setEditingEventId(evento.id);
    setOpenNewEventDialog(true);
  };

  const handleSubmitEvent = (payload) => {
    if (editingEventId) {
      updateEvent(editingEventId, payload);
      toast.success('Evento atualizado com sucesso.');
    } else {
      createEvent(payload);
      toast.success('Novo evento criado com sucesso.');
    }

    setOpenNewEventDialog(false);
    setEditingEventId(null);
  };

  const handleDeleteEvent = () => {
    if (!eventToDelete) return;

    updateEventStatus(eventToDelete.id, 'Inativo');
    toast.success('Evento desativado com sucesso.');
    setEventToDelete(null);
  };

  const eventosAdaptados = useMemo(() => {
    return (events || []).map((evt) => ({
      ...evt,
      faseNova: PHASE_OPTIONS.includes(evt.faseNova)
        ? evt.faseNova
        : (PHASE_OPTIONS.includes(evt.faseAtual) ? evt.faseAtual : 'Cadastro aberto')
    }));
  }, [events]);

  const filters = [
    { id: 'all', label: 'Todos os eventos', count: eventosAdaptados.length },
    { id: 'Cadastro aberto', label: 'Cadastro aberto', count: eventosAdaptados.filter(e => e.faseNova === 'Cadastro aberto').length },
    { id: 'Em análise', label: 'Em análise', count: eventosAdaptados.filter(e => e.faseNova === 'Em análise').length },
    { id: 'Lista liberada', label: 'Lista liberada', count: eventosAdaptados.filter(e => e.faseNova === 'Lista liberada').length },
    { id: 'Cadastro encerrado', label: 'Cadastro encerrado', count: eventosAdaptados.filter(e => e.faseNova === 'Cadastro encerrado').length }
  ];

  const filteredEvents = activeFilter === 'all' 
    ? eventosAdaptados 
    : eventosAdaptados.filter(e => e.faseNova === activeFilter);

  return (
    <>
      <Helmet>
        <title>Controle de Eventos - Expocentro Acesso</title>
      </Helmet>

      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col">
          <Header />
          
          <main className="flex-1 p-6 md:p-8">
            <div className="max-w-[1600px] mx-auto">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Eventos com Controle de Acesso</h1>
                  <p className="text-muted-foreground mt-1">Gerencie os eventos e suas fases de credenciamento.</p>
                </div>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={openCreateDialog}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Evento
                </Button>
              </div>

              <FilterCardGroup 
                filters={filters} 
                activeFilter={activeFilter} 
                onSelect={setActiveFilter} 
              />

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                <AdminTable>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead>Evento</TableHead>
                        <TableHead>Organizador/Locatário</TableHead>
                        <TableHead>Período</TableHead>
                        <TableHead className="w-[150px]">Fase Atual</TableHead>
                        <TableHead className="text-center">Cadastros</TableHead>
                        <TableHead className="text-center">Liberados</TableHead>
                        <TableHead className="text-center">Pendências</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEvents.map((evt) => (
                        <TableRow key={evt.id} className="hover:bg-muted/10 transition-colors group">
                          <TableCell className="font-semibold text-foreground">{evt.nome}</TableCell>
                          <TableCell className="text-muted-foreground">{evt.organizador}</TableCell>
                          <TableCell className="text-muted-foreground">{evt.periodo}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            <span className="inline-flex whitespace-nowrap bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs font-medium border border-primary/20">
                              {evt.faseNova}
                            </span>
                          </TableCell>
                          <TableCell className="text-center tabular-nums">{evt.pessoasCadastradas}</TableCell>
                          <TableCell className="text-center tabular-nums text-[hsl(var(--status-approved))] font-medium">{evt.pessoasLiberadas}</TableCell>
                          <TableCell className="text-center tabular-nums text-accent font-medium">{evt.pendencias}</TableCell>
                          <TableCell>
                            <StatusBadge status={evt.status} />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="transition-all duration-200"
                                onClick={() => navigate(`/admin/eventos/${evt.id}/convites`)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Ver controle
                              </Button>

                              <ActionMenu
                                actions={[
                                  { label: 'Editar evento', icon: Pencil, onClick: () => openEditDialog(evt) },
                                  { label: 'Excluir evento', icon: Trash2, destructive: true, onClick: () => setEventToDelete(evt) }
                                ]}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </AdminTable>
              </motion.div>
            </div>
          </main>
        </div>
      </div>

      <EventFormWizardDialog
        open={openNewEventDialog}
        onOpenChange={setOpenNewEventDialog}
        onSubmit={handleSubmitEvent}
        initialValues={editingEventId ? (events || []).find((evt) => evt.id === editingEventId) : null}
        title={editingEventId ? 'Editar evento' : 'Criar novo evento'}
        description="Cadastre ou atualize o evento em quatro etapas orientadas."
      />

      <ConfirmDialog
        isOpen={Boolean(eventToDelete)}
        onClose={() => setEventToDelete(null)}
        onConfirm={handleDeleteEvent}
        title="Excluir evento"
        description={`Tem certeza que deseja desativar o evento ${eventToDelete?.nome || ''}?`}
        confirmText="Excluir"
        cancelText="Cancelar"
        destructive
      />
    </>
  );
};

export default EventosControlePage;
