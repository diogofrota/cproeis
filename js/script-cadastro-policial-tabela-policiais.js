const STORAGE_KEY = 'cproeis_cadastro_policiais';
const HISTORY_STORAGE_KEY = 'cproeis_historico_sanitario';
const FUNCTIONAL_HISTORY_STORAGE_KEY = 'cproeis_historico_funcional';
const BEHAVIOR_HISTORY_STORAGE_KEY = 'cproeis_historico_comportamento';
const UNIT_HISTORY_STORAGE_KEY = 'cproeis_historico_unidade';
const STATUS_HISTORY_STORAGE_KEY = 'cproeis_historico_situacao_funcional';
const COURSE_HISTORY_STORAGE_KEY = 'cproeis_historico_cursos';
const MOTOR_LICENSE_HISTORY_STORAGE_KEY = 'cproeis_historico_habilitacao_moto';
const ORDINANCE_HISTORY_STORAGE_KEY = 'cproeis_historico_portariado';
const POLICIAL_STORAGE_RESET_KEY = 'cproeis_cadastro_policial_reset_version';
const POLICIAL_STORAGE_RESET_VERSION = '2026-05-15-input-ajustes';
const LEGACY_STORAGE_KEYS = [
  'cproeis_policiais_ativos',
  'cproeis_policiais_reserva',
  'cproeis_seed_version'
];

LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));

if (localStorage.getItem(POLICIAL_STORAGE_RESET_KEY) !== POLICIAL_STORAGE_RESET_VERSION) {
  [
    STORAGE_KEY,
    HISTORY_STORAGE_KEY,
    FUNCTIONAL_HISTORY_STORAGE_KEY,
    BEHAVIOR_HISTORY_STORAGE_KEY,
    UNIT_HISTORY_STORAGE_KEY,
    STATUS_HISTORY_STORAGE_KEY,
    COURSE_HISTORY_STORAGE_KEY,
    MOTOR_LICENSE_HISTORY_STORAGE_KEY,
    ORDINANCE_HISTORY_STORAGE_KEY
  ].forEach((key) => localStorage.removeItem(key));

  localStorage.setItem(POLICIAL_STORAGE_RESET_KEY, POLICIAL_STORAGE_RESET_VERSION);
}

const form = document.getElementById('policial-form');
const editingId = document.getElementById('editing-id');
const saveButton = document.getElementById('save-button');
const clearButton = document.getElementById('clear-button');
const cancelButton = document.getElementById('cancel-button');
const historyForm = document.getElementById('history-form');
const historyPolicialId = document.getElementById('history-policial-id');
const showHistoryFormButton = document.getElementById('show-history-form');
const saveHistoryButton = document.getElementById('save-history-button');
const cancelHistoryButton = document.getElementById('cancel-history-button');
const functionalForm = document.getElementById('functional-form');
const functionalPolicialId = document.getElementById('functional-policial-id');
const showFunctionalFormButton = document.getElementById('show-functional-form');
const saveFunctionalButton = document.getElementById('save-functional-button');
const cancelFunctionalButton = document.getElementById('cancel-functional-button');
const behaviorForm = document.getElementById('behavior-form');
const behaviorPolicialId = document.getElementById('behavior-policial-id');
const showBehaviorFormButton = document.getElementById('show-behavior-form');
const saveBehaviorButton = document.getElementById('save-behavior-button');
const cancelBehaviorButton = document.getElementById('cancel-behavior-button');
const unitForm = document.getElementById('unit-form');
const unitPolicialId = document.getElementById('unit-policial-id');
const showUnitFormButton = document.getElementById('show-unit-form');
const saveUnitButton = document.getElementById('save-unit-button');
const cancelUnitButton = document.getElementById('cancel-unit-button');
const statusForm = document.getElementById('status-form');
const statusPolicialId = document.getElementById('status-policial-id');
const showStatusFormButton = document.getElementById('show-status-form');
const saveStatusButton = document.getElementById('save-status-button');
const cancelStatusButton = document.getElementById('cancel-status-button');
const courseForm = document.getElementById('course-form');
const coursePolicialId = document.getElementById('course-policial-id');
const showCourseFormButton = document.getElementById('show-course-form');
const saveCourseButton = document.getElementById('save-course-button');
const cancelCourseButton = document.getElementById('cancel-course-button');
const motorLicenseForm = document.getElementById('motor-license-form');
const motorLicensePolicialId = document.getElementById('motor-license-policial-id');
const showMotorLicenseFormButton = document.getElementById('show-motor-license-form');
const saveMotorLicenseButton = document.getElementById('save-motor-license-button');
const cancelMotorLicenseButton = document.getElementById('cancel-motor-license-button');
const ordinanceForm = document.getElementById('ordinance-form');
const ordinancePolicialId = document.getElementById('ordinance-policial-id');
const showOrdinanceFormButton = document.getElementById('show-ordinance-form');
const saveOrdinanceButton = document.getElementById('save-ordinance-button');
const cancelOrdinanceButton = document.getElementById('cancel-ordinance-button');
const policiaisBody = document.getElementById('policiais-body');
const tableCount = document.getElementById('table-count');
const detailsCard = document.getElementById('details-card');
const detailsEmpty = document.getElementById('details-empty');
const detailsTitle = document.getElementById('details-title');
const detailsGrid = document.getElementById('details-grid');
const funcionalBody = document.getElementById('funcional-body');
const comportamentoBody = document.getElementById('comportamento-body');
const unidadeBody = document.getElementById('unidade-body');
const situacaoFuncionalBody = document.getElementById('situacao-funcional-body');
const historicoBody = document.getElementById('historico-body');
const cursoBody = document.getElementById('curso-body');
const habilitacaoMotoBody = document.getElementById('habilitacao-moto-body');
const portariadoBody = document.getElementById('portariado-body');
const closeDetails = document.getElementById('close-details');
const tabButtons = document.querySelectorAll('.tab-button[data-view]');
const viewPanels = document.querySelectorAll('.view-panel');

const fieldIds = [
  'rg',
  'idFuncional',
  'nomeCompleto',
  'nomeGuerra',
  'telefone',
  'email',
  'dataEntrada'
];

const initialFieldIds = [
  'initialPostoGraduacao',
  'initialGrupoHierarquico',
  'initialGrupoOficial',
  'initialComportamento',
  'initialSituacaoFuncional',
  'initialUnidade',
  'initialSituacaoSanitaria'
];

const functionalFieldIds = [
  'functionalPostoGraduacao',
  'functionalGrupoHierarquico',
  'functionalGrupoOficial',
  'functionalDataAlteracao',
  'functionalBolpm',
  'functionalDataBolpm'
];

const behaviorFieldIds = [
  'behaviorComportamento',
  'behaviorDataAlteracao',
  'behaviorBolpm',
  'behaviorDataBolpm'
];

const unitFieldIds = [
  'unitUnidade',
  'unitDataApresentacao',
  'unitBolpm',
  'unitDataBolpm'
];

const statusFieldIds = [
  'statusSituacaoFuncional',
  'statusDataAlteracao',
  'statusBolpm',
  'statusDataBolpm'
];

const historyFieldIds = [
  'situacaoSanitaria',
  'dataInicio',
  'dataTermino',
  'bolpm',
  'dataBolpm'
];

const courseFieldIds = [
  'courseDate',
  'courseConvenio',
  'courseName'
];

const motorLicenseFieldIds = [
  'motorLicenseExpiration',
  'motorLicenseCategory',
  'motorLicenseObservation'
];

const ordinanceFieldIds = [
  'ordinanceFineType',
  'ordinanceStartDate',
  'ordinanceBolNumber',
  'ordinanceBolDate',
  'ordinanceRegistrationStatus'
];

const fields = Object.fromEntries(
  fieldIds.map((id) => [id, document.getElementById(id)])
);

const initialFields = Object.fromEntries(
  initialFieldIds.map((id) => [id, document.getElementById(id)])
);

const historyFields = Object.fromEntries(
  historyFieldIds.map((id) => [id, document.getElementById(id)])
);

const functionalFields = Object.fromEntries(
  functionalFieldIds.map((id) => [id, document.getElementById(id)])
);

const behaviorFields = Object.fromEntries(
  behaviorFieldIds.map((id) => [id, document.getElementById(id)])
);

const unitFields = Object.fromEntries(
  unitFieldIds.map((id) => [id, document.getElementById(id)])
);

const statusFields = Object.fromEntries(
  statusFieldIds.map((id) => [id, document.getElementById(id)])
);

const courseFields = Object.fromEntries(
  courseFieldIds.map((id) => [id, document.getElementById(id)])
);

const motorLicenseFields = Object.fromEntries(
  motorLicenseFieldIds.map((id) => [id, document.getElementById(id)])
);

const ordinanceFields = Object.fromEntries(
  ordinanceFieldIds.map((id) => [id, document.getElementById(id)])
);

const formHintIds = [
  'rg',
  'idFuncional',
  'nomeCompleto',
  'nomeGuerra',
  'telefone',
  'email',
  'dataEntrada',
  'initialPostoGraduacao',
  'initialComportamento',
  'initialSituacaoFuncional',
  'initialUnidade',
  'initialSituacaoSanitaria'
];

const formHints = Object.fromEntries(
  formHintIds.map((id) => [id, document.getElementById(`${id}Hint`)])
);

const activeValidationFields = new Set();

const detailLabels = [
  ['rg', 'RG'],
  ['idFuncional', 'ID Funcional'],
  ['nomeCompleto', 'Nome Completo'],
  ['nomeGuerra', 'Nome de Guerra'],
  ['telefone', 'Telefone'],
  ['email', 'Email'],
  ['dataEntrada', 'Data de Entrada'],
  ['postoGraduacao', 'Posto/Graduação'],
  ['situacaoFuncional', 'Situação Funcional'],
  ['unidade', 'Unidade'],
  ['situacaoSanitaria', 'Situação Sanitária'],
  ['comportamento', 'Comportamento']
];

function loadPoliciais() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function savePoliciais(policiais) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(policiais));
}

function loadHistoricos() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveHistoricos(historicos) {
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historicos));
}

