
import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { GuaritaSidebar } from '@/components/Sidebar.jsx';
import Header from '@/components/Header.jsx';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { LogIn, LogOut, History } from 'lucide-react';
import { useAppData } from '@/store/AppDataContext.jsx';

const GuaritaHistoricoPage = () => {
  const { accessLogs } = useAppData();
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [eventoFilter, setEventoFilter] = useState('todos');
  const [dataFilter, setDataFilter] = useState('');

  const historico = useMemo(() => accessLogs || [], [accessLogs]);

  // Sort by dataHora descending (assuming format DD/MM/YYYY HH:mm)
  const sortedHistorico = [...historico].sort((a, b) => {
    const [dateA, timeA] = a.dataHora.split(' ');
    const [dayA, monthA, yearA] = dateA.split('/');
    const dateObjA = new Date(`${yearA}-${monthA}-${dayA}T${timeA}`);
    
    const [dateB, timeB] = b.dataHora.split(' ');
    const [dayB, monthB, yearB] = dateB.split('/');
    const dateObjB = new Date(`${yearB}-${monthB}-${dayB}T${timeB}`);
    
    return dateObjB - dateObjA;
  });

  const filtered = sortedHistorico.filter(h => {
    const matchesTipo = tipoFilter === 'todos' || h.tipo === tipoFilter;
    const matchesEvento = eventoFilter === 'todos' || h.evento === eventoFilter;
    const matchesData = !dataFilter || h.dataHora.includes(dataFilter);
    return matchesTipo && matchesEvento && matchesData;
  });

  return (
    <>
      <Helmet>
        <title>Histórico de Entradas e Saídas - Guarita</title>
      </Helmet>

      <div className="flex min-h-screen bg-background">
        <GuaritaSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          
          <main className="flex-1 p-6 md:p-8 overflow-x-hidden">
            <div className="max-w-7xl mx-auto space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Histórico de Entradas e Saídas</h1>
                <p className="text-muted-foreground mt-1">Log de movimentações registradas</p>
              </div>

              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="w-full sm:w-48 space-y-2">
                      <label className="text-sm font-medium">Tipo</label>
                      <Select value={tipoFilter} onValueChange={setTipoFilter}>
                        <SelectTrigger className="bg-background border-border">
                          <SelectValue placeholder="Todos os tipos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos os tipos</SelectItem>
                          <SelectItem value="Entrada">Entrada</SelectItem>
                          <SelectItem value="Saída">Saída</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="w-full sm:w-64 space-y-2">
                      <label className="text-sm font-medium">Evento</label>
                      <Select value={eventoFilter} onValueChange={setEventoFilter}>
                        <SelectTrigger className="bg-background border-border">
                          <SelectValue placeholder="Todos os eventos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos os eventos</SelectItem>
                          <SelectItem value="Feira Construir SC 2026">Feira Construir SC</SelectItem>
                          <SelectItem value="Expo Indústria Tech">Expo Indústria Tech</SelectItem>
                          <SelectItem value="Salão do Automóvel">Salão do Automóvel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-full sm:w-48 space-y-2">
                      <label className="text-sm font-medium">Data</label>
                      <Input 
                        type="text" 
                        placeholder="Ex: 12/07/2026" 
                        value={dataFilter}
                        onChange={(e) => setDataFilter(e.target.value)}
                        className="bg-background border-border"
                      />
                    </div>
                  </div>

                  {filtered.length === 0 ? (
                    <div className="text-center py-12">
                      <History className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium text-foreground">Nenhum registro encontrado</p>
                      <p className="text-muted-foreground text-sm">Ajuste os filtros para ver mais resultados.</p>
                    </div>
                  ) : (
                    <div className="border border-border rounded-lg overflow-x-auto">
                      <Table className="min-w-[1000px]">
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            <TableHead className="whitespace-nowrap">Data/hora</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Pessoa</TableHead>
                            <TableHead>Fornecedor</TableHead>
                            <TableHead>Evento</TableHead>
                            <TableHead>Função</TableHead>
                            <TableHead>Operador</TableHead>
                            <TableHead>Observações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filtered.map((hist) => (
                            <TableRow key={hist.id}>
                              <TableCell className="text-muted-foreground tabular-nums text-sm whitespace-nowrap font-medium">
                                {hist.dataHora}
                              </TableCell>
                              <TableCell>
                                {hist.tipo === 'Entrada' ? (
                                  <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10">
                                    <LogIn className="w-3 h-3 mr-1" /> Entrada
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-accent border-accent/30 bg-accent/10">
                                    <LogOut className="w-3 h-3 mr-1" /> Saída
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="font-medium">{hist.pessoa}</TableCell>
                              <TableCell className="text-sm">{hist.fornecedor}</TableCell>
                              <TableCell className="text-sm">{hist.evento}</TableCell>
                              <TableCell className="text-sm">{hist.funcao}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{hist.operador}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{hist.observacoes || hist.observações || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default GuaritaHistoricoPage;
