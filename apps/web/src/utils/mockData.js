
export const mockEvents = [
  {
    id: 'evt-1',
    name: 'Feira Construir SC 2026',
    period: '15/07/2026 a 18/07/2026',
    credenciamentoStatus: 'Aberto',
    prazoEnvio: '10/07/2026',
    pessoasCadastradas: 12,
    statusFornecedor: 'Aprovado',
    aceiteNormas: true,
    taxa: 'Paga'
  },
  {
    id: 'evt-2',
    name: 'Expo Indústria Tech',
    period: '22/08/2026 a 25/08/2026',
    credenciamentoStatus: 'Aberto',
    prazoEnvio: '15/08/2026',
    pessoasCadastradas: 4,
    statusFornecedor: 'Aguardando aprovação',
    aceiteNormas: true,
    taxa: 'Pendente'
  },
  {
    id: 'evt-3',
    name: 'Salão do Automóvel Sul',
    period: '10/09/2026 a 15/09/2026',
    credenciamentoStatus: 'Em breve',
    prazoEnvio: '01/09/2026',
    pessoasCadastradas: 0,
    statusFornecedor: 'Correção solicitada',
    aceiteNormas: false,
    taxa: 'Não gerada'
  }
];

export const mockPeople = [
  {
    id: 'p-1',
    nome: 'Maya Chen',
    cpf: '123.456.789-00',
    rg: '12.345.678-9',
    telefone: '(11) 98765-4321',
    funcao: 'Coordenador de equipe',
    tipoAcesso: 'Todos os períodos',
    periodoSolicitado: '10/07 a 20/07',
    status: 'Aprovado',
    observacoes: '',
    temPendencia: false,
    motivoPendencia: null,
    dataCadastro: '2026-06-25T10:30:00Z',
    avatarBg: 'bg-emerald-100 text-emerald-700'
  },
  {
    id: 'p-2',
    nome: 'Raj Patel',
    cpf: '234.567.890-11',
    rg: '',
    telefone: '(11) 91234-5678',
    funcao: 'Montador',
    tipoAcesso: 'Montagem',
    periodoSolicitado: '10/07 a 14/07',
    status: 'Rascunho',
    observacoes: 'Aguardando envio da foto',
    temPendencia: true,
    motivoPendencia: 'Falta foto de identificação',
    dataCadastro: '2026-07-01T14:20:00Z',
    avatarBg: 'bg-amber-100 text-amber-700'
  },
  {
    id: 'p-3',
    nome: 'Lucia Torres',
    cpf: '345.678.901-22',
    rg: '34.567.890-1',
    telefone: '(21) 99876-5432',
    funcao: 'Eletricista',
    tipoAcesso: 'Todos os períodos',
    periodoSolicitado: '10/07 a 20/07',
    status: 'Correção solicitada',
    observacoes: '',
    temPendencia: true,
    motivoPendencia: 'Documento ilegível, favor reenviar RG.',
    dataCadastro: '2026-06-28T09:15:00Z',
    avatarBg: 'bg-rose-100 text-rose-700'
  },
  {
    id: 'p-4',
    nome: 'Kwame Asante',
    cpf: '456.789.012-33',
    rg: '45.678.901-2',
    telefone: '(47) 98888-7777',
    funcao: 'Segurança',
    tipoAcesso: 'Evento',
    periodoSolicitado: '15/07 a 18/07',
    status: 'Em análise',
    observacoes: 'Turno noturno',
    temPendencia: false,
    motivoPendencia: null,
    dataCadastro: '2026-07-02T08:45:00Z',
    avatarBg: 'bg-blue-100 text-blue-700'
  },
  {
    id: 'p-5',
    nome: 'Anika Bergström',
    cpf: '567.890.123-44',
    rg: '56.789.012-3',
    telefone: '(41) 97777-6666',
    funcao: 'Técnico de iluminação',
    tipoAcesso: 'Montagem',
    periodoSolicitado: '12/07 a 14/07',
    status: 'Liberado para guarita',
    observacoes: '',
    temPendencia: false,
    motivoPendencia: null,
    dataCadastro: '2026-06-20T16:00:00Z',
    avatarBg: 'bg-purple-100 text-purple-700'
  }
];
