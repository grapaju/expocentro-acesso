import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'expocentro_app_data_v1';

const DOC_TYPES = [
  'Contrato assinado',
  'Plano do evento',
  'Planta/layout do evento',
  'Alvara eventual',
  'ART',
  'ECAD',
  'Outros documentos operacionais'
];

const SUPPLIER_CATEGORIES = [
  'Montadora',
  'Segurança',
  'Limpeza',
  'Alimentação',
  'Audiovisual',
  'Expositor',
  'Prestador de serviço',
  'Outro'
];

const ADMIN_CLASSIFICATIONS = [
  'Parceiro recorrente',
  'Oficial',
  'Obrigatório',
  'Prestador fixo',
  'Temporário',
  'Bloqueado'
];

const PARTNER_STATUSES = [
  'Ativo',
  'Inativo',
  'Bloqueado',
  'Documentação pendente',
  'Aguardando atualização cadastral'
];

const formatDateTimeBr = (date = new Date()) => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

const formatDateBr = (date = new Date()) => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
};

const parseBrDate = (value) => {
  const [day, month, year] = String(value || '').split('/');
  if (!day || !month || !year) return null;
  const parsed = new Date(`${year}-${month}-${day}T23:59:59`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getDefaultInvitationValidity = () => {
  const base = new Date();
  base.setDate(base.getDate() + 7);
  return formatDateBr(base);
};

const normalizeInviteCode = (value) => {
  let raw = String(value || '').trim();
  if (!raw) return '';

  try {
    if (/^https?:\/\//i.test(raw)) {
      const parsed = new URL(raw);
      raw = parsed.searchParams.get('codigo') || raw;
    }
  } catch {
    // Ignore invalid URL inputs and continue with plain-text normalization.
  }

  if (/^codigo=/i.test(raw)) {
    raw = raw.replace(/^codigo=/i, '');
  }

  try {
    raw = decodeURIComponent(raw);
  } catch {
    // Keep original value when decodeURIComponent fails.
  }

  return raw
    .trim()
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, '-')
    .replace(/^["'`\u2018\u2019\u201C\u201D]+|["'`\u2018\u2019\u201C\u201D]+$/g, '')
    .replace(/\s+/g, '')
    .replace(/[.,;:!?\)\]\}]+$/g, '')
    .replace(/[^A-Z0-9-]/gi, '')
    .toUpperCase();
};

const normalizeSupplier = (supplier) => {
  const statusCadastral = supplier?.statusCadastral || supplier?.registrationStatus || 'Aguardando cadastro';
  const inviteStatus = supplier?.inviteStatus || (String(statusCadastral).toLowerCase().includes('aguardando cadastro') ? 'Enviado' : 'Usado');

  return {
    ...supplier,
    nome: supplier?.nome || supplier?.name || 'Fornecedor',
    name: supplier?.name || supplier?.nome || 'Fornecedor',
    categoria: supplier?.categoria || supplier?.category || 'Outro',
    category: supplier?.category || supplier?.categoria || 'Outro',
    responsavel: supplier?.responsavel || supplier?.responsible || '',
    responsible: supplier?.responsible || supplier?.responsavel || '',
    email: supplier?.email || supplier?.emailEmpresa || '',
    whatsapp: supplier?.whatsapp || supplier?.telefoneEmpresa || '',
    origem: supplier?.origem || supplier?.origin || 'administracao',
    origin: supplier?.origin || supplier?.origem || 'administracao',
    inviteStatus,
    registrationStatus: supplier?.registrationStatus || statusCadastral,
    adminStatus: supplier?.adminStatus || (String(statusCadastral).toLowerCase().includes('aprov') ? 'aprovado' : 'pendente'),
    teamCount: Number(supplier?.teamCount ?? supplier?.pessoas ?? 0),
    createdBy: supplier?.createdBy || 'administracao',
    createdAt: supplier?.createdAt || new Date().toISOString(),
    statusCadastral,
    pessoas: Number(supplier?.pessoas ?? supplier?.teamCount ?? 0)
  };
};

const normalizePartnerSupplier = (supplier) => {
  const base = normalizeSupplier(supplier || {});
  const documentos = Array.isArray(supplier?.documentos) ? supplier.documentos : [];
  const equipeBase = Array.isArray(supplier?.equipeBase) ? supplier.equipeBase : [];
  const eventosVinculados = Array.isArray(supplier?.eventosVinculados) ? supplier.eventosVinculados : [];
  const historico = Array.isArray(supplier?.historico) ? supplier.historico : [];

  return {
    ...base,
    id: supplier?.id || base.id || `fp-${Date.now()}`,
    documentoTipoPessoa: supplier?.documentoTipoPessoa || 'PJ',
    razaoSocial: supplier?.razaoSocial || base.nome,
    nomeFantasia: supplier?.nomeFantasia || base.nome,
    documento: supplier?.documento || supplier?.cnpjCpf || '',
    cnpjCpf: supplier?.cnpjCpf || supplier?.documento || '',
    categoria: SUPPLIER_CATEGORIES.includes(base.categoria) ? base.categoria : 'Outro',
    classificacao: ADMIN_CLASSIFICATIONS.includes(base.classificacao) ? base.classificacao : (supplier?.classificacao || 'Temporário'),
    statusAdministrativo: PARTNER_STATUSES.includes(supplier?.statusAdministrativo)
      ? supplier.statusAdministrativo
      : (base.blocked ? 'Bloqueado' : 'Ativo'),
    cargoResponsavel: supplier?.cargoResponsavel || '',
    servicosPrestados: supplier?.servicosPrestados || '',
    observacoes: supplier?.observacoes || '',
    podeMontagem: supplier?.podeMontagem !== false,
    podeEvento: supplier?.podeEvento !== false,
    podeDesmontagem: supplier?.podeDesmontagem !== false,
    exigeAprovacaoCadaEvento: supplier?.exigeAprovacaoCadaEvento !== false,
    exigeAceiteNormasCadaEvento: supplier?.exigeAceiteNormasCadaEvento !== false,
    documentos,
    validadeDocumentos: supplier?.validadeDocumentos || '',
    observacoesDocumentos: supplier?.observacoesDocumentos || '',
    equipeBase,
    eventosVinculados,
    historico,
    source: 'fornecedor_parceiro'
  };
};

const normalizeStatusLabel = (status) => {
  const normalized = String(status || '').toLowerCase().trim();
  if (!normalized) return 'aguardando_aprovacao';
  if (normalized === 'rascunho') return 'rascunho';
  if (normalized === 'enviado' || normalized === 'aguardando aprovação' || normalized === 'aguardando aprovacao') return 'aguardando_aprovacao';
  if (normalized === 'aprovado') return 'aprovado';
  if (normalized === 'rejeitado') return 'rejeitado';
  if (normalized === 'correcao solicitada' || normalized === 'correção solicitada') return 'correcao_solicitada';
  if (normalized === 'liberado para guarita') return 'liberado_guarita';
  if (normalized === 'bloqueado') return 'bloqueado';
  return normalized.replace(/\s+/g, '_');
};

const toDisplayStatus = (statusCode) => {
  const code = String(statusCode || '').toLowerCase();
  if (code === 'aguardando_aprovacao') return 'Aguardando aprovação';
  if (code === 'aprovado') return 'Aprovado';
  if (code === 'liberado_guarita') return 'Liberado para guarita';
  if (code === 'correcao_solicitada') return 'Correção solicitada';
  if (code === 'rejeitado') return 'Rejeitado';
  if (code === 'bloqueado') return 'Bloqueado';
  if (code === 'rascunho') return 'Rascunho';
  return statusCode || 'Aguardando aprovação';
};