function loadFunctionalHistoricos() {
  try {
    return JSON.parse(localStorage.getItem(FUNCTIONAL_HISTORY_STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveFunctionalHistoricos(historicos) {
  localStorage.setItem(FUNCTIONAL_HISTORY_STORAGE_KEY, JSON.stringify(historicos));
}

function loadBehaviorHistoricos() {
  try {
    return JSON.parse(localStorage.getItem(BEHAVIOR_HISTORY_STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveBehaviorHistoricos(historicos) {
  localStorage.setItem(BEHAVIOR_HISTORY_STORAGE_KEY, JSON.stringify(historicos));
}

function loadUnitHistoricos() {
  try {
    return JSON.parse(localStorage.getItem(UNIT_HISTORY_STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveUnitHistoricos(historicos) {
  localStorage.setItem(UNIT_HISTORY_STORAGE_KEY, JSON.stringify(historicos));
}

function loadStatusHistoricos() {
  try {
    return JSON.parse(localStorage.getItem(STATUS_HISTORY_STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveStatusHistoricos(historicos) {
  localStorage.setItem(STATUS_HISTORY_STORAGE_KEY, JSON.stringify(historicos));
}

function loadCourseHistoricos() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Carrega os cursos vinculados ao policial na Base de Dados.
   * PARÂMETROS E RETORNO: Não recebe parâmetros; retorna um array de objetos de curso ou array vazio.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê COURSE_HISTORY_STORAGE_KEY do localStorage.
   * TODO: Em produção, substituir a leitura local por endpoint paginado filtrado pelo policial.
   */
  try {
    return JSON.parse(localStorage.getItem(COURSE_HISTORY_STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCourseHistoricos(historicos) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Persiste a lista de cursos vinculados aos policiais.
   * PARÂMETROS E RETORNO: Recebe array de históricos de curso e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Grava COURSE_HISTORY_STORAGE_KEY no localStorage.
   * TODO: Em ambiente online, enviar o lançamento para API com validação de convênio e curso existente.
   */
  localStorage.setItem(COURSE_HISTORY_STORAGE_KEY, JSON.stringify(historicos));
}

function loadMotorLicenseHistoricos() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Carrega os registros de habilitação de moto do policial.
   * PARÂMETROS E RETORNO: Não recebe parâmetros; retorna array de registros normalizáveis.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê MOTOR_LICENSE_HISTORY_STORAGE_KEY do localStorage.
   * TODO: Em produção, consultar tabela própria de documentos/habilitações com controle de vencimento.
   */
  try {
    return JSON.parse(localStorage.getItem(MOTOR_LICENSE_HISTORY_STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveMotorLicenseHistoricos(historicos) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Persiste registros de vencimento da habilitação de moto.
   * PARÂMETROS E RETORNO: Recebe array de registros e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Grava MOTOR_LICENSE_HISTORY_STORAGE_KEY no localStorage.
   * TODO: Em produção, validar datas e alertas de vencimento no backend.
   */
  localStorage.setItem(MOTOR_LICENSE_HISTORY_STORAGE_KEY, JSON.stringify(historicos));
}

function loadOrdinanceHistoricos() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Carrega registros de policial portariado por tipo de multa.
   * PARÂMETROS E RETORNO: Não recebe parâmetros; retorna array de portarias ou array vazio.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê ORDINANCE_HISTORY_STORAGE_KEY do localStorage.
   * TODO: Em produção, vincular esses registros a publicações oficiais e controlar permissões de lançamento.
   */
  try {
    return JSON.parse(localStorage.getItem(ORDINANCE_HISTORY_STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveOrdinanceHistoricos(historicos) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Persiste os registros de portaria do policial.
   * PARÂMETROS E RETORNO: Recebe array de portarias e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Grava ORDINANCE_HISTORY_STORAGE_KEY no localStorage.
   * TODO: Em ambiente online, gravar por transação com número/data do BOLPM e auditoria do operador.
   */
  localStorage.setItem(ORDINANCE_HISTORY_STORAGE_KEY, JSON.stringify(historicos));
}

function createId() {
  return window.crypto && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
}

function normalizePolicial(policial) {
  const legacyHistory = Array.isArray(policial.historicoSanitario)
    ? policial.historicoSanitario
    : [];
  const latestLegacyHistory = legacyHistory[legacyHistory.length - 1] || {};

  return {
    id: policial.id || createId(),
    rg: policial.rg || '',
    idFuncional: policial.idFuncional || '',
    nomeCompleto: policial.nomeCompleto || '',
    nomeGuerra: policial.nomeGuerra || '',
    telefone: policial.telefone || '',
    email: policial.email || '',
    dataEntrada: policial.dataEntrada || '',
    postoGraduacao: policial.postoGraduacao || '',
    grupoHierarquico: policial.grupoHierarquico || '',
    grupoOficial: policial.grupoOficial || '',
    situacaoFuncional: policial.situacaoFuncional || '',
    unidade: policial.unidade || '',
    situacaoSanitaria: latestLegacyHistory.situacaoSanitaria || policial.situacaoSanitaria || '',
    comportamento: policial.comportamento || '',
    historicoSanitario: legacyHistory
  };
}

function normalizeHistorico(historico) {
  return {
    id: historico.id || createId(),
    idFuncional: historico.idFuncional || '',
    dataInicio: historico.dataInicio || '',
    dataTermino: historico.dataTermino || '',
    bolpm: historico.bolpm || '',
    dataBolpm: historico.dataBolpm || '',
    situacaoSanitaria: historico.situacaoSanitaria || '',
    createdAt: historico.createdAt || new Date().toISOString()
  };
}

function normalizeFunctionalHistorico(historico) {
  return {
    id: historico.id || createId(),
    idFuncional: historico.idFuncional || '',
    postoGraduacao: historico.postoGraduacao || '',
    grupoHierarquico: historico.grupoHierarquico || '',
    grupoOficial: historico.grupoOficial || '',
    dataAlteracao: historico.dataAlteracao || '',
    bolpm: historico.bolpm || '',
    dataBolpm: historico.dataBolpm || '',
    createdAt: historico.createdAt || new Date().toISOString()
  };
}

function normalizeBehaviorHistorico(historico) {
  return {
    id: historico.id || createId(),
    idFuncional: historico.idFuncional || '',
    comportamento: historico.comportamento || '',
    dataAlteracao: historico.dataAlteracao || '',
    bolpm: historico.bolpm || '',
    dataBolpm: historico.dataBolpm || '',
    createdAt: historico.createdAt || new Date().toISOString()
  };
}

function normalizeUnitHistorico(historico) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Padroniza cada registro do histórico de unidade antes de leitura,
   * renderização ou gravação, garantindo compatibilidade com dados antigos sem Data de Apresentação.
   * PARÂMETROS E RETORNO: Recebe um objeto de histórico e retorna um objeto normalizado com strings
   * para unidade, Data de Apresentação, BOLPM e metadados.
   * ARMAZENAMENTO E PERSISTÊNCIA: O objeto normalizado é usado antes de gravar/ler o array salvo em
   * localStorage pela chave UNIT_HISTORY_STORAGE_KEY.
   * TODO: Em ambiente online, mover esta normalização para uma camada de DTO/validação da API.
   */
  return {
    id: historico.id || createId(),
    idFuncional: historico.idFuncional || '',
    unidade: historico.unidade || '',
    dataApresentacao: historico.dataApresentacao || historico.dataInicio || '',
    bolpm: historico.bolpm || '',
    dataBolpm: historico.dataBolpm || '',
    createdAt: historico.createdAt || new Date().toISOString()
  };
}

function normalizeStatusHistorico(historico) {
  return {
    id: historico.id || createId(),
    idFuncional: historico.idFuncional || '',
    situacaoFuncional: historico.situacaoFuncional || '',
    dataAlteracao: historico.dataAlteracao || '',
    bolpm: historico.bolpm || '',
    dataBolpm: historico.dataBolpm || '',
    createdAt: historico.createdAt || new Date().toISOString()
  };
}

function normalizeCourseHistorico(historico) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Padroniza um registro de curso realizado pelo policial.
   * PARÂMETROS E RETORNO: Recebe objeto bruto e retorna objeto com id, vínculo funcional, data,
   * nome do convênio, nome do curso e metadado de criação.
   * ARMAZENAMENTO E PERSISTÊNCIA: O retorno é usado para renderizar e gravar COURSE_HISTORY_STORAGE_KEY.
   * TODO: Em produção, trocar nomes livres por ids de convênio/curso vindos do banco.
   */
  return {
    id: historico.id || createId(),
    idFuncional: historico.idFuncional || '',
    data: historico.data || '',
    convenio: historico.convenio || '',
    curso: historico.curso || '',
    createdAt: historico.createdAt || new Date().toISOString()
  };
}

function normalizeMotorLicenseHistorico(historico) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Padroniza o registro de habilitação de moto para exibição e persistência.
   * PARÂMETROS E RETORNO: Recebe objeto bruto e retorna objeto normalizado com vencimento, categoria e observação.
   * ARMAZENAMENTO E PERSISTÊNCIA: O retorno é persistido em MOTOR_LICENSE_HISTORY_STORAGE_KEY.
   * TODO: Em produção, associar imagem/documento da CNH e regra automática de alerta de vencimento.
   */
  return {
    id: historico.id || createId(),
    idFuncional: historico.idFuncional || '',
    dataVencimento: historico.dataVencimento || '',
    categoria: historico.categoria || '',
    observacao: historico.observacao || '',
    createdAt: historico.createdAt || new Date().toISOString()
  };
}

function normalizeOrdinanceHistorico(historico) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Padroniza um registro de portaria de multa estadual ou municipal.
   * PARÂMETROS E RETORNO: Recebe objeto bruto e retorna portaria normalizada com tipo, início, BOLPM e status cadastral.
   * ARMAZENAMENTO E PERSISTÊNCIA: O retorno é usado em ORDINANCE_HISTORY_STORAGE_KEY no localStorage.
   * TODO: Em produção, criar vínculo com cadastro estadual/municipal oficial e validar duplicidade por tipo.
   */
  return {
    id: historico.id || createId(),
    idFuncional: historico.idFuncional || '',
    tipoMulta: historico.tipoMulta || '',
    dataInicio: historico.dataInicio || '',
    numeroBol: historico.numeroBol || '',
    dataBol: historico.dataBol || '',
    situacaoCadastro: historico.situacaoCadastro || '',
    createdAt: historico.createdAt || new Date().toISOString()
  };
}

function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

function toTitleCase(value) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Padroniza nomes digitados pelo usuário para primeira letra maiúscula e demais
   * minúsculas em cada palavra, evitando cadastros com texto todo em caixa alta ou baixa.
   * PARÂMETROS E RETORNO: Recebe uma string e retorna a string normalizada, preservando espaços simples.
   * ARMAZENAMENTO E PERSISTÊNCIA: Atua somente sobre o valor em memória/DOM; o resultado é persistido em
   * localStorage quando readForm monta o registro final do policial.
   * TODO: Em produção, repetir esta normalização no backend para manter consistência entre clientes.
   */
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/(^|\s)([a-zà-ú])/g, (match) => match.toUpperCase());
}

function toTitleCaseInput(value) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Normaliza nomes durante a digitação sem remover o espaço final que o usuário
   * acabou de inserir, permitindo compor nomes completos naturalmente.
   * PARÂMETROS E RETORNO: Recebe uma string do input e retorna a string com capitalização por palavra.
   * ARMAZENAMENTO E PERSISTÊNCIA: Atualiza apenas o valor exibido no DOM; a versão final é tratada em
   * readForm antes de gravar no localStorage.
   * TODO: Em produção, usar uma máscara/normalizador com preservação de cursor para nomes compostos.
   */
  return String(value || '')
    .toLowerCase()
    .replace(/\s{2,}/g, ' ')
    .replace(/(^|\s)([a-zà-ú])/g, (match) => match.toUpperCase());
}

function formatRg(value) {
  const digits = onlyDigits(value);
  return digits ? Number(digits).toLocaleString('pt-BR') : '';
}

function formatFunctionalId(value) {
  const digits = onlyDigits(value);
  if (digits.length !== 7) return digits;
  return `${digits.slice(0, 6)}-${digits.slice(6)}`;
}

function formatPhone(value) {
  const digits = onlyDigits(value);
  if (digits.length !== 11) return digits;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function requiresBehaviorByPosto(postoGraduacao) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Indica se o posto/graduação possui classificação de comportamento no cadastro
   * inicial, regra aplicada somente de Subtenente para baixo.
   * PARÂMETROS E RETORNO: Recebe o posto/graduação como string e retorna true para praças até Subtenente.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava dados; apenas apoia a validação e exibição do campo.
   * TODO: Em produção, carregar essa regra de uma tabela parametrizável para acompanhar mudanças normativas.
   */
  return ['Soldado', 'Cabo', '3º Sargento', '2º Sargento', '1º Sargento', 'Subtenente'].includes(postoGraduacao);
}

function updateInitialBehaviorVisibility() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Mantém o campo Comportamento visível, mas habilita a seleção somente quando o
   * posto/graduação exige essa classificação, limpando o valor para oficiais e aspirante.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e não retorna valor; altera o estado disabled do select.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê o posto selecionado e altera apenas o DOM; o valor é persistido no
   * submit se a regra exigir comportamento.
   * TODO: Em ambiente online, receber do backend se a graduação selecionada aceita comportamento.
   */
  const shouldShow = requiresBehaviorByPosto(initialFields.initialPostoGraduacao.value);

  initialFields.initialComportamento.disabled = !shouldShow;
  if (!shouldShow) {
    initialFields.initialComportamento.value = '';
    activeValidationFields.delete('initialComportamento');
  }
}

function sanitizeMainFormInput(id) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Restringe a digitação dos campos principais ao padrão esperado pelo cadastro,
   * removendo símbolos de RG, ID Funcional e telefone e normalizando nomes/email.
   * PARÂMETROS E RETORNO: Recebe o id do campo alterado como string e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Atualiza apenas o valor dos inputs no DOM; a persistência ocorre no
   * submit por meio de savePoliciais/localStorage.
   * TODO: Em ambiente online, complementar com máscaras acessíveis e validação assíncrona de duplicidade.
   */
  if (id === 'rg') fields.rg.value = onlyDigits(fields.rg.value).slice(0, 6);
  if (id === 'idFuncional') fields.idFuncional.value = onlyDigits(fields.idFuncional.value).slice(0, 7);
  if (id === 'telefone') fields.telefone.value = onlyDigits(fields.telefone.value).slice(0, 11);
  if (id === 'email') fields.email.value = fields.email.value.trim().toLowerCase();
  if (id === 'nomeCompleto') fields.nomeCompleto.value = toTitleCaseInput(fields.nomeCompleto.value);
  if (id === 'nomeGuerra') fields.nomeGuerra.value = toTitleCaseInput(fields.nomeGuerra.value);
}

function getMainFormValidation() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Valida todos os campos obrigatórios do cadastro principal antes de habilitar o
   * botão Salvar e antes de persistir o registro.
   * PARÂMETROS E RETORNO: Não recebe parâmetros; retorna um objeto com o estado booleano de cada campo.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê valores atuais do DOM e não grava dados; a função é usada apenas
   * para controle visual e bloqueio de submissão.
   * TODO: Em produção, replicar essas regras no servidor e retornar mensagens padronizadas pela API.
   */
  const rgNumber = Number(onlyDigits(fields.rg.value));
  const phoneDigits = onlyDigits(fields.telefone.value);
  const emailValue = fields.email.value.trim().toLowerCase();

  return {
    rg: rgNumber >= 2000 && rgNumber <= 150000,
    idFuncional: onlyDigits(fields.idFuncional.value).length === 7,
    nomeCompleto: toTitleCase(fields.nomeCompleto.value).length >= 3,
    nomeGuerra: toTitleCase(fields.nomeGuerra.value).length >= 2,
    telefone: phoneDigits.length === 11 && phoneDigits[2] === '9',
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue),
    dataEntrada: Boolean(fields.dataEntrada.value),
    initialPostoGraduacao: Boolean(initialFields.initialPostoGraduacao.value),
    initialComportamento: !requiresBehaviorByPosto(initialFields.initialPostoGraduacao.value) || Boolean(initialFields.initialComportamento.value),
    initialSituacaoFuncional: Boolean(initialFields.initialSituacaoFuncional.value),
    initialUnidade: Boolean(initialFields.initialUnidade.value),
    initialSituacaoSanitaria: Boolean(initialFields.initialSituacaoSanitaria.value)
  };
}

function hasMainFieldValue(id) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Verifica se um campo obrigatório já recebeu algum valor do usuário para manter
   * o alerta visual quando esse valor existe, mas ainda está incompleto ou inválido.
   * PARÂMETROS E RETORNO: Recebe o id do campo como string e retorna booleano indicando presença de valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê somente o DOM atual; não grava em localStorage nem altera arrays.
   * TODO: Em produção, combinar este estado com validação assíncrona para dados já usados no banco.
   */
  const element = fields[id] || initialFields[id];
  return Boolean(element && String(element.value || '').trim());
}

function updateMainFormValidation(options = {}) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Mostra ou oculta as orientações discretas em vermelho e habilita o botão Salvar
   * somente quando todos os campos obrigatórios estão corretos. As mensagens aparecem apenas no campo em
   * foco ou quando o fluxo força a exibição após tentativa de salvar.
   * PARÂMETROS E RETORNO: Recebe um objeto opcional com showAll booleano e retorna true quando o formulário está válido.
   * ARMAZENAMENTO E PERSISTÊNCIA: Altera classes CSS no DOM e o estado disabled do botão; não grava em
   * localStorage nem modifica arrays.
   * TODO: Em produção, integrar esta validação com erros vindos da API para cobrir regras de negócio.
   */
  const validation = getMainFormValidation();
  const { showAll = false } = options;

  formHintIds.forEach((id) => {
    const element = fields[id] || initialFields[id];
    const hint = formHints[id];
    if (!element || !hint) return;

    const isValid = validation[id];
    const shouldShowError = !isValid && (showAll || activeValidationFields.has(id) || hasMainFieldValue(id));
    element.classList.toggle('invalid', shouldShowError);
    hint.classList.toggle('hidden', !shouldShowError);
  });

  const isValidForm = Object.values(validation).every(Boolean);
  saveButton.disabled = !isValidForm;
  return isValidForm;
}

function readForm() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Monta o objeto principal do policial a partir do formulário de cadastro,
   * preservando grupo hierárquico/grupo oficial como dados técnicos e incluindo comportamento apenas
   * quando o posto/graduação permite essa classificação.
   * PARÂMETROS E RETORNO: Não recebe parâmetros; retorna o objeto de policial pronto para persistência.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê inputs/selects do DOM; o objeto retornado é salvo posteriormente
   * em localStorage por savePoliciais e usado para criar históricos iniciais.
   * TODO: Em produção, enviar este payload para uma API que valide regras funcionais e grave em banco.
   */
  const postoGraduacao = initialFields.initialPostoGraduacao.value;
  const groups = getGroupsByPosto(postoGraduacao);

  return {
    id: editingId.value || createId(),
    rg: formatRg(fields.rg.value),
    idFuncional: formatFunctionalId(fields.idFuncional.value),
    nomeCompleto: toTitleCase(fields.nomeCompleto.value),
    nomeGuerra: toTitleCase(fields.nomeGuerra.value),
    telefone: formatPhone(fields.telefone.value),
    email: fields.email.value.trim().toLowerCase(),
    dataEntrada: fields.dataEntrada.value,
    postoGraduacao,
    grupoHierarquico: groups.grupoHierarquico,
    grupoOficial: groups.grupoOficial,
    situacaoFuncional: initialFields.initialSituacaoFuncional.value,
    unidade: initialFields.initialUnidade.value,
    situacaoSanitaria: initialFields.initialSituacaoSanitaria.value || 'APTO_A',
    comportamento: requiresBehaviorByPosto(postoGraduacao) ? initialFields.initialComportamento.value : '',
    historicoSanitario: []
  };
}

function readFunctionalForm() {
  const postoGraduacao = functionalFields.functionalPostoGraduacao.value;
  const groups = getGroupsByPosto(postoGraduacao);

  return {
    postoGraduacao,
    grupoHierarquico: groups.grupoHierarquico,
    grupoOficial: groups.grupoOficial,
    dataAlteracao: functionalFields.functionalDataAlteracao.value,
    bolpm: functionalFields.functionalBolpm.value.trim(),
    dataBolpm: functionalFields.functionalDataBolpm.value
  };
}

function readBehaviorForm() {
  return {
    comportamento: behaviorFields.behaviorComportamento.value,
    dataAlteracao: behaviorFields.behaviorDataAlteracao.value,
    bolpm: behaviorFields.behaviorBolpm.value.trim(),
    dataBolpm: behaviorFields.behaviorDataBolpm.value
  };
}

function readUnitForm() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Coleta os campos do formulário de histórico de unidade, incluindo a data em
   * que o policial se apresentou de fato na nova unidade.
   * PARÂMETROS E RETORNO: Não recebe parâmetros; retorna um objeto com unidade, Data de Apresentação e dados de BOLPM.
   * ARMAZENAMENTO E PERSISTÊNCIA: Apenas lê valores do DOM; a gravação ocorre no submit do unitForm.
   * TODO: Em produção, validar essas datas também no backend antes de persistir a movimentação.
   */
  return {
    unidade: unitFields.unitUnidade.value,
    dataApresentacao: unitFields.unitDataApresentacao.value,
    bolpm: unitFields.unitBolpm.value.trim(),
    dataBolpm: unitFields.unitDataBolpm.value
  };
}

function readStatusForm() {
  return {
    situacaoFuncional: statusFields.statusSituacaoFuncional.value,
    dataAlteracao: statusFields.statusDataAlteracao.value,
    bolpm: statusFields.statusBolpm.value.trim(),
    dataBolpm: statusFields.statusDataBolpm.value
  };
}

function readHistoryForm() {
  return {
    dataInicio: historyFields.dataInicio.value,
    dataTermino: historyFields.dataTermino.value,
    bolpm: historyFields.bolpm.value.trim(),
    dataBolpm: historyFields.dataBolpm.value,
    situacaoSanitaria: historyFields.situacaoSanitaria.value
  };
}

function readCourseForm() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Coleta os dados do formulário de cursos do policial.
   * PARÂMETROS E RETORNO: Não recebe parâmetros; retorna objeto com data, convênio e nome do curso.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê apenas campos do DOM; o submit grava em COURSE_HISTORY_STORAGE_KEY.
   * TODO: Em produção, substituir campos de texto por selects pesquisáveis carregados da API de convênios.
   */
  return {
    data: courseFields.courseDate.value,
    convenio: courseFields.courseConvenio.value.trim(),
    curso: courseFields.courseName.value.trim()
  };
}

function readMotorLicenseForm() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Coleta dados de vencimento da habilitação para moto.
   * PARÂMETROS E RETORNO: Não recebe parâmetros; retorna objeto com data de vencimento, categoria e observação.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê somente DOM; o submit grava em MOTOR_LICENSE_HISTORY_STORAGE_KEY.
   * TODO: Em produção, validar categoria e vencimento com serviço de documentos do policial.
   */
  return {
    dataVencimento: motorLicenseFields.motorLicenseExpiration.value,
    categoria: motorLicenseFields.motorLicenseCategory.value,
    observacao: motorLicenseFields.motorLicenseObservation.value.trim()
  };
}

function readOrdinanceForm() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Coleta os dados da portaria de multa estadual ou municipal.
   * PARÂMETROS E RETORNO: Não recebe parâmetros; retorna objeto com tipo de multa, início, BOL e situação cadastral.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê campos do DOM; o submit grava em ORDINANCE_HISTORY_STORAGE_KEY.
   * TODO: Em produção, validar número/data do boletim e impedir duplicidades por tipo de multa ativo.
   */
  return {
    tipoMulta: ordinanceFields.ordinanceFineType.value,
    dataInicio: ordinanceFields.ordinanceStartDate.value,
    numeroBol: ordinanceFields.ordinanceBolNumber.value.trim(),
    dataBol: ordinanceFields.ordinanceBolDate.value,
    situacaoCadastro: ordinanceFields.ordinanceRegistrationStatus.value
  };
}

function hasHistoryData(historico) {
  return Boolean(
    historico.dataInicio ||
    historico.dataTermino ||
    historico.bolpm ||
    historico.dataBolpm ||
    historico.situacaoSanitaria
  );
}

function hasFunctionalData(historico) {
  return Boolean(
    historico.postoGraduacao ||
    historico.dataAlteracao ||
    historico.bolpm ||
    historico.dataBolpm
  );
}

function hasBehaviorData(historico) {
  return Boolean(
    historico.comportamento ||
    historico.dataAlteracao ||
    historico.bolpm ||
    historico.dataBolpm
  );
}

function hasUnitData(historico) {
  return Boolean(
    historico.unidade ||
    historico.dataApresentacao ||
    historico.bolpm ||
    historico.dataBolpm
  );
}

function hasStatusData(historico) {
  return Boolean(
    historico.situacaoFuncional ||
    historico.dataAlteracao ||
    historico.bolpm ||
    historico.dataBolpm
  );
}

function hasCourseData(historico) {
  return Boolean(historico.data || historico.convenio || historico.curso);
}

function hasMotorLicenseData(historico) {
  return Boolean(historico.dataVencimento || historico.observacao);
}

function hasOrdinanceData(historico) {
  return Boolean(
    historico.tipoMulta ||
    historico.dataInicio ||
    historico.numeroBol ||
    historico.dataBol ||
    historico.situacaoCadastro
  );
}

function clearForm() {
  form.reset();
  editingId.value = '';
  initialFields.initialGrupoHierarquico.value = '';
  initialFields.initialGrupoOficial.value = '';
  initialFields.initialComportamento.value = '';
  updateInitialBehaviorVisibility();
  saveButton.textContent = 'Salvar';
  updateMainFormValidation();
}

function clearHistoryForm() {
  historyForm.reset();
  saveHistoryButton.textContent = 'Salvar histórico';
}

function clearFunctionalForm() {
  functionalForm.reset();
  functionalFields.functionalGrupoHierarquico.value = '';
  functionalFields.functionalGrupoOficial.value = '';
  saveFunctionalButton.textContent = 'Salvar histórico';
}

function clearBehaviorForm() {
  behaviorForm.reset();
  saveBehaviorButton.textContent = 'Salvar histórico';
}

function clearUnitForm() {
  unitForm.reset();
  saveUnitButton.textContent = 'Salvar histórico';
}

function clearStatusForm() {
  statusForm.reset();
  saveStatusButton.textContent = 'Salvar histórico';
}

function clearCourseForm() {
  courseForm.reset();
  saveCourseButton.textContent = 'Salvar curso';
}

function clearMotorLicenseForm() {
  motorLicenseForm.reset();
  saveMotorLicenseButton.textContent = 'Salvar habilitação';
}

function clearOrdinanceForm() {
  ordinanceForm.reset();
  saveOrdinanceButton.textContent = 'Salvar portaria';
}

function formatDate(value) {
  if (!value) return '-';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

function displayValue(value) {
  return value || '-';
}

function isSameHistoryEntry(current, previous) {
  if (!current || !previous) return false;

  return current.dataInicio === previous.dataInicio &&
    current.dataTermino === previous.dataTermino &&
    current.bolpm === previous.bolpm &&
    current.dataBolpm === previous.dataBolpm &&
    current.situacaoSanitaria === previous.situacaoSanitaria;
}

function getHistoryLink(policial) {
  return policial.idFuncional || policial.id;
}

function getHistoricosByPolicial(policial) {
  const link = getHistoryLink(policial);
  return loadHistoricos()
    .map(normalizeHistorico)
    .filter((historico) => historico.idFuncional === link)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function getGroupsByPosto(posto) {
  const pracas = ['Soldado', 'Cabo', '3º Sargento', '2º Sargento', '1º Sargento', 'Subtenente'];
  const pracasEspeciais = ['Aspirante'];
  const subalternos = ['2º Tenente', '1º Tenente'];
  const intermediarios = ['Capitão'];
  const superiores = ['Major', 'Tenente-Coronel', 'Coronel'];

  if (pracas.includes(posto)) {
    return { grupoHierarquico: 'Praça', grupoOficial: '' };
  }

  if (pracasEspeciais.includes(posto)) {
    return { grupoHierarquico: 'Praça Especial', grupoOficial: '' };
  }

  if (subalternos.includes(posto)) {
    return { grupoHierarquico: 'Oficial', grupoOficial: 'Oficial Subalterno' };
  }

  if (intermediarios.includes(posto)) {
    return { grupoHierarquico: 'Oficial', grupoOficial: 'Oficial Intermediário' };
  }

  if (superiores.includes(posto)) {
    return { grupoHierarquico: 'Oficial', grupoOficial: 'Oficial Superior' };
  }

  return { grupoHierarquico: '', grupoOficial: '' };
}

function sortByCreation(items) {
  return items.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function getFunctionalHistoricosByPolicial(policial) {
  const link = getHistoryLink(policial);
  return sortByCreation(loadFunctionalHistoricos()
    .map(normalizeFunctionalHistorico)
    .filter((historico) => historico.idFuncional === link));
}

function getBehaviorHistoricosByPolicial(policial) {
  const link = getHistoryLink(policial);
  return sortByCreation(loadBehaviorHistoricos()
    .map(normalizeBehaviorHistorico)
    .filter((historico) => historico.idFuncional === link));
}

function getUnitHistoricosByPolicial(policial) {
  const link = getHistoryLink(policial);
  return sortByCreation(loadUnitHistoricos()
    .map(normalizeUnitHistorico)
    .filter((historico) => historico.idFuncional === link));
}

function getStatusHistoricosByPolicial(policial) {
  const link = getHistoryLink(policial);
  return sortByCreation(loadStatusHistoricos()
    .map(normalizeStatusHistorico)
    .filter((historico) => historico.idFuncional === link));
}

function getCourseHistoricosByPolicial(policial) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Retorna cursos vinculados ao policial selecionado no detalhe.
   * PARÂMETROS E RETORNO: Recebe objeto de policial e retorna array de cursos ordenado pela criação.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê COURSE_HISTORY_STORAGE_KEY via loadCourseHistoricos.
   * TODO: Em produção, substituir filtro local por consulta ao banco usando chave do policial.
   */
  const link = getHistoryLink(policial);
  return sortByCreation(loadCourseHistoricos()
    .map(normalizeCourseHistorico)
    .filter((historico) => historico.idFuncional === link));
}

function getMotorLicenseHistoricosByPolicial(policial) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Retorna registros de habilitação de moto do policial.
   * PARÂMETROS E RETORNO: Recebe objeto de policial e retorna array ordenado.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê MOTOR_LICENSE_HISTORY_STORAGE_KEY do localStorage.
   * TODO: Em produção, buscar somente documentos ativos/arquivados autorizados ao perfil logado.
   */
  const link = getHistoryLink(policial);
  return sortByCreation(loadMotorLicenseHistoricos()
    .map(normalizeMotorLicenseHistorico)
    .filter((historico) => historico.idFuncional === link));
}

function getOrdinanceHistoricosByPolicial(policial) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Retorna portarias de multa estadual/municipal do policial.
   * PARÂMETROS E RETORNO: Recebe objeto de policial e retorna array ordenado por criação.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê ORDINANCE_HISTORY_STORAGE_KEY do localStorage.
   * TODO: Em produção, filtrar por situação e vigência via consulta indexada no banco.
   */
  const link = getHistoryLink(policial);
  return sortByCreation(loadOrdinanceHistoricos()
    .map(normalizeOrdinanceHistorico)
    .filter((historico) => historico.idFuncional === link));
}

function getLatest(items) {
  return items[items.length - 1] || {};
}

function getLatestPresentedUnit(historicos) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Identifica a unidade vigente para o cadastro principal considerando somente
   * históricos com Data de Apresentação preenchida, pois a transferência só altera a unidade do policial
   * depois da apresentação efetiva.
   * PARÂMETROS E RETORNO: Recebe um array de históricos de unidade normalizados e retorna o histórico
   * apresentado mais recente; se nenhum tiver apresentação, retorna um objeto vazio.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê apenas o array em memória recebido de loadUnitHistoricos ou de
   * listas já montadas antes do salvamento; não grava dados diretamente.
   * TODO: Em ambiente online, substituir a ordenação local por consulta ao banco com índice em
   * idFuncional/dataApresentacao e regra transacional para evitar concorrência entre lançamentos do P/1.
   */
  const presented = historicos
    .filter((historico) => historico.dataApresentacao)
    .sort((a, b) => {
      const dateCompare = a.dataApresentacao.localeCompare(b.dataApresentacao);
      return dateCompare || a.createdAt.localeCompare(b.createdAt);
    });

  return getLatest(presented);
}

function getCurrentSituacaoSanitaria(policial) {
  const historicos = getHistoricosByPolicial(policial);
  const latest = historicos[historicos.length - 1];
  return latest ? latest.situacaoSanitaria : policial.situacaoSanitaria || 'APTO_A';
}

function getCurrentFunctional(policial) {
  const latest = getLatest(getFunctionalHistoricosByPolicial(policial));
  return {
    postoGraduacao: latest.postoGraduacao || policial.postoGraduacao || '',
    grupoHierarquico: latest.grupoHierarquico || policial.grupoHierarquico || '',
    grupoOficial: latest.grupoOficial || policial.grupoOficial || ''
  };
}

function getCurrentBehavior(policial) {
  const latest = getLatest(getBehaviorHistoricosByPolicial(policial));
  return latest.comportamento || policial.comportamento || '';
}

function getCurrentUnit(policial) {
  const latest = getLatestPresentedUnit(getUnitHistoricosByPolicial(policial));
  return latest.unidade || policial.unidade || '';
}

function getCurrentStatus(policial) {
  const latest = getLatest(getStatusHistoricosByPolicial(policial));
  return latest.situacaoFuncional || policial.situacaoFuncional || '';
}

function migrateLegacyHistoricos() {
  const historicos = loadHistoricos();
  const hasHistoryTable = historicos.length > 0;
  const policiais = loadPoliciais().map(normalizePolicial);
  const migrated = [];

  if (hasHistoryTable || policiais.every((policial) => policial.historicoSanitario.length === 0)) return;

  policiais.forEach((policial) => {
    const link = getHistoryLink(policial);
    policial.historicoSanitario.forEach((historico) => {
      migrated.push(normalizeHistorico({ ...historico, idFuncional: link }));
    });
  });

  saveHistoricos(migrated);
  savePoliciais(policiais.map(({ historicoSanitario, ...policial }) => policial));
}

function setActiveView(viewId) {
  viewPanels.forEach((panel) => {
    panel.classList.toggle('active', panel.id === viewId);
  });

  tabButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.view === viewId);
  });

  if (viewId !== 'details-view' && !detailsCard.hidden) detailsCard.hidden = true;
  if (viewId !== 'details-view') detailsEmpty.hidden = false;
}

