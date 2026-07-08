
import React from 'react';
import { Helmet } from 'react-helmet';
import { AdminSidebar } from '@/components/Sidebar.jsx';
import Header from '@/components/Header.jsx';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAppData } from '@/store/AppDataContext.jsx';
import { Edit, Trash2, Save, Download, ShieldAlert, History } from 'lucide-react';
import { toast } from 'sonner';

const mockCategoriasFornecedor = [
  { id: 1, nome: 'Montadora', desc: 'Montagem estrutural do evento' },
  { id: 2, nome: 'Segurança', desc: 'Controle e segurança patrimonial' },
  { id: 3, nome: 'Limpeza', desc: 'Serviços de limpeza e conservação' },
  { id: 4, nome: 'Alimentação', desc: 'Operação de alimentação durante o evento' },
  { id: 5, nome: 'Audiovisual', desc: 'Suporte de som, imagem e transmissão' },
  { id: 6, nome: 'Expositor', desc: 'Empresas expositoras com equipe própria' },
  { id: 7, nome: 'Prestador de serviço', desc: 'Prestadores operacionais diversos' },
  { id: 8, nome: 'Outro', desc: 'Categorias especiais e exceções' }
];

const mockClassificacoesFornecedor = [
  { id: 1, nome: 'Temporário', desc: 'Atuação pontual em evento específico' },
  { id: 2, nome: 'Parceiro recorrente', desc: 'Fornecedor com recorrência validada em eventos do Expocentro' },
  { id: 3, nome: 'Oficial', desc: 'Fornecedor homologado para múltiplos eventos' },
  { id: 4, nome: 'Obrigatório', desc: 'Fornecedor exigido por norma operacional' },
  { id: 5, nome: 'Prestador fixo', desc: 'Fornecedor operacional fixo da casa' },
  { id: 6, nome: 'Bloqueado', desc: 'Fornecedor bloqueado administrativamente' }
];

const mockRegrasTaxa = [
  { id: 1, categoria: 'Montadora', classificacao: 'Oficial', valor: 'Isento', periodo: 'Evento completo' },
  { id: 2, categoria: 'Alimentação', classificacao: 'Temporário', valor: 'R$ 150,00', periodo: 'Diária' }
];

const mockTiposAcesso = [
  { id: 1, tipo: 'Montagem/Desmontagem', desc: 'Acesso apenas nos dias logísticos', periodo: 'Pré/Pós Evento' },
  { id: 2, tipo: 'Livre', desc: 'Acesso total irrestrito', periodo: 'Todos' }
];

const mockPerfis = [
  { id: 1, perfil: 'Administrador', permissoes: 'Todas' },
  { id: 2, perfil: 'Gerenciador de eventos', permissoes: 'Eventos, Relatórios' },
  { id: 3, perfil: 'Gerenciador de fornecedores', permissoes: 'Fornecedores, Pessoas, Taxas' },
  { id: 4, perfil: 'Operador de guarita', permissoes: 'Guarita' },
  { id: 5, perfil: 'Analista de relatórios', permissoes: 'Relatórios, Visualizar histórico' }
];

