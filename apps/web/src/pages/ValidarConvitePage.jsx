
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppData } from '@/store/AppDataContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Ticket, Calendar, MapPin, Building, ArrowRight, AlertCircle } from 'lucide-react';

const getSpacesText = (invitation, event) => {
  const fromInvitation = invitation?.espacosLiberados ?? invitation?.espacosLocados;
  if (Array.isArray(fromInvitation) && fromInvitation.length > 0) return fromInvitation.join(', ');
  if (typeof fromInvitation === 'string' && fromInvitation.trim()) return fromInvitation.trim();

  const fromEvent = event?.espacosLocados;
  if (Array.isArray(fromEvent) && fromEvent.length > 0) return fromEvent.join(', ');
  if (typeof fromEvent === 'string' && fromEvent.trim()) return fromEvent.trim();

  return 'Não informado';
};

const ValidarConvitePage = () => {
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isValidated, setIsValidated] = useState(false);
  const [validatedInvitation, setValidatedInvitation] = useState(null);
  const navigate = useNavigate();
  const { validateInvitationCode, getEventById } = useAppData();
  const codeFromQuery = String(searchParams.get('codigo') || '').toUpperCase();
  const validatedEvent = validatedInvitation ? getEventById(validatedInvitation.eventId) : null;
  const spacesText = getSpacesText(validatedInvitation, validatedEvent);

  const handleValidate = (e) => {
    e.preventDefault();
    setError('');

    const targetCode = String(code || codeFromQuery || '').toUpperCase();
    const invitation = validateInvitationCode(targetCode);
    if (!invitation) {
      setError('Convite não localizado ou expirado. Solicite um novo link à administração do Expocentro ou ao organizador do evento.');
      return;
    }

    if (!email.trim()) {
      setError('Por favor, informe seu e-mail.');
      return;
    }

    setValidatedInvitation(invitation);
    setIsValidated(true);

    if (String(invitation.email || '').toLowerCase() !== String(email || '').toLowerCase()) {
      setError('Atenção: o e-mail informado é diferente do e-mail do convite, mas você pode continuar para teste de fluxo.');
    } else {
      setError('');
    }
  };

  const handleContinue = () => {
    const event = validatedInvitation ? getEventById(validatedInvitation.eventId) : null;
    const invitationType = validatedInvitation?.inviteType === 'organizer' ? 'organizer' : 'supplier';

    if (invitationType === 'organizer') {
      navigate('/portal-organizador', {
        state: {
          email,
          invitationId: validatedInvitation?.id
        }
      });
      return;
    }

    navigate('/cadastro-fornecedor', {
      state: {
        email,
        invitationId: validatedInvitation?.id,
        eventId: validatedInvitation?.eventId,
        eventName: event?.nome || 'Feira Construir SC 2026'
      }
    });
  };

  return (
    <>
      <Helmet>
        <title>Validar Convite - Expocentro Acesso</title>
        <meta name="description" content="Valide seu convite para iniciar o credenciamento" />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        {/* Header simplificado */}
        <header className="bg-primary py-4 px-6">
          <div className="max-w-4xl mx-auto flex items-center">
            <Link to="/">
              <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Voltar
              </Button>
            </Link>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4 py-12">
          <div className="w-full max-w-xl">
            <AnimatePresence mode="wait">
              {!isValidated ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-border">
                    <CardHeader className="text-center pb-8 border-b border-border bg-muted/20">
                      <div className="w-16 h-16 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto mb-4">
                        <Ticket className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <CardTitle className="text-2xl text-foreground">Validar Convite</CardTitle>
                      <CardDescription className="text-base mt-2">
                        Insira o código do convite e seu e-mail para validar o acesso ao evento.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-8">
                      <form onSubmit={handleValidate} className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="code" className="text-foreground font-medium">Código do convite</Label>
                          <Input
                            id="code"
                            type="text"
                            placeholder="Ex: FEIRA-CONSTRUIR-2026"
                            value={code || codeFromQuery}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            required
                            className="text-foreground placeholder:text-muted-foreground uppercase h-12 text-lg"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-foreground font-medium">E-mail de acesso</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="seu@email.com.br"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="text-foreground placeholder:text-muted-foreground h-12"
                          />
                        </div>

                        {error && (
                          <div className="p-4 rounded-lg bg-muted/30 text-foreground text-sm flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            <p>{error}</p>
                          </div>
                        )}

                        <Button 
                          type="submit" 
                          size="lg"
                          className="w-full text-base h-12"
                        >
                          Validar convite
                        </Button>
                      </form>
                      
                      <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-border">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Para testar, use:</p>
                        <p className="text-sm text-foreground font-mono">ORG-FEIRA-2026 ou FEIRA-CONSTRUIR-2026</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-border overflow-hidden">
                      <div className="bg-muted p-6 text-foreground flex justify-between items-start">
                      <div>
                        <h2 className="text-2xl font-bold mb-1">{validatedEvent?.nome || 'Feira Construir SC 2026'}</h2>
                        <p className="flex items-center text-muted-foreground">
                          <Building className="w-4 h-4 mr-2" />
                          {validatedEvent?.organizador || 'SC Feiras & Eventos'}
                        </p>
                      </div>
                      <Badge className="bg-green-500 hover:bg-green-600 text-white border-none">
                        Cadastro aberto
                      </Badge>
                    </div>
                    
                    <CardContent className="p-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                        <div className="p-6 space-y-6">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1 font-medium flex items-center">
                              <Calendar className="w-4 h-4 mr-2" />
                              Datas do Evento
                            </p>
                            <p className="text-foreground font-medium">{validatedEvent?.periodo || '15/07/2026 a 18/07/2026'}</p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-muted-foreground mb-1 font-medium">Montagem</p>
                            <p className="text-foreground">10/07/2026 a 14/07/2026</p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-muted-foreground mb-1 font-medium">Desmontagem</p>
                            <p className="text-foreground">19/07/2026 a 20/07/2026</p>
                          </div>
                        </div>
                        
                        <div className="p-6 flex flex-col justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1 font-medium flex items-center">
                              <MapPin className="w-4 h-4 mr-2" />
                              Espaços liberados
                            </p>
                            <p className="text-foreground">{spacesText}</p>
                          </div>
                          
                          <div className="mt-8 pt-6 border-t border-border">
                            <p className="text-sm text-muted-foreground mb-4">
                              Seu e-mail <strong>{email}</strong> será vinculado a este credenciamento.
                            </p>
                            <Button 
                              onClick={handleContinue}
                              size="lg"
                              className="w-full group"
                            >
                              {validatedInvitation?.inviteType === 'organizer'
                                ? 'Acessar Portal do Organizador'
                                : 'Continuar cadastro de fornecedor'}
                              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </>
  );
};

export default ValidarConvitePage;
