import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useParams } from 'react-router-dom';
import { AdminSidebar } from '@/components/Sidebar.jsx';
import Header from '@/components/Header.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import StatusBadge from '@/components/StatusBadge.jsx';
import { useAppData } from '@/store/AppDataContext.jsx';

const FornecedorParceiroDetalhePage = () => {
  const { parceiroId } = useParams();
  const { partnerSuppliers, suppliers, people, events, history } = useAppData();

  const parceiro = useMemo(
    () => (partnerSuppliers || []).find((item) => item.id === parceiroId) || null,
    [partnerSuppliers, parceiroId]
  );

  const fornecedoresNoEvento = useMemo(
    () => (suppliers || []).filter((item) => item.partnerSupplierId === parceiroId),
    [suppliers, parceiroId]
  );

  const equipeEvento = useMemo(() => {
    const supplierIds = new Set(fornecedoresNoEvento.map((item) => item.id));
    return (people || []).filter((person) => supplierIds.has(person.supplierId));
  }, [fornecedoresNoEvento, people]);

  const eventosVinculados = useMemo(() => {
    const base = parceiro?.eventosVinculados || [];
    if (base.length > 0) return base;

    return fornecedoresNoEvento.map((supplier) => {
      const event = (events || []).find((evt) => evt.id === supplier.eventId);
      return {
        eventId: supplier.eventId,
        eventName: event?.nome || supplier.eventId,
        status: supplier.statusCadastral || supplier.registrationStatus || 'Aguardando confirmação',
        source: supplier.source || supplier.origem || '-'
      };
    });
  }, [parceiro?.eventosVinculados, fornecedoresNoEvento, events]);

  const historicoConsolidado = useMemo(() => {
    const localHistory = parceiro?.historico || [];
    const global = (history || []).filter((item) => String(item.detalhes || '').toLowerCase().includes(String(parceiro?.nome || '').toLowerCase()));
    return [...localHistory, ...global].slice(0, 30);
  }, [parceiro?.historico, history, parceiro?.nome]);

  if (!parceiro) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-xl border-border">
          <CardHeader>
            <CardTitle>Fornecedor parceiro não encontrado</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Link to="/admin/fornecedores-parceiros"><Button>Voltar para listagem</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{parceiro.nome} - Fornecedor Parceiro</title>
      </Helmet>

      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <Header />

          <main className="flex-1 p-6 md:p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="page-title">{parceiro.nome}</h1>
                  <p className="page-subtitle">Visão completa de cadastro, vínculos e histórico operacional do fornecedor parceiro.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{parceiro.categoria}</Badge>
                  <Badge variant="outline">{parceiro.classificacao}</Badge>
                  <StatusBadge status={parceiro.statusAdministrativo} />
                </div>
              </div>

              <Tabs defaultValue="dados" className="w-full">
                <TabsList>
                  <TabsTrigger value="dados">Dados</TabsTrigger>
                  <TabsTrigger value="equipe">Equipe cadastrada</TabsTrigger>
                  <TabsTrigger value="eventos">Eventos vinculados</TabsTrigger>
                  <TabsTrigger value="documentos">Documentos</TabsTrigger>
                  <TabsTrigger value="historico">Histórico</TabsTrigger>
                </TabsList>

                <TabsContent value="dados" className="space-y-4 mt-4">
                  <Card className="border-border">
                    <CardHeader><CardTitle className="text-base">Dados cadastrais</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div><p className="text-muted-foreground">Razão social</p><p className="font-medium">{parceiro.razaoSocial || '-'}</p></div>
                      <div><p className="text-muted-foreground">Nome fantasia</p><p className="font-medium">{parceiro.nomeFantasia || '-'}</p></div>
                      <div><p className="text-muted-foreground">CNPJ/CPF</p><p className="font-medium">{parceiro.cnpjCpf || '-'}</p></div>
                      <div><p className="text-muted-foreground">Responsável</p><p className="font-medium">{parceiro.responsavel || '-'}</p></div>
                      <div><p className="text-muted-foreground">Cargo/Função</p><p className="font-medium">{parceiro.cargoResponsavel || '-'}</p></div>
                      <div><p className="text-muted-foreground">E-mail</p><p className="font-medium break-all">{parceiro.email || '-'}</p></div>
                      <div><p className="text-muted-foreground">WhatsApp</p><p className="font-medium">{parceiro.whatsapp || '-'}</p></div>
                      <div><p className="text-muted-foreground">Classificação administrativa</p><p className="font-medium">{parceiro.classificacao}</p></div>
                      <div><p className="text-muted-foreground">Status</p><p className="font-medium">{parceiro.statusAdministrativo}</p></div>
                    </CardContent>
                  </Card>

                  <Card className="border-border">
                    <CardHeader><CardTitle className="text-base">Dados operacionais</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p><span className="text-muted-foreground">Serviços prestados:</span> {parceiro.servicosPrestados || '-'}</p>
                      <p><span className="text-muted-foreground">Observações:</span> {parceiro.observacoes || '-'}</p>
                      <p><span className="text-muted-foreground">Pode atuar:</span> {parceiro.podeMontagem ? 'Montagem ' : ''}{parceiro.podeEvento ? '| Evento ' : ''}{parceiro.podeDesmontagem ? '| Desmontagem' : ''}</p>
                      <p><span className="text-muted-foreground">Exige aprovação a cada evento:</span> {parceiro.exigeAprovacaoCadaEvento ? 'Sim' : 'Não'}</p>
                      <p><span className="text-muted-foreground">Exige aceite de normas a cada evento:</span> {parceiro.exigeAceiteNormasCadaEvento ? 'Sim' : 'Não'}</p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="equipe" className="mt-4">
                  <Card className="border-border">
                    <CardHeader><CardTitle className="text-base">Pessoas/equipe já cadastradas</CardTitle></CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>CPF</TableHead>
                            <TableHead>Função</TableHead>
                            <TableHead>Status no evento</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(parceiro.equipeBase || []).length === 0 && equipeEvento.length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">Sem equipe cadastrada.</TableCell></TableRow>
                          ) : (
                            [...(parceiro.equipeBase || []), ...equipeEvento].map((person) => (
                              <TableRow key={person.id}>
                                <TableCell className="font-medium">{person.nome || person.name}</TableCell>
                                <TableCell>{person.cpf || '-'}</TableCell>
                                <TableCell>{person.funcao || person.role || '-'}</TableCell>
                                <TableCell><StatusBadge status={person.status || 'Base geral'} /></TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="eventos" className="mt-4">
                  <Card className="border-border">
                    <CardHeader><CardTitle className="text-base">Eventos vinculados</CardTitle></CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Evento</TableHead>
                            <TableHead>Status cadastral</TableHead>
                            <TableHead>Origem</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {eventosVinculados.length === 0 ? (
                            <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">Nenhum vínculo registrado.</TableCell></TableRow>
                          ) : eventosVinculados.map((item) => (
                            <TableRow key={`${item.eventId}-${item.eventName}`}>
                              <TableCell className="font-medium">{item.eventName}</TableCell>
                              <TableCell><StatusBadge status={item.status} /></TableCell>
                              <TableCell>{item.source}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="documentos" className="mt-4">
                  <Card className="border-border">
                    <CardHeader><CardTitle className="text-base">Documentos</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <p><span className="text-muted-foreground">Validade dos documentos:</span> {parceiro.validadeDocumentos || '-'}</p>
                        <p><span className="text-muted-foreground">Observações:</span> {parceiro.observacoesDocumentos || '-'}</p>
                      </div>

                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Documento</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(parceiro.documentos || []).length === 0 ? (
                            <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">Nenhum documento cadastrado.</TableCell></TableRow>
                          ) : (parceiro.documentos || []).map((doc) => (
                            <TableRow key={doc.id}>
                              <TableCell className="font-medium">{doc.tipo}</TableCell>
                              <TableCell>{doc.nome}</TableCell>
                              <TableCell><StatusBadge status={doc.status || 'Pendente'} /></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="historico" className="mt-4" id="historico">
                  <Card className="border-border">
                    <CardHeader><CardTitle className="text-base">Histórico</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      {historicoConsolidado.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Sem histórico registrado.</p>
                      ) : historicoConsolidado.map((item, index) => (
                        <div key={`${item.id || 'hist'}-${index}`} className="rounded-md border border-border p-3">
                          <p className="text-sm font-medium text-foreground">{item.acao || 'Registro'}</p>
                          <p className="text-xs text-muted-foreground mt-1">{item.dataHora || '-'} • {item.usuario || 'Sistema'}</p>
                          <p className="text-sm text-muted-foreground mt-2">{item.detalhes || '-'}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default FornecedorParceiroDetalhePage;
