const SEVERITY_ORDER = {
  critica: 4,
  alta: 3,
  media: 2,
  baixa: 1
};

const REQUIRED_PERSON_FIELDS = ['nome', 'cpf', 'fornecedor', 'funcao', 'tipoAcesso'];

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function normalizeCpf(value) {
  return String(value || '').replace(/\D/g, '');
}

function parseBrDate(value, endOfDay = false) {
  if (!value || typeof value !== 'string') return null;

  const [datePart, timePart] = value.trim().split(' ');
  if (!datePart) return null;

  const [dayStr, monthStr, yearStr] = datePart.split('/');
  const day = Number(dayStr);
  const month = Number(monthStr);
  const year = Number(yearStr);

  if (!day || !month || !year) return null;

  let hours = endOfDay ? 23 : 0;
  let minutes = endOfDay ? 59 : 0;

  if (timePart) {
    const [hStr, mStr] = timePart.split(':');
    const h = Number(hStr);
    const m = Number(mStr);

    if (Number.isFinite(h)) hours = h;
    if (Number.isFinite(m)) minutes = m;
  }

  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

function getEventDateWindow(evento) {
  const periodRange = String(evento?.periodo || '').split(' a ');
  const inicio = parseBrDate(periodRange[0], false);
  const fim = parseBrDate(periodRange[1], true);

  return {
    inicio,
    fim
  };
}

function readEventDocumentsStatus(eventoId) {
  if (typeof window === 'undefined' || !window?.localStorage || !eventoId) return null;

  const raw = window.localStorage.getItem(`evento_${eventoId}_docs`);
  if (!raw) return null;

  try {
    const docs = JSON.parse(raw);
    if (!Array.isArray(docs)) return null;

    const contrato = docs.find((doc) => normalizeText(doc?.name).includes('contrato'));
    const plano = docs.find((doc) => normalizeText(doc?.name).includes('plano'));

    return {
      contratoAnexado: normalizeText(contrato?.status) === 'anexado' || normalizeText(contrato?.status) === 'conferido',
      planoAnexado: normalizeText(plano?.status) === 'anexado' || normalizeText(plano?.status) === 'conferido'
    };
  } catch {
    return null;
  }
}

function isDocumentAttachedOrVerified(documents = [], keyword) {
  const doc = documents.find((item) => normalizeText(item?.name).includes(normalizeText(keyword)));
  if (!doc) return false;

  const status = normalizeText(doc?.status);
  return status === 'anexado' || status === 'conferido';
}

export function enrichFornecedoresWithNormas(fornecedores = [], normas = []) {
  const normasMap = new Map();

  normas.forEach((norma) => {
    normasMap.set(normalizeText(norma?.fornecedor), Boolean(norma?.aceiteCompleto));
  });

  return fornecedores.map((fornecedor) => ({
    ...fornecedor,
    aceiteNormas: normasMap.get(normalizeText(fornecedor?.nome)) ?? Boolean(fornecedor?.aceiteNormas)
  }));
}

export function isPessoaSemFoto(pessoa) {
  if (!pessoa) return false;

  if (pessoa.temFoto === false || pessoa.fotoAusente === true) return true;
  if (typeof pessoa.fotoUrl === 'string' && pessoa.fotoUrl.trim().length > 0) return false;
  if (typeof pessoa.foto === 'string' && pessoa.foto.trim().length > 0) return false;

  if (Array.isArray(pessoa.alertas)) {
    return pessoa.alertas.some((alerta) => normalizeText(alerta).includes('sem foto'));
  }

  return false;
}

export function isCpfDuplicadoMesmoEvento(pessoas = []) {
  const cpfCount = new Map();

  pessoas.forEach((pessoa) => {
    const cpf = normalizeCpf(pessoa?.cpf);
    if (!cpf) return;
    cpfCount.set(cpf, (cpfCount.get(cpf) || 0) + 1);
  });

  return Array.from(cpfCount.entries())
    .filter(([, count]) => count > 1)
    .map(([cpf]) => cpf);
}

export function isCpfDuplicadoFornecedoresDiferentes(pessoas = []) {
  const cpfFornecedores = new Map();

  pessoas.forEach((pessoa) => {
    const cpf = normalizeCpf(pessoa?.cpf);
    const fornecedor = normalizeText(pessoa?.fornecedor);

    if (!cpf || !fornecedor) return;

    if (!cpfFornecedores.has(cpf)) {
      cpfFornecedores.set(cpf, new Set());
    }

    cpfFornecedores.get(cpf).add(fornecedor);
  });

  return Array.from(cpfFornecedores.entries())
    .filter(([, fornecedores]) => fornecedores.size > 1)
    .map(([cpf]) => cpf);
}

export function isFornecedorSemAceiteNormas(fornecedor) {
  return fornecedor?.aceiteNormas === false || fornecedor?.normasAceitas === false;
}

export function isFornecedorAguardandoAprovacao(fornecedor) {
  return normalizeText(fornecedor?.statusCadastral).includes('aguardando');
}

export function isTaxaPendente(taxa) {
  const status = normalizeText(taxa?.status);
  return status === 'pendente' || status === 'atrasada';
}

export function isPessoaForaPeriodoAutorizado(pessoa, evento, referenceDate = new Date()) {
  const tipoAcesso = normalizeText(pessoa?.tipoAcesso);
  if (!tipoAcesso || tipoAcesso.includes('todos')) return false;

  const { inicio, fim } = getEventDateWindow(evento);
  const now = referenceDate;

  if (inicio && fim && (now < inicio || now > fim)) {
    return true;
  }

  const faseAtual = normalizeText(evento?.faseAtual);

  if (tipoAcesso.includes('montagem') && !faseAtual.includes('montagem')) return true;
  if (tipoAcesso === 'evento' && !faseAtual.includes('evento')) return true;
  if (tipoAcesso.includes('desmontagem') && !faseAtual.includes('desmontagem')) return true;

  return false;
}

export function isConviteExpirado(convite, referenceDate = new Date()) {
  const status = normalizeText(convite?.status);
  if (status === 'expirado') return true;

  const validade = parseBrDate(convite?.validade, true);
  if (!validade) return false;

  return referenceDate > validade;
}

export function isPessoaBloqueada(pessoa) {
  return normalizeText(pessoa?.status).includes('bloqueado');
}

export function isCadastroIncompleto(pessoa) {
  return REQUIRED_PERSON_FIELDS.some((field) => {
    const value = pessoa?.[field];
    return value === undefined || value === null || String(value).trim() === '';
  });
}

export function isEventoSemContratoAnexado(evento, documents = null) {
  if (evento?.contratoAnexado !== undefined) return evento.contratoAnexado === false;

  if (Array.isArray(documents) && documents.length > 0) {
    return !isDocumentAttachedOrVerified(documents, 'contrato');
  }

  const docsStatus = readEventDocumentsStatus(evento?.id);
  if (docsStatus) return docsStatus.contratoAnexado === false;

  return true;
}

export function isEventoSemPlanoAnexado(evento, documents = null) {
  if (evento?.planoAnexado !== undefined) return evento.planoAnexado === false;

  if (Array.isArray(documents) && documents.length > 0) {
    return !isDocumentAttachedOrVerified(documents, 'plano');
  }

  const docsStatus = readEventDocumentsStatus(evento?.id);
  if (docsStatus) return docsStatus.planoAnexado === false;

  return true;
}

export function isEventoSemPeriodosDefinidos(evento) {
  const periodos = evento?.periodos;

  if (!periodos) return true;

  return !periodos?.montagem || !periodos?.evento || !periodos?.desmontagem;
}

function buildAlert({ tipo, gravidade, mensagem, entidadeRelacionada, acaoSugerida }) {
  return {
    tipo,
    gravidade,
    mensagem,
    entidadeRelacionada,
    acaoSugerida
  };
}

function sortAlertsBySeverity(alertas) {
  return [...alertas].sort((a, b) => (SEVERITY_ORDER[b.gravidade] || 0) - (SEVERITY_ORDER[a.gravidade] || 0));
}

function createChecklistItem(id, label, status, detalhe = '') {
  return { id, label, status, detalhe };
}

function summarizeChecklist(items = []) {
  const total = items.length;
  const concluidos = items.filter((item) => item.status === 'concluido').length;
  const percentualConclusao = total === 0 ? 0 : Math.round((concluidos / total) * 100);

  return {
    total,
    concluidos,
    percentualConclusao,
    isOk: total > 0 && concluidos === total,
    faltantes: items.filter((item) => item.status !== 'concluido')
  };
}

function getDaysUntilEventStart(evento) {
  const periodRange = String(evento?.periodo || '').split(' a ');
  const inicio = parseBrDate(periodRange[0], false);
  if (!inicio) return null;

  const now = new Date();
  const diffMs = inicio.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function getRiskLevel(score) {
  if (score >= 8) return 'Critico';
  if (score >= 5) return 'Alto';
  if (score >= 3) return 'Medio';
  return 'Baixo';
}

function getSuggestedTabByAlertType(tipoAlerta) {
  const tabMap = {
    pessoa_sem_foto: 'aprovacoes',
    cpf_duplicado_mesmo_evento: 'pessoas',
    cpf_duplicado_fornecedores_diferentes: 'pessoas',
    fornecedor_sem_aceite_normas: 'normas',
    fornecedor_aguardando_aprovacao: 'fornecedores',
    taxa_pendente: 'taxas',
    pessoa_fora_periodo_autorizado: 'guarita',
    convite_expirado: 'convites',
    pessoa_bloqueada: 'guarita',
    cadastro_incompleto: 'pessoas',
    evento_sem_contrato_anexado: 'documentos',
    evento_sem_plano_anexado: 'documentos',
    evento_sem_periodos_definidos: 'documentos'
  };

  return tabMap[tipoAlerta] || 'documentos';
}

function getSuggestedButtonLabelByAlertType(tipoAlerta) {
  const labelMap = {
    pessoa_sem_foto: 'Ir para Pessoas sem foto',
    cpf_duplicado_mesmo_evento: 'Ir para CPFs duplicados',
    cpf_duplicado_fornecedores_diferentes: 'Ir para CPFs duplicados',
    fornecedor_sem_aceite_normas: 'Ir para Normas sem aceite',
    fornecedor_aguardando_aprovacao: 'Ir para Fornecedores pendentes',
    taxa_pendente: 'Ir para Taxas pendentes',
    pessoa_fora_periodo_autorizado: 'Ir para Acessos fora do período',
    convite_expirado: 'Ir para Convites expirados',
    pessoa_bloqueada: 'Ir para Pessoas bloqueadas',
    cadastro_incompleto: 'Ir para Cadastros incompletos',
    evento_sem_contrato_anexado: 'Ir para Contrato do evento',
    evento_sem_plano_anexado: 'Ir para Plano do evento',
    evento_sem_periodos_definidos: 'Ir para Períodos do evento'
  };

  return labelMap[tipoAlerta] || 'Abrir pendência crítica';
}

export function getOperationalRiskIndicator(
  evento,
  fornecedores = [],
  pessoas = [],
  convites = [],
  taxas = [],
  options = {}
) {
  const normas = options.normas || [];
  const documents = options.documents || [];
  const aprovacoes = options.aprovacoes || [];
  const guarita = options.guarita || [];

  const fornecedoresComNormas =
    options.fornecedoresComNormas ||
    enrichFornecedoresWithNormas(fornecedores, normas);

  const operationalAlerts =
    options.operationalAlerts ||
    getOperationalAlerts(evento, fornecedoresComNormas, pessoas, convites, taxas);

  const checklist =
    options.checklist ||
    getIntelligentEventChecklist(evento, fornecedoresComNormas, pessoas, convites, taxas, {
      normas,
      documents,
      aprovacoes,
      operationalAlerts
    });

  const diasParaInicio = getDaysUntilEventStart(evento);
  const existeSemFoto = operationalAlerts.some((alerta) => alerta.tipo === 'pessoa_sem_foto');
  const existeCpfDuplicado = operationalAlerts.some(
    (alerta) => alerta.tipo === 'cpf_duplicado_mesmo_evento' || alerta.tipo === 'cpf_duplicado_fornecedores_diferentes'
  );
  const fornecedoresSemAceite = fornecedoresComNormas.filter((f) => isFornecedorSemAceiteNormas(f)).length;
  const taxasPendentes = taxas.filter((t) => isTaxaPendente(t)).length;
  const planoNaoAnexado = isEventoSemPlanoAnexado(evento, documents);
  const listaNaoLiberadaGuarita = !checklist?.guarita?.isOk;

  const solicitacoesEmergenciaisAbertas =
    options.solicitacoesEmergenciaisAbertas ??
    guarita.filter((registro) => {
      const status = normalizeText(registro?.status);
      return status.includes('bloqueado') || status.includes('aguardando');
    }).length;

  const pessoasPendentes = pessoas.filter((p) => normalizeText(p?.status).includes('aguardando')).length;

  const motivos = [];
  const acoes = [];
  let riskScore = 0;

  if (diasParaInicio !== null && diasParaInicio >= 0 && diasParaInicio <= 14 && (evento?.pendencias || 0) > 0) {
    motivos.push(`Evento inicia em ${diasParaInicio} dia(s) e ainda há ${evento.pendencias} pendência(s).`);
    acoes.push('Executar plano de contingência com revisão diária de pendências até a abertura.');
    riskScore += 2;
  }

  if (existeSemFoto) {
    const qtdSemFoto = operationalAlerts.filter((alerta) => alerta.tipo === 'pessoa_sem_foto').length;
    motivos.push(`${qtdSemFoto} pessoa(s) sem foto validada.`);
    acoes.push('Solicitar envio de foto ao fornecedor.');
    riskScore += 2;
  }

  if (existeCpfDuplicado) {
    const qtdCpfDuplicado = operationalAlerts.filter(
      (alerta) => alerta.tipo === 'cpf_duplicado_mesmo_evento' || alerta.tipo === 'cpf_duplicado_fornecedores_diferentes'
    ).length;
    motivos.push(`${qtdCpfDuplicado} ocorrência(s) de CPF duplicado.`);
    acoes.push('Conferir se a pessoa foi cadastrada por outro fornecedor.');
    riskScore += 2;
  }

  if (fornecedoresSemAceite > 0) {
    motivos.push(`${fornecedoresSemAceite} fornecedor(es) sem aceite das normas.`);
    acoes.push('Solicitar aceite das normas antes de liberar equipe.');
    riskScore += 1;
  }

  if (taxasPendentes > 0) {
    motivos.push(`${taxasPendentes} taxa(s) pendente(s) ou atrasada(s).`);
    acoes.push('Verificar pagamento ou marcar como isento.');
    riskScore += 1;
  }

  if (planoNaoAnexado) {
    motivos.push('Plano do evento ainda não foi anexado/conferido.');
    acoes.push('Solicitar plano do evento antes de liberar lista à guarita.');
    riskScore += 2;
  }

  if (listaNaoLiberadaGuarita) {
    motivos.push('Lista ainda não foi liberada para guarita.');
    acoes.push('Concluir checklist de guarita e liberar lista com validação final.');
    riskScore += 2;
  }

  if (solicitacoesEmergenciaisAbertas > 0) {
    motivos.push(`${solicitacoesEmergenciaisAbertas} solicitação(ões) emergencial(is) aberta(s).`);
    acoes.push('Priorizar tratativa das solicitações emergenciais da guarita.');
    riskScore += 1;
  }

  if (pessoasPendentes > 0) {
    motivos.push(`${pessoasPendentes} pessoa(s) aguardando aprovação.`);
    acoes.push('Priorizar aprovação das equipes para reduzir risco de operação no acesso.');
    riskScore += 1;
  }

  const prontidaoAbertura = checklist?.abertura?.percentualConclusao || 0;
  const prontidaoGuarita = checklist?.guarita?.percentualConclusao || 0;
  const percentualProntidao = Math.round((prontidaoAbertura + prontidaoGuarita) / 2);

  const nivel = getRiskLevel(riskScore);
  const pendenciaPrioritaria = operationalAlerts[0] || null;
  const abaSugerida = pendenciaPrioritaria ? getSuggestedTabByAlertType(pendenciaPrioritaria.tipo) : 'documentos';

  return {
    nivel,
    score: riskScore,
    percentualProntidao,
    principaisMotivos: motivos.slice(0, 4),
    acoesRecomendadas: Array.from(new Set(acoes)).slice(0, 4),
    acaoDireta: {
      aba: abaSugerida,
      motivo: pendenciaPrioritaria?.mensagem || 'Revisar pendências do evento.',
      textoBotao: getSuggestedButtonLabelByAlertType(pendenciaPrioritaria?.tipo)
    },
    checklist
  };
}

function getSuggestionByPendencias(pendencias = []) {
  const has = (value) => pendencias.includes(value);

  if (has('fornecedor_bloqueado')) {
    return 'Não recomendado liberar.';
  }

  if (has('pessoa_sem_foto')) {
    return 'Solicitar foto antes da liberação.';
  }

  if (has('fora_periodo_autorizado')) {
    return 'Liberar somente se houver autorização operacional.';
  }

  if (has('pessoa_pendente')) {
    return 'Conferir cadastro antes de liberar.';
  }

  if (has('taxa_pendente')) {
    return 'Encaminhar para financeiro ou liberar excepcionalmente com justificativa.';
  }

  return 'Validar documentos e histórico operacional antes da decisão.';
}

function humanizePendencia(pendencia) {
  const map = {
    pessoa_pendente: 'Pessoa com status pendente de aprovação',
    pessoa_sem_foto: 'Pessoa sem foto válida',
    fora_periodo_autorizado: 'Pessoa fora do período autorizado',
    fornecedor_bloqueado: 'Fornecedor bloqueado/suspenso',
    taxa_pendente: 'Taxa pendente para o fornecedor'
  };

  return map[pendencia] || pendencia;
}

export function getGuaritaAdminQueue(
  evento,
  pessoas = [],
  fornecedores = [],
  taxas = [],
  aprovacoes = [],
  guaritaRegistros = []
) {
  const pessoasPorNome = new Map(
    pessoas.map((pessoa) => [normalizeText(pessoa?.nome), pessoa])
  );

  const fornecedoresPorNome = new Map(
    fornecedores.map((fornecedor) => [normalizeText(fornecedor?.nome), fornecedor])
  );

  const hasSemFotoByNome = new Set(
    aprovacoes
      .filter((item) =>
        Array.isArray(item?.alertas) &&
        item.alertas.some((alerta) => normalizeText(alerta).includes('sem foto'))
      )
      .map((item) => normalizeText(item?.nome))
  );

  const queueBase = guaritaRegistros.filter((registro) => {
    const status = normalizeText(registro?.status);
    return status.includes('aguardando') || status.includes('bloqueado') || status.includes('solicit');
  });

  return queueBase.map((registro, idx) => {
    const pessoaNome = registro?.pessoa || 'Pessoa não informada';
    const pessoa = pessoasPorNome.get(normalizeText(pessoaNome));
    const fornecedorNome = registro?.fornecedor || pessoa?.fornecedor || 'Fornecedor não informado';
    const fornecedor = fornecedoresPorNome.get(normalizeText(fornecedorNome));

    const pendencias = [];
    const pessoaStatus = pessoa?.status || 'Sem cadastro no evento';

    if (normalizeText(pessoaStatus).includes('aguardando') || normalizeText(pessoaStatus).includes('pendente')) {
      pendencias.push('pessoa_pendente');
    }

    if (hasSemFotoByNome.has(normalizeText(pessoaNome))) {
      pendencias.push('pessoa_sem_foto');
    }

    if (pessoa && isPessoaForaPeriodoAutorizado(pessoa, evento)) {
      pendencias.push('fora_periodo_autorizado');
    }

    if (normalizeText(fornecedor?.statusCadastral).includes('bloqueado') || normalizeText(fornecedor?.statusCadastral).includes('suspenso')) {
      pendencias.push('fornecedor_bloqueado');
    }

    const taxaFornecedor = taxas.find(
      (taxa) => normalizeText(taxa?.fornecedor) === normalizeText(fornecedorNome)
    );
    if (taxaFornecedor && isTaxaPendente(taxaFornecedor)) {
      pendencias.push('taxa_pendente');
    }

    const suggestion = getSuggestionByPendencias(pendencias);
    const urgencia = pendencias.includes('fornecedor_bloqueado') || pendencias.includes('fora_periodo_autorizado')
      ? 'Alta'
      : (pendencias.length >= 2 ? 'Média' : 'Baixa');

    return {
      id: registro?.id || `gua-admin-${idx}`,
      pessoa: {
        nome: pessoaNome,
        cpf: pessoa?.cpf || 'Não informado',
        funcao: registro?.funcao || pessoa?.funcao || 'Não informado'
      },
      evento: evento?.nome || 'Evento não identificado',
      fornecedor: fornecedorNome,
      motivo: pendencias.length > 0
        ? `Solicitação com ${pendencias.length} pendência(s) operacional(is).`
        : 'Solicitação operacional da guarita para avaliação administrativa.',
      urgencia,
      statusAtualPessoa: pessoaStatus,
      pendenciasExistentes: pendencias.map(humanizePendencia),
      sugestaoAutomatica: suggestion,
      statusSolicitacao: registro?.status || 'Aguardando análise',
      horario: registro?.dataHora || '-'
    };
  });
}

export function getIntelligentEventChecklist(
  evento,
  fornecedores = [],
  pessoas = [],
  convites = [],
  taxas = [],
  options = {}
) {
  const normas = options.normas || [];
  const documents = options.documents || [];
  const aprovacoes = options.aprovacoes || [];
  const alertasOperacionais = options.operationalAlerts || getOperationalAlerts(evento, fornecedores, pessoas, convites, taxas);

  const fornecedoresAprovados = fornecedores.filter((f) => normalizeText(f?.statusCadastral) === 'aprovado').length;
  const fornecedoresAguardando = fornecedores.some((f) => isFornecedorAguardandoAprovacao(f));
  const pessoasAguardandoOuBloqueadas = pessoas.filter(
    (p) => normalizeText(p?.status).includes('aguardando') || isPessoaBloqueada(p)
  );
  const existeSemFoto =
    pessoas.some((p) => isPessoaSemFoto(p)) ||
    aprovacoes.some((aprovacao) => Array.isArray(aprovacao?.alertas) && aprovacao.alertas.some((alerta) => normalizeText(alerta).includes('sem foto')));

  const cpfInvalidoOuDuplicado =
    pessoas.some((p) => normalizeCpf(p?.cpf).length !== 11) ||
    isCpfDuplicadoMesmoEvento(pessoas).length > 0 ||
    isCpfDuplicadoFornecedoresDiferentes(pessoas).length > 0;

  const fornecedoresSemNorma = fornecedores.filter((f) => isFornecedorSemAceiteNormas(f)).length;

  const taxasAtrasadas = taxas.filter((t) => normalizeText(t?.status) === 'atrasada').length;
  const taxasPendentes = taxas.filter((t) => normalizeText(t?.status) === 'pendente').length;

  const periodosDetalhados = evento?.periodos;
  const possuiPeriodoMacro = String(evento?.periodo || '').includes(' a ');

  const aberturaItems = [
    createChecklistItem(
      'abertura-contrato',
      'Contrato anexado',
      isEventoSemContratoAnexado(evento, documents) ? 'critico' : 'concluido',
      isEventoSemContratoAnexado(evento, documents) ? 'Anexe e confira o contrato assinado do evento.' : 'Contrato disponível para auditoria.'
    ),
    createChecklistItem(
      'abertura-organizador',
      'Locatário/organizador vinculado',
      evento?.organizador ? 'concluido' : 'critico',
      evento?.organizador ? `Organizador atual: ${evento.organizador}.` : 'Vincule o organizador responsável no cadastro do evento.'
    ),
    createChecklistItem(
      'abertura-periodos',
      'Períodos de montagem, evento e desmontagem definidos',
      periodosDetalhados?.montagem && periodosDetalhados?.evento && periodosDetalhados?.desmontagem
        ? 'concluido'
        : (possuiPeriodoMacro ? 'atencao' : 'critico'),
      periodosDetalhados?.montagem && periodosDetalhados?.evento && periodosDetalhados?.desmontagem
        ? 'Períodos operacionais completos.'
        : (possuiPeriodoMacro
          ? 'Existe período geral, mas faltam janelas específicas de montagem/evento/desmontagem.'
          : 'Defina os três períodos operacionais para liberar credenciamento com segurança.')
    ),
    createChecklistItem(
      'abertura-espacos',
      'Espaços locados definidos',
      evento?.espacosLocadosDefinidos === true ? 'concluido' : (evento?.espacosLocadosDefinidos === false ? 'pendente' : 'atencao'),
      evento?.espacosLocadosDefinidos === true
        ? 'Mapa de espaços locados preenchido.'
        : 'Informe os espaços locados por fornecedor para evitar acessos indevidos.'
    ),
    createChecklistItem(
      'abertura-normas-vinculadas',
      'Normas vinculadas',
      normas.length > 0 ? 'concluido' : 'pendente',
      normas.length > 0 ? 'Normas cadastradas e disponíveis para aceite.' : 'Vincule as normas obrigatórias ao evento.'
    ),
    createChecklistItem(
      'abertura-regras-taxa',
      'Regras de taxa definidas ou marcadas como não definida',
      evento?.regrasTaxaDefinidas === true || evento?.taxaNaoDefinida === true
        ? 'concluido'
        : (taxas.length > 0 ? 'atencao' : 'pendente'),
      evento?.regrasTaxaDefinidas === true || evento?.taxaNaoDefinida === true
        ? 'Política de taxa consolidada para o evento.'
        : (taxas.length > 0
          ? 'Existem lançamentos de taxa, mas a regra formal do evento não está registrada.'
          : 'Defina a regra de taxa ou marque explicitamente como não definida.')
    ),
    createChecklistItem(
      'abertura-autorizacao',
      'Evento autorizado pela administração',
      evento?.autorizadoAdministracao === true ? 'concluido' : (evento?.autorizadoAdministracao === false ? 'critico' : 'pendente'),
      evento?.autorizadoAdministracao === true
        ? 'Evento autorizado para etapa de credenciamento.'
        : 'A administração deve validar e autorizar a abertura do credenciamento.'
    )
  ];

  const guaritaItems = [
    createChecklistItem(
      'guarita-plano',
      'Plano do evento anexado/conferido',
      isEventoSemPlanoAnexado(evento, documents) ? 'pendente' : 'concluido',
      isEventoSemPlanoAnexado(evento, documents)
        ? 'Anexe e confira o plano operacional do evento.'
        : 'Plano do evento disponível e validado.'
    ),
    createChecklistItem(
      'guarita-fornecedores',
      'Fornecedores aprovados',
      fornecedores.length > 0 && fornecedoresAprovados === fornecedores.length
        ? 'concluido'
        : (fornecedoresAguardando ? 'atencao' : 'pendente'),
      fornecedores.length > 0 && fornecedoresAprovados === fornecedores.length
        ? 'Todos os fornecedores estão aprovados.'
        : 'Concluir aprovação dos fornecedores pendentes antes de liberar a lista.'
    ),
    createChecklistItem(
      'guarita-pessoas',
      'Pessoas aprovadas',
      pessoasAguardandoOuBloqueadas.length === 0 ? 'concluido' : (pessoasAguardandoOuBloqueadas.some((p) => isPessoaBloqueada(p)) ? 'critico' : 'pendente'),
      pessoasAguardandoOuBloqueadas.length === 0
        ? 'Equipes aptas para liberação.'
        : 'Existem pessoas aguardando aprovação ou bloqueadas.'
    ),
    createChecklistItem(
      'guarita-fotos',
      'Fotos conferidas',
      existeSemFoto ? 'critico' : 'concluido',
      existeSemFoto ? 'Há cadastros sem foto válida para identificação na guarita.' : 'Fotos conferidas para identificação.'
    ),
    createChecklistItem(
      'guarita-cpf',
      'CPFs conferidos',
      cpfInvalidoOuDuplicado ? 'critico' : 'concluido',
      cpfInvalidoOuDuplicado ? 'Foram encontradas inconsistências de CPF (duplicidade ou formato inválido).' : 'CPFs consistentes e validados.'
    ),
    createChecklistItem(
      'guarita-normas',
      'Normas aceitas',
      fornecedoresSemNorma === 0 ? 'concluido' : 'pendente',
      fornecedoresSemNorma === 0
        ? 'Aceites de normas concluídos por todos os fornecedores.'
        : 'Ainda existem fornecedores sem aceite completo das normas.'
    ),
    createChecklistItem(
      'guarita-taxas',
      'Taxas pagas ou isentas',
      taxasAtrasadas > 0 ? 'critico' : (taxasPendentes > 0 ? 'pendente' : 'concluido'),
      taxasAtrasadas > 0
        ? 'Existem taxas em atraso que bloqueiam liberação plena.'
        : (taxasPendentes > 0 ? 'Existem taxas pendentes de regularização.' : 'Situação financeira regular para liberação.')
    ),
    createChecklistItem(
      'guarita-pendencias',
      'Pendências resolvidas',
      alertasOperacionais.filter((a) => a.gravidade === 'critica').length > 0
        ? 'critico'
        : (alertasOperacionais.filter((a) => a.gravidade === 'alta' || a.gravidade === 'media').length > 0 ? 'atencao' : 'concluido'),
      alertasOperacionais.length === 0
        ? 'Sem pendências operacionais em aberto.'
        : 'Ainda há alertas operacionais que devem ser resolvidos antes da liberação.'
    )
  ];

  const aberturaResumo = summarizeChecklist(aberturaItems);
  const guaritaResumo = summarizeChecklist(guaritaItems);

  return {
    abertura: {
      titulo: 'Para abrir credenciamento',
      itens: aberturaItems,
      ...aberturaResumo
    },
    guarita: {
      titulo: 'Para liberar lista à guarita',
      itens: guaritaItems,
      ...guaritaResumo
    }
  };
}

export function getOperationalAlerts(evento, fornecedores = [], pessoas = [], convites = [], taxas = []) {
  const alertas = [];

  pessoas.forEach((pessoa) => {
    if (isPessoaSemFoto(pessoa)) {
      alertas.push(buildAlert({
        tipo: 'pessoa_sem_foto',
        gravidade: 'alta',
        mensagem: `Pessoa ${pessoa.nome} sem foto cadastrada.`,
        entidadeRelacionada: { tipo: 'pessoa', id: pessoa.id, nome: pessoa.nome },
        acaoSugerida: 'Solicitar envio de foto ao fornecedor.'
      }));
    }

    if (isPessoaBloqueada(pessoa)) {
      alertas.push(buildAlert({
        tipo: 'pessoa_bloqueada',
        gravidade: 'critica',
        mensagem: `Pessoa ${pessoa.nome} esta bloqueada para acesso.`,
        entidadeRelacionada: { tipo: 'pessoa', id: pessoa.id, nome: pessoa.nome },
        acaoSugerida: 'Revisar motivo do bloqueio e liberar apenas com validacao documental.'
      }));
    }

    if (isCadastroIncompleto(pessoa)) {
      alertas.push(buildAlert({
        tipo: 'cadastro_incompleto',
        gravidade: 'media',
        mensagem: `Cadastro incompleto para ${pessoa.nome}.`,
        entidadeRelacionada: { tipo: 'pessoa', id: pessoa.id, nome: pessoa.nome },
        acaoSugerida: 'Completar campos obrigatorios antes de aprovar acesso.'
      }));
    }

    if (isPessoaForaPeriodoAutorizado(pessoa, evento)) {
      alertas.push(buildAlert({
        tipo: 'pessoa_fora_periodo_autorizado',
        gravidade: 'alta',
        mensagem: `Pessoa ${pessoa.nome} com tipo de acesso fora do periodo autorizado do evento.`,
        entidadeRelacionada: { tipo: 'pessoa', id: pessoa.id, nome: pessoa.nome },
        acaoSugerida: 'Ajustar período ou negar liberação.'
      }));
    }
  });

  const cpfsDuplicadosMesmoEvento = isCpfDuplicadoMesmoEvento(pessoas);
  cpfsDuplicadosMesmoEvento.forEach((cpf) => {
    alertas.push(buildAlert({
      tipo: 'cpf_duplicado_mesmo_evento',
      gravidade: 'critica',
      mensagem: `CPF ${cpf} duplicado no mesmo evento.`,
      entidadeRelacionada: { tipo: 'cpf', valor: cpf },
      acaoSugerida: 'Conferir se a pessoa foi cadastrada por outro fornecedor.'
    }));
  });

  const cpfsDuplicadosFornecedores = isCpfDuplicadoFornecedoresDiferentes(pessoas);
  cpfsDuplicadosFornecedores.forEach((cpf) => {
    alertas.push(buildAlert({
      tipo: 'cpf_duplicado_fornecedores_diferentes',
      gravidade: 'alta',
      mensagem: `CPF ${cpf} vinculado a fornecedores diferentes.`,
      entidadeRelacionada: { tipo: 'cpf', valor: cpf },
      acaoSugerida: 'Conferir se a pessoa foi cadastrada por outro fornecedor.'
    }));
  });

  fornecedores.forEach((fornecedor) => {
    if (isFornecedorSemAceiteNormas(fornecedor)) {
      alertas.push(buildAlert({
        tipo: 'fornecedor_sem_aceite_normas',
        gravidade: 'alta',
        mensagem: `Fornecedor ${fornecedor.nome} sem aceite das normas obrigatorias.`,
        entidadeRelacionada: { tipo: 'fornecedor', id: fornecedor.id, nome: fornecedor.nome },
        acaoSugerida: 'Solicitar aceite das normas antes de liberar equipe.'
      }));
    }

    if (isFornecedorAguardandoAprovacao(fornecedor)) {
      alertas.push(buildAlert({
        tipo: 'fornecedor_aguardando_aprovacao',
        gravidade: 'media',
        mensagem: `Fornecedor ${fornecedor.nome} aguardando aprovacao cadastral.`,
        entidadeRelacionada: { tipo: 'fornecedor', id: fornecedor.id, nome: fornecedor.nome },
        acaoSugerida: 'Priorizar revisao de documentos e concluir aprovacao.'
      }));
    }
  });

  taxas.forEach((taxa) => {
    if (isTaxaPendente(taxa)) {
      alertas.push(buildAlert({
        tipo: 'taxa_pendente',
        gravidade: 'alta',
        mensagem: `Taxa pendente para o fornecedor ${taxa.fornecedor}.`,
        entidadeRelacionada: { tipo: 'taxa', id: taxa.id, fornecedor: taxa.fornecedor },
        acaoSugerida: 'Verificar pagamento ou marcar como isento.'
      }));
    }
  });

  convites.forEach((convite) => {
    if (isConviteExpirado(convite)) {
      alertas.push(buildAlert({
        tipo: 'convite_expirado',
        gravidade: 'media',
        mensagem: `Convite ${convite.codigo} expirado para ${convite.fornecedor}.`,
        entidadeRelacionada: { tipo: 'convite', id: convite.id, codigo: convite.codigo },
        acaoSugerida: 'Gerar novo convite ou reenviar ao fornecedor.'
      }));
    }
  });

  if (isEventoSemContratoAnexado(evento)) {
    alertas.push(buildAlert({
      tipo: 'evento_sem_contrato_anexado',
      gravidade: 'critica',
      mensagem: `Evento ${evento?.nome || ''} sem contrato anexado.`,
      entidadeRelacionada: { tipo: 'evento', id: evento?.id, nome: evento?.nome },
      acaoSugerida: 'Anexar contrato antes de abrir credenciamento.'
    }));
  }

  if (isEventoSemPlanoAnexado(evento)) {
    alertas.push(buildAlert({
      tipo: 'evento_sem_plano_anexado',
      gravidade: 'alta',
      mensagem: `Evento ${evento?.nome || ''} sem plano do evento anexado.`,
      entidadeRelacionada: { tipo: 'evento', id: evento?.id, nome: evento?.nome },
      acaoSugerida: 'Solicitar plano do evento antes de liberar lista à guarita.'
    }));
  }

  if (isEventoSemPeriodosDefinidos(evento)) {
    alertas.push(buildAlert({
      tipo: 'evento_sem_periodos_definidos',
      gravidade: 'critica',
      mensagem: `Evento ${evento?.nome || ''} sem periodos de montagem, evento e desmontagem definidos.`,
      entidadeRelacionada: { tipo: 'evento', id: evento?.id, nome: evento?.nome },
      acaoSugerida: 'Definir periodos operacionais para controlar autorizacoes de acesso.'
    }));
  }

  return sortAlertsBySeverity(alertas);
}