function openInitialViewFromHash() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Abre a visão inicial indicada na URL, permitindo que o dashboard direcione o
   * usuário diretamente para o formulário ou para a tabela de policiais.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e não retorna valor; usa window.location.hash.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava localStorage; altera apenas a aba ativa no DOM.
   * TODO: Em produção, substituir por roteamento formal quando a aplicação virar SPA ou tiver backend.
   */
  const requestedView = window.location.hash.replace('#', '');
  const allowedViews = ['form-view', 'table-view'];

  if (!allowedViews.includes(requestedView)) return;
  setActiveView(requestedView);
  if (requestedView === 'table-view') render();
}

function render() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Renderiza a tabela principal de policiais cadastrados, incluindo a coluna
   * Comportamento apenas como dado exibido; oficiais e aspirante aparecem sem comportamento por regra.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e não retorna valor; monta linhas HTML no tbody.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê policiais e históricos do localStorage por meio das funções load*;
   * grava somente no DOM da tabela, sem alterar os dados persistidos.
   * TODO: Em produção, buscar a listagem paginada em API e aplicar a regra de comportamento no backend.
   */
  const policiais = loadPoliciais().map(normalizePolicial);
  policiaisBody.innerHTML = '';
  tableCount.textContent = policiais.length === 0
    ? 'Nenhum registro cadastrado.'
    : `${policiais.length} registro(s) cadastrado(s).`;

  if (policiais.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.className = 'empty';
    cell.colSpan = 9;
    cell.textContent = 'Nenhum policial cadastrado. Use o formulário acima para adicionar o primeiro registro.';
    row.appendChild(cell);
    policiaisBody.appendChild(row);
    return;
  }

  policiais.forEach((policial) => {
    const row = document.createElement('tr');
    const currentSituacaoSanitaria = getCurrentSituacaoSanitaria(policial);
    const currentFunctional = getCurrentFunctional(policial);
    const currentUnit = getCurrentUnit(policial);
    const currentBehavior = requiresBehaviorByPosto(currentFunctional.postoGraduacao)
      ? getCurrentBehavior(policial)
      : '';
    [
      policial.rg,
      policial.idFuncional,
      currentFunctional.postoGraduacao,
      policial.nomeCompleto,
      currentUnit,
      currentBehavior,
      currentSituacaoSanitaria,
      getCurrentStatus(policial)
    ].forEach((value) => {
      const cell = document.createElement('td');
      cell.textContent = displayValue(value);
      row.appendChild(cell);
    });

    const actionsCell = document.createElement('td');
    const actions = document.createElement('div');
    actions.className = 'actions';
    actions.appendChild(createActionButton('Detalhes', 'details', policial.id, 'action-details'));
    actions.appendChild(createActionButton('Excluir', 'delete', policial.id, 'action-delete'));
    actionsCell.appendChild(actions);
    row.appendChild(actionsCell);
    policiaisBody.appendChild(row);
  });
}

