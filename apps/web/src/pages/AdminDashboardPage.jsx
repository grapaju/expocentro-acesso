
import React from 'react';
import { Helmet } from 'react-helmet';
import { AdminSidebar } from '@/components/Sidebar.jsx';
import Header from '@/components/Header.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, ShieldAlert, LogIn, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppData } from '@/store/AppDataContext.jsx';
import { useNavigate } from 'react-router-dom';
import { enrichFornecedoresWithNormas } from '@/utils/rules.js';
import { getOperationalAlerts } from '@/utils/alerts.js';

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { adminMockData } = useAppData();
  const eventoPrincipal = adminMockData.eventos[0];
  const fornecedoresComNormas = enrichFornecedoresWithNormas(adminMockData.fornecedores, adminMockData.normas);
  const operationalAlerts = getOperationalAlerts(
    eventoPrincipal,
    fornecedoresComNormas,
    adminMockData.pessoas,
    adminMockData.convites,
    adminMockData.taxas
  );
  const stats = [
    {
      id: 1,
      icon: Calendar,
      label: 'Eventos ativos',
      value: String(adminMockData.eventos.filter((evt) => evt.status === 'Ativo').length),
      color: 'text-muted-foreground',
      bg: 'bg-muted/30'
    },
    {
      id: 2,
      icon: AlertTriangle,
      label: 'Pendências críticas',
      value: String(operationalAlerts.filter((alerta) => alerta.gravidade === 'critica').length),
      color: 'text-muted-foreground',
      bg: 'bg-muted/30'
    },
    {
      id: 3,
      icon: ShieldAlert,
      label: 'Solicitações da guarita',
      value: String(adminMockData.guarita.length),
      color: 'text-muted-foreground',
      bg: 'bg-muted/30'
    },
    { id: 4, icon: LogIn, label: 'Acessos hoje', value: '315', color: 'text-muted-foreground', bg: 'bg-muted/30' }
  ];

  const prioridadesHoje = operationalAlerts
    .filter((alerta) => alerta.gravidade === 'critica' || alerta.gravidade === 'alta')
    .slice(0, 5)
    .map((alerta, index) => ({
      id: `${alerta.tipo}-${index}`,
      titulo: alerta.mensagem,
      gravidade: alerta.gravidade,
      acao: alerta.acaoSugerida,
      aba: alerta.tipo === 'taxa_pendente' ? 'taxas' : 'aprovacoes'
    }));

  const eventosEmAtencao = adminMockData.eventos
    .map((evento) => ({
      id: evento.id,
      nome: evento.nome,
      faseAtual: evento.faseAtual,
      pendencias: evento.pendencias,
      status: evento.status
    }))
    .sort((a, b) => b.pendencias - a.pendencias)
    .slice(0, 4);

  const severityDotClass = {
    critica: 'bg-destructive',
    alta: 'bg-destructive',
    media: 'bg-warning',
    baixa: 'bg-primary'
  };

  const handleOpenPriority = (aba) => {
    navigate(`/admin/eventos/${eventoPrincipal.id}/${aba}`);
  };

  return (
    <>
      <Helmet>
        <title>Dashboard Administrativo - Expocentro Acesso</title>
      </Helmet>

      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col">
          <Header />
          
          <main className="flex-1 p-4 md:p-6 2xl:p-10 overflow-y-auto">
            <div className="max-w-7xl 2xl:max-w-[88rem] mx-auto space-y-6 2xl:space-y-8">
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="page-title">Dashboard Administrativo</h1>
                  <p className="page-subtitle">Resumo executivo com foco no que exige decisão agora.</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 xl:gap-4">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div 
                      key={stat.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                    >
                      <Card className="hover:shadow-sm transition-shadow duration-200 border-border h-full bg-card/95">
                        <CardContent className="p-4 md:p-5 flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                            <p className="kpi-number">{stat.value}</p>
                          </div>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${stat.bg}`}>
                            <Icon className={`w-5 h-5 ${stat.color}`} />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 xl:gap-6">
                <div className="xl:col-span-2 space-y-5 xl:space-y-6">
                  <Card className="border-border shadow-sm">
                    <CardHeader className="bg-secondary/40 border-b border-border/60 pb-4">
                      <CardTitle className="text-lg">Prioridades de hoje</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 md:p-4 space-y-3">
                      {prioridadesHoje.length > 0 ? (
                        prioridadesHoje.map((item) => (
                          <div key={item.id} className="rounded-lg border border-border bg-card/80 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{item.titulo}</p>
                              <p className="text-xs text-muted-foreground">Ação sugerida: {item.acao}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge variant="outline" className="capitalize">{item.gravidade}</Badge>
                              <Button size="sm" variant="outline" onClick={() => handleOpenPriority(item.aba)}>
                                Ver detalhes
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-lg border border-border bg-card/70 p-4 text-sm text-muted-foreground flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                          Nenhuma prioridade crítica para hoje.
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-border shadow-sm">
                    <CardHeader className="bg-secondary/40 border-b border-border/60 flex flex-row items-center justify-between pb-4">
                      <CardTitle className="text-lg">Eventos em atenção</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => navigate('/admin/eventos')} className="text-foreground">
                        Ver todos <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead>Evento</TableHead>
                            <TableHead>Fase Atual</TableHead>
                            <TableHead className="text-center">Pendências</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ação</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {eventosEmAtencao.map((evt) => (
                            <TableRow key={evt.id}>
                              <TableCell className="font-medium">{evt.nome}</TableCell>
                              <TableCell className="whitespace-nowrap">
                                <Badge variant="outline" className="bg-muted/30 text-foreground border-border whitespace-nowrap">
                                  {evt.faseAtual}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">{evt.pendencias}</TableCell>
                              <TableCell><Badge variant="outline">{evt.status}</Badge></TableCell>
                              <TableCell className="text-right">
                                <Button size="sm" variant="outline" onClick={() => navigate(`/admin/eventos/${evt.id}/convites`)}>Ver detalhes</Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card className="border-primary/20 bg-primary/5 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Resumo de operação</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <p className="text-muted-foreground">Detalhes completos de risco, alertas e filas operacionais ficam na Central de Credenciamento.</p>
                      <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/credenciamento')}>
                        Abrir Central de Credenciamento
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default AdminDashboardPage;
