
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppData } from '@/store/AppDataContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Building2, User, FileCheck, CheckCircle2 } from 'lucide-react';

const rules = [
  { id: 'rule1', text: 'Declaro que li e aceito as normas de montagem e desmontagem' },
  { id: 'rule2', text: 'Declaro que as equipes deverão permanecer identificadas' },
  { id: 'rule3', text: 'Declaro que os profissionais utilizarão EPIs quando aplicável' },
  { id: 'rule4', text: 'Declaro que a permanência será limitada aos horários autorizados' },
  { id: 'rule5', text: 'Declaro ciência de que crianças não podem circular nos pavilhões durante montagem e desmontagem' },
  { id: 'rule6', text: 'Declaro ciência de que não é permitido serrar, lixar ou pintar nos pavilhões e salas' },
  { id: 'rule7', text: 'Declaro ciência de que corredores, portas de emergência, hidrantes e painéis elétricos não podem ser obstruídos' },
  { id: 'rule8', text: 'Autorizo o uso dos dados informados para controle de acesso ao evento' }
];

const categories = [
  'Montadora', 'Segurança', 'Limpeza', 'Alimentação', 'Técnico', 'Expositor', 'Prestador de serviço', 'Outro'
];

const initialFormData = {
  // Step 1
  type: 'PJ',
  razaoSocial: '',
  nomeFantasia: '',
  documentoEmpresa: '',
  responsavelEmpresa: '',
  telefoneEmpresa: '',
  emailEmpresa: '',
  segmento: '',
  categoria: '',
  
  // Step 2
  nomeGestor: '',
  cpfGestor: '',
  cargoGestor: '',
  telefoneGestor: '',
  emailGestor: '',
  
  // Step 3
  acceptedRules: []
};

const CadastroFornecedorPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const location = useLocation();
  const { createSupplierFromInvitation, getInvitationById } = useAppData();
  
  const eventName = location.state?.eventName || 'Feira Construir SC 2026';
  const initialEmail = location.state?.email || '';
  const invitationId = location.state?.invitationId || null;
  const invitation = invitationId ? getInvitationById(invitationId) : null;
  const isSupplierInvitation = Boolean(invitation && invitation.inviteType === 'supplier');

  // Carregar dados salvos
  useEffect(() => {
    const saved = localStorage.getItem('cadastroFornecedor');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Error parsing saved data');
      }
    } else if (initialEmail) {
      setFormData(prev => ({ ...prev, emailEmpresa: initialEmail }));
    }
  }, [initialEmail]);

  // Salvar dados a cada mudança
  useEffect(() => {
    localStorage.setItem('cadastroFornecedor', JSON.stringify(formData));
  }, [formData]);

  const updateForm = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.razaoSocial) newErrors.razaoSocial = 'Campo obrigatório';
    if (!formData.documentoEmpresa) newErrors.documentoEmpresa = 'Campo obrigatório';
    if (!formData.responsavelEmpresa) newErrors.responsavelEmpresa = 'Campo obrigatório';
    if (!formData.telefoneEmpresa) newErrors.telefoneEmpresa = 'Campo obrigatório';
    if (!formData.emailEmpresa) newErrors.emailEmpresa = 'Campo obrigatório';
    if (!formData.categoria) newErrors.categoria = 'Selecione uma categoria';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.nomeGestor) newErrors.nomeGestor = 'Campo obrigatório';
    if (!formData.cpfGestor) newErrors.cpfGestor = 'Campo obrigatório';
    if (!formData.telefoneGestor) newErrors.telefoneGestor = 'Campo obrigatório';
    if (!formData.emailGestor) newErrors.emailGestor = 'Campo obrigatório';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep === 3 && formData.acceptedRules.length < rules.length) {
      setErrors({ rules: 'Você deve aceitar todas as normas para prosseguir.' });
      return;
    }
    
    setCurrentStep(prev => Math.min(prev + 1, 4));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = () => {
    if (!invitationId || !isSupplierInvitation) {
      setErrors({ form: 'Convite nao encontrado. Refaca a validacao do convite.' });
      return;
    }

    const createdSupplier = createSupplierFromInvitation(invitationId, {
      nome: formData.nomeFantasia || formData.razaoSocial,
      categoria: formData.categoria,
      responsavel: formData.responsavelEmpresa,
      classificacao: 'Temporario',
      documentoEmpresa: formData.documentoEmpresa,
      telefoneEmpresa: formData.telefoneEmpresa,
      emailEmpresa: formData.emailEmpresa,
      nomeGestor: formData.nomeGestor,
      cpfGestor: formData.cpfGestor,
      telefoneGestor: formData.telefoneGestor,
      emailGestor: formData.emailGestor,
      acceptedRules: formData.acceptedRules
    });

    if (!createdSupplier) {
      setErrors({ form: 'Este convite nao permite cadastro de fornecedor. Valide um convite de fornecedor ativo.' });
      return;
    }

    localStorage.removeItem('cadastroFornecedor');
    navigate('/sucesso-cadastro');
  };

  const toggleRule = (ruleId) => {
    setFormData(prev => {
      const isAccepted = prev.acceptedRules.includes(ruleId);
      const newRules = isAccepted 
        ? prev.acceptedRules.filter(id => id !== ruleId)
        : [...prev.acceptedRules, ruleId];
      
      if (newRules.length === rules.length) {
        setErrors(prevErrors => ({ ...prevErrors, rules: null }));
      }
      
      return { ...prev, acceptedRules: newRules };
    });
  };

  const steps = [
    { icon: Building2, title: 'Dados da Empresa' },
    { icon: User, title: 'Gestor Operacional' },
    { icon: FileCheck, title: 'Normas e Aceites' },
    { icon: CheckCircle2, title: 'Confirmação' }
  ];

  if (!isSupplierInvitation) {
    return (
      <>
        <Helmet>
          <title>Cadastro de Fornecedor - Expocentro Acesso</title>
        </Helmet>

        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <Card className="w-full max-w-xl border-border">
            <CardHeader>
              <CardTitle>Acesso indisponível</CardTitle>
              <CardDescription>Esta tela é exclusiva para convites do tipo fornecedor.</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Link to="/validar-convite">
                <Button>Validar convite</Button>
              </Link>
              <Link to="/">
                <Button variant="outline">Voltar ao início</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Cadastro de Fornecedor - Expocentro Acesso</title>
        <meta name="description" content="Formulário de credenciamento de fornecedor" />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <header className="bg-primary py-6 px-6 text-primary-foreground shadow-md sticky top-0 z-10">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10 rounded-full">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold">Credenciamento</h1>
                <p className="text-sm text-primary-foreground/80">{eventName}</p>
              </div>
            </div>
            
            <div className="text-sm font-medium bg-primary-foreground/20 px-3 py-1 rounded-full">
              Passo {currentStep} de 4
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-3xl w-full mx-auto p-4 py-8">
          {/* Progress Indicator */}
          <div className="flex justify-between items-center mb-10 relative">
            <div className="absolute left-0 right-0 top-1/2 h-1 bg-border -z-10 transform -translate-y-1/2 rounded-full"></div>
            <div className="absolute left-0 top-1/2 h-1 bg-secondary -z-10 transform -translate-y-1/2 rounded-full transition-all duration-500" style={{ width: `${((currentStep - 1) / 3) * 100}%` }}></div>
            
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index + 1 === currentStep;
              const isCompleted = index + 1 < currentStep;
              
              return (
                <div key={index} className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
                    isActive ? 'bg-background border-secondary text-secondary' : 
                    isCompleted ? 'bg-secondary border-secondary text-secondary-foreground' : 
                    'bg-background border-border text-muted-foreground'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-xs mt-2 font-medium hidden sm:block ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>

          <Card className="border-border">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <CardHeader className="bg-muted/30 border-b border-border/50">
                    <CardTitle className="text-xl">Dados da Empresa</CardTitle>
                    <CardDescription>Informações básicas sobre a fornecedora</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    <div className="space-y-3">
                      <Label className="text-base">Tipo de pessoa</Label>
                      <RadioGroup 
                        value={formData.type} 
                        onValueChange={(val) => updateForm('type', val)}
                        className="flex gap-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="PJ" id="pj" />
                          <Label htmlFor="pj" className="font-normal cursor-pointer">Pessoa Jurídica</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="PF" id="pf" />
                          <Label htmlFor="pf" className="font-normal cursor-pointer">Pessoa Física</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="razaoSocial">
                          {formData.type === 'PJ' ? 'Razão social' : 'Nome completo'} <span className="text-destructive">*</span>
                        </Label>
                        <Input 
                          id="razaoSocial" 
                          value={formData.razaoSocial}
                          onChange={(e) => updateForm('razaoSocial', e.target.value)}
                          className={`text-foreground ${errors.razaoSocial ? 'border-destructive' : ''}`}
                        />
                        {errors.razaoSocial && <p className="text-xs text-destructive">{errors.razaoSocial}</p>}
                      </div>
                      
                      {formData.type === 'PJ' && (
                        <div className="space-y-2">
                          <Label htmlFor="nomeFantasia">Nome fantasia</Label>
                          <Input 
                            id="nomeFantasia" 
                            value={formData.nomeFantasia}
                            onChange={(e) => updateForm('nomeFantasia', e.target.value)}
                            className="text-foreground"
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="documentoEmpresa">
                          {formData.type === 'PJ' ? 'CNPJ' : 'CPF'} <span className="text-destructive">*</span>
                        </Label>
                        <Input 
                          id="documentoEmpresa" 
                          value={formData.documentoEmpresa}
                          onChange={(e) => updateForm('documentoEmpresa', e.target.value)}
                          className={`text-foreground ${errors.documentoEmpresa ? 'border-destructive' : ''}`}
                        />
                        {errors.documentoEmpresa && <p className="text-xs text-destructive">{errors.documentoEmpresa}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="responsavelEmpresa">Responsável <span className="text-destructive">*</span></Label>
                        <Input 
                          id="responsavelEmpresa" 
                          value={formData.responsavelEmpresa}
                          onChange={(e) => updateForm('responsavelEmpresa', e.target.value)}
                          className={`text-foreground ${errors.responsavelEmpresa ? 'border-destructive' : ''}`}
                        />
                        {errors.responsavelEmpresa && <p className="text-xs text-destructive">{errors.responsavelEmpresa}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="telefoneEmpresa">Telefone/WhatsApp <span className="text-destructive">*</span></Label>
                        <Input 
                          id="telefoneEmpresa" 
                          value={formData.telefoneEmpresa}
                          onChange={(e) => updateForm('telefoneEmpresa', e.target.value)}
                          className={`text-foreground ${errors.telefoneEmpresa ? 'border-destructive' : ''}`}
                        />
                        {errors.telefoneEmpresa && <p className="text-xs text-destructive">{errors.telefoneEmpresa}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="emailEmpresa">E-mail <span className="text-destructive">*</span></Label>
                        <Input 
                          id="emailEmpresa" 
                          type="email"
                          value={formData.emailEmpresa}
                          onChange={(e) => updateForm('emailEmpresa', e.target.value)}
                          className={`text-foreground ${errors.emailEmpresa ? 'border-destructive' : ''}`}
                        />
                        {errors.emailEmpresa && <p className="text-xs text-destructive">{errors.emailEmpresa}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="segmento">Segmento/atividade</Label>
                        <Input 
                          id="segmento" 
                          value={formData.segmento}
                          onChange={(e) => updateForm('segmento', e.target.value)}
                          className="text-foreground"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="categoria">Categoria principal <span className="text-destructive">*</span></Label>
                        <Select 
                          value={formData.categoria} 
                          onValueChange={(val) => updateForm('categoria', val)}
                        >
                          <SelectTrigger className={`text-foreground ${errors.categoria ? 'border-destructive' : ''}`}>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(cat => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.categoria && <p className="text-xs text-destructive">{errors.categoria}</p>}
                      </div>
                    </div>

                    <div className="space-y-2 mt-4 p-4 bg-muted/30 rounded-lg border border-border">
                      <Label htmlFor="eventoVinculado">Evento vinculado</Label>
                      <Input 
                        id="eventoVinculado" 
                        value={eventName}
                        readOnly
                        disabled
                        className="bg-muted text-muted-foreground font-medium"
                      />
                      <p className="text-xs text-muted-foreground">Este campo é preenchido automaticamente pelo convite validado.</p>
                    </div>
                  </CardContent>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <CardHeader className="bg-muted/30 border-b border-border/50">
                    <CardTitle className="text-xl">Gestor Operacional</CardTitle>
                    <CardDescription>Pessoa responsável pela equipe durante o evento</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="nomeGestor">Nome completo <span className="text-destructive">*</span></Label>
                        <Input 
                          id="nomeGestor" 
                          value={formData.nomeGestor}
                          onChange={(e) => updateForm('nomeGestor', e.target.value)}
                          className={`text-foreground ${errors.nomeGestor ? 'border-destructive' : ''}`}
                        />
                        {errors.nomeGestor && <p className="text-xs text-destructive">{errors.nomeGestor}</p>}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="cpfGestor">CPF <span className="text-destructive">*</span></Label>
                        <Input 
                          id="cpfGestor" 
                          value={formData.cpfGestor}
                          onChange={(e) => updateForm('cpfGestor', e.target.value)}
                          className={`text-foreground ${errors.cpfGestor ? 'border-destructive' : ''}`}
                        />
                        {errors.cpfGestor && <p className="text-xs text-destructive">{errors.cpfGestor}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cargoGestor">Cargo/função</Label>
                        <Input 
                          id="cargoGestor" 
                          value={formData.cargoGestor}
                          onChange={(e) => updateForm('cargoGestor', e.target.value)}
                          className="text-foreground"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="telefoneGestor">Telefone/WhatsApp <span className="text-destructive">*</span></Label>
                        <Input 
                          id="telefoneGestor" 
                          value={formData.telefoneGestor}
                          onChange={(e) => updateForm('telefoneGestor', e.target.value)}
                          className={`text-foreground ${errors.telefoneGestor ? 'border-destructive' : ''}`}
                        />
                        {errors.telefoneGestor && <p className="text-xs text-destructive">{errors.telefoneGestor}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="emailGestor">E-mail <span className="text-destructive">*</span></Label>
                        <Input 
                          id="emailGestor" 
                          type="email"
                          value={formData.emailGestor}
                          onChange={(e) => updateForm('emailGestor', e.target.value)}
                          className={`text-foreground ${errors.emailGestor ? 'border-destructive' : ''}`}
                        />
                        {errors.emailGestor && <p className="text-xs text-destructive">{errors.emailGestor}</p>}
                      </div>
                    </div>
                  </CardContent>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <CardHeader className="bg-muted/30 border-b border-border/50">
                    <CardTitle className="text-xl">Normas e Aceites</CardTitle>
                    <CardDescription>Leia atentamente e aceite as regras de acesso ao pavilhão</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {rules.map((rule) => (
                        <div key={rule.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/30 transition-colors border border-transparent hover:border-border">
                          <Checkbox 
                            id={rule.id} 
                            checked={formData.acceptedRules.includes(rule.id)}
                            onCheckedChange={() => toggleRule(rule.id)}
                            className="mt-1"
                          />
                          <Label 
                            htmlFor={rule.id}
                            className="text-sm font-medium leading-relaxed text-foreground cursor-pointer"
                          >
                            {rule.text}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {errors.rules && (
                      <div className="mt-6 p-4 rounded-lg bg-destructive/10 text-destructive text-sm font-medium">
                        {errors.rules}
                      </div>
                    )}
                  </CardContent>
                </motion.div>
              )}

              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <CardHeader className="bg-muted/30 border-b border-border/50">
                    <CardTitle className="text-xl">Confirmação dos Dados</CardTitle>
                    <CardDescription>Revise as informações antes de enviar para análise</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-8">
                    
                    <div>
                      <h3 className="text-lg font-semibold text-primary mb-4 flex items-center border-b border-border pb-2">
                        <Building2 className="w-5 h-5 mr-2" />
                        Dados da Empresa
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                        <div>
                          <p className="text-muted-foreground">Razão social / Nome</p>
                          <p className="font-medium text-foreground">{formData.razaoSocial}</p>
                        </div>
                        {formData.type === 'PJ' && formData.nomeFantasia && (
                          <div>
                            <p className="text-muted-foreground">Nome fantasia</p>
                            <p className="font-medium text-foreground">{formData.nomeFantasia}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-muted-foreground">{formData.type === 'PJ' ? 'CNPJ' : 'CPF'}</p>
                          <p className="font-medium text-foreground">{formData.documentoEmpresa}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Categoria</p>
                          <p className="font-medium text-foreground">{formData.categoria}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Responsável</p>
                          <p className="font-medium text-foreground">{formData.responsavelEmpresa}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Contato</p>
                          <p className="font-medium text-foreground">{formData.telefoneEmpresa} <br/> {formData.emailEmpresa}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-primary mb-4 flex items-center border-b border-border pb-2">
                        <User className="w-5 h-5 mr-2" />
                        Gestor Operacional
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                        <div>
                          <p className="text-muted-foreground">Nome completo</p>
                          <p className="font-medium text-foreground">{formData.nomeGestor}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">CPF</p>
                          <p className="font-medium text-foreground">{formData.cpfGestor}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Cargo</p>
                          <p className="font-medium text-foreground">{formData.cargoGestor || '-'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Contato</p>
                          <p className="font-medium text-foreground">{formData.telefoneGestor} <br/> {formData.emailGestor}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-primary mb-4 flex items-center border-b border-border pb-2">
                        <FileCheck className="w-5 h-5 mr-2" />
                        Aceite de Normas
                      </h3>
                      <div className="bg-muted/30 text-foreground p-4 rounded-lg flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 mt-0.5" />
                        <p className="text-sm font-medium">Todas as {rules.length} normas e termos de responsabilidade foram lidos e aceitos.</p>
                      </div>
                    </div>

                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="p-6 border-t border-border bg-muted/10 flex justify-between rounded-b-xl">
              <Button 
                variant="outline" 
                onClick={handleBack} 
                disabled={currentStep === 1}
                className="w-32"
              >
                Voltar
              </Button>
              
              {currentStep < 4 ? (
                <Button onClick={handleNext} className="w-32 group">
                  Próximo
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} className="w-40 bg-secondary text-secondary-foreground hover:bg-secondary/90">
                  Enviar cadastro
                </Button>
              )}
            </div>
          </Card>
        </main>
      </div>
    </>
  );
};

export default CadastroFornecedorPage;