function createActionButton(text, action, id, className = '') {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = text;
  button.dataset.action = action;
  button.dataset.id = id;
  if (className) button.className = className;
  return button;
}

function renderEmptyHistory(tbody, colSpan, message) {
  const row = document.createElement('tr');
  const cell = document.createElement('td');
  cell.className = 'empty';
  cell.colSpan = colSpan;
  cell.textContent = message;
  row.appendChild(cell);
  tbody.appendChild(row);
}

function attachHistoryRowReferences(row, historico) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Mantém referências técnicas do histórico na linha HTML sem exibi-las como
   * colunas visíveis, preparando a tela para integração futura com banco relacional.
   * PARÂMETROS E RETORNO: Recebe a linha de tabela HTMLTableRowElement e o objeto de histórico; não
   * retorna valor, apenas grava atributos data-* na linha.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não altera localStorage nem arrays; escreve somente metadados no DOM
   * renderizado, como data-id-funcional, data-grupo-hierarquico e data-grupo-oficial.
   * TODO: Em produção, substituir essas referências de apoio por chaves estrangeiras reais retornadas
   * pela API, mantendo somente identificadores não sensíveis no DOM.
   */
  row.dataset.idFuncional = historico.idFuncional || '';
  row.dataset.grupoHierarquico = historico.grupoHierarquico || '';
  row.dataset.grupoOficial = historico.grupoOficial || '';
}

