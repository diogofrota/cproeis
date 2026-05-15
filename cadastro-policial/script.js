const STORAGE_KEY = 'cproeis_cadastro_policiais';
const HISTORY_STORAGE_KEY = 'cproeis_historico_sanitario';
const FUNCTIONAL_HISTORY_STORAGE_KEY = 'cproeis_historico_funcional';
const BEHAVIOR_HISTORY_STORAGE_KEY = 'cproeis_historico_comportamento';
const UNIT_HISTORY_STORAGE_KEY = 'cproeis_historico_unidade';
const STATUS_HISTORY_STORAGE_KEY = 'cproeis_historico_situacao_funcional';
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
    STATUS_HISTORY_STORAGE_KEY
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
const editingHistoryId = document.getElementById('editing-history-id');
const showHistoryFormButton = document.getElementById('show-history-form');
const saveHistoryButton = document.getElementById('save-history-button');
const cancelHistoryButton = document.getElementById('cancel-history-button');
const functionalForm = document.getElementById('functional-form');
const functionalPolicialId = document.getElementById('functional-policial-id');
const editingFunctionalId = document.getElementById('editing-functional-id');
const showFunctionalFormButton = document.getElementById('show-functional-form');
const saveFunctionalButton = document.getElementById('save-functional-button');
const cancelFunctionalButton = document.getElementById('cancel-functional-button');
const behaviorForm = document.getElementById('behavior-form');
const behaviorPolicialId = document.getElementById('behavior-policial-id');
const editingBehaviorId = document.getElementById('editing-behavior-id');
const showBehaviorFormButton = document.getElementById('show-behavior-form');
const saveBehaviorButton = document.getElementById('save-behavior-button');
const cancelBehaviorButton = document.getElementById('cancel-behavior-button');
const unitForm = document.getElementById('unit-form');
const unitPolicialId = document.getElementById('unit-policial-id');
const editingUnitId = document.getElementById('editing-unit-id');
const showUnitFormButton = document.getElementById('show-unit-form');
const saveUnitButton = document.getElementById('save-unit-button');
const cancelUnitButton = document.getElementById('cancel-unit-button');
const statusForm = document.getElementById('status-form');
const statusPolicialId = document.getElementById('status-policial-id');
const editingStatusId = document.getElementById('editing-status-id');
const showStatusFormButton = document.getElementById('show-status-form');
const saveStatusButton = document.getElementById('save-status-button');
const cancelStatusButton = document.getElementById('cancel-status-button');
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
  'unitDataInicio',
  'unitDataTermino',
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

