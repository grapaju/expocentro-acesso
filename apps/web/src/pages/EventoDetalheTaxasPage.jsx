
import React from 'react';
import { Helmet } from 'react-helmet';
import { useParams } from 'react-router-dom';
import { AdminSidebar } from '@/components/Sidebar.jsx';
import Header from '@/components/Header.jsx';
import EventoDetalheLayout from '@/components/EventoDetalheLayout.jsx';
import AdminTable from '@/components/AdminTable.jsx';
import StatusBadge from '@/components/StatusBadge.jsx';
import ActionMenu from '@/components/ActionMenu.jsx';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppData } from '@/store/AppDataContext.jsx';
import { DollarSign, FileText, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const parseMoney = (value) => Number(String(value || '').replace(/[^\d,.-]/g, '').replace('.', '').replace(',', '.')) || 0;
const formatMoney = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

const EventoDetalheTaxasPage = () => {
  const { eventoId } = useParams();
  const { adminMockData } = useAppData();
  const taxas = adminMockData.taxas.filter((item) => item.eventId === eventoId);
  const evento = adminMockData.eventos.find((item) => item.id === eventoId);

  const totalPrevisto = taxas.reduce((sum, item) => sum + parseMoney(item.valor), 0);
  const totalRecebido = taxas.filter((item) => String(item.status || '').toLowerCase() === 'paga').reduce((sum, item) => sum + parseMoney(item.valor), 0);
  const totalPendente = Math.max(totalPrevisto - totalRecebido, 0);
  const totalIsencoes = taxas.filter((item) => String(item.status || '').toLowerCase() === 'isento').length;

  return (
    <>
      <Helmet>
        <title>Taxas - Detalhes do Evento</title>
      </Helmet>
      
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <EventoDetalheLayout>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">Taxas de Credenciamento</h2>
                <p className="text-sm text-muted-foreground">Controle financeiro das empresas participantes.</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                <Card className="border-border bg-muted/20 shadow-none"><CardContent className="p-3"><p className="text-xs text-muted-foreground">Regra de cobrança</p><p className="text-sm font-semibold">{evento?.regraTaxa || 'nao_definida'}</p></CardContent></Card>
                <Card className="border-border bg-muted/20 shadow-none"><CardContent className="p-3"><p className="text-xs text-muted-foreground">Bloqueia guarita</p><p className="text-sm font-semibold">{evento?.regraTaxa === 'isento' ? 'Nao' : 'Sim'}</p></CardContent></Card>
                <Card className="border-border bg-muted/20 shadow-none"><CardContent className="p-3"><p className="text-xs text-muted-foreground">Total previsto</p><p className="text-sm font-semibold tabular-nums">{formatMoney(totalPrevisto)}</p></CardContent></Card>
                <Card className="border-border bg-muted/20 shadow-none"><CardContent className="p-3"><p className="text-xs text-muted-foreground">Total recebido</p><p className="text-sm font-semibold tabular-nums">{formatMoney(totalRecebido)}</p></CardContent></Card>
                <Card className="border-border bg-muted/20 shadow-none"><CardContent className="p-3"><p className="text-xs text-muted-foreground">Total pendente</p><p className="text-sm font-semibold tabular-nums">{formatMoney(totalPendente)}</p></CardContent></Card>
                <Card className="border-border bg-muted/20 shadow-none"><CardContent className="p-3"><p className="text-xs text-muted-foreground">Isencoes</p><p className="text-sm font-semibold tabular-nums">{totalIsencoes}</p></CardContent></Card>
              </div>

              <AdminTable>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taxas.map((tax) => (
                      <TableRow key={tax.id}>
                        <TableCell className="font-medium text-foreground">{tax.fornecedor}</TableCell>
                        <TableCell className="tabular-nums">{tax.valor}</TableCell>
                        <TableCell>{tax.vencimento}</TableCell>
                        <TableCell><StatusBadge status={tax.status} /></TableCell>
                        <TableCell className="text-right">
                          <ActionMenu actions={[
                            { label: 'Marcar como pago', icon: DollarSign, onClick: () => toast.success('Pagamento marcado como recebido (simulação).') },
                            { label: 'Marcar como isento', icon: Wallet, onClick: () => toast.success('Registro marcado como isento (simulação).') },
                            { label: 'Ver comprovante', icon: FileText, onClick: () => toast.info('Visualização de comprovante em implantação.') },
                            { label: 'Solicitar pagamento', icon: FileText, onClick: () => toast.info('Solicitação de pagamento reenviada ao fornecedor.') }
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
    </>
  );
};

export default EventoDetalheTaxasPage;