const normalizePerson = (person) => {
  const statusCode = normalizeStatusLabel(person?.statusCode || person?.status);
  const supplierName = person?.supplierName || person?.fornecedor || person?.supplier || 'Fornecedor';
  const role = person?.role || person?.funcao || '';
  const accessType = person?.accessType || person?.tipoAcesso || 'Evento';
  const phone = person?.phone || person?.telefone || '';
  const name = person?.name || person?.nome || 'Pessoa';

  return {
    ...person,
    statusCode,
    status: toDisplayStatus(statusCode),
    supplierName,
    fornecedor: supplierName,
    name,
    nome: name,
    role,
    funcao: role,
    accessType,
    tipoAcesso: accessType,
    phone,
    telefone: phone,
    teamMember: true,
    createdBy: person?.createdBy || 'fornecedor',
    createdAt: person?.createdAt || person?.dataCadastro || new Date().toISOString(),
    dataCadastro: person?.dataCadastro || person?.createdAt || new Date().toISOString(),
    requestedPeriodStart: person?.requestedPeriodStart || null,
    requestedPeriodEnd: person?.requestedPeriodEnd || null,
    issues: Array.isArray(person?.issues) ? person.issues : (person?.motivoPendencia ? [person.motivoPendencia] : []),
    temPendencia: statusCode === 'correcao_solicitada' || Boolean(person?.temPendencia),
    statusGuarita: person?.statusGuarita || (statusCode === 'liberado_guarita' ? 'liberado' : 'pendente'),
    photo: person?.photo || null
  };
};

const normalizeInvitation = (invitation) => {
  const inviteType = invitation?.inviteType === 'organizer' ? 'organizer' : 'supplier';
  const normalizedStatus = String(invitation?.status || '').trim() || 'Criado';

  return {
    inviteType,
    origem: invitation?.origem || 'administracao',
    status: normalizedStatus,
    validade: invitation?.validade || getDefaultInvitationValidity(),
    used: Boolean(invitation?.used),
    ...invitation,
    inviteType,
    origem: invitation?.origem || 'administracao',
    status: normalizedStatus,
    validade: invitation?.validade || getDefaultInvitationValidity(),
    used: Boolean(invitation?.used)
  };
};

const getComputedInvitationStatus = (invitation, referenceDate = new Date()) => {
  const status = String(invitation?.status || '').toLowerCase();
  if (status === 'cancelado' || status === 'usado' || status === 'expirado') return invitation?.status;
  const validade = parseBrDate(invitation?.validade);
  if (!validade) return invitation?.status || 'Criado';
  return referenceDate > validade ? 'Expirado' : (invitation?.status || 'Criado');
};

const getInitialDocuments = (eventId) => {
  return DOC_TYPES.map((name) => ({
    id: `${eventId}-${name.toLowerCase().replace(/\s+/g, '-')}`,
    eventId,
    name,
    status: 'Nao anexado',
    date: null
  }));
};

const buildDemoData = () => {
  const events = [
    {
      id: 'evt-001',
      nome: 'Feira Construir SC 2026',
      organizador: 'Eventos Sul Ltda',
      periodo: '15/07/2026 a 18/07/2026',
      periodos: {
        montagem: '10/07/2026 a 14/07/2026',
        evento: '15/07/2026 a 18/07/2026',
        desmontagem: '19/07/2026 a 20/07/2026'
      },
      espacosLocados: 'Pavilhão Norte, Credenciamento e Praça de Alimentação',
      faseAtual: 'Cadastro aberto',
      faseNova: 'Cadastro aberto',
      pessoasCadastradas: 2,
      pessoasLiberadas: 1,
      pendencias: 1,
      status: 'Ativo'
    },
    {
      id: 'evt-002',
      nome: 'Expo Industria Tech',
      organizador: 'Associacao Tech Sul',
      periodo: '22/08/2026 a 25/08/2026',
      periodos: {
        montagem: '18/08/2026 a 21/08/2026',
        evento: '22/08/2026 a 25/08/2026',
        desmontagem: '26/08/2026 a 27/08/2026'
      },
      espacosLocados: 'Pavilhão Principal e Área Externa',
      faseAtual: 'Em analise',
      faseNova: 'Em analise',
      pessoasCadastradas: 0,
      pessoasLiberadas: 0,
      pendencias: 0,
      status: 'Ativo'
    }
  ];

  const invitations = [
    {
      id: 'inv-org-001',
      eventId: 'evt-001',
      inviteType: 'organizer',
      organizador: 'Eventos Sul Ltda',
      responsavel: 'Mariana Souza',
      email: 'organizador@eventossul.com.br',
      whatsapp: '(47) 98888-1111',
      codigo: 'ORG-FEIRA-2026',
      validade: '10/07/2026',
      status: 'Enviado',
      origem: 'administracao',
      used: false
    },
    {
      id: 'inv-001',
      eventId: 'evt-001',
      inviteType: 'supplier',
      fornecedor: 'Art Planos Stands',
      email: 'fornecedor@empresa.com.br',
      whatsapp: '(47) 99999-0000',
      categoria: 'Montadora',
      codigo: 'FEIRA-CONSTRUIR-2026',
      validade: '10/07/2026',
      status: 'Enviado',
      origem: 'indicado_pelo_locatario',
      used: false
    }
  ];

  const suppliers = [
    {
      id: 'for-001',
      invitationId: 'inv-001',
      eventId: 'evt-001',
      nome: 'Art Planos Stands',
      categoria: 'Montadora',
      classificacao: 'Parceiro recorrente',
      responsavel: 'Carlos Lima',
      email: 'fornecedor@empresa.com.br',
      whatsapp: '(47) 99999-0000',
      origem: 'indicado_pelo_locatario',
      inviteStatus: 'Enviado',
      registrationStatus: 'Aprovado',
      adminStatus: 'aprovado',
      teamCount: 2,
      createdBy: 'locatario',
      createdAt: new Date().toISOString(),
      pessoas: 2,
      statusCadastral: 'Aprovado',
      statusPagamento: 'Paga',
      blocked: false
    }
  ];

  const partnerSuppliers = [
    normalizePartnerSupplier({
      id: 'fp-001',
      nome: 'Art Planos Stands',
      razaoSocial: 'Art Planos Stands Ltda',
      nomeFantasia: 'Art Planos Stands',
      documento: '12.345.678/0001-99',
      categoria: 'Montadora',
      classificacao: 'Parceiro recorrente',
      statusAdministrativo: 'Ativo',
      responsavel: 'Carlos Lima',
      cargoResponsavel: 'Gerente Operacional',
      email: 'fornecedor@empresa.com.br',
      whatsapp: '(47) 99999-0000',
      servicosPrestados: 'Montagem de estandes e infraestrutura modular.',
      observacoes: 'Atende os principais pavilhões com equipe recorrente.',
      podeMontagem: true,
      podeEvento: true,
      podeDesmontagem: true,
      exigeAprovacaoCadaEvento: true,
      exigeAceiteNormasCadaEvento: true,
      documentos: [
        { id: 'fp-001-doc-1', tipo: 'Contrato de prestação', nome: 'Contrato anual 2026', status: 'Ok' },
        { id: 'fp-001-doc-2', tipo: 'Documentos cadastrais', nome: 'Cartão CNPJ', status: 'Ok' }
      ],
      validadeDocumentos: '31/12/2026',
      equipeBase: [
        { id: 'fp-001-p1', nome: 'Ana Costa', cpf: '111.222.333-44', funcao: 'Coordenadora' },
        { id: 'fp-001-p2', nome: 'Bruno Gomes', cpf: '222.333.444-55', funcao: 'Montador' }
      ],
      eventosVinculados: [
        { eventId: 'evt-001', eventName: 'Feira Construir SC 2026', status: 'Aprovado', source: 'fornecedor_parceiro' }
      ],
      historico: [
        { id: 'fp-001-h-1', dataHora: formatDateTimeBr(new Date()), acao: 'Cadastro inicial', usuario: 'Admin', detalhes: 'Fornecedor parceiro cadastrado na base geral.' }
      ]
    }),
    normalizePartnerSupplier({
      id: 'fp-002',
      nome: 'Segurança Prime',
      razaoSocial: 'Segurança Prime Serviços Ltda',
      nomeFantasia: 'Segurança Prime',
      documento: '33.222.111/0001-70',
      categoria: 'Segurança',
      classificacao: 'Oficial',
      statusAdministrativo: 'Documentação pendente',
      responsavel: 'Luiz Fernandes',
      cargoResponsavel: 'Supervisor',
      email: 'contato@segurancaprime.com.br',
      whatsapp: '(47) 98888-2222',
      servicosPrestados: 'Segurança patrimonial e controle de acesso.',
      podeMontagem: true,
      podeEvento: true,
      podeDesmontagem: true,
      exigeAprovacaoCadaEvento: true,
      exigeAceiteNormasCadaEvento: true,
      documentos: [
        { id: 'fp-002-doc-1', tipo: 'Certidões', nome: 'Certidão trabalhista', status: 'Pendente' }
      ],
      validadeDocumentos: '15/09/2026',
      equipeBase: [
        { id: 'fp-002-p1', nome: 'Marta Silveira', cpf: '333.444.555-66', funcao: 'Controladora de acesso' }
      ],
      eventosVinculados: [],
      historico: []
    })
  ];

  const people = [
    {
      id: 'pes-001',
      eventId: 'evt-001',
      supplierId: 'for-001',
      nome: 'Ana Costa',
      iniciais: 'AC',
      cpf: '111.222.333-44',
      fornecedor: 'Art Planos Stands',
      funcao: 'Coordenadora',
      tipoAcesso: 'Todos os periodos',
      periodoSolicitado: '15/07 a 18/07',
      status: 'Liberado para guarita',
      temPendencia: false,
      motivoPendencia: null,
      statusGuarita: 'liberado',
      avatarBg: 'bg-slate-100 text-slate-700'
    },
    {
      id: 'pes-002',
      eventId: 'evt-001',
      supplierId: 'for-001',
      nome: 'Bruno Gomes',
      iniciais: 'BG',
      cpf: '222.333.444-55',
      fornecedor: 'Art Planos Stands',
      funcao: 'Montador',
      tipoAcesso: 'Montagem',
      periodoSolicitado: '14/07 a 16/07',
      status: 'Aguardando aprovacao',
      temPendencia: false,
      motivoPendencia: null,
      statusGuarita: 'pendente',
      avatarBg: 'bg-slate-100 text-slate-700'
    }
  ];

  const accessRequests = [
    {
      id: 'req-001',
      personId: 'pes-002',
      evento: 'Feira Construir SC 2026',
      eventId: 'evt-001',
      pessoa: 'Bruno Gomes',
      fornecedor: 'Art Planos Stands',
      motivo: 'Solicitacao de liberacao para montagem',
      urgencia: 'media',
      status: 'Aguardando análise',
      dataHora: formatDateTimeBr(new Date())
    }
  ];

  const accessLogs = [
    {
      id: 'log-001',
      personId: 'pes-001',
      pessoa: 'Ana Costa',
      fornecedor: 'Art Planos Stands',
      evento: 'Feira Construir SC 2026',
      funcao: 'Coordenadora',
      tipoAcesso: 'Todos os periodos',
      status: 'Entrada autorizada',
      tipo: 'Entrada',
      dataHora: formatDateTimeBr(new Date()),
      operador: 'Guarita Demo',
      observacoes: 'Acesso liberado'
    }
  ];

  const fees = [
    {
      id: 'tax-001',
      eventId: 'evt-001',
      supplierId: 'for-001',
      fornecedor: 'Art Planos Stands',
      valor: 'R$ 350,00',
      vencimento: '10/07/2026',
      status: 'Paga'
    }
  ];

  const documents = getInitialDocuments('evt-001');

  const norms = [
    {
      id: 'nor-001',
      supplierId: 'for-001',
      fornecedor: 'Art Planos Stands',
      dataAceite: formatDateTimeBr(new Date()),
      aceiteCompleto: true
    }
  ];

  const history = [
    {
      id: 'his-001',
      dataHora: formatDateTimeBr(new Date()),
      acao: 'Inicializacao de demonstracao',
      usuario: 'Sistema',
      detalhes: 'Dados minimos carregados no prototipo.'
    }
  ];

  return {
    events,
    invitations,
    suppliers,
    partnerSuppliers,
    people,
    accessRequests,
    accessLogs,
    fees,
    documents,
    approvals: people
      .filter((p) => String(p.status || '').toLowerCase().includes('aguardando'))
      .map((p) => ({
        id: `apr-${p.id}`,
        personId: p.id,
        nome: p.nome,
        iniciais: p.iniciais,
        cpf: p.cpf,
        fornecedor: p.fornecedor,
        funcao: p.funcao,
        acesso: p.tipoAcesso,
        periodo: p.periodoSolicitado,
        alertas: []
      })),
    norms,
    history,
    equipesHistorico: [
      {
        fornecedorId: 'fp-001',
        eventoId: 'evt-001',
        pessoas: [
          { id: 'fp-001-p1', nome: 'Ana Costa', cpf: '111.222.333-44', funcao: 'Coordenadora' },
          { id: 'fp-001-p2', nome: 'Bruno Gomes', cpf: '222.333.444-55', funcao: 'Montador' }
        ]
      },
      {
        fornecedorId: 'fp-002',
        eventoId: 'evt-001',
        pessoas: [
          { id: 'fp-002-p1', nome: 'Marta Silveira', cpf: '333.444.555-66', funcao: 'Controladora de acesso' }
        ]
      }
    ]
  };
};