const detailLabels = [
  ['rg', 'RG'],
  ['idFuncional', 'ID Funcional'],
  ['nomeCompleto', 'Nome Completo'],
  ['nomeGuerra', 'Nome de Guerra'],
  ['telefone', 'Telefone'],
  ['email', 'Email'],
  ['dataEntrada', 'Data de Entrada'],
  ['postoGraduacao', 'Posto/Graduação'],
  ['grupoHierarquico', 'Grupo Hierárquico'],
  ['grupoOficial', 'Grupo Oficial'],
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
  return {
    id: historico.id || createId(),
    idFuncional: historico.idFuncional || '',
    unidade: historico.unidade || '',
    dataInicio: historico.dataInicio || '',
    dataTermino: historico.dataTermino || '',
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

function readForm() {
  const postoGraduacao = initialFields.initialPostoGraduacao.value;
  const groups = getGroupsByPosto(postoGraduacao);

  return {
    id: editingId.value || createId(),
    rg: fields.rg.value.trim(),
    idFuncional: fields.idFuncional.value.trim(),
    nomeCompleto: fields.nomeCompleto.value.trim(),
    nomeGuerra: fields.nomeGuerra.value.trim(),
    telefone: fields.telefone.value.trim(),
    email: fields.email.value.trim(),
    dataEntrada: fields.dataEntrada.value,
    postoGraduacao,
    grupoHierarquico: groups.grupoHierarquico,
    grupoOficial: groups.grupoOficial,
    situacaoFuncional: initialFields.initialSituacaoFuncional.value,
    unidade: initialFields.initialUnidade.value,
    situacaoSanitaria: initialFields.initialSituacaoSanitaria.value || 'APTO_A',
    comportamento: '',
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
  return {
    unidade: unitFields.unitUnidade.value,
    dataInicio: unitFields.unitDataInicio.value,
    dataTermino: unitFields.unitDataTermino.value,
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
    historico.dataInicio ||
    historico.dataTermino ||
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

function fillForm(policial) {
  const data = normalizePolicial(policial);
  editingId.value = data.id;

  fieldIds.forEach((id) => {
    if (fields[id] && id in data) fields[id].value = data[id];
  });

  const currentFunctional = getCurrentFunctional(data);
  initialFields.initialPostoGraduacao.value = currentFunctional.postoGraduacao;
  initialFields.initialGrupoHierarquico.value = currentFunctional.grupoHierarquico;
  initialFields.initialGrupoOficial.value = currentFunctional.grupoOficial;
  initialFields.initialSituacaoFuncional.value = getCurrentStatus(data);
  initialFields.initialUnidade.value = getCurrentUnit(data);
  initialFields.initialSituacaoSanitaria.value = getCurrentSituacaoSanitaria(data);

  saveButton.textContent = 'Atualizar';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function clearForm() {
  form.reset();
  editingId.value = '';
  initialFields.initialGrupoHierarquico.value = '';
  initialFields.initialGrupoOficial.value = '';
  saveButton.textContent = 'Salvar';
}

function clearHistoryForm() {
  historyForm.reset();
  editingHistoryId.value = '';
  saveHistoryButton.textContent = 'Salvar histórico';
}

function clearFunctionalForm() {
  functionalForm.reset();
  editingFunctionalId.value = '';
  functionalFields.functionalGrupoHierarquico.value = '';
  functionalFields.functionalGrupoOficial.value = '';
  saveFunctionalButton.textContent = 'Salvar histórico';
}

function clearBehaviorForm() {
  behaviorForm.reset();
  editingBehaviorId.value = '';
  saveBehaviorButton.textContent = 'Salvar histórico';
}

function clearUnitForm() {
  unitForm.reset();
  editingUnitId.value = '';
  saveUnitButton.textContent = 'Salvar histórico';
}

function clearStatusForm() {
  statusForm.reset();
  editingStatusId.value = '';
  saveStatusButton.textContent = 'Salvar histórico';
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

function getLatest(items) {
  return items[items.length - 1] || {};
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
  const latest = getLatest(getUnitHistoricosByPolicial(policial));
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

function render() {
  const policiais = loadPoliciais().map(normalizePolicial);
  policiaisBody.innerHTML = '';
  tableCount.textContent = policiais.length === 0
    ? 'Nenhum registro cadastrado.'
    : `${policiais.length} registro(s) cadastrado(s).`;

  if (policiais.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.className = 'empty';
    cell.colSpan = 8;
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
    [
      policial.rg,
      policial.idFuncional,
      policial.nomeCompleto,
      currentFunctional.postoGraduacao,
      currentUnit,
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
    actions.appendChild(createActionButton('Editar', 'edit', policial.id, 'secondary'));
    actions.appendChild(createActionButton('Excluir registro', 'delete', policial.id));
    actions.appendChild(createActionButton('Detalhes', 'details', policial.id, 'ghost'));
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

function renderFuncionalTable(historicos) {
  funcionalBody.innerHTML = '';

  if (historicos.length === 0) {
    renderEmptyHistory(funcionalBody, 8, 'Nenhum histórico funcional informado.');
    return;
  }

  historicos.forEach((historico) => {
    const row = document.createElement('tr');
    [
      historico.idFuncional,
      historico.postoGraduacao,
      historico.grupoHierarquico,
      historico.grupoOficial,
      formatDate(historico.dataAlteracao),
      historico.bolpm,
      formatDate(historico.dataBolpm)
    ].forEach((value) => {
      const cell = document.createElement('td');
      cell.textContent = displayValue(value);
      row.appendChild(cell);
    });

    const actionsCell = document.createElement('td');
    const actions = document.createElement('div');
    actions.className = 'actions';
    actions.appendChild(createActionButton('Editar', 'edit-functional', historico.id, 'secondary'));
    actions.appendChild(createActionButton('Excluir registro', 'delete-functional', historico.id));
    actionsCell.appendChild(actions);
    row.appendChild(actionsCell);
    funcionalBody.appendChild(row);
  });
}

function renderComportamentoTable(historicos) {
  comportamentoBody.innerHTML = '';

  if (historicos.length === 0) {
    renderEmptyHistory(comportamentoBody, 6, 'Nenhum histórico de comportamento informado.');
    return;
  }

  historicos.forEach((historico) => {
    const row = document.createElement('tr');
    [
      historico.idFuncional,
      historico.comportamento,
      formatDate(historico.dataAlteracao),
      historico.bolpm,
      formatDate(historico.dataBolpm)
    ].forEach((value) => {
      const cell = document.createElement('td');
      cell.textContent = displayValue(value);
      row.appendChild(cell);
    });

    const actionsCell = document.createElement('td');
    const actions = document.createElement('div');
    actions.className = 'actions';
    actions.appendChild(createActionButton('Editar', 'edit-behavior', historico.id, 'secondary'));
    actions.appendChild(createActionButton('Excluir registro', 'delete-behavior', historico.id));
    actionsCell.appendChild(actions);
    row.appendChild(actionsCell);
    comportamentoBody.appendChild(row);
  });
}

function renderUnidadeTable(historicos) {
  unidadeBody.innerHTML = '';

  if (historicos.length === 0) {
    renderEmptyHistory(unidadeBody, 7, 'Nenhum histórico de unidade informado.');
    return;
  }

  historicos.forEach((historico) => {
    const row = document.createElement('tr');
    [
      historico.idFuncional,
      historico.unidade,
      formatDate(historico.dataInicio),
      formatDate(historico.dataTermino),
      historico.bolpm,
      formatDate(historico.dataBolpm)
    ].forEach((value) => {
      const cell = document.createElement('td');
      cell.textContent = displayValue(value);
      row.appendChild(cell);
    });

    const actionsCell = document.createElement('td');
    const actions = document.createElement('div');
    actions.className = 'actions';
    actions.appendChild(createActionButton('Editar', 'edit-unit', historico.id, 'secondary'));
    actions.appendChild(createActionButton('Excluir registro', 'delete-unit', historico.id));
    actionsCell.appendChild(actions);
    row.appendChild(actionsCell);
    unidadeBody.appendChild(row);
  });
}

function renderSituacaoFuncionalTable(historicos) {
  situacaoFuncionalBody.innerHTML = '';

  if (historicos.length === 0) {
    renderEmptyHistory(situacaoFuncionalBody, 6, 'Nenhum histórico de situação funcional informado.');
    return;
  }

  historicos.forEach((historico) => {
    const row = document.createElement('tr');
    [
      historico.idFuncional,
      historico.situacaoFuncional,
      formatDate(historico.dataAlteracao),
      historico.bolpm,
      formatDate(historico.dataBolpm)
    ].forEach((value) => {
      const cell = document.createElement('td');
      cell.textContent = displayValue(value);
      row.appendChild(cell);
    });

    const actionsCell = document.createElement('td');
    const actions = document.createElement('div');
    actions.className = 'actions';
    actions.appendChild(createActionButton('Editar', 'edit-status', historico.id, 'secondary'));
    actions.appendChild(createActionButton('Excluir registro', 'delete-status', historico.id));
    actionsCell.appendChild(actions);
    row.appendChild(actionsCell);
    situacaoFuncionalBody.appendChild(row);
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
  clearHistoryForm();
  clearFunctionalForm();
  clearBehaviorForm();
  clearUnitForm();
  clearStatusForm();
  historyForm.hidden = true;
  functionalForm.hidden = true;
  behaviorForm.hidden = true;
  unitForm.hidden = true;
  statusForm.hidden = true;
  detailsTitle.textContent = policial.nomeCompleto || policial.nomeGuerra || policial.rg || 'Registro sem nome';
  detailsGrid.innerHTML = '';
  historicoBody.innerHTML = '';
  const historicos = getHistoricosByPolicial(policial);
  const funcionalHistoricos = getFunctionalHistoricosByPolicial(policial);
  const comportamentoHistoricos = getBehaviorHistoricosByPolicial(policial);
  const unidadeHistoricos = getUnitHistoricosByPolicial(policial);
  const statusHistoricos = getStatusHistoricosByPolicial(policial);
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

  if (historicos.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.className = 'empty';
    cell.colSpan = 7;
    cell.textContent = 'Nenhum histórico sanitário informado.';
    row.appendChild(cell);
    historicoBody.appendChild(row);
  } else {
    historicos.forEach((historico) => {
      const row = document.createElement('tr');
      [
        displayValue(historico.idFuncional),
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

      const actionsCell = document.createElement('td');
      const actions = document.createElement('div');
      actions.className = 'actions';
      actions.appendChild(createActionButton('Editar', 'edit-history', historico.id, 'secondary'));
      actions.appendChild(createActionButton('Excluir registro', 'delete-history', historico.id));
      actionsCell.appendChild(actions);
      row.appendChild(actionsCell);
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

  savePoliciais(policiais.filter((item) => item.id !== id));
  saveHistoricos(historicos);
  saveFunctionalHistoricos(funcionalHistoricos);
  saveBehaviorHistoricos(comportamentoHistoricos);
  saveUnitHistoricos(unidadeHistoricos);
  saveStatusHistoricos(statusHistoricos);
  if (!detailsCard.hidden) detailsCard.hidden = true;
  render();
}

function editHistorico(id) {
  const historico = loadHistoricos().map(normalizeHistorico).find((item) => item.id === id);
  if (!historico) return;

  const policial = loadPoliciais()
    .map(normalizePolicial)
    .find((item) => getHistoryLink(item) === historico.idFuncional);

  if (policial) {
    showDetails(policial.id);
  }

  editingHistoryId.value = historico.id;
  historyFields.situacaoSanitaria.value = historico.situacaoSanitaria;
  historyFields.dataInicio.value = historico.dataInicio;
  historyFields.dataTermino.value = historico.dataTermino;
  historyFields.bolpm.value = historico.bolpm;
  historyFields.dataBolpm.value = historico.dataBolpm;
  saveHistoryButton.textContent = 'Atualizar histórico';
  historyForm.hidden = false;
  historyForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function editFunctional(id) {
  const historico = loadFunctionalHistoricos().map(normalizeFunctionalHistorico).find((item) => item.id === id);
  if (!historico) return;

  const policial = loadPoliciais()
    .map(normalizePolicial)
    .find((item) => getHistoryLink(item) === historico.idFuncional);

  if (policial) showDetails(policial.id);

  editingFunctionalId.value = historico.id;
  functionalFields.functionalPostoGraduacao.value = historico.postoGraduacao;
  functionalFields.functionalGrupoHierarquico.value = historico.grupoHierarquico;
  functionalFields.functionalGrupoOficial.value = historico.grupoOficial;
  functionalFields.functionalDataAlteracao.value = historico.dataAlteracao;
  functionalFields.functionalBolpm.value = historico.bolpm;
  functionalFields.functionalDataBolpm.value = historico.dataBolpm;
  saveFunctionalButton.textContent = 'Atualizar histórico';
  functionalForm.hidden = false;
  functionalForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function editBehavior(id) {
  const historico = loadBehaviorHistoricos().map(normalizeBehaviorHistorico).find((item) => item.id === id);
  if (!historico) return;

  const policial = loadPoliciais()
    .map(normalizePolicial)
    .find((item) => getHistoryLink(item) === historico.idFuncional);

  if (policial) showDetails(policial.id);

  editingBehaviorId.value = historico.id;
  behaviorFields.behaviorComportamento.value = historico.comportamento;
  behaviorFields.behaviorDataAlteracao.value = historico.dataAlteracao;
  behaviorFields.behaviorBolpm.value = historico.bolpm;
  behaviorFields.behaviorDataBolpm.value = historico.dataBolpm;
  saveBehaviorButton.textContent = 'Atualizar histórico';
  behaviorForm.hidden = false;
  behaviorForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function editUnit(id) {
  const historico = loadUnitHistoricos().map(normalizeUnitHistorico).find((item) => item.id === id);
  if (!historico) return;

  const policial = loadPoliciais()
    .map(normalizePolicial)
    .find((item) => getHistoryLink(item) === historico.idFuncional);

  if (policial) showDetails(policial.id);

  editingUnitId.value = historico.id;
  unitFields.unitUnidade.value = historico.unidade;
  unitFields.unitDataInicio.value = historico.dataInicio;
  unitFields.unitDataTermino.value = historico.dataTermino;
  unitFields.unitBolpm.value = historico.bolpm;
  unitFields.unitDataBolpm.value = historico.dataBolpm;
  saveUnitButton.textContent = 'Atualizar histórico';
  unitForm.hidden = false;
  unitForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function editStatus(id) {
  const historico = loadStatusHistoricos().map(normalizeStatusHistorico).find((item) => item.id === id);
  if (!historico) return;

  const policial = loadPoliciais()
    .map(normalizePolicial)
    .find((item) => getHistoryLink(item) === historico.idFuncional);

  if (policial) showDetails(policial.id);

  editingStatusId.value = historico.id;
  statusFields.statusSituacaoFuncional.value = historico.situacaoFuncional;
  statusFields.statusDataAlteracao.value = historico.dataAlteracao;
  statusFields.statusBolpm.value = historico.bolpm;
  statusFields.statusDataBolpm.value = historico.dataBolpm;
  saveStatusButton.textContent = 'Atualizar histórico';
  statusForm.hidden = false;
  statusForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
  const historicos = loadUnitHistoricos()
    .map(normalizeUnitHistorico)
    .filter((historico) => historico.idFuncional === link);
  const latest = getLatest(sortByCreation(historicos));
  const policiais = loadPoliciais().map(normalizePolicial);

  savePoliciais(policiais.map((policial) => {
    if (getHistoryLink(policial) !== link) return policial;
    return { ...policial, unidade: latest.unidade || '' };
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

function deleteHistorico(id) {
  if (!confirm('Deseja excluir este registro do histórico sanitário?')) return;

  const historicos = loadHistoricos().map(normalizeHistorico);
  const historico = historicos.find((item) => item.id === id);
  if (!historico) return;

  saveHistoricos(historicos.filter((item) => item.id !== id));
  syncPolicialSituacao(historico.idFuncional);
  render();

  const policial = loadPoliciais()
    .map(normalizePolicial)
    .find((item) => getHistoryLink(item) === historico.idFuncional);
  if (policial) showDetails(policial.id);
}

function deleteFunctional(id) {
  if (!confirm('Deseja excluir este registro do histórico funcional?')) return;

  const historicos = loadFunctionalHistoricos().map(normalizeFunctionalHistorico);
  const historico = historicos.find((item) => item.id === id);
  if (!historico) return;

  saveFunctionalHistoricos(historicos.filter((item) => item.id !== id));
  syncPolicialFunctional(historico.idFuncional);
  render();

  const policial = loadPoliciais()
    .map(normalizePolicial)
    .find((item) => getHistoryLink(item) === historico.idFuncional);
  if (policial) showDetails(policial.id);
}

function deleteBehavior(id) {
  if (!confirm('Deseja excluir este registro do histórico de comportamento?')) return;

  const historicos = loadBehaviorHistoricos().map(normalizeBehaviorHistorico);
  const historico = historicos.find((item) => item.id === id);
  if (!historico) return;

  saveBehaviorHistoricos(historicos.filter((item) => item.id !== id));
  syncPolicialBehavior(historico.idFuncional);
  render();

  const policial = loadPoliciais()
    .map(normalizePolicial)
    .find((item) => getHistoryLink(item) === historico.idFuncional);
  if (policial) showDetails(policial.id);
}

function deleteUnit(id) {
  if (!confirm('Deseja excluir este registro do histórico de unidade?')) return;

  const historicos = loadUnitHistoricos().map(normalizeUnitHistorico);
  const historico = historicos.find((item) => item.id === id);
  if (!historico) return;

  saveUnitHistoricos(historicos.filter((item) => item.id !== id));
  syncPolicialUnit(historico.idFuncional);
  render();

  const policial = loadPoliciais()
    .map(normalizePolicial)
    .find((item) => getHistoryLink(item) === historico.idFuncional);
  if (policial) showDetails(policial.id);
}

function deleteStatus(id) {
  if (!confirm('Deseja excluir este registro do histórico de situação funcional?')) return;

  const historicos = loadStatusHistoricos().map(normalizeStatusHistorico);
  const historico = historicos.find((item) => item.id === id);
  if (!historico) return;

  saveStatusHistoricos(historicos.filter((item) => item.id !== id));
  syncPolicialStatus(historico.idFuncional);
  render();

  const policial = loadPoliciais()
    .map(normalizePolicial)
    .find((item) => getHistoryLink(item) === historico.idFuncional);
  if (policial) showDetails(policial.id);
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
  const latest = getLatest(sortByCreation(historicos.filter((historico) => historico.idFuncional === link)));
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

function updateFunctionalGroups() {
  const groups = getGroupsByPosto(functionalFields.functionalPostoGraduacao.value);
  functionalFields.functionalGrupoHierarquico.value = groups.grupoHierarquico;
  functionalFields.functionalGrupoOficial.value = groups.grupoOficial;
}

function updateInitialGroups() {
  const groups = getGroupsByPosto(initialFields.initialPostoGraduacao.value);
  initialFields.initialGrupoHierarquico.value = groups.grupoHierarquico;
  initialFields.initialGrupoOficial.value = groups.grupoOficial;
}

function addInitialHistoryRows({
  formData,
  currentLink,
  updatedHistories,
  updatedFunctionalHistories,
  updatedUnitHistories,
  updatedStatusHistories
}) {
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

  if (formData.unidade) {
    updatedUnitHistories.push(normalizeUnitHistorico({
      idFuncional: currentLink,
      unidade: formData.unidade,
      dataInicio: dataEntrada
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

  if (!existing) {
    addInitialHistoryRows({
      formData,
      currentLink,
      updatedHistories,
      updatedFunctionalHistories,
      updatedUnitHistories,
      updatedStatusHistories
    });
  }

  const savedRecord = {
    ...formData,
    ...getLatestFunctionalFromList(updatedFunctionalHistories, currentLink),
    comportamento: getLatestBehaviorFromList(updatedBehaviorHistories, currentLink),
    unidade: getLatestUnitFromList(updatedUnitHistories, currentLink),
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
  clearForm();
  render();
  setActiveView('table-view');
});

historyForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const policial = loadPoliciais()
    .map(normalizePolicial)
    .find((item) => item.id === historyPolicialId.value);
  if (!policial) return;

  const historyData = readHistoryForm();
  if (!hasHistoryData(historyData)) return;

  const link = getHistoryLink(policial);
  const historicos = loadHistoricos().map(normalizeHistorico);
  const updatedHistoricos = editingHistoryId.value
    ? historicos.map((historico) => historico.id === editingHistoryId.value
      ? normalizeHistorico({ ...historico, ...historyData, idFuncional: link })
      : historico)
    : [...historicos, normalizeHistorico({ ...historyData, idFuncional: link })];

  saveHistoricos(updatedHistoricos);
  syncPolicialSituacao(link);
  clearHistoryForm();
  historyForm.hidden = true;
  render();
  showDetails(policial.id);
});

functionalForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const policial = loadPoliciais()
    .map(normalizePolicial)
    .find((item) => item.id === functionalPolicialId.value);
  if (!policial) return;

  const historyData = readFunctionalForm();
  if (!hasFunctionalData(historyData)) return;

  const link = getHistoryLink(policial);
  const historicos = loadFunctionalHistoricos().map(normalizeFunctionalHistorico);
  const updatedHistoricos = editingFunctionalId.value
    ? historicos.map((historico) => historico.id === editingFunctionalId.value
      ? normalizeFunctionalHistorico({ ...historico, ...historyData, idFuncional: link })
      : historico)
    : [...historicos, normalizeFunctionalHistorico({ ...historyData, idFuncional: link })];

  saveFunctionalHistoricos(updatedHistoricos);
  syncPolicialFunctional(link);
  clearFunctionalForm();
  functionalForm.hidden = true;
  render();
  showDetails(policial.id);
});

behaviorForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const policial = loadPoliciais()
    .map(normalizePolicial)
    .find((item) => item.id === behaviorPolicialId.value);
  if (!policial) return;

  const historyData = readBehaviorForm();
  if (!hasBehaviorData(historyData)) return;

  const link = getHistoryLink(policial);
  const historicos = loadBehaviorHistoricos().map(normalizeBehaviorHistorico);
  const updatedHistoricos = editingBehaviorId.value
    ? historicos.map((historico) => historico.id === editingBehaviorId.value
      ? normalizeBehaviorHistorico({ ...historico, ...historyData, idFuncional: link })
      : historico)
    : [...historicos, normalizeBehaviorHistorico({ ...historyData, idFuncional: link })];

  saveBehaviorHistoricos(updatedHistoricos);
  syncPolicialBehavior(link);
  clearBehaviorForm();
  behaviorForm.hidden = true;
  render();
  showDetails(policial.id);
});

unitForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const policial = loadPoliciais()
    .map(normalizePolicial)
    .find((item) => item.id === unitPolicialId.value);
  if (!policial) return;

  const historyData = readUnitForm();
  if (!hasUnitData(historyData)) return;

  const link = getHistoryLink(policial);
  const historicos = loadUnitHistoricos().map(normalizeUnitHistorico);
  const updatedHistoricos = editingUnitId.value
    ? historicos.map((historico) => historico.id === editingUnitId.value
      ? normalizeUnitHistorico({ ...historico, ...historyData, idFuncional: link })
      : historico)
    : [...historicos, normalizeUnitHistorico({ ...historyData, idFuncional: link })];

  saveUnitHistoricos(updatedHistoricos);
  syncPolicialUnit(link);
  clearUnitForm();
  unitForm.hidden = true;
  render();
  showDetails(policial.id);
});

statusForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const policial = loadPoliciais()
    .map(normalizePolicial)
    .find((item) => item.id === statusPolicialId.value);
  if (!policial) return;

  const historyData = readStatusForm();
  if (!hasStatusData(historyData)) return;

  const link = getHistoryLink(policial);
  const historicos = loadStatusHistoricos().map(normalizeStatusHistorico);
  const updatedHistoricos = editingStatusId.value
    ? historicos.map((historico) => historico.id === editingStatusId.value
      ? normalizeStatusHistorico({ ...historico, ...historyData, idFuncional: link })
      : historico)
    : [...historicos, normalizeStatusHistorico({ ...historyData, idFuncional: link })];

  saveStatusHistoricos(updatedHistoricos);
  syncPolicialStatus(link);
  clearStatusForm();
  statusForm.hidden = true;
  render();
  showDetails(policial.id);
});

showHistoryFormButton.addEventListener('click', openNewHistoryForm);
showFunctionalFormButton.addEventListener('click', openNewFunctionalForm);
showBehaviorFormButton.addEventListener('click', openNewBehaviorForm);
showUnitFormButton.addEventListener('click', openNewUnitForm);
showStatusFormButton.addEventListener('click', openNewStatusForm);

functionalFields.functionalPostoGraduacao.addEventListener('change', updateFunctionalGroups);
initialFields.initialPostoGraduacao.addEventListener('change', updateInitialGroups);

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

tabButtons.forEach((button) => {
  button.addEventListener('click', () => {
    setActiveView(button.dataset.view);
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

  if (action === 'edit' && policial) {
    setActiveView('form-view');
    fillForm(policial);
  }
  if (action === 'delete') deletePolicial(id);
  if (action === 'details') {
    setActiveView('details-view');
    showDetails(id);
  }
  if (action === 'edit-functional') editFunctional(id);
  if (action === 'delete-functional') deleteFunctional(id);
  if (action === 'edit-behavior') editBehavior(id);
  if (action === 'delete-behavior') deleteBehavior(id);
  if (action === 'edit-unit') editUnit(id);
  if (action === 'delete-unit') deleteUnit(id);
  if (action === 'edit-status') editStatus(id);
  if (action === 'delete-status') deleteStatus(id);
  if (action === 'edit-history') editHistorico(id);
  if (action === 'delete-history') deleteHistorico(id);
});

migrateLegacyHistoricos();
render();
