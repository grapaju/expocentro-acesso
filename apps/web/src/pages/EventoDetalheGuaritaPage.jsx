
import React from 'react';
import { Helmet } from 'react-helmet';
import { AdminSidebar } from '@/components/Sidebar.jsx';
import Header from '@/components/Header.jsx';
import EventoDetalheLayout from '@/components/EventoDetalheLayout.jsx';
import AdminTable from '@/components/AdminTable.jsx';
import StatusBadge from '@/components/StatusBadge.jsx';
import { Badge } from '@/components/ui/badge';
import ActionMenu from '@/components/ActionMenu.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppData } from '@/store/AppDataContext.jsx';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, ShieldBan } from 'lucide-react';
import { toast } from 'sonner';

const EventoDetalheGuaritaPage = () => {
  const { eventoId } = useParams();
  const { people, accessLogs, events, registerEntry, registerExit, blockPerson } = useAppData();

  const evento = (events || []).find((item) => item.id === eventoId);

  const liberadosDoEvento = (people || []).filter((person) => {
    const status = String(person.statusGuarita || '').toLowerCase();
    return person.eventId === eventoId && (status === 'liberado' || status === 'entrou');
  });

  const idsLiberados = new Set(liberadosDoEvento.map((person) => person.id));

  const registrosDoEvento = (accessLogs || []).filter((log) => {
    const tipo = String(log.tipo || '').toLowerCase();
    const isMov = tipo === 'entrada' || tipo === 'saida' || tipo === 'saída';
    if (!isMov) return false;

    if (log.eventId) return log.eventId === eventoId;
    if (log.personId) return idsLiberados.has(log.personId);
    return String(log.evento || '') === String(evento?.nome || '');
  });

  const maskCpf = (cpf) => {
    const digits = String(cpf || '').replace(/\D/g, '');
    if (digits.length < 11) return cpf;
    return `***.***.***-${digits.slice(-2)}`;
  };

  return (
    <>
      <Helmet>
        <title>Guarita - Detalhes do Evento</title>
      </Helmet>
      
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <EventoDetalheLayout>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">Lista da Guarita</h2>
                <p className="text-sm text-muted-foreground">Pessoas autorizadas para entrada neste evento e registros de movimentação.</p>
              </div>

              <AdminTable>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="w-16">Foto</TableHead>
                      <TableHead>Pessoa</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Fornecedor / Função</TableHead>
                      <TableHead>Tipo de Acesso</TableHead>
                      <TableHead>Período autorizado</TableHead>
                      <TableHead>Status de Guarita</TableHead>
                      <TableHead>Última movimentação</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {liberadosDoEvento.map((person) => (
                      <TableRow key={person.id}>
                        <TableCell>
                          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-sm">
                            {person.iniciais || String(person.nome || '').charAt(0)}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-foreground">{person.nome}</TableCell>
                        <TableCell className="tabular-nums text-muted-foreground">{maskCpf(person.cpf)}</TableCell>
                        <TableCell>
                          <p>{person.fornecedor}</p>
                          <p className="text-xs text-muted-foreground">{person.funcao}</p>
                        </TableCell>
                        <TableCell>{person.tipoAcesso}</TableCell>
                        <TableCell>{person.periodoSolicitado || '-'}</TableCell>
                        <TableCell><StatusBadge status={person.statusGuarita || person.status} /></TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {registrosDoEvento.find((log) => log.personId === person.id)?.dataHora || 'Sem registro'}
                        </TableCell>
                        <TableCell className="text-right">
                          <ActionMenu actions={[
                            { label: 'Ver detalhes', icon: Eye, onClick: () => toast.info('Use a Central da Guarita para detalhes completos da pessoa.') },
                            { label: 'Registrar entrada', icon: Eye, onClick: () => { registerEntry(person.id); toast.success('Entrada registrada.'); } },
                            { label: 'Registrar saída', icon: Eye, onClick: () => { registerExit(person.id); toast.success('Saída registrada.'); } },
                            { label: 'Ver histórico de acesso', icon: Eye, onClick: () => toast.info('Consulte os registros abaixo para histórico de acesso.') },
                            { label: 'Bloquear', icon: ShieldBan, destructive: true, onClick: () => { blockPerson(person.id); toast.error('Pessoa bloqueada.'); } }
                          ]} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AdminTable>

              <div className="rounded-lg border border-border p-4 bg-muted/20">
                <p className="text-sm font-medium text-foreground mb-2">Registros de movimentação</p>
                <div className="flex flex-wrap gap-2">
                  {registrosDoEvento.map((log) => (
                    <Badge key={log.id} variant="outline">{log.pessoa} • {log.tipo} • {log.dataHora}</Badge>
                  ))}
                </div>
              </div>
            </motion.div>
          </EventoDetalheLayout>
        </div>
      </div>
    </>
  );
};

export default EventoDetalheGuaritaPage;
