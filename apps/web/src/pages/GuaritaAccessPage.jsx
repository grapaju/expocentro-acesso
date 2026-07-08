
import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { GuaritaSidebar } from '@/components/Sidebar.jsx';
import Header from '@/components/Header.jsx';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, ShieldBan, LogIn, LogOut, Info, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { filterGuaritaData, maskCpf } from '@/utils/guaritaMockData.js';
import { useAppData } from '@/store/AppDataContext.jsx';
import ConfirmDialog from '@/components/ConfirmDialog.jsx';
import GuaritaSolicitacaoModal from '@/components/GuaritaSolicitacaoModal.jsx';
import GuaritaDetalhesModal from '@/components/GuaritaDetalhesModal.jsx';
import { motion } from 'framer-motion';

const GuaritaAccessPage = () => {
  const { people: appPeople, events, registerEntry, registerExit, blockPerson, createAccessRequest } = useAppData();
  const [searchTerm, setSearchTerm] = useState('');
  const [eventoFilter, setEventoFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todos');
  
  // Modals state
  const [personToBlock, setPersonToBlock] = useState(null);
  const [personToRequest, setPersonToRequest] = useState(null);
  const [personDetails, setPersonDetails] = useState(null);

  const allPeople = useMemo(() => {
    return (appPeople || []).map((person) => {
      const event = (events || []).find((evt) => evt.id === person.eventId);
      return {
        id: person.id,
        nome: person.nome,
        cpf: person.cpf,
        fornecedor: person.fornecedor,
        evento: event?.nome || 'Evento',
        funcao: person.funcao,
        tipoAcesso: person.tipoAcesso,
        periodoAutorizado: person.periodoSolicitado || '-',
        status: person.statusGuarita || 'pendente',
        avatar: person.iniciais || String(person.nome || '').charAt(0)
      };
    });
  }, [appPeople, events]);

  const people = useMemo(
    () => allPeople.filter((person) => person.status === 'liberado' || person.status === 'entrou'),
    [allPeople]
  );

  const blockedForRequest = useMemo(
    () => allPeople.filter((person) => person.status !== 'liberado' && person.status !== 'entrou' && person.status !== 'bloqueado'),
    [allPeople]
  );

  const nonReleasedMatches = useMemo(() => {
    const needle = String(searchTerm || '').toLowerCase().trim();
    if (!needle) return [];

    return blockedForRequest.filter((person) => {
      const cpfRaw = String(person.cpf || '').replace(/\D/g, '');
      const needleCpf = needle.replace(/\D/g, '');

      return (
        String(person.nome || '').toLowerCase().includes(needle)
        || String(person.fornecedor || '').toLowerCase().includes(needle)
        || String(person.evento || '').toLowerCase().includes(needle)
        || (needleCpf && cpfRaw.includes(needleCpf))
      );
    });
  }, [blockedForRequest, searchTerm]);

  const filteredPeople = filterGuaritaData(people, {
    search: searchTerm,
    evento: eventoFilter,
    status: statusFilter
  });

  const handleRegistrarEntrada = (id) => {
    registerEntry(id);
    toast.success('Entrada registrada com sucesso', { icon: <LogIn className="w-4 h-4 text-accent"/> });
  };

  const handleRegistrarSaida = (id) => {
    registerExit(id);
    toast.success('Saída registrada com sucesso', { icon: <LogOut className="w-4 h-4"/> });
  };

  const handleBloquearConfirm = () => {
    if (!personToBlock) return;
    blockPerson(personToBlock.id);
    toast.error('Pessoa bloqueada com sucesso no sistema da guarita.', { icon: <ShieldBan className="w-4 h-4 text-destructive"/> });
    setPersonToBlock(null);
  };

  const handleSolicitacaoSubmit = (solicitacaoData) => {
    createAccessRequest({
      ...solicitacaoData,
      personId: personToRequest?.id,
      pessoa: personToRequest?.nome || solicitacaoData?.pessoa,
      fornecedor: personToRequest?.fornecedor || solicitacaoData?.fornecedor,
      evento: personToRequest?.evento || solicitacaoData?.evento,
      eventId: (events || []).find((evt) => evt.nome === (personToRequest?.evento || solicitacaoData?.evento))?.id
    });
    toast.success('Solicitação enviada à administração. Aguarde análise antes de liberar a entrada.');
    setPersonToRequest(null);
  };

  const renderCardButtons = (person) => {
    if (person.status === 'liberado') {
      return (
        <div className="flex gap-2 mt-4 pt-4 border-t border-border">
          <Button 
            className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground" 
            onClick={() => handleRegistrarEntrada(person.id)}
          >
            <LogIn className="w-4 h-4 mr-2" /> Registrar entrada
          </Button>
          <Button variant="outline" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => setPersonToBlock(person)}>
            <ShieldBan className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setPersonDetails(person)}>
            <Info className="w-4 h-4" />
          </Button>
        </div>
      );
    }

    if (person.status === 'entrou') {
      return (
        <div className="flex gap-2 mt-4 pt-4 border-t border-border">
          <Button 
            variant="outline"
            className="flex-1 border-primary/20 text-primary hover:bg-primary/5" 
            onClick={() => handleRegistrarSaida(person.id)}
          >
            <LogOut className="w-4 h-4 mr-2" /> Registrar saída
          </Button>
          <Button variant="outline" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => setPersonToBlock(person)}>
            <ShieldBan className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setPersonDetails(person)}>
            <Info className="w-4 h-4" />
          </Button>
        </div>
      );
    }

    return (
      <div className="flex gap-2 mt-4 pt-4 border-t border-border">
        <Button variant="outline" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => setPersonToBlock(person)}>
          <ShieldBan className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setPersonDetails(person)}>
          <Info className="w-4 h-4" />
        </Button>
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Guarita - Expocentro Acesso</title>
      </Helmet>

      <div className="flex min-h-screen bg-background">
        <GuaritaSidebar />
        
        <div className="flex-1 flex flex-col">
          <Header />
          
          <main className="flex-1 p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
              
              {/* Page Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-primary">Guarita - Expocentro Acesso</h1>
                  <p className="text-muted-foreground mt-1">Liberação de entrada e saída</p>
                </div>
                <Button
                  className="bg-primary text-primary-foreground"
                  onClick={() => toast.info('Busque uma pessoa não liberada para abrir a solicitação de liberação.')}
                >
                  <Plus className="w-4 h-4 mr-2" /> Nova solicitação
                </Button>
              </div>

              {/* Filters */}
              <Card className="bg-card border-border shadow-sm">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    <div className="md:col-span-6 space-y-2">
                      <label className="text-sm font-medium">Buscar pessoa</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Buscar por CPF, nome, fornecedor ou evento..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 h-12 bg-background border-border"
                        />
                      </div>
                    </div>
                    
                    <div className="md:col-span-3 space-y-2">
                      <label className="text-sm font-medium">Filtro por evento</label>
                      <Select value={eventoFilter} onValueChange={setEventoFilter}>
                        <SelectTrigger className="h-12 bg-background border-border">
                          <SelectValue placeholder="Selecione o evento" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos os eventos</SelectItem>
                          {[...new Set(people.map((person) => person.evento))].map((evento) => (
                            <SelectItem key={evento} value={evento}>{evento}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-3 space-y-2">
                      <label className="text-sm font-medium">Filtro por status</label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-12 bg-background border-border">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos os status</SelectItem>
                          <SelectItem value="liberado">Liberado</SelectItem>
                          <SelectItem value="entrou">Entrou</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {nonReleasedMatches.length > 0 && (
                <Card className="bg-card border-border shadow-sm">
                  <CardContent className="p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-semibold text-foreground">Pessoas não liberadas encontradas</h2>
                      <span className="text-xs text-muted-foreground">{nonReleasedMatches.length} resultado(s)</span>
                    </div>
                    <div className="space-y-2">
                      {nonReleasedMatches.slice(0, 5).map((person) => (
                        <div key={`non-release-${person.id}`} className="rounded-lg border border-border bg-background p-3 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">{person.nome} • {maskCpf(person.cpf)}</p>
                            <p className="text-xs text-muted-foreground">{person.fornecedor} • {person.evento}</p>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => setPersonToRequest(person)}>
                            <ClipboardList className="w-4 h-4 mr-2" /> Solicitar liberação
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Grid of Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredPeople.map((person, idx) => (
                  <motion.div 
                    key={person.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                  >
                    <Card className="overflow-hidden h-full flex flex-col transition-shadow hover:shadow-md border-border bg-card">
                      
                      <CardContent className="p-6 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                              {person.avatar}
                            </div>
                            <div>
                              <h3 className="font-bold text-lg leading-none mb-1 text-card-foreground">{person.nome}</h3>
                              <p className="text-sm text-muted-foreground font-mono">{maskCpf(person.cpf)}</p>
                            </div>
                          </div>
                          {person.status === 'liberado' && <Badge className="bg-accent text-accent-foreground shrink-0">Liberado</Badge>}
                          {person.status === 'entrou' && <Badge variant="secondary" className="shrink-0 bg-primary/10 text-primary border-primary/20">Entrou</Badge>}
                        </div>

                        <div className="space-y-3 mb-4 flex-1">
                          <div className="grid grid-cols-[100px_1fr] text-sm items-baseline">
                            <span className="text-muted-foreground font-medium">Fornecedor:</span>
                            <span className="font-medium text-foreground text-right">{person.fornecedor}</span>
                          </div>
                          <div className="grid grid-cols-[100px_1fr] text-sm items-baseline">
                            <span className="text-muted-foreground font-medium">Evento:</span>
                            <span className="text-right truncate" title={person.evento}>{person.evento}</span>
                          </div>
                          <div className="grid grid-cols-[100px_1fr] text-sm items-baseline">
                            <span className="text-muted-foreground font-medium">Função:</span>
                            <span className="text-right">{person.funcao}</span>
                          </div>
                          <div className="grid grid-cols-[100px_1fr] text-sm items-baseline">
                            <span className="text-muted-foreground font-medium">Acesso:</span>
                            <span className="text-right">{person.tipoAcesso}</span>
                          </div>
                          <div className="grid grid-cols-[100px_1fr] text-sm items-baseline">
                            <span className="text-muted-foreground font-medium">Período:</span>
                            <span className="text-right">{person.periodoAutorizado}</span>
                          </div>
                        </div>

                        <div className="mt-auto">
                          {renderCardButtons(person)}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}

                {filteredPeople.length === 0 && (
                  <div className="col-span-full py-16 text-center border-2 border-dashed border-border rounded-xl">
                    <p className="text-lg font-medium text-foreground">Nenhuma pessoa encontrada</p>
                    <p className="text-muted-foreground">Tente alterar os termos da busca ou os filtros de status.</p>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      <ConfirmDialog 
        isOpen={!!personToBlock}
        onClose={() => setPersonToBlock(null)}
        onConfirm={handleBloquearConfirm}
        title="Confirmar Bloqueio"
        description={`Tem certeza que deseja bloquear o acesso de ${personToBlock?.nome}? Esta ação registrará um incidente de segurança.`}
        confirmText="Bloquear Acesso"
        destructive={true}
      />

      <GuaritaSolicitacaoModal 
        isOpen={!!personToRequest}
        onClose={() => setPersonToRequest(null)}
        person={personToRequest}
        onSubmit={handleSolicitacaoSubmit}
      />

      <GuaritaDetalhesModal 
        isOpen={!!personDetails}
        onClose={() => setPersonDetails(null)}
        person={personDetails}
      />
    </>
  );
};

export default GuaritaAccessPage;