function renderFuncionalTable(historicos) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Renderiza o histórico funcional exibindo apenas os dados operacionais que o
   * usuário precisa ver, com Data Promoção como primeira coluna e sem ações de edição/exclusão.
   * PARÂMETROS E RETORNO: Recebe um array de históricos funcionais normalizados e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê o array em memória e escreve linhas no tbody funcionalBody; os dados
   * completos continuam persistidos no localStorage em FUNCTIONAL_HISTORY_STORAGE_KEY.
   * TODO: Em ambiente online, carregar esse histórico via relacionamento entre policial e promoções,
   * mantendo regra de auditoria append-only também no backend.
   */
  funcionalBody.innerHTML = '';

  if (historicos.length === 0) {
    renderEmptyHistory(funcionalBody, 4, 'Nenhum histórico funcional informado.');
    return;
  }

  historicos.forEach((historico) => {
    const row = document.createElement('tr');
    attachHistoryRowReferences(row, historico);
    [
      formatDate(historico.dataAlteracao),
      historico.postoGraduacao,
      historico.bolpm,
      formatDate(historico.dataBolpm)
    ].forEach((value) => {
      const cell = document.createElement('td');
      cell.textContent = displayValue(value);
      row.appendChild(cell);
    });

    funcionalBody.appendChild(row);
  });
}

function renderComportamentoTable(historicos) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Renderiza o histórico de comportamento sem expor o ID Funcional na tabela,
   * iniciando pela Data Alteração e preservando o vínculo técnico no atributo data-id-funcional.
   * PARÂMETROS E RETORNO: Recebe um array de históricos de comportamento e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Atualiza apenas o tbody comportamentoBody; os registros completos
   * permanecem no localStorage em BEHAVIOR_HISTORY_STORAGE_KEY.
   * TODO: Em produção, trocar a leitura local por consulta relacional filtrada pelo policial e impedir
   * atualização/exclusão desses lançamentos fora de um fluxo formal de retificação.
   */
  comportamentoBody.innerHTML = '';

  if (historicos.length === 0) {
    renderEmptyHistory(comportamentoBody, 4, 'Nenhum histórico de comportamento informado.');
    return;
  }

  historicos.forEach((historico) => {
    const row = document.createElement('tr');
    attachHistoryRowReferences(row, historico);
    [
      formatDate(historico.dataAlteracao),
      historico.comportamento,
      historico.bolpm,
      formatDate(historico.dataBolpm)
    ].forEach((value) => {
      const cell = document.createElement('td');
      cell.textContent = displayValue(value);
      row.appendChild(cell);
    });

    comportamentoBody.appendChild(row);
  });
}

function renderUnidadeTable(historicos) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Renderiza a grade de histórico de unidade no detalhe do policial, mostrando
   * Data de Apresentação como primeira coluna e publicação, sem expor o ID Funcional nem ações destrutivas.
   * PARÂMETROS E RETORNO: Recebe um array de históricos normalizados e não retorna valor; atualiza o DOM.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê o array recebido em memória e escreve apenas na tabela HTML
   * unidadeBody, mantendo o vínculo em data-id-funcional; a persistência permanece no localStorage.
   * TODO: Em produção, carregar essa lista paginada da API e registrar retificações em tabela separada.
   */
  unidadeBody.innerHTML = '';

  if (historicos.length === 0) {
    renderEmptyHistory(unidadeBody, 4, 'Nenhum histórico de unidade informado.');
    return;
  }

  historicos.forEach((historico) => {
    const row = document.createElement('tr');
    attachHistoryRowReferences(row, historico);
    [
      formatDate(historico.dataApresentacao),
      historico.unidade,
      historico.bolpm,
      formatDate(historico.dataBolpm)
    ].forEach((value) => {
      const cell = document.createElement('td');
      cell.textContent = displayValue(value);
      row.appendChild(cell);
    });

    unidadeBody.appendChild(row);
  });
}

function renderSituacaoFuncionalTable(historicos) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Renderiza o histórico de situação funcional sem mostrar o ID Funcional,
   * começando pela Data Alteração e mantendo essa referência técnica na própria linha para uso futuro.
   * PARÂMETROS E RETORNO: Recebe um array de históricos de situação funcional e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Escreve somente no DOM em situacaoFuncionalBody; os dados completos
   * continuam salvos em localStorage pela chave STATUS_HISTORY_STORAGE_KEY.
   * TODO: Em ambiente online, consultar essa tabela por chave estrangeira do policial e manter bloqueio
   * de edição/exclusão no serviço de aplicação.
   */
  situacaoFuncionalBody.innerHTML = '';

  if (historicos.length === 0) {
    renderEmptyHistory(situacaoFuncionalBody, 4, 'Nenhum histórico de situação funcional informado.');
    return;
  }

  historicos.forEach((historico) => {
    const row = document.createElement('tr');
    attachHistoryRowReferences(row, historico);
    [
      formatDate(historico.dataAlteracao),
      historico.situacaoFuncional,
      historico.bolpm,
      formatDate(historico.dataBolpm)
    ].forEach((value) => {
      const cell = document.createElement('td');
      cell.textContent = displayValue(value);
      row.appendChild(cell);
    });

    situacaoFuncionalBody.appendChild(row);
  });
}

function renderCourseTable(historicos) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Renderiza a tabela de cursos do policial com data, convênio e curso realizado.
   * PARÂMETROS E RETORNO: Recebe array de históricos de curso normalizados e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Escreve somente no tbody cursoBody; os dados vêm do localStorage
   * COURSE_HISTORY_STORAGE_KEY filtrado pelo policial.
   * TODO: Em produção, carregar convênio/curso por ids reais e exibir origem da certificação.
   */
  cursoBody.innerHTML = '';

  if (historicos.length === 0) {
    renderEmptyHistory(cursoBody, 3, 'Nenhum curso informado.');
    return;
  }

  historicos.forEach((historico) => {
    const row = document.createElement('tr');
    attachHistoryRowReferences(row, historico);
    [
      formatDate(historico.data),
      historico.convenio,
      historico.curso
    ].forEach((value) => {
      const cell = document.createElement('td');
      cell.textContent = displayValue(value);
      row.appendChild(cell);
    });

    cursoBody.appendChild(row);
  });
}

function renderMotorLicenseTable(historicos) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Renderiza registros de habilitação de moto e vencimento da carteira.
   * PARÂMETROS E RETORNO: Recebe array de registros normalizados e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Atualiza habilitacaoMotoBody no DOM; os dados seguem em
   * MOTOR_LICENSE_HISTORY_STORAGE_KEY no localStorage.
   * TODO: Em produção, destacar vencimentos próximos com regra de alerta vinda do backend.
   */
  habilitacaoMotoBody.innerHTML = '';

  if (historicos.length === 0) {
    renderEmptyHistory(habilitacaoMotoBody, 3, 'Nenhuma habilitação de moto informada.');
    return;
  }

  historicos.forEach((historico) => {
    const row = document.createElement('tr');
    attachHistoryRowReferences(row, historico);
    [
      formatDate(historico.dataVencimento),
      historico.categoria,
      historico.observacao
    ].forEach((value) => {
      const cell = document.createElement('td');
      cell.textContent = displayValue(value);
      row.appendChild(cell);
    });

    habilitacaoMotoBody.appendChild(row);
  });
}

function renderOrdinanceTable(historicos) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Renderiza registros de policial portariado para multa estadual ou municipal.
   * PARÂMETROS E RETORNO: Recebe array de portarias normalizadas e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Escreve linhas no tbody portariadoBody; a origem é
   * ORDINANCE_HISTORY_STORAGE_KEY no localStorage.
   * TODO: Em produção, controlar vigência, revogação e validação de publicação por serviço administrativo.
   */
  portariadoBody.innerHTML = '';

  if (historicos.length === 0) {
    renderEmptyHistory(portariadoBody, 5, 'Nenhum registro de policial portariado informado.');
    return;
  }

  historicos.forEach((historico) => {
    const row = document.createElement('tr');
    attachHistoryRowReferences(row, historico);
    [
      historico.tipoMulta,
      formatDate(historico.dataInicio),
      historico.numeroBol,
      formatDate(historico.dataBol),
      historico.situacaoCadastro
    ].forEach((value) => {
      const cell = document.createElement('td');
      cell.textContent = displayValue(value);
      row.appendChild(cell);
    });

    portariadoBody.appendChild(row);
  });
}

