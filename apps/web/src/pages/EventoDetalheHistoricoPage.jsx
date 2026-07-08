
import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { AdminSidebar } from '@/components/Sidebar.jsx';
import Header from '@/components/Header.jsx';
import EventoDetalheLayout from '@/components/EventoDetalheLayout.jsx';
import AdminTable from '@/components/AdminTable.jsx';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAppData } from '@/store/AppDataContext.jsx';
import { Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const EventoDetalheHistoricoPage = () => {
  const { adminMockData } = useAppData();
  const historico = adminMockData.historico;
  const [filters, setFilters] = useState({ data: '', tipo: 'todos', usuario: '', entidade: '' });

  const tipos = [
    'Evento criado',
    'Evento editado',
    'Documento anexado',
    'Convite enviado',
    'Fornecedor aprovado',
    'Pessoa cadastrada',
    'Pessoa aprovada',
    'Pessoa liberada para guarita',
    'Entrada registrada',
    'Saída registrada',
    'Liberação excepcional',
    'Bloqueio'
  ];

  const normalizeAction = (acao) => {
    const text = String(acao || '').toLowerCase();
    if (text.includes('criacao de evento')) return 'Evento criado';
    if (text.includes('edicao de evento')) return 'Evento editado';
    if (text.includes('convite')) return 'Convite enviado';
    if (text.includes('fornecedor') && text.includes('aprov')) return 'Fornecedor aprovado';
    if (text.includes('cadastro de pessoa')) return 'Pessoa cadastrada';
    if (text.includes('aprovacao de pessoa')) return 'Pessoa aprovada';
    if (text.includes('liberacao para guarita')) return 'Pessoa liberada para guarita';
    if (text.includes('registro de entrada')) return 'Entrada registrada';
    if (text.includes('registro de saida')) return 'Saída registrada';
    if (text.includes('solicitacao de acesso')) return 'Liberação excepcional';
    if (text.includes('bloqueio')) return 'Bloqueio';
    return acao;
  };

  const getOrigin = (item) => {
    const usuario = String(item?.usuario || '').toLowerCase();
    if (usuario.includes('fornecedor')) return 'Portal do fornecedor';
    if (usuario.includes('guarita')) return 'Operação de guarita';
    if (usuario.includes('organizador') || usuario.includes('locat')) return 'Portal do organizador';
    if (usuario.includes('admin')) return 'Administração';
    return 'Administração';
  };

  const getRelatedEntity = (item) => {
    const detalhes = String(item?.detalhes || '').toLowerCase();
    if (detalhes.includes('fornecedor')) return 'Fornecedor';
    if (detalhes.includes('pessoa') || detalhes.includes('cpf')) return 'Pessoa';
    if (detalhes.includes('convite')) return 'Convite';
    if (detalhes.includes('guarita') || detalhes.includes('entrada') || detalhes.includes('saída')) return 'Guarita';
    if (detalhes.includes('evento')) return 'Evento';
    return 'Operação do evento';
  };

  const filteredHistory = useMemo(() => {
    return historico.filter((item) => {
      const mappedTipo = normalizeAction(item.acao);
      const matchTipo = filters.tipo === 'todos' || mappedTipo === filters.tipo;
      const matchUsuario = !filters.usuario || String(item.usuario || '').toLowerCase().includes(filters.usuario.toLowerCase());
      const matchEntidade = !filters.entidade || String(item.detalhes || '').toLowerCase().includes(filters.entidade.toLowerCase());
      const matchData = !filters.data || String(item.dataHora || '').includes(filters.data.split('-').reverse().join('/'));
      return matchTipo && matchUsuario && matchEntidade && matchData;
    });
  }, [filters, historico]);

  return (
    <>
      <Helmet>
        <title>Histórico - Detalhes do Evento</title>
      </Helmet>
      
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <EventoDetalheLayout>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">Histórico</h2>
                <p className="text-sm text-muted-foreground">Auditoria cronológica das ações, com origem e entidade relacionada para rastreabilidade.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <Input type="date" value={filters.data} onChange={(event) => setFilters((prev) => ({ ...prev, data: event.target.value }))} />
                <select value={filters.tipo} onChange={(event) => setFilters((prev) => ({ ...prev, tipo: event.target.value }))} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  <option value="todos">Tipo de ação</option>
                  {tipos.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
                </select>
                <Input placeholder="Usuário" value={filters.usuario} onChange={(event) => setFilters((prev) => ({ ...prev, usuario: event.target.value }))} />
                <Input placeholder="Pessoa/fornecedor" value={filters.entidade} onChange={(event) => setFilters((prev) => ({ ...prev, entidade: event.target.value }))} />
              </div>

              <AdminTable>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="w-48">Data/Hora</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Origem</TableHead>
                      <TableHead>Entidade relacionada</TableHead>
                      <TableHead>Usuário Responsável</TableHead>
                      <TableHead>Detalhes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistory.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="tabular-nums text-muted-foreground flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5" /> {log.dataHora}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-muted font-medium">{normalizeAction(log.acao)}</Badge>
                        </TableCell>
                        <TableCell>{getOrigin(log)}</TableCell>
                        <TableCell>{getRelatedEntity(log)}</TableCell>
                        <TableCell className="text-foreground">{log.usuario}</TableCell>
                        <TableCell className="text-muted-foreground">{log.detalhes}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AdminTable>
            </motion.div>
          </EventoDetalheLayout>
        </div>
      </div>
    </>
  );
};

export default EventoDetalheHistoricoPage;
