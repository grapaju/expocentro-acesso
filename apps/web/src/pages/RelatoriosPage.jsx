
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { AdminSidebar } from '@/components/Sidebar.jsx';
import Header from '@/components/Header.jsx';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  ShieldBan, LogIn, DollarSign, Building2,
  FileText, FileBarChart, Download, FileSpreadsheet,
  CalendarDays, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppData } from '@/store/AppDataContext.jsx';

const reportTypes = [
  { id: 'rpt-1', nome: 'Lista de pessoas por evento', descricao: 'Relação completa de credenciados por evento.' },
  { id: 'rpt-2', nome: 'Lista de fornecedores por evento', descricao: 'Fornecedores com status e classificação administrativa.' },
  { id: 'rpt-3', nome: 'Pessoas pendentes de aprovação', descricao: 'Pendências de aprovação para ação da equipe.' },
  { id: 'rpt-4', nome: 'Pessoas bloqueadas', descricao: 'Bloqueios ativos e motivo do bloqueio.' },
  { id: 'rpt-5', nome: 'Acessos registrados por dia', descricao: 'Entradas e saídas em janela diária.' },
  { id: 'rpt-6', nome: 'Taxas por evento', descricao: 'Previsto, recebido e pendente por evento.' }
];

const mockReportData = [
  { id: 1, col1: 'João Silva', col2: 'Luz & Som', col3: 'Expo Tech', col4: 'Aprovado', col5: '02/07/2026' },
  { id: 2, col1: 'Maria Souza', col2: 'FoodTruck BR', col3: 'Feira Construir', col4: 'Pendente', col5: '01/07/2026' },
  { id: 3, col1: 'Carlos Mendes', col2: 'Segurança Máxima', col3: 'Expo Tech', col4: 'Bloqueado', col5: '30/06/2026' }
];

const RelatoriosPage = () => {
  const [selectedReport, setSelectedReport] = useState(null);
  const { adminMockData } = useAppData();

  const fornecedoresAtivos = (adminMockData.fornecedores || []).filter((item) => String(item.statusCadastral || '').toLowerCase() !== 'bloqueado').length;
  const pessoasLiberadas = (adminMockData.pessoas || []).filter((item) => String(item.status || '').toLowerCase().includes('liberado')).length;
  const pessoasBloqueadas = (adminMockData.pessoas || []).filter((item) => String(item.status || '').toLowerCase().includes('bloqueado')).length;
  const taxasPendentes = (adminMockData.taxas || []).filter((item) => {
    const status = String(item.status || '').toLowerCase();
    return status.includes('pendente') || status.includes('atrasada');
  }).length;

  const summaryData = [
    { title: 'Acessos do dia', value: String((adminMockData.guarita || []).length), icon: LogIn, color: 'text-accent' },
    { title: 'Pessoas liberadas', value: String(pessoasLiberadas), icon: CheckCircle, color: 'text-accent' },
    { title: 'Pessoas bloqueadas', value: String(pessoasBloqueadas), icon: ShieldBan, color: 'text-destructive' },
    { title: 'Taxas pendentes', value: String(taxasPendentes), icon: DollarSign, color: 'text-warning' },
    { title: 'Fornecedores ativos', value: String(fornecedoresAtivos), icon: Building2, color: 'text-primary' }
  ];

  const handleExport = (format) => {
    toast.success(`Relatório exportado em ${format} com sucesso.`);
  };

  return (
    <>
      <Helmet>
        <title>Relatórios - Expocentro</title>
      </Helmet>
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-6 md:p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto space-y-8">
              <div>
                <h1 className="page-title">Relatórios Gerenciais</h1>
                <p className="page-subtitle">Extraia dados completos sobre acessos, fornecedores e taxas.</p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {summaryData.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <Card key={idx} className="border-border bg-muted/20 shadow-none">
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">{item.title}</p>
                          <p className="text-xl font-semibold text-foreground">{item.value}</p>
                        </div>
                        <div className={`w-9 h-9 rounded-md flex items-center justify-center bg-background border border-border ${item.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Card className="border-border shadow-sm">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-100">
                        <TableHead>Relatório</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportTypes.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell className="font-medium">{report.nome}</TableCell>
                          <TableCell className="text-muted-foreground">{report.descricao}</TableCell>
                          <TableCell className="text-right">
                            <div className="inline-flex items-center gap-2">
                              <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => setSelectedReport(report)}>
                                Visualizar
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => handleExport('PDF')}>
                                PDF
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => handleExport('Excel')}>
                                Excel
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

            </div>
          </main>
        </div>
      </div>

      {/* Report Modal */}
      <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {selectedReport?.nome}
            </DialogTitle>
            <DialogDescription>
              Filtre e exporte os dados detalhados.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col gap-4 mt-2">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg border border-border shrink-0">
              <div className="space-y-2">
                <label className="text-xs font-medium">Evento</label>
                <Select defaultValue="todos">
                  <SelectTrigger className="bg-background"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Eventos</SelectItem>
                    <SelectItem value="expo">Expo Tech</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium">Data / Período</label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="date" className="pl-9 bg-background" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium">Status</label>
                <Select defaultValue="todos">
                  <SelectTrigger className="bg-background"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Status</SelectItem>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <Button className="flex-1 bg-primary">Filtrar</Button>
              </div>
            </div>

            {/* Table Area (Scrollable) */}
            <div className="flex-1 overflow-y-auto border border-border rounded-lg">
              <Table className="table-vertical-only text-sm">
                <TableHeader className="bg-muted sticky top-0 z-10">
                  <TableRow>
                    <TableHead>Pessoa / Referência</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Evento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockReportData.map(row => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.col1}</TableCell>
                      <TableCell>{row.col2}</TableCell>
                      <TableCell>{row.col3}</TableCell>
                      <TableCell>{row.col4}</TableCell>
                      <TableCell className="text-muted-foreground">{row.col5}</TableCell>
                    </TableRow>
                  ))}
                  {mockReportData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum dado encontrado.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="flex justify-between mt-4 shrink-0 pt-4 border-t border-border">
            <Button variant="ghost" onClick={() => setSelectedReport(null)}>Fechar</Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleExport('Excel')} className="border-accent text-accent hover:bg-accent/10">
                <FileSpreadsheet className="w-4 h-4 mr-2" /> Exportar Excel
              </Button>
              <Button onClick={() => handleExport('PDF')} className="bg-destructive hover:bg-destructive/90 text-white">
                <Download className="w-4 h-4 mr-2" /> Exportar PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RelatoriosPage;