function showDetails(id) {
  const policial = loadPoliciais().map(normalizePolicial).find((item) => item.id === id);
  if (!policial) return;

  detailsEmpty.hidden = true;
  historyPolicialId.value = policial.id;
  functionalPolicialId.value = policial.id;
  behaviorPolicialId.value = policial.id;
  unitPolicialId.value = policial.id;
  statusPolicialId.value = policial.id;
  coursePolicialId.value = policial.id;
  motorLicensePolicialId.value = policial.id;
  ordinancePolicialId.value = policial.id;
  clearHistoryForm();
  clearFunctionalForm();
  clearBehaviorForm();
  clearUnitForm();
  clearStatusForm();
  clearCourseForm();
  clearMotorLicenseForm();
  clearOrdinanceForm();
  historyForm.hidden = true;
  functionalForm.hidden = true;
  behaviorForm.hidden = true;
  unitForm.hidden = true;
  statusForm.hidden = true;
  courseForm.hidden = true;
  motorLicenseForm.hidden = true;
  ordinanceForm.hidden = true;
  detailsTitle.textContent = policial.nomeCompleto || policial.nomeGuerra || policial.rg || 'Registro sem nome';
  detailsGrid.innerHTML = '';
  historicoBody.innerHTML = '';
  const historicos = getHistoricosByPolicial(policial);
  const funcionalHistoricos = getFunctionalHistoricosByPolicial(policial);
  const comportamentoHistoricos = getBehaviorHistoricosByPolicial(policial);
  const unidadeHistoricos = getUnitHistoricosByPolicial(policial);
  const statusHistoricos = getStatusHistoricosByPolicial(policial);
  const courseHistoricos = getCourseHistoricosByPolicial(policial);
  const motorLicenseHistoricos = getMotorLicenseHistoricosByPolicial(policial);
  const ordinanceHistoricos = getOrdinanceHistoricosByPolicial(policial);
  const currentFunctional = getCurrentFunctional(policial);
  const policialWithCurrentStatus = {
    ...policial,
    ...currentFunctional,
    unidade: getCurrentUnit(policial),
    comportamento: getCurrentBehavior(policial),
    situacaoFuncional: getCurrentStatus(policial),
    situacaoSanitaria: getCurrentSituacaoSanitaria(policial)
  };

  detailLabels.forEach(([key, label]) => {
    const item = document.createElement('div');
    item.className = 'detail-item';

    const labelElement = document.createElement('span');
    labelElement.textContent = label;

    const valueElement = document.createElement('strong');
    valueElement.textContent = displayValue(policialWithCurrentStatus[key]);

    item.append(labelElement, valueElement);
    detailsGrid.appendChild(item);
  });

  renderFuncionalTable(funcionalHistoricos);
  renderComportamentoTable(comportamentoHistoricos);
  renderUnidadeTable(unidadeHistoricos);
  renderSituacaoFuncionalTable(statusHistoricos);
  renderCourseTable(courseHistoricos);
  renderMotorLicenseTable(motorLicenseHistoricos);
  renderOrdinanceTable(ordinanceHistoricos);

  /*
   * DESCRIÇÃO DA FUNÇÃO: Renderiza o histórico sanitário do policial sem exibir o ID Funcional e sem
   * ações de edição/exclusão, pois a base de dados deve aceitar apenas novos lançamentos históricos.
   * PARÂMETROS E RETORNO: Usa a lista historicos já filtrada no detalhe do policial e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Atualiza apenas o tbody historicoBody; os dados completos seguem
   * persistidos no localStorage pela chave HISTORY_STORAGE_KEY.
   * TODO: Em produção, substituir o vínculo textual por chave estrangeira relacional, paginação via API e
   * trilha de retificação separada para qualquer correção administrativa.
   */
  if (historicos.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.className = 'empty';
    cell.colSpan = 5;
    cell.textContent = 'Nenhum histórico sanitário informado.';
    row.appendChild(cell);
    historicoBody.appendChild(row);
  } else {
    historicos.forEach((historico) => {
      const row = document.createElement('tr');
      attachHistoryRowReferences(row, historico);
      [
        formatDate(historico.dataInicio),
        formatDate(historico.dataTermino),
        displayValue(historico.bolpm),
        formatDate(historico.dataBolpm),
        displayValue(historico.situacaoSanitaria)
      ].forEach((value) => {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.appendChild(cell);
      });

      historicoBody.appendChild(row);
    });
  }

  detailsCard.hidden = false;
  detailsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function deletePolicial(id) {
  if (!confirm('Deseja excluir este registro?')) return;

  const policiais = loadPoliciais().map(normalizePolicial);
  const policial = policiais.find((item) => item.id === id);
  if (!policial) return;

  const link = getHistoryLink(policial);
  const historicos = loadHistoricos()
    .map(normalizeHistorico)
    .filter((historico) => historico.idFuncional !== link);
  const funcionalHistoricos = loadFunctionalHistoricos()
    .map(normalizeFunctionalHistorico)
    .filter((historico) => historico.idFuncional !== link);
  const comportamentoHistoricos = loadBehaviorHistoricos()
    .map(normalizeBehaviorHistorico)
    .filter((historico) => historico.idFuncional !== link);
  const unidadeHistoricos = loadUnitHistoricos()
    .map(normalizeUnitHistorico)
    .filter((historico) => historico.idFuncional !== link);
  const statusHistoricos = loadStatusHistoricos()
    .map(normalizeStatusHistorico)
    .filter((historico) => historico.idFuncional !== link);
  const courseHistoricos = loadCourseHistoricos()
    .map(normalizeCourseHistorico)
    .filter((historico) => historico.idFuncional !== link);
  const motorLicenseHistoricos = loadMotorLicenseHistoricos()
    .map(normalizeMotorLicenseHistorico)
    .filter((historico) => historico.idFuncional !== link);
  const ordinanceHistoricos = loadOrdinanceHistoricos()
    .map(normalizeOrdinanceHistorico)
    .filter((historico) => historico.idFuncional !== link);

  savePoliciais(policiais.filter((item) => item.id !== id));
  saveHistoricos(historicos);
  saveFunctionalHistoricos(funcionalHistoricos);
  saveBehaviorHistoricos(comportamentoHistoricos);
  saveUnitHistoricos(unidadeHistoricos);
  saveStatusHistoricos(statusHistoricos);
  saveCourseHistoricos(courseHistoricos);
  saveMotorLicenseHistoricos(motorLicenseHistoricos);
  saveOrdinanceHistoricos(ordinanceHistoricos);
  if (!detailsCard.hidden) detailsCard.hidden = true;
  render();
}

function syncPolicialSituacao(link) {
  const historicos = loadHistoricos()
    .map(normalizeHistorico)
    .filter((historico) => historico.idFuncional === link)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const latest = historicos[historicos.length - 1];
  const policiais = loadPoliciais().map(normalizePolicial);

  savePoliciais(policiais.map((policial) => {
    if (getHistoryLink(policial) !== link) return policial;
    return { ...policial, situacaoSanitaria: latest ? latest.situacaoSanitaria : 'APTO_A' };
  }));
}

function syncPolicialFunctional(link) {
  const historicos = loadFunctionalHistoricos()
    .map(normalizeFunctionalHistorico)
    .filter((historico) => historico.idFuncional === link);
  const latest = getLatest(sortByCreation(historicos));
  const policiais = loadPoliciais().map(normalizePolicial);

  savePoliciais(policiais.map((policial) => {
    if (getHistoryLink(policial) !== link) return policial;
    return {
      ...policial,
      postoGraduacao: latest.postoGraduacao || '',
      grupoHierarquico: latest.grupoHierarquico || '',
      grupoOficial: latest.grupoOficial || ''
    };
  }));
}

function syncPolicialBehavior(link) {
  const historicos = loadBehaviorHistoricos()
    .map(normalizeBehaviorHistorico)
    .filter((historico) => historico.idFuncional === link);
  const latest = getLatest(sortByCreation(historicos));
  const policiais = loadPoliciais().map(normalizePolicial);

  savePoliciais(policiais.map((policial) => {
    if (getHistoryLink(policial) !== link) return policial;
    return { ...policial, comportamento: latest.comportamento || '' };
  }));
}

function syncPolicialUnit(link) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Sincroniza a unidade exibida no cadastro principal com a última unidade em que
   * o policial possui Data de Apresentação registrada.
   * PARÂMETROS E RETORNO: Recebe o vínculo funcional/idFuncional como string e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê históricos de unidade e policiais do localStorage e grava o cadastro
   * atualizado em STORAGE_KEY por meio de savePoliciais.
   * TODO: Em produção, executar essa atualização em transação no backend quando o P/1 confirmar a
   * apresentação, registrando auditoria do usuário responsável.
   */
  const historicos = loadUnitHistoricos()
    .map(normalizeUnitHistorico)
    .filter((historico) => historico.idFuncional === link);
  const latest = getLatestPresentedUnit(historicos);
  const policiais = loadPoliciais().map(normalizePolicial);

  savePoliciais(policiais.map((policial) => {
    if (getHistoryLink(policial) !== link) return policial;
    return { ...policial, unidade: latest.unidade || policial.unidade || '' };
  }));
}

function syncPolicialStatus(link) {
  const historicos = loadStatusHistoricos()
    .map(normalizeStatusHistorico)
    .filter((historico) => historico.idFuncional === link);
  const latest = getLatest(sortByCreation(historicos));
  const policiais = loadPoliciais().map(normalizePolicial);

  savePoliciais(policiais.map((policial) => {
    if (getHistoryLink(policial) !== link) return policial;
    return { ...policial, situacaoFuncional: latest.situacaoFuncional || '' };
  }));
}

function getLatestSituacaoFromList(historicos, link) {
  const linkedHistoricos = historicos
    .filter((historico) => historico.idFuncional === link)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const latest = linkedHistoricos[linkedHistoricos.length - 1];

  return latest ? latest.situacaoSanitaria : 'APTO_A';
}

function getLatestFunctionalFromList(historicos, link) {
  const latest = getLatest(sortByCreation(historicos.filter((historico) => historico.idFuncional === link)));
  return {
    postoGraduacao: latest.postoGraduacao || '',
    grupoHierarquico: latest.grupoHierarquico || '',
    grupoOficial: latest.grupoOficial || ''
  };
}

function getLatestBehaviorFromList(historicos, link) {
  const latest = getLatest(sortByCreation(historicos.filter((historico) => historico.idFuncional === link)));
  return latest.comportamento || '';
}

function getLatestUnitFromList(historicos, link) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Retorna a unidade que deve aparecer no cadastro principal a partir de uma lista
   * já carregada, respeitando a regra de só atualizar após Data de Apresentação.
   * PARÂMETROS E RETORNO: Recebe um array de históricos e o link funcional do policial; retorna a unidade
   * como string ou vazio quando não há apresentação registrada.
   * ARMAZENAMENTO E PERSISTÊNCIA: Usa apenas a lista em memória criada durante o salvamento do formulário.
   * TODO: Em produção, centralizar esta regra na API para que listagem e cadastro usem a mesma fonte.
   */
  const latest = getLatestPresentedUnit(historicos.filter((historico) => historico.idFuncional === link));
  return latest.unidade || '';
}

function getLatestStatusFromList(historicos, link) {
  const latest = getLatest(sortByCreation(historicos.filter((historico) => historico.idFuncional === link)));
  return latest.situacaoFuncional || '';
}

function openNewHistoryForm() {
  const policial = loadPoliciais().map(normalizePolicial).find((item) => item.id === historyPolicialId.value);
  if (!policial) return;

  clearHistoryForm();
  historyPolicialId.value = policial.id;
  historyForm.hidden = false;
  historyFields.situacaoSanitaria.focus();
}

function openNewFunctionalForm() {
  const policial = loadPoliciais().map(normalizePolicial).find((item) => item.id === functionalPolicialId.value);
  if (!policial) return;

  clearFunctionalForm();
  functionalPolicialId.value = policial.id;
  functionalForm.hidden = false;
  functionalFields.functionalPostoGraduacao.focus();
}

function openNewBehaviorForm() {
  const policial = loadPoliciais().map(normalizePolicial).find((item) => item.id === behaviorPolicialId.value);
  if (!policial) return;

  clearBehaviorForm();
  behaviorPolicialId.value = policial.id;
  behaviorForm.hidden = false;
  behaviorFields.behaviorComportamento.focus();
}