const AppDataContext = createContext(null);

const ensureEventDocuments = (data) => {
  const existingByEvent = new Set((data.documents || []).map((doc) => doc.eventId));
  const missingDocs = (data.events || [])
    .filter((evt) => !existingByEvent.has(evt.id))
    .flatMap((evt) => getInitialDocuments(evt.id));

  if (missingDocs.length === 0) return data;
  return {
    ...data,
    documents: [...(data.documents || []), ...missingDocs]
  };
};

const recalcEventCounters = (data) => {
  const events = (data.events || []).map((evt) => {
    const eventPeople = (data.people || []).filter((person) => person.eventId === evt.id);
    const pessoasCadastradas = eventPeople.length;
    const pessoasAguardandoAprovacao = eventPeople.filter((person) => normalizeStatusLabel(person.statusCode || person.status) === 'aguardando_aprovacao').length;
    const pessoasAprovadas = eventPeople.filter((person) => normalizeStatusLabel(person.statusCode || person.status) === 'aprovado').length;
    const pessoasLiberadasGuarita = eventPeople.filter((person) => normalizeStatusLabel(person.statusCode || person.status) === 'liberado_guarita').length;
    const pessoasLiberadas = pessoasLiberadasGuarita;
    const pendencias = eventPeople.filter((person) => {
      const st = normalizeStatusLabel(person.statusCode || person.status);
      return st === 'aguardando_aprovacao' || st === 'correcao_solicitada' || st === 'rejeitado';
    }).length;

    return {
      ...evt,
      pessoasCadastradas,
      pessoasLiberadas,
      pessoasAguardandoAprovacao,
      pessoasAprovadas,
      pessoasLiberadasGuarita,
      pendencias
    };
  });

  return {
    ...data,
    events
  };
};

const normalizeData = (incoming) => {
  const base = {
    ...buildDemoData(),
    ...incoming
  };

  const invitations = (base.invitations || []).map((invitation) => normalizeInvitation(invitation));
  const suppliers = (base.suppliers || []).map((supplier) => normalizeSupplier(supplier));
  const partnerSuppliers = (base.partnerSuppliers || []).map((supplier) => normalizePartnerSupplier(supplier));
  const people = (base.people || []).map((person) => normalizePerson(person));

  return recalcEventCounters(ensureEventDocuments({
    ...base,
    invitations,
    suppliers,
    partnerSuppliers,
    people
  }));
};

