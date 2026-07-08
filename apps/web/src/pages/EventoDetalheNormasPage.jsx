
import React from 'react';
import { Helmet } from 'react-helmet';
import { useParams } from 'react-router-dom';
import { AdminSidebar } from '@/components/Sidebar.jsx';
import Header from '@/components/Header.jsx';
import EventoDetalheLayout from '@/components/EventoDetalheLayout.jsx';
import AdminTable from '@/components/AdminTable.jsx';
import ActionMenu from '@/components/ActionMenu.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAppData } from '@/store/AppDataContext.jsx';
import { Check, X, FileSignature } from 'lucide-react';
import { motion } from 'framer-motion';

const EventoDetalheNormasPage = () => {
  const { eventoId } = useParams();
  const { adminMockData } = useAppData();
  const normas = adminMockData.normas.filter((nor) => {
    const supplier = adminMockData.fornecedores.find((fornecedor) => fornecedor.id === nor.supplierId);
    return !supplier || supplier.eventId === eventoId;
  });

  const renderAceite = (ok) => (
    ok ? (
      <Badge variant="outline" className="bg-[hsl(var(--status-approved)/0.15)] text-[hsl(var(--status-approved))] border-transparent">
        <Check className="w-3 h-3 mr-1" /> Aceito
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-[hsl(var(--status-blocked)/0.15)] text-[hsl(var(--status-blocked))] border-transparent">
        <X className="w-3 h-3 mr-1" /> Pendente
      </Badge>
    )
  );

  return (
    <>
      <Helmet>
        <title>Normas e Aceites - Detalhes do Evento</title>
      </Helmet>
      
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <EventoDetalheLayout>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">Normas e Aceites</h2>
                <p className="text-sm text-muted-foreground">Aceites de montagem, identificação, EPI e uso de dados por fornecedor.</p>
              </div>

              <AdminTable>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>Normas de montagem</TableHead>
                      <TableHead>Regras de identificação</TableHead>
                      <TableHead>Regras de EPI</TableHead>
                      <TableHead>Autorização de uso de dados</TableHead>
                      <TableHead>Data do Aceite</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {normas.map((nor) => (
                      <TableRow key={nor.id}>
                        <TableCell className="font-medium text-foreground">{nor.fornecedor}</TableCell>
                        <TableCell>{renderAceite(Boolean(nor.aceiteCompleto))}</TableCell>
                        <TableCell>{renderAceite(Boolean(nor.aceiteCompleto))}</TableCell>
                        <TableCell>{renderAceite(Boolean(nor.aceiteCompleto))}</TableCell>
                        <TableCell>{renderAceite(Boolean(nor.aceiteCompleto))}</TableCell>
                        <TableCell className="text-muted-foreground">{nor.dataAceite}</TableCell>
                        <TableCell>{nor.responsavelAceite || 'Responsável do fornecedor'}</TableCell>
                        <TableCell className="text-right">
                          <ActionMenu actions={[
                            { label: 'Ver aceite', icon: FileSignature, onClick: () => {} }
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

export default EventoDetalheNormasPage;