const ConfiguracoesPage = () => {
  const { restoreDemoData } = useAppData();

  const handleSave = (msg = 'Configurações salvas com sucesso.') => {
    toast.success(msg);
  };

  const handleAction = (action) => {
    toast.success(action);
  };

  const handleRestoreDemo = () => {
    restoreDemoData();
    toast.success('Dados de demonstracao restaurados com sucesso.');
  };

  return (
    <>
      <Helmet>
        <title>Configurações - Expocentro</title>
      </Helmet>
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-6 md:p-8 overflow-y-auto">
            <div className="max-w-5xl mx-auto space-y-8">
              <div>
                <h1 className="page-title">Configurações do Sistema</h1>
                <p className="page-subtitle">Gerencie regras de negócios, perfis de acesso e políticas de segurança.</p>
              </div>

              <Card className="border-border shadow-sm">
                <CardContent className="p-0">
                  <Tabs defaultValue="tipos_fornecedor" className="w-full">
                    <div className="px-6 pt-6 pb-2 border-b border-border overflow-x-auto scrollbar-hide bg-slate-50/80">
                      <TabsList className="inline-flex min-w-max">
                        <TabsTrigger value="tipos_fornecedor">Fornecedor: Categoria e Classificação</TabsTrigger>
                        <TabsTrigger value="regras_taxa">Regras de Taxa</TabsTrigger>
                        <TabsTrigger value="tipos_acesso">Tipos de Acesso</TabsTrigger>
                        <TabsTrigger value="perfis_acesso">Perfis de Acesso</TabsTrigger>
                        <TabsTrigger value="termos">Termos e Normas</TabsTrigger>
                        <TabsTrigger value="seguranca">Segurança e LGPD</TabsTrigger>
                      </TabsList>
                    </div>

                    {/* TAB 1: Tipos de Fornecedores */}
                    <TabsContent value="tipos_fornecedor" className="p-6 m-0">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Fornecedor: Categoria e Classificação</h3>
                      </div>
                      <div className="mb-4 p-3 rounded-xl border border-border bg-slate-50 text-xs text-muted-foreground space-y-1">
                        <p><strong>Categorias:</strong> Montadora, Segurança, Limpeza, Alimentação, Audiovisual, Expositor, Prestador de serviço, Outro.</p>
                        <p><strong>Classificações administrativas:</strong> Temporário, Parceiro recorrente, Oficial, Obrigatório, Prestador fixo, Bloqueado.</p>
                      </div>
                      <div className="space-y-6">
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="text-base font-semibold">Categorias de fornecedor</h4>
                            <Button onClick={() => handleAction('Adicionar categoria de fornecedor')}>Adicionar Categoria</Button>
                          </div>
                          <div className="overflow-x-hidden border border-border rounded-xl bg-white">
                            <Table className="table-vertical-only text-sm">
                              <TableHeader className="bg-muted/50">
                                <TableRow>
                                  <TableHead>Categoria</TableHead>
                                  <TableHead>Descrição</TableHead>
                                  <TableHead className="w-[150px] text-right">Ações</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {mockCategoriasFornecedor.map(row => (
                                  <TableRow key={row.id}>
                                    <TableCell className="font-medium">{row.nome}</TableCell>
                                    <TableCell>{row.desc}</TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex justify-end gap-2">
                                        <Button size="icon" variant="ghost"><Edit className="w-4 h-4 text-muted-foreground"/></Button>
                                        <Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="w-4 h-4"/></Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="text-base font-semibold">Classificações administrativas</h4>
                            <Button onClick={() => handleAction('Adicionar classificação administrativa')}>Adicionar Classificação</Button>
                          </div>
                          <div className="overflow-x-hidden border border-border rounded-xl bg-white">
                            <Table className="table-vertical-only text-sm">
                              <TableHeader className="bg-muted/50">
                                <TableRow>
                                  <TableHead>Classificação</TableHead>
                                  <TableHead>Descrição</TableHead>
                                  <TableHead className="w-[150px] text-right">Ações</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {mockClassificacoesFornecedor.map(row => (
                                  <TableRow key={row.id}>
                                    <TableCell className="font-medium">{row.nome}</TableCell>
                                    <TableCell>{row.desc}</TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex justify-end gap-2">
                                        <Button size="icon" variant="ghost"><Edit className="w-4 h-4 text-muted-foreground"/></Button>
                                        <Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="w-4 h-4"/></Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* TAB 2: Regras de Taxa */}
                    <TabsContent value="regras_taxa" className="p-6 m-0">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Regras de Taxa Base</h3>
                        <Button onClick={() => handleAction('Adicionar regra de taxa')}>Adicionar Regra</Button>
                      </div>
                      <div className="overflow-x-hidden border border-border rounded-lg">
                        <Table className="table-vertical-only text-sm">
                          <TableHeader className="bg-muted/50">
                            <TableRow>
                              <TableHead>Categoria</TableHead>
                              <TableHead>Classificação</TableHead>
                              <TableHead>Valor</TableHead>
                              <TableHead>Período</TableHead>
                              <TableHead className="w-[150px] text-right">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {mockRegrasTaxa.map(row => (
                              <TableRow key={row.id}>
                                <TableCell className="font-medium">{row.categoria}</TableCell>
                                <TableCell>{row.classificacao}</TableCell>
                                <TableCell>{row.valor}</TableCell>
                                <TableCell>{row.periodo}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button size="icon" variant="ghost"><Edit className="w-4 h-4 text-muted-foreground"/></Button>
                                    <Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="w-4 h-4"/></Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>

                    {/* TAB 3: Tipos de Acesso */}
                    <TabsContent value="tipos_acesso" className="p-6 m-0">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Tipos de Acesso na Guarita</h3>
                        <Button onClick={() => handleAction('Adicionar tipo de acesso')}>Adicionar Tipo</Button>
                      </div>
                      <div className="overflow-x-hidden border border-border rounded-lg">
                        <Table className="table-vertical-only text-sm">
                          <TableHeader className="bg-muted/50">
                            <TableRow>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Descrição</TableHead>
                              <TableHead>Períodos Permitidos</TableHead>
                              <TableHead className="w-[150px] text-right">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {mockTiposAcesso.map(row => (
                              <TableRow key={row.id}>
                                <TableCell className="font-medium">{row.tipo}</TableCell>
                                <TableCell>{row.desc}</TableCell>
                                <TableCell>{row.periodo}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button size="icon" variant="ghost"><Edit className="w-4 h-4 text-muted-foreground"/></Button>
                                    <Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="w-4 h-4"/></Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>

                    {/* TAB 4: Perfis de Acesso */}
                    <TabsContent value="perfis_acesso" className="p-6 m-0">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Perfis e Permissões de Usuários</h3>
                      </div>
                      <div className="overflow-x-hidden border border-border rounded-lg">
                        <Table className="table-vertical-only text-sm">
                          <TableHeader className="bg-muted/50">
                            <TableRow>
                              <TableHead className="w-[30%]">Perfil</TableHead>
                              <TableHead className="w-[50%]">Permissões Principais</TableHead>
                              <TableHead className="w-[20%] text-right">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {mockPerfis.map(row => (
                              <TableRow key={row.id}>
                                <TableCell className="font-medium">{row.perfil}</TableCell>
                                <TableCell className="text-muted-foreground">{row.permissoes}</TableCell>
                                <TableCell className="text-right">
                                  <Button size="sm" variant="outline">Editar Permissões</Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      <div className="mt-4 p-4 bg-muted/30 rounded-lg text-sm text-muted-foreground border border-border">
                        <p><strong>Permissões mapeáveis:</strong> Gerenciar eventos, Gerenciar fornecedores, Gerenciar pessoas, Gerenciar taxas, Gerenciar guarita, Gerar relatórios, Gerenciar configurações, Visualizar histórico.</p>
                      </div>
                    </TabsContent>

                    {/* TAB 5: Termos e Normas */}
                    <TabsContent value="termos" className="p-6 m-0">
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-lg font-semibold">Termos de Responsabilidade e Normas</h3>
                            <p className="text-sm text-muted-foreground">Estes termos são exibidos e devem ser aceitos por todos os fornecedores no primeiro login.</p>
                          </div>
                          <div className="text-right text-sm">
                            <span className="block font-medium">Versão atual: v2.4</span>
                            <span className="text-muted-foreground">Atualizado em: 15/06/2026</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Textarea 
                            className="min-h-[300px] font-mono text-sm bg-background border-border" 
                            defaultValue={`1. DO ACESSO E CREDENCIAMENTO\n1.1. O acesso às dependências do Expocentro Balneário Camboriú está estritamente condicionado ao uso de crachá de identificação válido.\n1.2. Todos os prestadores de serviço deverão estar previamente cadastrados e aprovados.\n\n2. DAS NORMAS DE SEGURANÇA\n2.1. É obrigatório o uso de EPIs (Equipamentos de Proteção Individual) adequados à função exercida durante os períodos de montagem e desmontagem...`}
                          />
                        </div>

                        <div className="flex gap-4">
                          <Button onClick={() => handleSave('Termos atualizados com sucesso.')} className="bg-primary">
                            <Save className="w-4 h-4 mr-2" /> Salvar Alterações
                          </Button>
                          <Button variant="outline" onClick={() => handleAction('Carregando histórico de versões...')}>
                            <History className="w-4 h-4 mr-2" /> Visualizar versão anterior
                          </Button>
                        </div>
                      </div>
                    </TabsContent>

                    {/* TAB 6: Segurança e LGPD */}
                    <TabsContent value="seguranca" className="p-6 m-0">
                      <div className="space-y-8">
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Políticas de Privacidade e Segurança (LGPD)</h3>
                          
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-4 bg-muted/30 p-4 rounded-lg border border-border">
                                <h4 className="font-medium mb-2 border-b border-border pb-2">Exibição de Dados</h4>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm">CPF mascarado na guarita (***.***.***-XX)</span>
                                  <Switch defaultChecked />
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm">Foto visível apenas para conferência (sem download)</span>
                                  <Switch defaultChecked />
                                </div>
                              </div>
                              
                              <div className="space-y-4 bg-muted/30 p-4 rounded-lg border border-border">
                                <h4 className="font-medium mb-2 border-b border-border pb-2">Rastreabilidade</h4>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm">Histórico de aprovação/alteração de dados</span>
                                  <Switch defaultChecked disabled />
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm">Logs de entrada e saída definitivos</span>
                                  <Switch defaultChecked disabled />
                                </div>
                              </div>
                            </div>

                            <div className="bg-muted/30 p-4 rounded-lg border border-border">
                              <h4 className="font-medium mb-4 border-b border-border pb-2">Retenção de Dados</h4>
                              <div className="max-w-md space-y-3">
                                <label className="text-sm">Período de retenção de dados após evento</label>
                                <Select defaultValue="1_ano">
                                  <SelectTrigger className="bg-background">
                                    <SelectValue placeholder="Selecione o período" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="30_dias">30 dias</SelectItem>
                                    <SelectItem value="90_dias">90 dias</SelectItem>
                                    <SelectItem value="1_ano">1 ano</SelectItem>
                                    <SelectItem value="2_anos">2 anos</SelectItem>
                                  </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground pt-1">Dados não essenciais serão anonimizados automaticamente após o período selecionado para conformidade com a LGPD.</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4 pt-4 border-t border-border">
                          <Button onClick={() => handleSave('Configurações de segurança salvas.')} className="bg-primary">
                            <Save className="w-4 h-4 mr-2" /> Salvar Configurações
                          </Button>
                          <Button variant="outline" onClick={() => handleAction('Exportação de dados iniciada.')}>
                            <Download className="w-4 h-4 mr-2" /> Exportar Dados Pessoais
                          </Button>
                          <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive/10" onClick={() => handleAction('Solicitação de anonimização enviada para a fila de processamento.')}>
                            <ShieldAlert className="w-4 h-4 mr-2" /> Solicitar Anonimização
                          </Button>
                          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={handleRestoreDemo}>
                            Restaurar dados de demonstração
                          </Button>
                        </div>
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

export default ConfiguracoesPage;