export const AppDataProvider = ({ children }) => {
  const [data, setData] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return buildDemoData();
      const parsed = JSON.parse(raw);
      return normalizeData(parsed);
    } catch {
      return buildDemoData();
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const persist = (updater) => {
    setData((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const normalizedNext = normalizeData(next);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedNext));
      } catch {
        // Ignore storage write failures and keep in-memory state.
      }
      return normalizedNext;
    });
  };

  const addHistoryLog = (actionData) => {
    const historyItem = {
      id: `his-${Date.now()}`,
      dataHora: actionData?.dataHora || formatDateTimeBr(new Date()),
      acao: actionData?.acao || 'Atualizacao',
      usuario: actionData?.usuario || 'Sistema',
      detalhes: actionData?.detalhes || 'Alteracao registrada.',
      ...actionData
    };

    persist((prev) => ({
      ...prev,
      history: [historyItem, ...(prev.history || [])]
    }));

    return historyItem;
  };

  const createEvent = (eventData) => {
    const mandatoryPartners = (data.partnerSuppliers || [])
      .filter((partner) => String(partner.classificacao || '').toLowerCase() === 'obrigatório')
      .map((partner) => ({ id: partner.id, nome: partner.nome }));

    const event = {
      id: eventData?.id || `evt-${Date.now()}`,
      nome: eventData?.nome || 'Novo evento',
      organizador: eventData?.organizador || 'Organizador',
      periodo: eventData?.periodo || `${formatDateBr()} a ${formatDateBr()}`,
      faseAtual: eventData?.faseAtual || eventData?.faseNova || 'Cadastro aberto',
      faseNova: eventData?.faseNova || eventData?.faseAtual || 'Cadastro aberto',
      status: eventData?.status || 'Ativo',
      pessoasCadastradas: 0,
      pessoasLiberadas: 0,
      pendencias: 0,
      fornecedoresObrigatoriosSugeridos: mandatoryPartners,
      ...eventData
    };

    persist((prev) => ({
      ...prev,
      events: [event, ...(prev.events || [])]
    }));

    addHistoryLog({ acao: 'Criacao de evento', usuario: 'Admin', detalhes: `Evento ${event.nome} criado.` });
    return event;
  };

  const updateEvent = (eventId, eventData) => {
    let updatedEvent = null;
    persist((prev) => ({
      ...prev,
      events: (prev.events || []).map((event) => {
        if (event.id !== eventId) return event;
        updatedEvent = { ...event, ...eventData };
        return updatedEvent;
      })
    }));

    if (updatedEvent) {
      addHistoryLog({ acao: 'Edicao de evento', usuario: 'Admin', detalhes: `Evento ${updatedEvent.nome} atualizado.` });
    }

    return updatedEvent;
  };

  const getEventById = (eventId) => (data.events || []).find((event) => event.id === eventId);

  const updateEventStatus = (eventId, status) => {
    return updateEvent(eventId, { status });
  };

  const getInvitationById = (invitationId) => {
    return (data.invitations || []).find((item) => item.id === invitationId) || null;
  };

  const createInvitation = (eventId, invitationData) => {
    const inviteType = invitationData?.inviteType === 'organizer' ? 'organizer' : 'supplier';
    const defaultCodePrefix = inviteType === 'organizer' ? 'ORG' : 'FOR';
    const invitation = {
      id: `inv-${Date.now()}`,
      eventId,
      inviteType,
      origem: invitationData?.origem || 'administracao',
      supplierId: invitationData?.supplierId || null,
      supplierName: invitationData?.supplierName || invitationData?.fornecedor || '',
      supplierEmail: invitationData?.supplierEmail || invitationData?.email || '',
      supplierWhatsapp: invitationData?.supplierWhatsapp || invitationData?.whatsapp || '',
      fornecedor: invitationData?.fornecedor || 'Fornecedor',
      organizador: invitationData?.organizador || '',
      responsavel: invitationData?.responsavel || '',
      email: invitationData?.email || '',
      whatsapp: invitationData?.whatsapp || '',
      categoria: invitationData?.categoria || 'Montadora',
      codigo: invitationData?.codigo || `${defaultCodePrefix}-${Date.now().toString().slice(-6)}`,
      validade: invitationData?.validade || getDefaultInvitationValidity(),
      status: invitationData?.status || 'Criado',
      used: false,
      ...invitationData
    };

    const normalizedInvitation = normalizeInvitation(invitation);

    persist((prev) => ({
      ...prev,
      invitations: [normalizedInvitation, ...(prev.invitations || [])]
    }));

    const destinatario = normalizedInvitation.inviteType === 'organizer'
      ? normalizedInvitation.organizador || normalizedInvitation.responsavel || 'Organizador'
      : normalizedInvitation.fornecedor;

    addHistoryLog({ acao: 'Envio de convite', usuario: 'Admin', detalhes: `Convite ${normalizedInvitation.codigo} criado para ${destinatario}.` });
    return normalizedInvitation;
  };

  const createOrganizerInvitation = (eventId, invitationData = {}) => {
    const event = getEventById(eventId);
    if (!event) return null;

    const existingOrganizerInvite = (data.invitations || []).find(
      (item) => item.eventId === eventId && item.inviteType === 'organizer' && String(item.status || '').toLowerCase() !== 'cancelado'
    );

    if (existingOrganizerInvite) {
      return patchInvitation(existingOrganizerInvite.id, {
        organizador: invitationData?.organizador || event.organizador || existingOrganizerInvite.organizador,
        responsavel: invitationData?.responsavel || existingOrganizerInvite.responsavel || 'Responsável do organizador',
        email: invitationData?.email || existingOrganizerInvite.email || '',
        whatsapp: invitationData?.whatsapp || existingOrganizerInvite.whatsapp || '',
        validade: invitationData?.validade || existingOrganizerInvite.validade || getDefaultInvitationValidity(),
        status: invitationData?.status || 'Criado',
        origem: 'administracao'
      });
    }

    const codePrefix = String(event.nome || 'ORG').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5) || 'ORG';
    return createInvitation(eventId, {
      inviteType: 'organizer',
      organizador: invitationData?.organizador || event.organizador || 'Locatário/Organizador',
      responsavel: invitationData?.responsavel || 'Responsável do organizador',
      email: invitationData?.email || '',
      whatsapp: invitationData?.whatsapp || '',
      codigo: invitationData?.codigo || `${codePrefix}-ORG-${Math.floor(100 + Math.random() * 900)}`,
      validade: invitationData?.validade || getDefaultInvitationValidity(),
      status: invitationData?.status || 'Criado',
      origem: 'administracao'
    });
  };

  const updateInvitationStatus = (invitationId, status) => {
    let target = null;
    persist((prev) => ({
      ...prev,
      invitations: (prev.invitations || []).map((invitation) => {
        if (invitation.id !== invitationId) return invitation;
        target = { ...invitation, status };
        return target;
      })
    }));

    if (target) {
      addHistoryLog({ acao: 'Status de convite', usuario: 'Admin', detalhes: `Convite ${target.codigo} alterado para ${status}.` });
    }

    return target;
  };

  const patchInvitation = (invitationId, invitationData) => {
    let target = null;
    persist((prev) => ({
      ...prev,
      invitations: (prev.invitations || []).map((invitation) => {
        if (invitation.id !== invitationId) return invitation;
        target = normalizeInvitation({ ...invitation, ...invitationData });
        return target;
      })
    }));

    return target;
  };

  const validateInvitationCode = (code) => {
    const normalized = normalizeInviteCode(code);
    if (!normalized) return null;

    const normalizedCompact = normalized.replace(/-/g, '');

    const candidates = (data.invitations || []).filter((item) => {
      const itemCode = normalizeInviteCode(item.codigo);
      if (!itemCode) return false;
      if (itemCode === normalized) return true;
      return itemCode.replace(/-/g, '') === normalizedCompact;
    });

    if (candidates.length === 0) return null;

    const invitation = candidates.find((item) => {
      const computedStatus = String(getComputedInvitationStatus(item)).toLowerCase();
      if (computedStatus === 'cancelado' || computedStatus === 'expirado') return false;
      if (item.inviteType === 'supplier' && item.used) return false;
      return true;
    }) || null;

    if (!invitation) return null;

    const computedStatus = String(getComputedInvitationStatus(invitation)).toLowerCase();
    if (computedStatus === 'cancelado' || computedStatus === 'expirado') return null;
    if (invitation.inviteType === 'supplier' && invitation.used) return null;

    return invitation;
  };

  const markInvitationAsUsed = (invitationId) => {
    let target = null;
    persist((prev) => ({
      ...prev,
      invitations: (prev.invitations || []).map((invitation) => {
        if (invitation.id !== invitationId) return invitation;
        target = { ...invitation, used: true, status: 'Usado' };
        return target;
      })
    }));

    return target;
  };

  const createSupplierFromInvitation = (invitationId, supplierData) => {
    const invitation = (data.invitations || []).find((item) => item.id === invitationId);
    if (!invitation) return null;
    if (invitation.inviteType !== 'supplier') return null;

    const existingSupplier = (data.suppliers || []).find((item) => item.id === invitation.supplierId || item.invitationId === invitationId);
    const supplierId = existingSupplier?.id || invitation.supplierId || `for-${Date.now()}`;

    const supplier = normalizeSupplier({
      ...(existingSupplier || {}),
      id: supplierId,
      invitationId,
      eventId: invitation.eventId,
      nome: supplierData?.nome || invitation.supplierName || invitation.fornecedor,
      categoria: supplierData?.categoria || invitation.categoria || 'Montadora',
      classificacao: supplierData?.classificacao || existingSupplier?.classificacao || 'Temporario',
      responsavel: supplierData?.responsavel || supplierData?.nomeGestor || invitation.responsavel || existingSupplier?.responsavel || 'Responsavel',
      email: supplierData?.emailEmpresa || supplierData?.email || invitation.supplierEmail || invitation.email || existingSupplier?.email || '',
      whatsapp: supplierData?.telefoneEmpresa || invitation.supplierWhatsapp || invitation.whatsapp || existingSupplier?.whatsapp || '',
      pessoas: Number(existingSupplier?.pessoas || 0),
      teamCount: Number(existingSupplier?.teamCount || 0),
      statusCadastral: 'Aguardando avaliação',
      registrationStatus: 'Aguardando avaliação',
      adminStatus: 'pendente',
      inviteStatus: 'Usado',
      origem: existingSupplier?.origem || invitation.origem || 'administracao',
      origin: existingSupplier?.origin || invitation.origem || 'administracao',
      statusPagamento: existingSupplier?.statusPagamento || 'Pendente',
      blocked: false,
      createdBy: existingSupplier?.createdBy || 'locatario',
      createdAt: existingSupplier?.createdAt || new Date().toISOString(),
      ...supplierData
    });

    persist((prev) => ({
      ...prev,
      suppliers: (() => {
        const others = (prev.suppliers || []).filter((item) => item.id !== supplier.id);
        return [supplier, ...others];
      })(),
      invitations: (prev.invitations || []).map((item) => {
        if (item.id !== invitationId) return item;
        return normalizeInvitation({
          ...item,
          used: true,
          status: 'Usado',
          supplierId: supplier.id,
          supplierName: supplier.nome,
          supplierEmail: supplier.email,
          supplierWhatsapp: supplier.whatsapp
        });
      }),
      norms: [
        {
          id: `nor-${Date.now()}`,
          supplierId: supplier.id,
          fornecedor: supplier.nome,
          dataAceite: formatDateTimeBr(new Date()),
          aceiteCompleto: true
        },
        ...(prev.norms || [])
      ]
    }));

    addHistoryLog({ acao: 'Cadastro de fornecedor', usuario: 'Fornecedor', detalhes: 'Fornecedor concluiu cadastro pelo convite.' });
    return supplier;
  };

  const createSupplierIndication = (eventId, indicationData) => {
    const fornecedor = String(indicationData?.fornecedor || '').trim();
    if (!fornecedor) return null;

    const supplierId = `for-${Date.now()}`;
    const centralSupplier = normalizeSupplier({
      id: supplierId,
      eventId,
      invitationId: null,
      nome: fornecedor,
      name: fornecedor,
      categoria: indicationData?.categoria || 'Outro',
      category: indicationData?.categoria || 'Outro',
      responsavel: indicationData?.responsavel || '',
      responsible: indicationData?.responsavel || '',
      email: indicationData?.email || '',
      whatsapp: indicationData?.whatsapp || '',
      origem: 'indicado_pelo_locatario',
      origin: 'indicado_pelo_locatario',
      inviteStatus: 'Enviado',
      registrationStatus: 'Aguardando cadastro',
      statusCadastral: 'Aguardando cadastro',
      adminStatus: 'pendente',
      teamCount: 0,
      pessoas: 0,
      createdBy: 'locatario',
      createdAt: new Date().toISOString(),
      statusPagamento: 'Pendente',
      blocked: false,
      observacoes: indicationData?.observacoes || ''
    });

    const generatedCode = String(indicationData?.codigo || '').trim() || `FOR-${Date.now().toString().slice(-6)}`;

    const invitation = normalizeInvitation({
      id: `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      inviteType: 'supplier',
      eventId,
      supplierId,
      supplierName: centralSupplier.nome,
      supplierEmail: centralSupplier.email,
      supplierWhatsapp: centralSupplier.whatsapp,
      fornecedor: centralSupplier.nome,
      categoria: centralSupplier.categoria,
      responsavel: centralSupplier.responsavel,
      email: centralSupplier.email,
      whatsapp: centralSupplier.whatsapp,
      codigo: generatedCode,
      status: 'Enviado',
      validade: indicationData?.validade || getDefaultInvitationValidity(),
      origem: 'indicado_pelo_locatario',
      used: false,
      observacoes: indicationData?.observacoes || ''
    });

    const linkedSupplier = normalizeSupplier({
      ...centralSupplier,
      invitationId: invitation.id
    });

    persist((prev) => ({
      ...prev,
      suppliers: [linkedSupplier, ...(prev.suppliers || [])],
      invitations: [invitation, ...(prev.invitations || [])]
    }));

    addHistoryLog({ acao: 'Indicação de fornecedor', usuario: 'Locatário', detalhes: `${linkedSupplier.nome} indicado pelo locatário para o evento.` });
    return { supplier: linkedSupplier, invitation };
  };

  const cancelSupplierIndication = (supplierId) => {
    let target = null;
    persist((prev) => {
      const supplier = (prev.suppliers || []).find((item) => item.id === supplierId);
      if (!supplier) return prev;
      target = supplier;

      return {
        ...prev,
        suppliers: (prev.suppliers || []).map((item) => {
          if (item.id !== supplierId) return item;
          return normalizeSupplier({
            ...item,
            inviteStatus: 'Cancelado',
            registrationStatus: 'Indicado',
            statusCadastral: 'Indicado',
            adminStatus: 'pendente'
          });
        }),
        invitations: (prev.invitations || []).map((invitation) => {
          if (invitation.supplierId !== supplierId && invitation.id !== supplier.invitationId) return invitation;
          return normalizeInvitation({ ...invitation, status: 'Cancelado', used: false });
        })
      };
    });

    if (target) {
      addHistoryLog({ acao: 'Cancelamento de indicação', usuario: 'Locatário', detalhes: `${target.nome} teve a indicação cancelada.` });
    }

    return target;
  };

  const updateSupplier = (supplierId, supplierData) => {
    let target = null;
    persist((prev) => ({
      ...prev,
      suppliers: (prev.suppliers || []).map((supplier) => {
        if (supplier.id !== supplierId) return supplier;
        target = { ...supplier, ...supplierData };
        return target;
      })
    }));
    return target;
  };

  const approveSupplier = (supplierId) => updateSupplier(supplierId, { statusCadastral: 'Aprovado' });

  const requestSupplierCorrection = (supplierId, reason) => {
    const supplier = updateSupplier(supplierId, { statusCadastral: 'Correcao solicitada', correctionReason: reason });
    if (supplier) {
      addHistoryLog({ acao: 'Correcao de fornecedor', usuario: 'Admin', detalhes: `Correcao solicitada para ${supplier.nome}: ${reason}` });
    }
    return supplier;
  };

  const blockSupplier = (supplierId) => {
    const supplier = updateSupplier(supplierId, { statusCadastral: 'Bloqueado', blocked: true });
    if (supplier) {
      addHistoryLog({ acao: 'Bloqueio de fornecedor', usuario: 'Admin', detalhes: `${supplier.nome} bloqueado.` });
    }
    return supplier;
  };

  const changeSupplierClassification = (supplierId, classification) => {
    const supplier = updateSupplier(supplierId, { classificacao: classification });
    if (supplier) {
      addHistoryLog({ acao: 'Classificacao de fornecedor', usuario: 'Admin', detalhes: `${supplier.nome} classificado como ${classification}.` });
    }
    return supplier;
  };

  const createPartnerSupplier = (partnerData) => {
    const partner = normalizePartnerSupplier({
      id: `fp-${Date.now()}`,
      nome: partnerData?.nomeFantasia || partnerData?.razaoSocial || 'Fornecedor parceiro',
      name: partnerData?.nomeFantasia || partnerData?.razaoSocial || 'Fornecedor parceiro',
      razaoSocial: partnerData?.razaoSocial || '',
      nomeFantasia: partnerData?.nomeFantasia || partnerData?.razaoSocial || '',
      documento: partnerData?.documento || '',
      cnpjCpf: partnerData?.documento || '',
      documentoTipoPessoa: partnerData?.documentoTipoPessoa || 'PJ',
      categoria: partnerData?.categoria || 'Outro',
      classificacao: partnerData?.classificacao || 'Temporário',
      statusAdministrativo: partnerData?.statusAdministrativo || 'Ativo',
      responsavel: partnerData?.responsavel || '',
      cargoResponsavel: partnerData?.cargoResponsavel || '',
      email: partnerData?.email || '',
      whatsapp: partnerData?.whatsapp || '',
      servicosPrestados: partnerData?.servicosPrestados || '',
      observacoes: partnerData?.observacoes || '',
      podeMontagem: partnerData?.podeMontagem !== false,
      podeEvento: partnerData?.podeEvento !== false,
      podeDesmontagem: partnerData?.podeDesmontagem !== false,
      exigeAprovacaoCadaEvento: partnerData?.exigeAprovacaoCadaEvento !== false,
      exigeAceiteNormasCadaEvento: partnerData?.exigeAceiteNormasCadaEvento !== false,
      documentos: Array.isArray(partnerData?.documentos) ? partnerData.documentos : [],
      validadeDocumentos: partnerData?.validadeDocumentos || '',
      observacoesDocumentos: partnerData?.observacoesDocumentos || '',
      equipeBase: Array.isArray(partnerData?.equipeBase) ? partnerData.equipeBase : [],
      eventosVinculados: [],
      historico: [
        {
          id: `fph-${Date.now()}`,
          dataHora: formatDateTimeBr(new Date()),
          acao: 'Cadastro criado',
          usuario: 'Admin',
          detalhes: 'Fornecedor parceiro criado na base geral.'
        }
      ]
    });

    persist((prev) => ({
      ...prev,
      partnerSuppliers: [partner, ...(prev.partnerSuppliers || [])]
    }));

    addHistoryLog({ acao: 'Cadastro parceiro', usuario: 'Admin', detalhes: `${partner.nome} cadastrado como fornecedor parceiro.` });
    return partner;
  };

  const updatePartnerSupplier = (partnerId, updates) => {
    let target = null;
    persist((prev) => ({
      ...prev,
      partnerSuppliers: (prev.partnerSuppliers || []).map((partner) => {
        if (partner.id !== partnerId) return partner;
        target = normalizePartnerSupplier({ ...partner, ...updates });
        return target;
      })
    }));
    return target;
  };

  const setPartnerSupplierStatus = (partnerId, statusAdministrativo) => {
    const blocked = String(statusAdministrativo || '').toLowerCase() === 'bloqueado';
    const updates = blocked
      ? { statusAdministrativo, blocked, classificacao: 'Bloqueado' }
      : { statusAdministrativo, blocked };
    const updated = updatePartnerSupplier(partnerId, updates);
    if (updated) {
      addHistoryLog({ acao: 'Status fornecedor parceiro', usuario: 'Admin', detalhes: `${updated.nome} atualizado para ${statusAdministrativo}.` });
    }
    return updated;
  };

  const linkPartnerSuppliersToEvent = (eventId, payload) => {
    const partnerIds = Array.isArray(payload?.partnerIds) ? payload.partnerIds : [];
    const selectedPeopleByPartner = payload?.selectedPeopleByPartner || {};
    const tipoAcesso = payload?.tipoAcesso || 'Evento';
    const exigeNormas = payload?.precisaAceitarNormas !== false;
    const precisaEnviarEquipe = payload?.precisaEnviarEquipe !== false;

    if (!eventId || partnerIds.length === 0) return [];

    const event = getEventById(eventId);
    if (!event) return [];

    const linkedSuppliers = [];

    persist((prev) => {
      const partners = prev.partnerSuppliers || [];
      const suppliers = [...(prev.suppliers || [])];
      const norms = [...(prev.norms || [])];
      const fees = [...(prev.fees || [])];
      const people = [...(prev.people || [])];
      const equipesHistorico = [...(prev.equipesHistorico || [])];

      const nextPartners = partners.map((partner) => {
        if (!partnerIds.includes(partner.id)) return partner;

        const statusCadastral = partner.exigeAprovacaoCadaEvento ? 'Aguardando confirmação' : 'Aprovado';
        const supplierEventId = `for-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const selectedTeam = Array.isArray(selectedPeopleByPartner[partner.id])
          ? selectedPeopleByPartner[partner.id]
          : [];

        const eventSupplier = normalizeSupplier({
          id: supplierEventId,
          eventId,
          partnerSupplierId: partner.id,
          nome: partner.nome,
          categoria: partner.categoria,
          classificacao: partner.classificacao,
          responsavel: partner.responsavel,
          email: partner.email,
          whatsapp: partner.whatsapp,
          origem: 'fornecedor_parceiro',
          source: 'fornecedor_parceiro',
          inviteStatus: 'Vinculado',
          registrationStatus: statusCadastral,
          statusCadastral,
          adminStatus: statusCadastral === 'Aprovado' ? 'aprovado' : 'pendente',
          teamCount: precisaEnviarEquipe ? selectedTeam.length : 0,
          pessoas: precisaEnviarEquipe ? selectedTeam.length : 0,
          blocked: false,
          statusPagamento: 'Pendente',
          requiresNormAcceptance: exigeNormas,
          requiresTeamSubmission: precisaEnviarEquipe,
          accessType: tipoAcesso
        });

        suppliers.unshift(eventSupplier);
        linkedSuppliers.push(eventSupplier);

        if (exigeNormas) {
          norms.unshift({
            id: `nor-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            supplierId: eventSupplier.id,
            fornecedor: eventSupplier.nome,
            dataAceite: null,
            aceiteCompleto: false,
            status: 'Pendente'
          });
        }

        fees.unshift({
          id: `tax-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          eventId,
          supplierId: eventSupplier.id,
          fornecedor: eventSupplier.nome,
          valor: 'Conforme regra do evento',
          vencimento: event?.periodo?.split(' a ')?.[0] || '-',
          status: 'Pendente'
        });

        if (precisaEnviarEquipe && selectedTeam.length > 0) {
          selectedTeam.forEach((member) => {
            people.unshift(normalizePerson({
              id: `pes-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              eventId,
              supplierId: eventSupplier.id,
              supplierName: eventSupplier.nome,
              name: member.nome,
              cpf: member.cpf || '',
              role: member.funcao || 'Equipe',
              accessType: tipoAcesso,
              statusCode: 'aguardando_aprovacao',
              statusGuarita: 'pendente',
              origemEquipe: 'reutilizada',
              createdBy: 'admin'
            }));
          });

          equipesHistorico.unshift({
            fornecedorId: partner.id,
            eventoId: eventId,
            pessoas: selectedTeam.map((member) => ({
              id: member.id || `eq-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              nome: member.nome,
              cpf: member.cpf || '',
              funcao: member.funcao || 'Equipe'
            }))
          });
        }

        const eventLink = {
          eventId,
          eventName: event.nome,
          source: 'fornecedor_parceiro',
          status: statusCadastral,
          accessType: tipoAcesso,
          requiresNormAcceptance: exigeNormas,
          requiresTeamSubmission: precisaEnviarEquipe,
          linkedAt: formatDateTimeBr(new Date())
        };

        const historico = [
          {
            id: `fph-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            dataHora: formatDateTimeBr(new Date()),
            acao: 'Vinculado ao evento',
            usuario: 'Admin',
            detalhes: `${event.nome} com tipo de acesso ${tipoAcesso}.`
          },
          ...(partner.historico || [])
        ];

        return normalizePartnerSupplier({
          ...partner,
          eventosVinculados: [eventLink, ...(partner.eventosVinculados || []).filter((item) => item.eventId !== eventId)],
          historico
        });
      });

      return {
        ...prev,
        partnerSuppliers: nextPartners,
        suppliers,
        norms,
        fees,
        people,
        equipesHistorico
      };
    });

    if (linkedSuppliers.length > 0) {
      addHistoryLog({
        acao: 'Vinculo de fornecedores parceiros',
        usuario: 'Admin',
        detalhes: `${linkedSuppliers.length} fornecedor(es) parceiro(s) vinculados ao evento ${event.nome}.`
      });
    }

    return linkedSuppliers;
  };

  const createManualEventSupplier = (eventId, supplierData) => {
    const event = getEventById(eventId);
    if (!event) return null;

    const supplier = normalizeSupplier({
      id: `for-${Date.now()}`,
      eventId,
      nome: supplierData?.nome || 'Fornecedor manual',
      categoria: supplierData?.categoria || 'Outro',
      classificacao: supplierData?.classificacao || 'Temporário',
      responsavel: supplierData?.responsavel || '',
      email: supplierData?.email || '',
      whatsapp: supplierData?.whatsapp || '',
      origem: 'cadastro_manual_admin',
      source: 'cadastro_manual_admin',
      inviteStatus: 'Cadastro manual',
      registrationStatus: 'Aguardando confirmação',
      statusCadastral: 'Aguardando confirmação',
      adminStatus: 'pendente',
      teamCount: 0,
      pessoas: 0,
      statusPagamento: 'Conforme regra do evento',
      blocked: false
    });

    persist((prev) => ({
      ...prev,
      suppliers: [supplier, ...(prev.suppliers || [])],
      norms: [
        {
          id: `nor-${Date.now()}`,
          supplierId: supplier.id,
          fornecedor: supplier.nome,
          dataAceite: null,
          aceiteCompleto: false,
          status: 'Pendente'
        },
        ...(prev.norms || [])
      ],
      fees: [
        {
          id: `tax-${Date.now()}`,
          eventId,
          supplierId: supplier.id,
          fornecedor: supplier.nome,
          valor: 'Conforme regra do evento',
          vencimento: event?.periodo?.split(' a ')?.[0] || '-',
          status: 'Pendente'
        },
        ...(prev.fees || [])
      ]
    }));

    addHistoryLog({ acao: 'Fornecedor manual no evento', usuario: 'Admin', detalhes: `${supplier.nome} incluído manualmente no evento ${event.nome}.` });
    return supplier;
  };

  const createPerson = (eventId, supplierId, personData) => {
    const supplier = (data.suppliers || []).find((item) => item.id === supplierId);

    const initials = String(personData?.nome || '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');

    const periodText = String(personData?.periodoSolicitado || '').trim();
    const periodMatch = periodText.match(/(\d{2}\/\d{2}(?:\/\d{4})?)\s*a\s*(\d{2}\/\d{2}(?:\/\d{4})?)/i);

    const person = normalizePerson({
      id: `pes-${Date.now()}`,
      eventId,
      supplierId,
      supplierName: supplier?.nome || personData?.fornecedor || 'Fornecedor',
      name: personData?.nome || 'Pessoa',
      cpf: personData?.cpf || '',
      rg: personData?.rg || '',
      phone: personData?.telefone || '',
      role: personData?.funcao || '',
      accessType: personData?.tipoAcesso || 'Evento',
      periodoSolicitado: personData?.periodoSolicitado || '-',
      requestedPeriodStart: periodMatch?.[1] || null,
      requestedPeriodEnd: periodMatch?.[2] || null,
      statusCode: personData?.statusCode || personData?.status || 'aguardando_aprovacao',
      issues: personData?.issues || [],
      temPendencia: Boolean(personData?.temPendencia) || normalizeStatusLabel(personData?.statusCode || personData?.status) === 'correcao_solicitada',
      motivoPendencia: personData?.motivoPendencia || null,
      statusGuarita: 'pendente',
      iniciais: initials,
      avatarBg: personData?.avatarBg || 'bg-slate-100 text-slate-700',
      createdBy: 'fornecedor',
      createdAt: new Date().toISOString(),
      photo: personData?.photo || null,
      ...personData
    });

    persist((prev) => ({
      ...prev,
      people: [person, ...(prev.people || [])],
      suppliers: (prev.suppliers || []).map((item) => {
        if (item.id !== supplierId) return item;
        return {
          ...item,
          pessoas: Number(item.pessoas || 0) + 1,
          teamCount: Number(item.teamCount || item.pessoas || 0) + 1
        };
      })
    }));

    addHistoryLog({ acao: 'Cadastro de pessoa', usuario: 'Fornecedor', detalhes: 'Pessoa cadastrada pelo fornecedor.' });
    return person;
  };

  const updatePerson = (personId, personData) => {
    let target = null;
    persist((prev) => ({
      ...prev,
      people: (prev.people || []).map((person) => {
        if (person.id !== personId) return person;
        target = normalizePerson({ ...person, ...personData });
        return target;
      })
    }));
    return target;
  };

  const submitPeopleForApproval = (eventId, supplierId) => {
    const updatedIds = [];

    persist((prev) => {
      const people = (prev.people || []).map((person) => {
        if (person.eventId !== eventId || person.supplierId !== supplierId) return person;
        updatedIds.push(person.id);
        return {
          ...normalizePerson({
            ...person,
            statusCode: 'aguardando_aprovacao',
            status: 'aguardando_aprovacao',
            issues: [],
            motivoPendencia: null,
            temPendencia: false,
            statusGuarita: 'pendente'
          }),
          temPendencia: false,
          motivoPendencia: null
        };
      });

      return {
        ...prev,
        people
      };
    });

    return updatedIds;
  };

  const approvePerson = (personId) => {
    const person = updatePerson(personId, { statusCode: 'aprovado', status: 'aprovado', statusGuarita: 'pendente', issues: [], temPendencia: false, motivoPendencia: null });
    if (person) addHistoryLog({ acao: 'Aprovacao de pessoa', usuario: 'Admin', detalhes: 'Pessoa aprovada pela administração.' });
    return person;
  };

  const rejectPerson = (personId, reason) => {
    const person = updatePerson(personId, {
      statusCode: 'rejeitado',
      status: 'rejeitado',
      motivoPendencia: reason,
      temPendencia: true,
      issues: reason ? [reason] : []
    });
    if (person) addHistoryLog({ acao: 'Rejeicao de pessoa', usuario: 'Admin', detalhes: `${person.nome} rejeitada: ${reason}` });
    return person;
  };

  const requestPersonCorrection = (personId, reason) => {
    const person = updatePerson(personId, {
      statusCode: 'correcao_solicitada',
      status: 'correcao_solicitada',
      motivoPendencia: reason,
      temPendencia: true,
      statusGuarita: 'pendente',
      issues: reason ? [reason] : []
    });

    if (person) addHistoryLog({ acao: 'Correcao de pessoa', usuario: 'Admin', detalhes: `${person.nome} com correcao solicitada: ${reason}` });
    return person;
  };

  const blockPerson = (personId) => {
    const person = updatePerson(personId, { statusCode: 'bloqueado', status: 'bloqueado', statusGuarita: 'bloqueado' });
    if (person) addHistoryLog({ acao: 'Bloqueio de pessoa', usuario: 'Guarita', detalhes: `${person.nome} bloqueada.` });
    return person;
  };

  const releasePersonToGate = (personId) => {
    const person = updatePerson(personId, { statusCode: 'liberado_guarita', status: 'liberado_guarita', statusGuarita: 'liberado' });
    if (person) addHistoryLog({ acao: 'Liberacao para guarita', usuario: 'Admin', detalhes: 'Pessoa liberada para guarita.' });
    return person;
  };

  const createAccessRequest = (requestData) => {
    const request = {
      id: `req-${Date.now()}`,
      dataHora: formatDateTimeBr(new Date()),
      status: 'Aguardando análise',
      urgencia: requestData?.urgencia || 'media',
      ...requestData
    };

    persist((prev) => ({
      ...prev,
      accessRequests: [request, ...(prev.accessRequests || [])]
    }));

    addHistoryLog({ acao: 'Solicitacao de acesso', usuario: 'Guarita', detalhes: `Solicitacao criada para ${request.pessoa || 'pessoa nao informada'}.` });
    return request;
  };

  const approveAccessRequest = (requestId, validity) => {
    let target = null;
    persist((prev) => ({
      ...prev,
      accessRequests: (prev.accessRequests || []).map((request) => {
        if (request.id !== requestId) return request;
        target = { ...request, status: 'Aprovado', validade: validity || request.validade || '-' };
        return target;
      })
    }));

    return target;
  };

  const rejectAccessRequest = (requestId, reason) => {
    let target = null;
    persist((prev) => ({
      ...prev,
      accessRequests: (prev.accessRequests || []).map((request) => {
        if (request.id !== requestId) return request;
        target = { ...request, status: 'Negado', motivo: reason || request.motivo };
        return target;
      })
    }));

    return target;
  };

  const updateAccessRequest = (requestId, requestData) => {
    let target = null;
    persist((prev) => ({
      ...prev,
      accessRequests: (prev.accessRequests || []).map((request) => {
        if (request.id !== requestId) return request;
        target = { ...request, ...requestData };
        return target;
      })
    }));
    return target;
  };

  const registerEntry = (personId) => {
    const person = (data.people || []).find((item) => item.id === personId);
    if (!person) return null;

    updatePerson(personId, { statusGuarita: 'entrou' });

    const log = {
      id: `log-${Date.now()}`,
      personId,
      pessoa: person.nome,
      fornecedor: person.fornecedor,
      evento: getEventById(person.eventId)?.nome || '-',
      funcao: person.funcao,
      tipoAcesso: person.tipoAcesso,
      status: 'Entrada autorizada',
      tipo: 'Entrada',
      dataHora: formatDateTimeBr(new Date()),
      operador: 'Guarita Demo',
      observacoes: 'Entrada registrada manualmente'
    };

    persist((prev) => ({
      ...prev,
      accessLogs: [log, ...(prev.accessLogs || [])]
    }));

    addHistoryLog({ acao: 'Registro de entrada', usuario: 'Guarita', detalhes: `${person.nome} teve entrada registrada.` });
    return log;
  };

  const registerExit = (personId) => {
    const person = (data.people || []).find((item) => item.id === personId);
    if (!person) return null;

    updatePerson(personId, { statusGuarita: 'liberado' });

    const log = {
      id: `log-${Date.now()}`,
      personId,
      pessoa: person.nome,
      fornecedor: person.fornecedor,
      evento: getEventById(person.eventId)?.nome || '-',
      funcao: person.funcao,
      tipoAcesso: person.tipoAcesso,
      status: 'Saida registrada',
      tipo: 'Saída',
      dataHora: formatDateTimeBr(new Date()),
      operador: 'Guarita Demo',
      observacoes: 'Saida registrada manualmente'
    };

    persist((prev) => ({
      ...prev,
      accessLogs: [log, ...(prev.accessLogs || [])]
    }));

    addHistoryLog({ acao: 'Registro de saida', usuario: 'Guarita', detalhes: `${person.nome} teve saida registrada.` });
    return log;
  };

  const restoreDemoData = () => {
    const initial = buildDemoData();
    localStorage.removeItem(STORAGE_KEY);
    setData(initial);
    return initial;
  };

  const adminMockData = useMemo(() => {
    const peopleApprovals = (data.people || [])
      .filter((person) => {
        const st = normalizeStatusLabel(person.statusCode || person.status);
        return st === 'aguardando_aprovacao' || st === 'correcao_solicitada';
      })
      .map((person) => ({
        id: `apr-${person.id}`,
        itemType: 'person',
        personId: person.id,
        eventId: person.eventId,
        supplierId: person.supplierId,
        nome: person.nome,
        iniciais: person.iniciais,
        cpf: person.cpf,
        fornecedor: person.fornecedor,
        funcao: person.funcao,
        acesso: person.tipoAcesso,
        periodo: person.periodoSolicitado || '-',
        alertas: person.issues?.length ? person.issues : (person.temPendencia && person.motivoPendencia ? [person.motivoPendencia] : [])
      }));

    const supplierApprovals = (data.suppliers || [])
      .filter((supplier) => {
        const st = normalizeStatusLabel(supplier.registrationStatus || supplier.statusCadastral);
        return st === 'aguardando_aprovacao' || st === 'aguardando_avaliacao' || st === 'correcao_solicitada';
      })
      .map((supplier) => ({
        id: `apr-supplier-${supplier.id}`,
        itemType: 'supplier',
        supplierId: supplier.id,
        eventId: supplier.eventId,
        nome: supplier.nome,
        iniciais: String(supplier.nome || '').split(' ').filter(Boolean).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join(''),
        cpf: '-',
        fornecedor: supplier.nome,
        funcao: 'Empresa',
        acesso: supplier.categoria || '-',
        periodo: '-',
        alertas: [supplier.registrationStatus || supplier.statusCadastral || 'Aguardando aprovação']
      }));

    const derivedApprovals = [...peopleApprovals, ...supplierApprovals];

    return {
      eventos: data.events || [],
      convites: data.invitations || [],
      fornecedores: data.suppliers || [],
      fornecedoresParceiros: data.partnerSuppliers || [],
      pessoas: data.people || [],
      aprovacoes: derivedApprovals,
      taxas: data.fees || [],
      normas: data.norms || [],
      guarita: data.accessLogs || [],
      historico: data.history || [],
      equipesHistorico: data.equipesHistorico || [],
      documentos: data.documents || [],
      solicitacoesGuarita: data.accessRequests || []
    };
  }, [data]);

  const value = {
    data,
    adminMockData,

    events: data.events || [],
    invitations: data.invitations || [],
    suppliers: data.suppliers || [],
    partnerSuppliers: data.partnerSuppliers || [],
    people: data.people || [],
    accessRequests: data.accessRequests || [],
    accessLogs: data.accessLogs || [],
    fees: data.fees || [],
    documents: data.documents || [],
    history: data.history || [],

    createEvent,
    updateEvent,
    getEventById,
    getInvitationById,
    updateEventStatus,

    createInvitation,
    createOrganizerInvitation,
    createSupplierIndication,
    updateInvitationStatus,
    validateInvitationCode,
    markInvitationAsUsed,
    patchInvitation,

    createSupplierFromInvitation,
    cancelSupplierIndication,
    updateSupplier,
    approveSupplier,
    requestSupplierCorrection,
    blockSupplier,
    changeSupplierClassification,

    createPartnerSupplier,
    updatePartnerSupplier,
    setPartnerSupplierStatus,
    linkPartnerSuppliersToEvent,
    createManualEventSupplier,

    createPerson,
    updatePerson,
    submitPeopleForApproval,
    approvePerson,
    rejectPerson,
    requestPersonCorrection,
    blockPerson,
    releasePersonToGate,

    createAccessRequest,
    approveAccessRequest,
    rejectAccessRequest,
    updateAccessRequest,
    registerEntry,
    registerExit,

    addHistoryLog,
    restoreDemoData,

    SUPPLIER_CATEGORIES,
    ADMIN_CLASSIFICATIONS,
    PARTNER_STATUSES
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
};

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within AppDataProvider');
  }
  return context;
};
