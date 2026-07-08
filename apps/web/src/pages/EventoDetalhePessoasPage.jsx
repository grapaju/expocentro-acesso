
import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useParams } from 'react-router-dom';
import { AdminSidebar } from '@/components/Sidebar.jsx';
import Header from '@/components/Header.jsx';
import EventoDetalheLayout from '@/components/EventoDetalheLayout.jsx';
import AdminTable from '@/components/AdminTable.jsx';
import StatusBadge from '@/components/StatusBadge.jsx';
import ActionMenu from '@/components/ActionMenu.jsx';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppData } from '@/store/AppDataContext.jsx';
import { CheckCircle2, Eye, LogIn, ShieldBan } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const normalize = (value) => String(value || '').toLowerCase();

const maskCpf = (cpf) => {
  const digits = String(cpf || '').replace(/\D/g, '');
  if (digits.length < 11) return cpf;
  return `***.***.***-${digits.slice(-2)}`;
};

const EventoDetalhePessoasPage = () => {
  const { eventoId } = useParams();
  const {
    adminMockData,
    updatePerson: patchPerson,
    requestPersonCorrection,
    blockPerson,
    approvePerson,
    rejectPerson,
    releasePersonToGate
  } = useAppData();

  const [pessoas, setPessoas] = useState(adminMockData.pessoas);
  const [selectedPessoaId, setSelectedPessoaId] = useState(null);
  const [isCadastroDialogOpen, setIsCadastroDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    fornecedor: '',
    funcao: '',
    tipoAcesso: '',
    status: ''
  });
  const [correctionMessage, setCorrectionMessage] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    fornecedor: 'todos',
    status: 'todos',
    tipoAcesso: 'todos',
    funcao: 'todos'
  });

  useEffect(() => {
    setPessoas((adminMockData.pessoas || []).filter((pessoa) => pessoa.eventId === eventoId));
  }, [adminMockData.pessoas, eventoId]);

  const selectedPessoa = pessoas.find((item) => item.id === selectedPessoaId) || null;

  const filterOptions = useMemo(() => {
    const uniq = (list) => Array.from(new Set(list.filter(Boolean)));
    return {
      fornecedores: uniq(pessoas.map((item) => item.fornecedor)),
      status: uniq(pessoas.map((item) => item.status)),
      tipoAcesso: uniq(pessoas.map((item) => item.tipoAcesso)),
      funcao: uniq(pessoas.map((item) => item.funcao))
    };
  }, [pessoas]);

  const pessoasFiltradas = useMemo(() => {
    return pessoas.filter((pes) => {
      const search = normalize(filters.search);
      const matchSearch = !search || normalize(pes.nome).includes(search) || normalize(pes.cpf).includes(search);
      const matchFornecedor = filters.fornecedor === 'todos' || pes.fornecedor === filters.fornecedor;
      const matchStatus = filters.status === 'todos' || pes.status === filters.status;
      const matchTipo = filters.tipoAcesso === 'todos' || pes.tipoAcesso === filters.tipoAcesso;
      const matchFuncao = filters.funcao === 'todos' || pes.funcao === filters.funcao;
      return matchSearch && matchFornecedor && matchStatus && matchTipo && matchFuncao;
    });
  }, [filters, pessoas]);

  const syncFormData = (pessoa) => {
    if (!pessoa) return;

    setFormData({
      nome: pessoa.nome || '',
      cpf: pessoa.cpf || '',
      fornecedor: pessoa.fornecedor || '',
      funcao: pessoa.funcao || '',
      tipoAcesso: pessoa.tipoAcesso || '',
      status: pessoa.status || ''
    });
  };

  const openCadastroDialog = (pessoa) => {
    setSelectedPessoaId(pessoa.id);
    setIsEditMode(false);
    syncFormData(pessoa);
    setCorrectionMessage('');
    setIsCadastroDialogOpen(true);
  };

  const openEditDialog = (pessoa) => {
    setSelectedPessoaId(pessoa.id);
    setIsEditMode(true);
    syncFormData(pessoa);
    setCorrectionMessage('');
    setIsCadastroDialogOpen(true);
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const persistPessoas = (updatedPessoas) => {
    setPessoas(updatedPessoas);
  };

  const savePessoaCadastro = () => {
    if (!selectedPessoa) return;

    if (!formData.nome.trim() || !formData.cpf.trim() || !formData.fornecedor.trim()) {
      toast.error('Preencha os campos obrigatórios: nome, CPF e fornecedor.');
      return;
    }

    const updatedPessoas = pessoas.map((item) => {
      if (item.id !== selectedPessoa.id) return item;
      return {
        ...item,
        ...formData,
        nome: formData.nome.trim(),
        cpf: formData.cpf.trim(),
        fornecedor: formData.fornecedor.trim(),
        funcao: formData.funcao.trim(),
        tipoAcesso: formData.tipoAcesso.trim(),
        status: formData.status.trim()
      };
    });

    persistPessoas(updatedPessoas);
    patchPerson(selectedPessoa.id, {
      ...formData,
      nome: formData.nome.trim(),
      cpf: formData.cpf.trim(),
      fornecedor: formData.fornecedor.trim(),
      funcao: formData.funcao.trim(),
      tipoAcesso: formData.tipoAcesso.trim(),
      status: formData.status.trim()
    });
    setIsEditMode(false);
    toast.success('Cadastro atualizado com sucesso.');
  };

  const sendCorrectionMessage = () => {
    if (!selectedPessoa) return;

    const message = correctionMessage.trim();
    if (!message) {
      toast.error('Digite a mensagem de correção para o fornecedor.');
      return;
    }

    requestPersonCorrection(selectedPessoa.id, message);
    const updatedPessoas = pessoas.map((item) => (item.id === selectedPessoa.id ? { ...item, status: 'Correcao solicitada' } : item));
    persistPessoas(updatedPessoas);
    setCorrectionMessage('');
    toast.success('Mensagem de correção enviada ao fornecedor.');
  };

  const quickRequestCorrection = (pessoa) => {
    requestPersonCorrection(pessoa.id, 'Corrigir cadastro e reenviar para aprovação.');
    persistPessoas(pessoas.map((item) => (item.id === pessoa.id ? { ...item, status: 'Correcao solicitada' } : item)));
    toast.success('Correção solicitada para o cadastro.');
  };

  const blockPessoaAccess = (pessoa) => {
    blockPerson(pessoa.id);
    persistPessoas(pessoas.map((item) => (item.id === pessoa.id ? { ...item, status: 'Bloqueado' } : item)));
    toast.success('Acesso da pessoa bloqueado com sucesso.');
  };

  const approvePessoa = (pessoa) => {
    approvePerson(pessoa.id);
    persistPessoas(pessoas.map((item) => (item.id === pessoa.id ? { ...item, status: 'Aprovado', statusCode: 'aprovado' } : item)));
    toast.success('Pessoa aprovada com sucesso.');
  };

  const reprovarPessoa = (pessoa) => {
    rejectPerson(pessoa.id, 'Reprovado pela administração');
    persistPessoas(pessoas.map((item) => (item.id === pessoa.id ? { ...item, status: 'Rejeitado', statusCode: 'rejeitado' } : item)));
    toast.error('Pessoa reprovada.');
  };

  const liberarParaGuarita = (pessoa) => {
    releasePersonToGate(pessoa.id);
    persistPessoas(pessoas.map((item) => (item.id === pessoa.id ? { ...item, status: 'Liberado para guarita', statusCode: 'liberado_guarita' } : item)));
    toast.success('Pessoa liberada para guarita.');
  };

  return (
    <>
      <Helmet>
        <title>Pessoas - Detalhes do Evento</title>
      </Helmet>
      
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <EventoDetalheLayout>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">Equipes Credenciadas</h2>
                <p className="text-sm text-muted-foreground">Pessoas cadastradas pelos fornecedores para solicitar acesso ao evento.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                <Input
                  placeholder="Buscar por nome ou CPF"
                  value={filters.search}
                  onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
                  className="md:col-span-2"
                />
                <select value={filters.fornecedor} onChange={(event) => setFilters((prev) => ({ ...prev, fornecedor: event.target.value }))} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  <option value="todos">Fornecedor</option>
                  {filterOptions.fornecedores.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <select value={filters.status} onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  <option value="todos">Status</option>
                  {filterOptions.status.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <select value={filters.tipoAcesso} onChange={(event) => setFilters((prev) => ({ ...prev, tipoAcesso: event.target.value }))} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  <option value="todos">Tipo de acesso</option>
                  {filterOptions.tipoAcesso.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <select value={filters.funcao} onChange={(event) => setFilters((prev) => ({ ...prev, funcao: event.target.value }))} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  <option value="todos">Função</option>
                  {filterOptions.funcao.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              <AdminTable>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="w-16">Foto</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Tipo de Acesso</TableHead>
                      <TableHead>Período solicitado</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Pendências</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pessoasFiltradas.map((pes) => (
                      <TableRow key={pes.id}>
                        <TableCell>
                          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-sm">
                            {pes.iniciais}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-foreground">{pes.nome}</TableCell>
                        <TableCell className="tabular-nums tracking-wide text-muted-foreground">{maskCpf(pes.cpf)}</TableCell>
                        <TableCell>{pes.fornecedor}</TableCell>
                        <TableCell>{pes.funcao}</TableCell>
                        <TableCell>
                          <span className="bg-muted px-2 py-1 rounded-md text-xs">{pes.tipoAcesso}</span>
                        </TableCell>
                        <TableCell>{pes.periodoSolicitado || '-'}</TableCell>
                        <TableCell><StatusBadge status={pes.status} /></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{(pes.issues && pes.issues.length > 0) ? pes.issues.join(' | ') : (pes.motivoPendencia || '-')}</TableCell>
                        <TableCell className="text-right">
                          <ActionMenu actions={[
                            { label: 'Ver cadastro', icon: Eye, onClick: () => openCadastroDialog(pes) },
                            { label: 'Editar', icon: Eye, onClick: () => openEditDialog(pes) },
                            { label: 'Aprovar Pessoa', icon: CheckCircle2, onClick: () => approvePessoa(pes) },
                            { label: 'Solicitar correção', icon: Eye, onClick: () => quickRequestCorrection(pes) },
                            { label: 'Reprovar', icon: ShieldBan, onClick: () => reprovarPessoa(pes) },
                            { label: 'Liberar para Guarita', icon: LogIn, onClick: () => liberarParaGuarita(pes) },
                            { label: 'Bloquear Acesso', icon: ShieldBan, destructive: true, onClick: () => blockPessoaAccess(pes) }
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

      <Dialog open={isCadastroDialogOpen} onOpenChange={setIsCadastroDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Editar cadastro da pessoa' : 'Visualizar cadastro da pessoa'}</DialogTitle>
            <DialogDescription>
              Consulte o cadastro e, se necessário, edite as informações ou envie solicitação de correção ao fornecedor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="pessoa-nome">Nome</Label>
                <Input id="pessoa-nome" value={formData.nome} onChange={(event) => handleFormChange('nome', event.target.value)} disabled={!isEditMode} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="pessoa-cpf">CPF</Label>
                <Input id="pessoa-cpf" value={formData.cpf} onChange={(event) => handleFormChange('cpf', event.target.value)} disabled={!isEditMode} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="pessoa-fornecedor">Fornecedor</Label>
                <Input id="pessoa-fornecedor" value={formData.fornecedor} onChange={(event) => handleFormChange('fornecedor', event.target.value)} disabled={!isEditMode} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="pessoa-funcao">Função</Label>
                <Input id="pessoa-funcao" value={formData.funcao} onChange={(event) => handleFormChange('funcao', event.target.value)} disabled={!isEditMode} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="pessoa-tipo-acesso">Tipo de acesso</Label>
                <Input id="pessoa-tipo-acesso" value={formData.tipoAcesso} onChange={(event) => handleFormChange('tipoAcesso', event.target.value)} disabled={!isEditMode} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="pessoa-status">Status</Label>
                <Input id="pessoa-status" value={formData.status} onChange={(event) => handleFormChange('status', event.target.value)} disabled={!isEditMode} />
              </div>
            </div>

            <div className="space-y-2 border border-border rounded-lg p-3 bg-muted/20">
              <Label htmlFor="mensagem-correcao">Mensagem para correção do cadastro</Label>
              <Textarea
                id="mensagem-correcao"
                value={correctionMessage}
                onChange={(event) => setCorrectionMessage(event.target.value)}
                placeholder="Ex.: Faltou foto legível e confirmação do tipo de acesso. Favor corrigir e reenviar o cadastro."
                className="min-h-[100px]"
              />
              <div className="flex justify-end">
                <Button variant="outline" onClick={sendCorrectionMessage}>Enviar para o fornecedor</Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCadastroDialogOpen(false)}>Fechar</Button>
            {isEditMode ? (
              <Button onClick={savePessoaCadastro}>Salvar alterações</Button>
            ) : (
              <Button onClick={() => setIsEditMode(true)}>Editar cadastro</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EventoDetalhePessoasPage;