function openNewUnitForm() {
  const policial = loadPoliciais().map(normalizePolicial).find((item) => item.id === unitPolicialId.value);
  if (!policial) return;

  clearUnitForm();
  unitPolicialId.value = policial.id;
  unitForm.hidden = false;
  unitFields.unitUnidade.focus();
}

function openNewStatusForm() {
  const policial = loadPoliciais().map(normalizePolicial).find((item) => item.id === statusPolicialId.value);
  if (!policial) return;

  clearStatusForm();
  statusPolicialId.value = policial.id;
  statusForm.hidden = false;
  statusFields.statusSituacaoFuncional.focus();
}

function openNewCourseForm() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Abre o formulário para adicionar curso ao histórico do policial selecionado.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e não retorna valor; usa coursePolicialId para localizar o policial.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; apenas prepara o DOM para posterior submit no localStorage.
   * TODO: Em produção, carregar lista de convênios/cursos antes de abrir o formulário.
   */
  const policial = loadPoliciais().map(normalizePolicial).find((item) => item.id === coursePolicialId.value);
  if (!policial) return;

  clearCourseForm();
  coursePolicialId.value = policial.id;
  courseForm.hidden = false;
  courseFields.courseDate.focus();
}

function openNewMotorLicenseForm() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Abre o formulário para cadastrar vencimento da habilitação de moto.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Altera somente o DOM; a persistência ocorre no submit do formulário.
   * TODO: Em produção, consultar documento vigente do policial para evitar duplicidade manual.
   */
  const policial = loadPoliciais().map(normalizePolicial).find((item) => item.id === motorLicensePolicialId.value);
  if (!policial) return;

  clearMotorLicenseForm();
  motorLicensePolicialId.value = policial.id;
  motorLicenseForm.hidden = false;
  motorLicenseFields.motorLicenseExpiration.focus();
}

function openNewOrdinanceForm() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Abre o formulário de portaria para multa estadual ou municipal.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Manipula apenas o DOM; o registro é salvo no localStorage no submit.
   * TODO: Em produção, checar se já existe portaria ativa do mesmo tipo antes de permitir novo lançamento.
   */
  const policial = loadPoliciais().map(normalizePolicial).find((item) => item.id === ordinancePolicialId.value);
  if (!policial) return;

  clearOrdinanceForm();
  ordinancePolicialId.value = policial.id;
  ordinanceForm.hidden = false;
  ordinanceFields.ordinanceFineType.focus();
}

function updateFunctionalGroups() {
  const groups = getGroupsByPosto(functionalFields.functionalPostoGraduacao.value);
  functionalFields.functionalGrupoHierarquico.value = groups.grupoHierarquico;
  functionalFields.functionalGrupoOficial.value = groups.grupoOficial;
}

function updateInitialGroups() {
  const groups = getGroupsByPosto(initialFields.initialPostoGraduacao.value);
  initialFields.initialGrupoHierarquico.value = groups.grupoHierarquico;
  initialFields.initialGrupoOficial.value = groups.grupoOficial;
  updateInitialBehaviorVisibility();
}

function addInitialHistoryRows({
  formData,
  currentLink,
  updatedHistories,
  updatedFunctionalHistories,
  updatedBehaviorHistories,
  updatedUnitHistories,
  updatedStatusHistories
}) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Cria os registros iniciais de histórico a partir do primeiro cadastro do policial,
   * incluindo comportamento inicial somente quando ele existir para praças/Subtenente.
   * PARÂMETROS E RETORNO: Recebe o formData, link funcional e arrays de históricos já carregados; não
   * retorna valor, pois adiciona os registros diretamente nos arrays recebidos por referência.
   * ARMAZENAMENTO E PERSISTÊNCIA: Manipula arrays em memória que serão gravados em localStorage pelas
   * funções saveHistoricos/saveFunctionalHistoricos/saveBehaviorHistoricos e equivalentes.
   * TODO: Em produção, substituir por criação transacional dos registros relacionados no banco.
   */
  const dataEntrada = formData.dataEntrada;

  if (formData.situacaoSanitaria) {
    updatedHistories.push(normalizeHistorico({
      idFuncional: currentLink,
      dataInicio: dataEntrada,
      situacaoSanitaria: formData.situacaoSanitaria
    }));
  }

  if (formData.postoGraduacao) {
    updatedFunctionalHistories.push(normalizeFunctionalHistorico({
      idFuncional: currentLink,
      postoGraduacao: formData.postoGraduacao,
      grupoHierarquico: formData.grupoHierarquico,
      grupoOficial: formData.grupoOficial,
      dataAlteracao: dataEntrada
    }));
  }

  if (formData.comportamento) {
    updatedBehaviorHistories.push(normalizeBehaviorHistorico({
      idFuncional: currentLink,
      comportamento: formData.comportamento,
      dataAlteracao: dataEntrada
    }));
  }

  if (formData.unidade) {
    updatedUnitHistories.push(normalizeUnitHistorico({
      idFuncional: currentLink,
      unidade: formData.unidade,
      dataApresentacao: dataEntrada
    }));
  }

  if (formData.situacaoFuncional) {
    updatedStatusHistories.push(normalizeStatusHistorico({
      idFuncional: currentLink,
      situacaoFuncional: formData.situacaoFuncional,
      dataAlteracao: dataEntrada
    }));
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!updateMainFormValidation({ showAll: true })) return;

  const formData = readForm();
  const policiais = loadPoliciais().map(normalizePolicial);
  const existing = policiais.find((policial) => policial.id === formData.id);
  const previousLink = existing ? getHistoryLink(existing) : getHistoryLink(formData);
  const currentLink = getHistoryLink(formData);
  const updatedHistories = loadHistoricos().map(normalizeHistorico).map((historico) => {
    if (historico.idFuncional !== previousLink) return historico;
    return { ...historico, idFuncional: currentLink };
  });
  const updatedFunctionalHistories = loadFunctionalHistoricos().map(normalizeFunctionalHistorico).map((historico) => {
    if (historico.idFuncional !== previousLink) return historico;
    return { ...historico, idFuncional: currentLink };
  });
  const updatedBehaviorHistories = loadBehaviorHistoricos().map(normalizeBehaviorHistorico).map((historico) => {
    if (historico.idFuncional !== previousLink) return historico;
    return { ...historico, idFuncional: currentLink };
  });
  const updatedUnitHistories = loadUnitHistoricos().map(normalizeUnitHistorico).map((historico) => {
    if (historico.idFuncional !== previousLink) return historico;
    return { ...historico, idFuncional: currentLink };
  });
  const updatedStatusHistories = loadStatusHistoricos().map(normalizeStatusHistorico).map((historico) => {
    if (historico.idFuncional !== previousLink) return historico;
    return { ...historico, idFuncional: currentLink };
  });
  const updatedCourseHistories = loadCourseHistoricos().map(normalizeCourseHistorico).map((historico) => {
    if (historico.idFuncional !== previousLink) return historico;
    return { ...historico, idFuncional: currentLink };
  });
  const updatedMotorLicenseHistories = loadMotorLicenseHistoricos().map(normalizeMotorLicenseHistorico).map((historico) => {
    if (historico.idFuncional !== previousLink) return historico;
    return { ...historico, idFuncional: currentLink };
  });
  const updatedOrdinanceHistories = loadOrdinanceHistoricos().map(normalizeOrdinanceHistorico).map((historico) => {
    if (historico.idFuncional !== previousLink) return historico;
    return { ...historico, idFuncional: currentLink };
  });

  if (!existing) {
    addInitialHistoryRows({
      formData,
      currentLink,
      updatedHistories,
      updatedFunctionalHistories,
      updatedBehaviorHistories,
      updatedUnitHistories,
      updatedStatusHistories
    });
  }

  const savedRecord = {
    ...formData,
    ...getLatestFunctionalFromList(updatedFunctionalHistories, currentLink),
    comportamento: getLatestBehaviorFromList(updatedBehaviorHistories, currentLink),
    unidade: getLatestUnitFromList(updatedUnitHistories, currentLink) || (existing ? existing.unidade : formData.unidade),
    situacaoFuncional: getLatestStatusFromList(updatedStatusHistories, currentLink),
    situacaoSanitaria: getLatestSituacaoFromList(updatedHistories, currentLink) || formData.situacaoSanitaria || 'APTO_A',
    historicoSanitario: []
  };

  const updated = existing
    ? policiais.map((policial) => policial.id === savedRecord.id ? savedRecord : policial)
    : [...policiais, savedRecord];

  savePoliciais(updated);
  saveHistoricos(updatedHistories);
  saveFunctionalHistoricos(updatedFunctionalHistories);
  saveBehaviorHistoricos(updatedBehaviorHistories);
  saveUnitHistoricos(updatedUnitHistories);
  saveStatusHistoricos(updatedStatusHistories);
  saveCourseHistoricos(updatedCourseHistories);
  saveMotorLicenseHistoricos(updatedMotorLicenseHistories);
  saveOrdinanceHistoricos(updatedOrdinanceHistories);
  clearForm();
  render();
  setActiveView('table-view');
});

historyForm.addEventListener('submit', (event) => {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Registra uma nova movimentação sanitária no histórico do policial, sem permitir
   * edição ou exclusão de lançamentos já gravados.
   * PARÂMETROS E RETORNO: Recebe o evento submit do formulário e não retorna valor; controla validação e
   * atualização da tela.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê o policial e o histórico sanitário do localStorage, acrescenta um
   * novo item em HISTORY_STORAGE_KEY e sincroniza a situação vigente no cadastro principal.
   * TODO: Em produção, mover a regra append-only para endpoint transacional com auditoria de usuário.
   */
  event.preventDefault();

  const policial = loadPoliciais()
    .map(normalizePolicial)
    .find((item) => item.id === historyPolicialId.value);
  if (!policial) return;

  const historyData = readHistoryForm();
  if (!hasHistoryData(historyData)) return;

  const link = getHistoryLink(policial);
  const historicos = loadHistoricos().map(normalizeHistorico);
  const updatedHistoricos = [...historicos, normalizeHistorico({ ...historyData, idFuncional: link })];

  saveHistoricos(updatedHistoricos);
  syncPolicialSituacao(link);
  clearHistoryForm();
  historyForm.hidden = true;
  render();
  showDetails(policial.id);
});

functionalForm.addEventListener('submit', (event) => {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Registra uma nova alteração funcional do policial como histórico imutável.
   * PARÂMETROS E RETORNO: Recebe o evento submit do formulário e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê policiais e FUNCTIONAL_HISTORY_STORAGE_KEY do localStorage, grava
   * o array com o novo lançamento e sincroniza posto/grupo vigentes no cadastro principal.
   * TODO: Em produção, validar a publicação BOLPM no backend e manter trilha de retificação separada.
   */
  event.preventDefault();

  const policial = loadPoliciais()
    .map(normalizePolicial)
    .find((item) => item.id === functionalPolicialId.value);
  if (!policial) return;

  const historyData = readFunctionalForm();
  if (!hasFunctionalData(historyData)) return;

  const link = getHistoryLink(policial);
  const historicos = loadFunctionalHistoricos().map(normalizeFunctionalHistorico);
  const updatedHistoricos = [...historicos, normalizeFunctionalHistorico({ ...historyData, idFuncional: link })];

  saveFunctionalHistoricos(updatedHistoricos);
  syncPolicialFunctional(link);
  clearFunctionalForm();
  functionalForm.hidden = true;
  render();
  showDetails(policial.id);
});

