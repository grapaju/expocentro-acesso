
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useLocation } from 'react-router-dom';
import { FornecedorSidebar } from '@/components/Sidebar.jsx';
import Header from '@/components/Header.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useFornecedorData } from '@/hooks/useFornecedorData.js';
import { toast } from 'sonner';
import { UploadCloud, ArrowLeft, Image as ImageIcon } from 'lucide-react';

const FUNCOES = [
  'Montador', 'Eletricista', 'Segurança', 'Auxiliar de limpeza', 
  'Técnico de som', 'Técnico de iluminação', 'Coordenador de equipe', 
  'Expositor', 'Recepcionista', 'Motorista', 'Outro'
];

const TIPOS_ACESSO = [
  'Montagem', 'Evento', 'Desmontagem', 'Todos os períodos'
];

const formatCPF = (value) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

const formatPhone = (value) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1');
};

const CadastroPessoasPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addPerson, updatePerson, people } = useFornecedorData();
  
  const editingPerson = location.state?.person || null;

  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    rg: '',
    telefone: '',
    funcao: '',
    tipoAcesso: '',
    periodoSolicitado: '',
    observacoes: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editingPerson) {
      setFormData({
        nome: editingPerson.nome || '',
        cpf: editingPerson.cpf || '',
        rg: editingPerson.rg || '',
        telefone: editingPerson.telefone || '',
        funcao: editingPerson.funcao || '',
        tipoAcesso: editingPerson.tipoAcesso || '',
        periodoSolicitado: editingPerson.periodoSolicitado || '',
        observacoes: editingPerson.observacoes || ''
      });
    }
  }, [editingPerson]);

  const validate = () => {
    const newErrors = {};
    if (!formData.nome.trim()) newErrors.nome = 'Nome é obrigatório';
    if (!formData.cpf.trim() || formData.cpf.length < 14) newErrors.cpf = 'CPF inválido';
    if (!formData.funcao) newErrors.funcao = 'Função é obrigatória';
    if (!formData.tipoAcesso) newErrors.tipoAcesso = 'Tipo de acesso é obrigatório';
    if (!formData.periodoSolicitado.trim()) newErrors.periodoSolicitado = 'Período é obrigatório';

    // Duplicate CPF check
    if (formData.cpf && !editingPerson) {
      const exists = people.find(p => p.cpf === formData.cpf);
      if (exists) newErrors.cpf = 'CPF já cadastrado na sua equipe';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (status) => {
    if (status === 'aguardando_aprovacao' && !validate()) {
      toast.error('Preencha os campos obrigatórios para enviar');
      return;
    }

    if (editingPerson) {
      updatePerson(editingPerson.id, { ...formData, status });
      toast.success(status === 'Rascunho' ? 'Rascunho atualizado' : 'Cadastro enviado para análise');
    } else {
      addPerson(formData, status);
      toast.success(status === 'Rascunho' ? 'Salvo como rascunho' : 'Pessoa cadastrada com sucesso');
    }
    
    navigate('/pessoas-cadastradas');
  };

  return (
    <>
      <Helmet>
        <title>Cadastrar Pessoa - Expocentro Acesso</title>
      </Helmet>

      <div className="flex min-h-screen bg-background">
        <FornecedorSidebar />
        
        <div className="flex-1 flex flex-col">
          <Header />
          
          <main className="flex-1 p-6 md:p-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">
                    {editingPerson ? 'Editar Cadastro' : 'Cadastrar Pessoa'}
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Insira os dados do profissional para liberação de acesso
                  </p>
                </div>
              </div>

              <Card className="border-border shadow-sm">
                <CardHeader className="bg-muted/30 border-b border-border/50">
                  <CardTitle>Informações do Profissional</CardTitle>
                  <CardDescription>A foto é obrigatória para a confecção da credencial</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    
                    {/* Photo Upload Area */}
                    <div className="md:col-span-4 space-y-4">
                      <Label>Foto de Rosto (Padrão documento)</Label>
                      <div className="w-full aspect-[3/4] rounded-xl border-2 border-dashed border-border bg-muted/30 flex flex-col items-center justify-center p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer group">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <ImageIcon className="w-6 h-6 text-primary" />
                        </div>
                        <p className="text-sm font-medium text-foreground mb-1">Clique para enviar</p>
                        <p className="text-xs text-muted-foreground">JPG ou PNG até 5MB</p>
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div className="md:col-span-8 space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="nome">Nome completo <span className="text-destructive">*</span></Label>
                        <Input 
                          id="nome" 
                          value={formData.nome}
                          onChange={(e) => setFormData({...formData, nome: e.target.value})}
                          className={`text-foreground ${errors.nome ? 'border-destructive' : ''}`}
                        />
                        {errors.nome && <p className="text-xs text-destructive">{errors.nome}</p>}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="cpf">CPF <span className="text-destructive">*</span></Label>
                          <Input 
                            id="cpf" 
                            value={formData.cpf}
                            onChange={(e) => setFormData({...formData, cpf: formatCPF(e.target.value)})}
                            maxLength={14}
                            className={`text-foreground ${errors.cpf ? 'border-destructive' : ''}`}
                            disabled={!!editingPerson}
                          />
                          {errors.cpf && <p className="text-xs text-destructive">{errors.cpf}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="rg">RG (Opcional)</Label>
                          <Input 
                            id="rg" 
                            value={formData.rg}
                            onChange={(e) => setFormData({...formData, rg: e.target.value})}
                            className="text-foreground"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="telefone">Telefone (Opcional)</Label>
                          <Input 
                            id="telefone" 
                            value={formData.telefone}
                            onChange={(e) => setFormData({...formData, telefone: formatPhone(e.target.value)})}
                            maxLength={15}
                            className="text-foreground"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="funcao">Função <span className="text-destructive">*</span></Label>
                          <Select 
                            value={formData.funcao} 
                            onValueChange={(val) => setFormData({...formData, funcao: val})}
                          >
                            <SelectTrigger className={`text-foreground ${errors.funcao ? 'border-destructive' : ''}`}>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                              {FUNCOES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          {errors.funcao && <p className="text-xs text-destructive">{errors.funcao}</p>}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="tipoAcesso">Tipo de acesso <span className="text-destructive">*</span></Label>
                          <Select 
                            value={formData.tipoAcesso} 
                            onValueChange={(val) => setFormData({...formData, tipoAcesso: val})}
                          >
                            <SelectTrigger className={`text-foreground ${errors.tipoAcesso ? 'border-destructive' : ''}`}>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                              {TIPOS_ACESSO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          {errors.tipoAcesso && <p className="text-xs text-destructive">{errors.tipoAcesso}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="periodo">Período solicitado <span className="text-destructive">*</span></Label>
                          <Input 
                            id="periodo" 
                            placeholder="Ex: 10/07 a 15/07"
                            value={formData.periodoSolicitado}
                            onChange={(e) => setFormData({...formData, periodoSolicitado: e.target.value})}
                            className={`text-foreground ${errors.periodoSolicitado ? 'border-destructive' : ''}`}
                          />
                          {errors.periodoSolicitado && <p className="text-xs text-destructive">{errors.periodoSolicitado}</p>}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="observacoes">Observações (Opcional)</Label>
                        <Textarea 
                          id="observacoes" 
                          rows={3}
                          value={formData.observacoes}
                          onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                          className="text-foreground resize-none"
                          placeholder="Informações adicionais para a administração..."
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
                
                <div className="p-6 border-t border-border bg-muted/10 flex justify-end gap-3 rounded-b-xl">
                  <Button 
                    variant="outline" 
                    onClick={() => handleSave('Rascunho')}
                    className="transition-all active:scale-[0.98]"
                  >
                    Salvar como rascunho
                  </Button>
                  <Button 
                    onClick={() => handleSave('aguardando_aprovacao')}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-[0.98]"
                  >
                    <UploadCloud className="w-4 h-4 mr-2" />
                    Enviar para análise
                  </Button>
                </div>
              </Card>

            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default CadastroPessoasPage;
