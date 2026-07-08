
import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { GuaritaSidebar } from '@/components/Sidebar.jsx';
import Header from '@/components/Header.jsx';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardList, Eye, X, RotateCw } from 'lucide-react';
import { toast } from 'sonner';
import { useAppData } from '@/store/AppDataContext.jsx';
import ConfirmDialog from '@/components/ConfirmDialog.jsx';

const GuaritaSolicitacoesPage = () => {
  const { accessRequests, rejectAccessRequest, updateAccessRequest } = useAppData();
  const [statusFilter, setStatusFilter] = useState('todos');
  const [eventoFilter, setEventoFilter] = useState('todos');
  
  const [requestToCancel, setRequestToCancel] = useState(null);

  const solicitacoes = useMemo(() => accessRequests || [], [accessRequests]);

  const filtered = solicitacoes.filter(s => {
    const matchesStatus = statusFilter === 'todos' || s.status === statusFilter;
    const matchesEvento = eventoFilter === 'todos' || s.evento === eventoFilter;
    return matchesStatus && matchesEvento;
  });

  const getUrgenciaBadge = (urgencia) => {
    switch(urgencia) {
      case 'baixa': return <Badge className="bg-accent text-accent-foreground hover:bg-accent/90">Baixa</Badge>;
      case 'media': return <Badge className="bg-[#eab308] text-white hover:bg-[#eab308]/90">Média</Badge>;
      case 'alta': return <Badge className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Alta</Badge>;
      default: return <Badge variant="outline">{urgencia}</Badge>;
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Aguardando análise': return <Badge variant="secondary" className="bg-[#fb923c]/10 text-[#ea580c]">Aguardando análise</Badge>;
      case 'Aprovado': return <Badge className="bg-accent text-accent-foreground">Aprovado</Badge>;
      case 'Negado': return <Badge variant="destructive">Negado</Badge>;
      case 'Correção solicitada': return <Badge variant="outline" className="border-[#eab308] text-[#ca8a04]">Correção solicitada</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleCancelConfirm = () => {
    if (!requestToCancel) return;
    rejectAccessRequest(requestToCancel.id, 'Solicitacao cancelada pela guarita');
    toast.success('Solicitação cancelada com sucesso.');
    setRequestToCancel(null);
  };

  const handleReenviar = (id) => {
    updateAccessRequest(id, { status: 'Aguardando análise' });
    toast.success('Solicitação reenviada para análise.');
  };

  return (
    <>
      <Helmet>
        <title>Solicitações Enviadas - Guarita</title>
      </Helmet>

      <div className="flex min-h-screen bg-background">
        <GuaritaSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          
          <main className="flex-1 p-6 md:p-8 overflow-x-hidden">
            <div className="max-w-7xl mx-auto space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Solicitações Enviadas</h1>
                <p className="text-muted-foreground mt-1">Histórico de solicitações de liberação à administração</p>
              </div>

              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="w-full sm:w-64 space-y-2">
                      <label className="text-sm font-medium">Status</label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="bg-background border-border">
                          <SelectValue placeholder="Todos os status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos os status</SelectItem>
                          <SelectItem value="Aguardando análise">Aguardando análise</SelectItem>
                          <SelectItem value="Aprovado">Aprovado</SelectItem>
                          <SelectItem value="Negado">Negado</SelectItem>
                          <SelectItem value="Correção solicitada">Correção solicitada</SelectItem>
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
                  </div>

                  {filtered.length === 0 ? (
                    <div className="text-center py-12">
                      <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium text-foreground">Nenhuma solicitação encontrada</p>
                      <p className="text-muted-foreground text-sm">Ajuste os filtros para ver mais resultados.</p>
                    </div>
                  ) : (
                    <div className="border border-border rounded-lg overflow-x-auto">
                      <Table className="min-w-[800px]">
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            <TableHead className="whitespace-nowrap">Data/hora</TableHead>
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
                          {filtered.map((sol) => (
                            <TableRow key={sol.id}>
                              <TableCell className="text-muted-foreground tabular-nums text-sm whitespace-nowrap">{sol.dataHora}</TableCell>
                              <TableCell className="font-medium text-sm">{sol.evento}</TableCell>
                              <TableCell className="font-medium">{sol.pessoa}</TableCell>
                              <TableCell className="text-sm">{sol.fornecedor}</TableCell>
                              <TableCell className="text-sm max-w-[200px] truncate" title={sol.motivo}>{sol.motivo}</TableCell>
                              <TableCell>{getUrgenciaBadge(sol.urgencia)}</TableCell>
                              <TableCell>{getStatusBadge(sol.status)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button variant="ghost" size="icon" title="Visualizar" onClick={() => toast.info('Visualizando detalhes da solicitação...')}>
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  {sol.status === 'Aguardando análise' && (
                                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" title="Cancelar" onClick={() => setRequestToCancel(sol)}>
                                      <X className="w-4 h-4" />
                                    </Button>
                                  )}
                                  {(sol.status === 'Negado' || sol.status === 'Correção solicitada') && (
                                    <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10" title="Reenviar" onClick={() => handleReenviar(sol.id)}>
                                      <RotateCw className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
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

      <ConfirmDialog 
        isOpen={!!requestToCancel}
        onClose={() => setRequestToCancel(null)}
        onConfirm={handleCancelConfirm}
        title="Cancelar Solicitação"
        description="Tem certeza que deseja cancelar esta solicitação de liberação? A administração não irá mais analisá-la."
        confirmText="Sim, cancelar"
        destructive={true}
      />
    </>
  );
};

export default GuaritaSolicitacoesPage;