behaviorForm.addEventListener('submit', (event) => {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Inclui um novo registro de comportamento no histórico do policial.
   * PARÂMETROS E RETORNO: Recebe o evento submit e não retorna valor; valida dados mínimos e fecha o
   * formulário após salvar.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê e grava BEHAVIOR_HISTORY_STORAGE_KEY no localStorage, além de
   * sincronizar o comportamento atual no cadastro principal.
   * TODO: Em produção, aplicar permissões por perfil e auditoria antes de aceitar novo lançamento.
   */
  event.preventDefault();

  const policial = loadPoliciais()
    .map(normalizePolicial)
    .find((item) => item.id === behaviorPolicialId.value);
  if (!policial) return;

  const historyData = readBehaviorForm();
  if (!hasBehaviorData(historyData)) return;

  const link = getHistoryLink(policial);
  const historicos = loadBehaviorHistoricos().map(normalizeBehaviorHistorico);
  const updatedHistoricos = [...historicos, normalizeBehaviorHistorico({ ...historyData, idFuncional: link })];

  saveBehaviorHistoricos(updatedHistoricos);
  syncPolicialBehavior(link);
  clearBehaviorForm();
  behaviorForm.hidden = true;
  render();
  showDetails(policial.id);
});

unitForm.addEventListener('submit', (event) => {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Processa inclusão append-only do histórico de unidade e atualiza o cadastro
   * apenas quando há Data de Apresentação.
   * PARÂMETROS E RETORNO: Recebe o evento submit do formulário; não retorna valor e controla o fluxo na tela.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê policiais e históricos do localStorage, grava o array atualizado em
   * UNIT_HISTORY_STORAGE_KEY e sincroniza o cadastro principal em STORAGE_KEY.
   * TODO: Em produção, substituir localStorage por endpoint transacional com validação de permissão do P/1
   * e fluxo formal de retificação para correções.
   */
  event.preventDefault();

  const policial = loadPoliciais()
    .map(normalizePolicial)
    .find((item) => item.id === unitPolicialId.value);
  if (!policial) return;

  const historyData = readUnitForm();
  if (!hasUnitData(historyData)) return;

  const link = getHistoryLink(policial);
  const historicos = loadUnitHistoricos().map(normalizeUnitHistorico);
  const updatedHistoricos = [...historicos, normalizeUnitHistorico({ ...historyData, idFuncional: link })];

  saveUnitHistoricos(updatedHistoricos);
  syncPolicialUnit(link);
  clearUnitForm();
  unitForm.hidden = true;
  render();
  showDetails(policial.id);
});

statusForm.addEventListener('submit', (event) => {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Inclui uma nova situação funcional no histórico imutável do policial.
   * PARÂMETROS E RETORNO: Recebe o evento submit do formulário e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê/grava STATUS_HISTORY_STORAGE_KEY no localStorage e sincroniza a
   * situação funcional vigente no cadastro principal.
   * TODO: Em produção, validar o evento administrativo no backend e registrar usuário/data de lançamento.
   */
  event.preventDefault();

  const policial = loadPoliciais()
    .map(normalizePolicial)
    .find((item) => item.id === statusPolicialId.value);
  if (!policial) return;

  const historyData = readStatusForm();
  if (!hasStatusData(historyData)) return;

  const link = getHistoryLink(policial);
  const historicos = loadStatusHistoricos().map(normalizeStatusHistorico);
  const updatedHistoricos = [...historicos, normalizeStatusHistorico({ ...historyData, idFuncional: link })];

  saveStatusHistoricos(updatedHistoricos);
  syncPolicialStatus(link);
  clearStatusForm();
  statusForm.hidden = true;
  render();
  showDetails(policial.id);
});

courseForm.addEventListener('submit', (event) => {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Salva um novo curso no histórico do policial.
   * PARÂMETROS E RETORNO: Recebe o evento submit e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê policiais e cursos do localStorage, acrescenta novo item em
   * COURSE_HISTORY_STORAGE_KEY e redesenha o detalhe.
   * TODO: Em produção, validar convênio/curso contra tabelas reais e anexar certificado quando existir.
   */
  event.preventDefault();

  const policial = loadPoliciais()
    .map(normalizePolicial)
    .find((item) => item.id === coursePolicialId.value);
  if (!policial) return;

  const historyData = readCourseForm();
  if (!hasCourseData(historyData)) return;

  const link = getHistoryLink(policial);
  const historicos = loadCourseHistoricos().map(normalizeCourseHistorico);
  saveCourseHistoricos([...historicos, normalizeCourseHistorico({ ...historyData, idFuncional: link })]);
  clearCourseForm();
  courseForm.hidden = true;
  showDetails(policial.id);
});

motorLicenseForm.addEventListener('submit', (event) => {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Salva um novo registro de habilitação de moto do policial.
   * PARÂMETROS E RETORNO: Recebe o evento submit e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê localStorage, acrescenta registro em MOTOR_LICENSE_HISTORY_STORAGE_KEY
   * e atualiza a tabela de detalhe.
   * TODO: Em produção, automatizar alerta de vencimento e validação documental.
   */
  event.preventDefault();

  const policial = loadPoliciais()
    .map(normalizePolicial)
    .find((item) => item.id === motorLicensePolicialId.value);
  if (!policial) return;

  const historyData = readMotorLicenseForm();
  if (!hasMotorLicenseData(historyData)) return;

  const link = getHistoryLink(policial);
  const historicos = loadMotorLicenseHistoricos().map(normalizeMotorLicenseHistorico);
  saveMotorLicenseHistoricos([...historicos, normalizeMotorLicenseHistorico({ ...historyData, idFuncional: link })]);
  clearMotorLicenseForm();
  motorLicenseForm.hidden = true;
  showDetails(policial.id);
});

ordinanceForm.addEventListener('submit', (event) => {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Salva novo registro de policial portariado por tipo de multa.
   * PARÂMETROS E RETORNO: Recebe o evento submit e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê/grava ORDINANCE_HISTORY_STORAGE_KEY no localStorage e redesenha o detalhe.
   * TODO: Em produção, validar publicação em BOLPM e separar fluxos de multa estadual e municipal por serviço.
   */
  event.preventDefault();

  const policial = loadPoliciais()
    .map(normalizePolicial)
    .find((item) => item.id === ordinancePolicialId.value);
  if (!policial) return;

  const historyData = readOrdinanceForm();
  if (!hasOrdinanceData(historyData)) return;

  const link = getHistoryLink(policial);
  const historicos = loadOrdinanceHistoricos().map(normalizeOrdinanceHistorico);
  saveOrdinanceHistoricos([...historicos, normalizeOrdinanceHistorico({ ...historyData, idFuncional: link })]);
  clearOrdinanceForm();
  ordinanceForm.hidden = true;
  showDetails(policial.id);
});

showHistoryFormButton.addEventListener('click', openNewHistoryForm);
showFunctionalFormButton.addEventListener('click', openNewFunctionalForm);
showBehaviorFormButton.addEventListener('click', openNewBehaviorForm);
showUnitFormButton.addEventListener('click', openNewUnitForm);
showStatusFormButton.addEventListener('click', openNewStatusForm);
showCourseFormButton.addEventListener('click', openNewCourseForm);
showMotorLicenseFormButton.addEventListener('click', openNewMotorLicenseForm);
showOrdinanceFormButton.addEventListener('click', openNewOrdinanceForm);

functionalFields.functionalPostoGraduacao.addEventListener('change', updateFunctionalGroups);
initialFields.initialPostoGraduacao.addEventListener('change', () => {
  updateInitialGroups();
  updateMainFormValidation();
});

fieldIds.forEach((id) => {
  if (!fields[id]) return;

  fields[id].addEventListener('focus', () => {
    activeValidationFields.add(id);
    updateMainFormValidation();
  });

  fields[id].addEventListener('input', () => {
    sanitizeMainFormInput(id);
    updateMainFormValidation();
  });

  fields[id].addEventListener('blur', () => {
    activeValidationFields.delete(id);
    updateMainFormValidation();
  });
});

Object.entries(initialFields).forEach(([id, element]) => {
  element.addEventListener('focus', () => {
    activeValidationFields.add(id);
    updateMainFormValidation();
  });
  element.addEventListener('change', updateMainFormValidation);
  element.addEventListener('blur', () => {
    activeValidationFields.delete(id);
    updateMainFormValidation();
  });
});

cancelHistoryButton.addEventListener('click', () => {
  clearHistoryForm();
  historyForm.hidden = true;
});

cancelFunctionalButton.addEventListener('click', () => {
  clearFunctionalForm();
  functionalForm.hidden = true;
});

cancelBehaviorButton.addEventListener('click', () => {
  clearBehaviorForm();
  behaviorForm.hidden = true;
});

cancelUnitButton.addEventListener('click', () => {
  clearUnitForm();
  unitForm.hidden = true;
});

cancelStatusButton.addEventListener('click', () => {
  clearStatusForm();
  statusForm.hidden = true;
});

cancelCourseButton.addEventListener('click', () => {
  clearCourseForm();
  courseForm.hidden = true;
});

cancelMotorLicenseButton.addEventListener('click', () => {
  clearMotorLicenseForm();
  motorLicenseForm.hidden = true;
});

cancelOrdinanceButton.addEventListener('click', () => {
  clearOrdinanceForm();
  ordinanceForm.hidden = true;
});

tabButtons.forEach((button) => {
  button.addEventListener('click', () => {
    setActiveView(button.dataset.view);
    window.history.replaceState(null, '', `#${button.dataset.view}`);
    if (button.dataset.view === 'table-view') render();
  });
});

clearButton.addEventListener('click', clearForm);

cancelButton.addEventListener('click', () => {
  clearForm();
  detailsCard.hidden = true;
});

closeDetails.addEventListener('click', () => {
  detailsCard.hidden = true;
  detailsEmpty.hidden = false;
});

document.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const { action, id } = button.dataset;
  const policial = loadPoliciais().map(normalizePolicial).find((item) => item.id === id);

  if (action === 'delete') deletePolicial(id);
  if (action === 'details') {
    setActiveView('details-view');
    showDetails(id);
  }
});

migrateLegacyHistoricos();
updateMainFormValidation();
render();
openInitialViewFromHash();

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Inicializa o menu hamburger do cadastro de policiais, abrindo a lista de páginas do módulo
 * dentro do cabeçalho e fechando ao escolher uma opção, clicar fora ou pressionar Escape.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void} Não retorna valores; conecta eventos aos elementos do DOM quando eles existem.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa LocalStorage nem APIs; grava apenas estado temporário em aria-expanded, aria-hidden
 * e na classe CSS is-open do header.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: integrar o item ativo e as permissões do menu ao roteamento autenticado em produção.
 */
function inicializarMenuHamburgerCadastroPolicial() {
  const moduleHeader = document.querySelector('.module-header');
  const menuToggle = document.querySelector('.menu-toggle');
  const moduleMenu = document.querySelector('#cadastro-policial-menu');

  if (!moduleHeader || !menuToggle || !moduleMenu) {
    return;
  }

  function definirEstadoMenu(shouldOpen) {
    menuToggle.setAttribute('aria-expanded', String(shouldOpen));
    menuToggle.setAttribute('aria-label', shouldOpen ? 'Fechar menu do cadastro de policiais' : 'Abrir menu do cadastro de policiais');
    moduleMenu.setAttribute('aria-hidden', String(!shouldOpen));
    moduleHeader.classList.toggle('is-open', shouldOpen);
  }

  menuToggle.addEventListener('click', () => {
    const shouldOpen = menuToggle.getAttribute('aria-expanded') !== 'true';
    definirEstadoMenu(shouldOpen);
  });

  moduleMenu.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      definirEstadoMenu(false);
    }
  });

  document.addEventListener('click', (event) => {
    if (!moduleHeader.contains(event.target)) {
      definirEstadoMenu(false);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      definirEstadoMenu(false);
      menuToggle.focus();
    }
  });
}

inicializarMenuHamburgerCadastroPolicial();
