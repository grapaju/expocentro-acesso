
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { FornecedorSidebar } from '@/components/Sidebar.jsx';
import Header from '@/components/Header.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFornecedorData } from '@/hooks/useFornecedorData.js';
import { StatusBadge, FunctionIcon, AccessTypeIcon, PendencyIndicator } from '@/components/PortalUI.jsx';
import PessoasDetalhesModal from '@/components/PessoasDetalhesModal.jsx';
import { toast } from 'sonner';
import { Search, UserPlus, Eye, Edit2, Trash2, Send, Users } from 'lucide-react';

const PessoasCadastradasPage = () => {
  const navigate = useNavigate();
  const { people, deletePerson, submitForAnalysis } = useFornecedorData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPerson, setSelectedPerson] = useState(null);

  const filteredPeople = people.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.cpf.includes(searchTerm)
  );

  const maskCpf = (cpf) => {
    return cpf.replace(/(\d{3})\.(\d{3})\.(\d{3})-(\d{2})/, '***.$2.***-**');
  };

  const handleEdit = (person) => {
    setSelectedPerson(null);
    navigate('/cadastro-pessoas', { state: { person } });
  };

  const handleDelete = (id) => {
    if (confirm('Tem certeza que deseja excluir este rascunho?')) {
      deletePerson(id);
      toast.success('Rascunho excluído');
    }
  };

  const handleResend = (id) => {
    submitForAnalysis(id);
    toast.success('Cadastro reenviado para análise');
  };

  return (
    <>
      <Helmet>
        <title>Pessoas Cadastradas - Expocentro Acesso</title>
      </Helmet>

      <div className="flex min-h-screen bg-background">
        <FornecedorSidebar />
        
        <div className="flex-1 flex flex-col">
          <Header />
          
          <main className="flex-1 p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Equipe e Credenciados</h1>
                  <p className="text-muted-foreground mt-1">Gerencie as pessoas cadastradas pela sua empresa</p>
                </div>
                <Button 
                  onClick={() => navigate('/cadastro-pessoas')}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Cadastrar pessoa
                </Button>
              </div>

              <Card className="border-border shadow-sm">
                <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <CardTitle>Lista de Pessoas</CardTitle>
                      <CardDescription>Total de {people.length} registros</CardDescription>
                    </div>
                    <div className="relative w-full sm:w-72">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por nome ou CPF..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 bg-card"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {filteredPeople.length === 0 ? (
                    <div className="py-16 text-center">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-medium text-foreground mb-1">Nenhuma pessoa encontrada</h3>
                      <p className="text-muted-foreground text-sm">
                        {searchTerm ? 'Tente ajustar os filtros da sua busca.' : 'Você ainda não cadastrou nenhuma pessoa.'}
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/10 hover:bg-muted/10">
                          <TableHead className="w-[250px]">Profissional</TableHead>
                          <TableHead>CPF</TableHead>
                          <TableHead>Acesso</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPeople.map((person) => (
                          <TableRow key={person.id} className="hover:bg-muted/30 transition-colors">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${person.avatarBg}`}>
                                  {person.nome.charAt(0)}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-medium text-foreground">{person.nome}</span>
                                  <div className="flex items-center text-xs text-muted-foreground gap-1">
                                    <FunctionIcon functionName={person.funcao} className="w-3 h-3" />
                                    {person.funcao}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground tabular-nums tracking-wide">
                              {maskCpf(person.cpf)}
                            </TableCell>
                            <TableCell>
                              <AccessTypeIcon type={person.tipoAcesso} />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <StatusBadge status={person.status} />
                                <PendencyIndicator hasPendency={person.temPendencia} message={person.motivoPendencia} />
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => setSelectedPerson(person)}
                                  className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                                  title="Visualizar detalhes"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                
                                {(person.status === 'Rascunho' || person.status === 'Correção solicitada') && (
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleEdit(person)}
                                    className="text-muted-foreground hover:text-secondary hover:bg-secondary/10"
                                    title="Editar"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                )}

                                {person.status === 'Correção solicitada' && (
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleResend(person.id)}
                                    className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    title="Reenviar para análise"
                                  >
                                    <Send className="w-4 h-4" />
                                  </Button>
                                )}

                                {person.status === 'Rascunho' && (
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleDelete(person.id)}
                                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    title="Excluir"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>

      <PessoasDetalhesModal 
        person={selectedPerson} 
        isOpen={!!selectedPerson} 
        onClose={() => setSelectedPerson(null)}
        onEdit={() => handleEdit(selectedPerson)}
      />
    </>
  );
};

export default PessoasCadastradasPage;
