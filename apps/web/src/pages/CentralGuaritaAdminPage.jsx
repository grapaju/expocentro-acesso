import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { AdminSidebar } from '@/components/Sidebar.jsx';
import Header from '@/components/Header.jsx';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAppData } from '@/store/AppDataContext.jsx';
import { AlertTriangle, Clock, LogIn, ShieldAlert } from 'lucide-react';

const normalizeStatus = (status) => String(status || '').toLowerCase();

const maskCpf = (cpf) => {
  const digits = String(cpf || '').replace(/\D/g, '');
  if (digits.length < 11) return String(cpf || '-');
  return `***.***.***-${digits.slice(-2)}`;
};

const isTodayBr = (dateTimeBr) => {
  const [datePart] = String(dateTimeBr || '').split(' ');
  if (!datePart) return false;
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = String(today.getFullYear());
  return datePart === `${dd}/${mm}/${yyyy}`;
};

const CentralGuaritaAdminPage = () => {
  const {
    events,
    accessRequests,
    accessLogs,
    people,
    history,
    approveAccessRequest,
    rejectAccessRequest,
    updateAccessRequest,
    blockPerson
  } = useAppData();

  const solicitacoesPendentes = useMemo(
    () => (accessRequests || []).filter((item) => normalizeStatus(item.status) === 'aguardando análise' || normalizeStatus(item.status) === 'aguardando analise'),
    [accessRequests]
  );

  const liberacoesEmergenciais = useMemo(
    () => (accessRequests || []).filter((item) => ['alta', 'urgente'].includes(String(item.urgencia || '').toLowerCase())),
    [accessRequests]
  );

  const entradasHoje = useMemo(
    () => (accessLogs || []).filter((log) => String(log.tipo || '').toLowerCase() === 'entrada' && isTodayBr(log.dataHora)),
    [accessLogs]
  );

  const bloqueiosPortaria = useMemo(
    () => (people || []).filter((person) => String(person.statusGuarita || '').toLowerCase() === 'bloqueado' || String(person.status || '').toLowerCase() === 'bloqueado'),
    [people]
  );

  const logsComCpf = useMemo(() => {
    const cpfByPersonId = new Map((people || []).map((person) => [person.id, person.cpf]));
    return (accessLogs || []).map((log) => ({
      ...log,
      cpfMasked: maskCpf(cpfByPersonId.get(log.personId))
    }));
  }, [accessLogs, people]);

  const eventNameById = useMemo(() => new Map((events || []).map((event) => [event.id, event.nome])), [events]);

  const historicoGuarita = useMemo(() => {
    return (history || []).filter((item) => {
      const acao = String(item.acao || '').toLowerCase();
      const usuario = String(item.usuario || '').toLowerCase();
      return usuario.includes('guarita') || acao.includes('guarita') || acao.includes('entrada') || acao.includes('saida') || acao.includes('bloqueio');
    });
  }, [history]);

  const handleAprovar = (request) => {
    approveAccessRequest(request.id, 'Evento');
    toast.success('Liberação aprovada.');
  };

  const handleLiberarHoje = (request) => {
    approveAccessRequest(request.id, 'Somente hoje');
    toast.success('Liberação concedida somente hoje.');
  };

  const handleNegar = (request) => {
    rejectAccessRequest(request.id, 'Negado pela administração');
    toast.error('Solicitação negada.');
  };

  const handleSolicitarCorrecao = (request) => {
    updateAccessRequest(request.id, { status: 'Correção solicitada' });
    toast.success('Correção solicitada à guarita.');
  };

  const handleBloquearPessoa = (request) => {
    if (request.personId) {
      blockPerson(request.personId);
    }
    updateAccessRequest(request.id, { status: 'Negado' });
    toast.error('Pessoa bloqueada e solicitação encerrada.');
  };

  return (
    <>
      <Helmet>
        <title>Central da Guarita - Expocentro</title>
      </Helmet>
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-6 md:p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Central da Guarita</h1>
                <p className="text-muted-foreground mt-1">O que a guarita está solicitando ou registrando agora.</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="border-border bg-muted/20 shadow-none">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-medium text-muted-foreground">Solicitações pendentes</p>
                      <p className="text-xl font-semibold tabular-nums">{solicitacoesPendentes.length}</p>
                    </div>
                    <Clock className="w-4 h-4 text-muted-foreground" />
                  </CardContent>
                </Card>
                <Card className="border-border bg-muted/20 shadow-none">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-medium text-muted-foreground">Liberações emergenciais</p>
                      <p className="text-xl font-semibold tabular-nums">{liberacoesEmergenciais.length}</p>
                    </div>
                    <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                  </CardContent>
                </Card>
                <Card className="border-border bg-muted/20 shadow-none">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-medium text-muted-foreground">Entradas registradas hoje</p>
                      <p className="text-xl font-semibold tabular-nums">{entradasHoje.length}</p>
                    </div>
                    <LogIn className="w-4 h-4 text-muted-foreground" />
                  </CardContent>
                </Card>
                <Card className="border-border bg-muted/20 shadow-none">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-medium text-muted-foreground">Pessoas bloqueadas na portaria</p>
                      <p className="text-xl font-semibold tabular-nums">{bloqueiosPortaria.length}</p>
                    </div>
                    <ShieldAlert className="w-4 h-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              </div>

              <Card className="border-border shadow-sm">
                <CardContent className="p-0">
                  <Tabs defaultValue="solicitacoes" className="w-full">
                    <div className="px-6 pt-6 pb-2 border-b border-border overflow-x-auto scrollbar-hide">
                      <TabsList className="bg-muted inline-flex min-w-max">
                        <TabsTrigger value="solicitacoes">Solicitações pendentes</TabsTrigger>
                        <TabsTrigger value="emergenciais">Liberações emergenciais</TabsTrigger>
                        <TabsTrigger value="entradas">Entradas e saídas</TabsTrigger>
                        <TabsTrigger value="bloqueios">Bloqueios</TabsTrigger>
                        <TabsTrigger value="historico">Histórico da guarita</TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="solicitacoes" className="p-6 m-0">
                      <div className="rounded-lg border border-border overflow-hidden">
                        <Table className="table-vertical-only text-sm">
                          <TableHeader className="bg-muted/50">
                            <TableRow>
                              <TableHead>Horário</TableHead>
                              <TableHead>Evento</TableHead>
                              <TableHead>Pessoa</TableHead>
                              <TableHead>Fornecedor</TableHead>
                              <TableHead>Motivo</TableHead>
                              <TableHead>Urgência</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {solicitacoesPendentes.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell className="font-mono text-xs">{item.dataHora}</TableCell>
                                <TableCell>{item.evento}</TableCell>
                                <TableCell>{item.pessoa}</TableCell>
                                <TableCell>{item.fornecedor}</TableCell>
                                <TableCell>{item.motivo}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="capitalize bg-warning/10 text-warning border-warning/20 whitespace-nowrap">{item.urgencia}</Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="bg-muted text-muted-foreground border-border whitespace-nowrap">{item.status}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex flex-wrap justify-end gap-2">
                                    <Button size="sm" onClick={() => handleAprovar(item)}>Aprovar liberação</Button>
                                    <Button size="sm" variant="outline" onClick={() => handleLiberarHoje(item)}>Liberar somente hoje</Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleNegar(item)}>Negar</Button>
                                    <Button size="sm" variant="outline" onClick={() => handleSolicitarCorrecao(item)}>Solicitar correção</Button>
                                    <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleBloquearPessoa(item)}>Bloquear pessoa</Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>

                    <TabsContent value="emergenciais" className="p-6 m-0">
                      <div className="rounded-lg border border-border overflow-hidden">
                        <Table className="table-vertical-only text-sm">
                          <TableHeader className="bg-muted/50">
                            <TableRow>
                              <TableHead>Horário</TableHead>
                              <TableHead>Evento</TableHead>
                              <TableHead>Pessoa</TableHead>
                              <TableHead>Fornecedor</TableHead>
                              <TableHead>Urgência</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {liberacoesEmergenciais.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell className="font-mono text-xs">{item.dataHora}</TableCell>
                                <TableCell>{item.evento}</TableCell>
                                <TableCell>{item.pessoa}</TableCell>
                                <TableCell>{item.fornecedor}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="capitalize bg-warning/10 text-warning border-warning/20 whitespace-nowrap">{item.urgencia}</Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="bg-muted text-muted-foreground border-border whitespace-nowrap">{item.status}</Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>

                    <TabsContent value="entradas" className="p-6 m-0">
                      <div className="rounded-lg border border-border overflow-hidden">
                        <Table className="table-vertical-only text-sm">
                          <TableHeader className="bg-muted/50">
                            <TableRow>
                              <TableHead>Data/hora</TableHead>
                              <TableHead>Pessoa</TableHead>
                              <TableHead>CPF mascarado</TableHead>
                              <TableHead>Fornecedor</TableHead>
                              <TableHead>Evento</TableHead>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Usuário da guarita</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {logsComCpf.map((log) => (
                              <TableRow key={log.id}>
                                <TableCell className="font-mono text-xs">{log.dataHora}</TableCell>
                                <TableCell>{log.pessoa}</TableCell>
                                <TableCell>{log.cpfMasked}</TableCell>
                                <TableCell>{log.fornecedor}</TableCell>
                                <TableCell>{log.evento}</TableCell>
                                <TableCell><Badge variant="outline">{log.tipo}</Badge></TableCell>
                                <TableCell>{log.operador || 'Guarita'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>

                    <TabsContent value="bloqueios" className="p-6 m-0">
                      <div className="rounded-lg border border-border overflow-hidden">
                        <Table className="table-vertical-only text-sm">
                          <TableHeader className="bg-muted/50">
                            <TableRow>
                              <TableHead>Pessoa</TableHead>
                              <TableHead>Fornecedor</TableHead>
                              <TableHead>Evento</TableHead>
                              <TableHead>Motivo do bloqueio</TableHead>
                              <TableHead>Quem bloqueou</TableHead>
                              <TableHead>Data/hora</TableHead>
                              <TableHead className="text-right">Ação</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {bloqueiosPortaria.map((person) => (
                              <TableRow key={person.id}>
                                <TableCell className="font-medium">{person.nome}</TableCell>
                                <TableCell>{person.fornecedor}</TableCell>
                                <TableCell>{eventNameById.get(person.eventId) || '-'}</TableCell>
                                <TableCell>{person.motivoPendencia || 'Bloqueio administrativo na portaria'}</TableCell>
                                <TableCell>Guarita/Admin</TableCell>
                                <TableCell>-</TableCell>
                                <TableCell className="text-right">
                                  <Button size="sm" variant="outline" onClick={() => toast.info('Revisão de bloqueio registrada para análise.')}>Revisar bloqueio</Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>

                    <TabsContent value="historico" className="p-6 m-0">
                      <div className="rounded-lg border border-border overflow-hidden">
                        <Table className="table-vertical-only text-sm">
                          <TableHeader className="bg-muted/50">
                            <TableRow>
                              <TableHead>Data/hora</TableHead>
                              <TableHead>Ação</TableHead>
                              <TableHead>Usuário</TableHead>
                              <TableHead>Detalhes</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {historicoGuarita.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell className="font-mono text-xs">{item.dataHora}</TableCell>
                                <TableCell><Badge variant="outline">{item.acao}</Badge></TableCell>
                                <TableCell>{item.usuario}</TableCell>
                                <TableCell className="text-muted-foreground">{item.detalhes}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default CentralGuaritaAdminPage;
