const STORAGE_VALORES = 'cproeis_contratos_valores';
const STORAGE_CONVENIOS = 'cproeis_contratos_convenios';
const STORAGE_RESPONSAVEIS = 'cproeis_contratos_responsaveis';
const STORAGE_HISTORICOS = 'cproeis_contratos_historicos';
const STORAGE_SCHEMA_VERSION = 'cproeis_contratos_schema_version';
const CURRENT_SCHEMA_VERSION = '2026-05-15-endereco-separado';

window.CPROEIS_CONTRATOS_STORAGE = {
  valores: STORAGE_VALORES,
  convenios: STORAGE_CONVENIOS,
  responsaveis: STORAGE_RESPONSAVEIS,
  historicos: STORAGE_HISTORICOS,
  schemaVersion: STORAGE_SCHEMA_VERSION
};

if (localStorage.getItem(STORAGE_SCHEMA_VERSION) !== CURRENT_SCHEMA_VERSION) {
  [
    STORAGE_VALORES,
    STORAGE_CONVENIOS,
    STORAGE_RESPONSAVEIS,
    STORAGE_HISTORICOS
  ].forEach((key) => localStorage.removeItem(key));

  localStorage.setItem(STORAGE_SCHEMA_VERSION, CURRENT_SCHEMA_VERSION);
}

const gruposClasse = {
  A: 'Oficiais superiores',
  B: 'Oficiais intermediários e subalternos',
  C: 'Praças subtenentes e sargentos',
  D: 'Cabos e soldados'
};

const dinheiro = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const today = new Date().toISOString().slice(0, 10);

const tabs = document.querySelectorAll('.tab-button');
const views = document.querySelectorAll('.view');
const form = document.getElementById('convenio-form');
const editingId = document.getElementById('editing-id');
const formTitle = document.getElementById('form-title');
const submitButton = document.getElementById('submit-button');
const clearButton = document.getElementById('clear-button');
const cancelButton = document.getElementById('cancel-button');
const cnpjList = document.getElementById('cnpj-list');
const ativosBody = document.getElementById('ativos-body');
const inativosBody = document.getElementById('inativos-body');
const activeCount = document.getElementById('active-count');
const inactiveCount = document.getElementById('inactive-count');
const detailsEmpty = document.getElementById('details-empty');
const detailsPanel = document.getElementById('details-panel');
const detailsHeading = document.getElementById('details-heading');
const detailsSubtitle = document.getElementById('details-subtitle');
const detailsContent = document.getElementById('details-content');
const closeDetails = document.getElementById('close-details');
const responsaveisFormBody = document.getElementById('responsaveis-form-body');
const addResponsavelButton = document.getElementById('add-responsavel');
const clearResponsavelButton = document.getElementById('clear-responsavel');

const totals = {
  convenios: document.getElementById('total-convenios'),
  ativos: document.getElementById('total-ativos'),
  inativos: document.getElementById('total-inativos'),
  clientes: document.getElementById('total-clientes')
};

const fields = {
  nome: document.getElementById('nome'),
  cnpj: document.getElementById('cnpj'),
  enderecoCep: document.getElementById('endereco-cep'),
  enderecoLogradouro: document.getElementById('endereco-logradouro'),
  enderecoNumero: document.getElementById('endereco-numero'),
  enderecoComplemento: document.getElementById('endereco-complemento'),
  enderecoBairro: document.getElementById('endereco-bairro'),
  enderecoCidade: document.getElementById('endereco-cidade'),
  enderecoUf: document.getElementById('endereco-uf'),
  numero: document.getElementById('numero'),
  diarioData: document.getElementById('diario-data'),
  diarioPagina: document.getElementById('diario-pagina'),
  valorContrato: document.getElementById('valor-contrato'),
  inicio: document.getElementById('inicio'),
  fim: document.getElementById('fim'),
  valorPassagem: document.getElementById('valor-passagem'),
  valorAlimentacao: document.getElementById('valor-alimentacao'),
  responsavelNome: document.getElementById('responsavel-nome'),
  responsavelCpf: document.getElementById('responsavel-cpf'),
  responsavelEmail: document.getElementById('responsavel-email'),
  responsavelTelefone: document.getElementById('responsavel-telefone'),
  responsavelFuncao: document.getElementById('responsavel-funcao'),
  responsavelInicio: document.getElementById('responsavel-inicio'),
  responsavelFim: document.getElementById('responsavel-fim'),
  responsavelObservacoes: document.getElementById('responsavel-observacoes'),
  observacoes: document.getElementById('observacoes')
};

const valueInputs = {
  A: {
    servico12: document.getElementById('valor-a-12'),
    servico8: document.getElementById('valor-a-8'),
    servico6: document.getElementById('valor-a-6')
  },
  B: {
    servico12: document.getElementById('valor-b-12'),
    servico8: document.getElementById('valor-b-8'),
    servico6: document.getElementById('valor-b-6')
  },
  C: {
    servico12: document.getElementById('valor-c-12'),
    servico8: document.getElementById('valor-c-8'),
    servico6: document.getElementById('valor-c-6')
  },
  D: {
    servico12: document.getElementById('valor-d-12'),
    servico8: document.getElementById('valor-d-8'),
    servico6: document.getElementById('valor-d-6')
  }
};

let selectedConvenioId = '';
let responsaveisState = [];

function loadList(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (error) {
    return [];
  }
}

function saveList(key, list) {
  localStorage.setItem(key, JSON.stringify(list));
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function numberValue(input) {
  return Number(input.value || 0);
}

function formatDate(value) {
  if (!value) return 'Sem fim';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

function formatDateOrDash(value) {
  return value ? formatDate(value) : '-';
}

function formatPeriod(start, end) {
  return start || end ? `${formatDateOrDash(start)} até ${formatDate(end)}` : '-';
}

function getEnderecoFromFields() {
  return {
    cep: fields.enderecoCep.value.trim(),
    logradouro: fields.enderecoLogradouro.value.trim(),
    numero: fields.enderecoNumero.value.trim(),
    complemento: fields.enderecoComplemento.value.trim(),
    bairro: fields.enderecoBairro.value.trim(),
    cidade: fields.enderecoCidade.value.trim(),
    uf: fields.enderecoUf.value.trim().toUpperCase()
  };
}

function formatEndereco(endereco, legado = '') {
  if (!endereco) return legado || '';

  const linha1 = [endereco.logradouro, endereco.numero].filter(Boolean).join(', ');
  const linha2 = [endereco.complemento, endereco.bairro].filter(Boolean).join(' - ');
  const linha3 = [endereco.cidade, endereco.uf].filter(Boolean).join('/');
  const linha4 = endereco.cep ? `CEP ${endereco.cep}` : '';

  return [linha1, linha2, linha3, linha4].filter(Boolean).join('\n');
}

function setEnderecoFields(convenio) {
  const endereco = convenio.enderecoDados || {};

  fields.enderecoCep.value = endereco.cep || '';
  fields.enderecoLogradouro.value = endereco.logradouro || convenio.endereco || '';
  fields.enderecoNumero.value = endereco.numero || '';
  fields.enderecoComplemento.value = endereco.complemento || '';
  fields.enderecoBairro.value = endereco.bairro || '';
  fields.enderecoCidade.value = endereco.cidade || '';
  fields.enderecoUf.value = endereco.uf || '';
}

function previousDate(value) {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
}

function getConvenios() {
  return loadList(STORAGE_CONVENIOS);
}

function getValores() {
  return loadList(STORAGE_VALORES);
}

function getResponsaveis() {
  return loadList(STORAGE_RESPONSAVEIS);
}

function setActiveView(viewId) {
  tabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.view === viewId));
  views.forEach((view) => view.classList.toggle('active', view.id === viewId));
}

function getSituacao(convenio) {
  if (convenio.inicio && today < convenio.inicio) {
    return { label: 'Aguardando', active: false, className: 'warning' };
  }

  if (convenio.fim && today > convenio.fim) {
    return { label: 'Encerrado', active: false, className: 'inactive' };
  }

  return { label: 'Ativo', active: true, className: '' };
}

function getClientContracts(cnpj) {
  return getConvenios()
    .filter((item) => item.cnpj && item.cnpj === cnpj)
    .sort((a, b) => (b.inicio || '').localeCompare(a.inicio || ''));
}

function getLatestByCnpj(cnpj, ignoreId = '') {
  return getClientContracts(cnpj).find((item) => item.id !== ignoreId);
}

function getContractValues(convenio) {
  if (convenio.valores?.length) return convenio.valores;
  return getValores().filter((item) => item.convenioId === convenio.id);
}

function getContractResponsaveis(convenio) {
  if (convenio.responsaveis?.length) return convenio.responsaveis;
  return getResponsaveis().filter((item) => item.convenioId === convenio.id);
}

function getValueRows(convenioId) {
  return ['A', 'B', 'C', 'D'].map((classe) => ({
    id: `${convenioId}-classe-${classe}`,
    convenioId,
    classe,
    grupo: gruposClasse[classe],
    servico12: numberValue(valueInputs[classe].servico12),
    servico8: numberValue(valueInputs[classe].servico8),
    servico6: numberValue(valueInputs[classe].servico6),
    passagem: numberValue(fields.valorPassagem),
    alimentacao: numberValue(fields.valorAlimentacao),
    decreto: '',
    inicio: '',
    fim: '',
    publicacao: '',
    status: 'Vigente'
  }));
}

function clearResponsavelFields() {
  fields.responsavelNome.value = '';
  fields.responsavelCpf.value = '';
  fields.responsavelEmail.value = '';
  fields.responsavelTelefone.value = '';
  fields.responsavelFuncao.value = '';
  fields.responsavelInicio.value = '';
  fields.responsavelFim.value = '';
  fields.responsavelObservacoes.value = '';
}

function renderResponsaveisForm() {
  if (!responsaveisState.length) {
    responsaveisFormBody.innerHTML = '<tr><td class="empty" colspan="5">Nenhum responsável adicionado.</td></tr>';
    return;
  }

  responsaveisFormBody.innerHTML = responsaveisState.map((responsavel) => `
    <tr>
      <td><strong>${escapeHtml(responsavel.nome)}</strong></td>
      <td>${escapeHtml(responsavel.cpf || '-')}</td>
      <td>${escapeHtml(responsavel.email || '-')}${responsavel.telefone ? `<br><small>${escapeHtml(responsavel.telefone)}</small>` : ''}</td>
      <td>${escapeHtml(responsavel.funcao || '-')}</td>
      <td>
        <div class="actions">
          <button type="button" data-action="edit-form-responsavel" data-id="${responsavel.id}">Editar</button>
          <button type="button" class="danger" data-action="remove-form-responsavel" data-id="${responsavel.id}">Remover</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function addResponsavelFromFields() {
  if (!fields.responsavelNome.value.trim()) {
    alert('Informe o nome do responsável antes de adicionar.');
    return;
  }

  const cpf = fields.responsavelCpf.value.trim();
  const existing = cpf
    ? responsaveisState.find((item) => item.cpf === cpf)
    : null;

  const payload = {
    id: existing?.id || makeId(),
    nome: fields.responsavelNome.value.trim(),
    cpf,
    email: fields.responsavelEmail.value.trim(),
    telefone: fields.responsavelTelefone.value.trim(),
    funcao: fields.responsavelFuncao.value.trim(),
    inicio: fields.responsavelInicio.value,
    fim: fields.responsavelFim.value,
    observacoes: fields.responsavelObservacoes.value.trim()
  };

  responsaveisState = existing
    ? responsaveisState.map((item) => item.id === existing.id ? payload : item)
    : [...responsaveisState, payload];

  clearResponsavelFields();
  renderResponsaveisForm();
}

function collectPayload() {
  const id = editingId.value || makeId();
  const valores = getValueRows(id);
  const responsaveis = responsaveisState.map((responsavel) => ({ ...responsavel, convenioId: id }));
  const enderecoDados = getEnderecoFromFields();

  return {
    id,
    nome: fields.nome.value.trim(),
    cnpj: fields.cnpj.value.trim(),
    endereco: formatEndereco(enderecoDados),
    enderecoDados,
    numero: fields.numero.value.trim(),
    diarioData: fields.diarioData.value,
    diarioPagina: fields.diarioPagina.value.trim(),
    valorContrato: numberValue(fields.valorContrato),
    inicio: fields.inicio.value,
    fim: fields.fim.value,
    classeA: 0,
    classeB: 0,
    classeC: 0,
    classeD: 0,
    valores,
    responsaveis,
    observacoes: fields.observacoes.value.trim()
  };
}

function syncRelatedStorage(convenioId, valores, responsaveis) {
  saveList(STORAGE_VALORES, [
    ...getValores().filter((item) => item.convenioId !== convenioId),
    ...valores
  ]);

  saveList(STORAGE_RESPONSAVEIS, [
    ...getResponsaveis().filter((item) => item.convenioId !== convenioId),
    ...responsaveis
  ]);
}

function resetForm() {
  form.reset();
  editingId.value = '';
  responsaveisState = [];
  renderResponsaveisForm();
  formTitle.textContent = 'Cadastrar convênio';
  submitButton.textContent = 'Salvar convênio';
}

function applyClientData(convenio) {
  fields.nome.value = convenio.nome || '';
  setEnderecoFields(convenio);
  fields.observacoes.value = convenio.observacoes || '';

  const valores = getContractValues(convenio);
  valores.forEach((valor) => {
    if (!valueInputs[valor.classe]) return;
    valueInputs[valor.classe].servico12.value = valor.servico12 ?? valor.valor ?? 0;
    valueInputs[valor.classe].servico8.value = valor.servico8 ?? valor.valor ?? 0;
    valueInputs[valor.classe].servico6.value = valor.servico6 ?? valor.valor ?? 0;
  });

  const valorBase = valores[0] || {};
  fields.valorPassagem.value = valorBase.passagem || 0;
  fields.valorAlimentacao.value = valorBase.alimentacao || 0;

  responsaveisState = getContractResponsaveis(convenio).map((responsavel) => ({ ...responsavel, id: makeId() }));
  renderResponsaveisForm();
}

function loadCnpjData() {
  const cnpj = fields.cnpj.value.trim();
  if (!cnpj) return;

  const convenio = getLatestByCnpj(cnpj, editingId.value);
  if (!convenio) {
    return;
  }

  applyClientData(convenio);
}

function fillForm(convenio) {
  resetForm();
  editingId.value = convenio.id;
  fields.nome.value = convenio.nome || '';
  fields.cnpj.value = convenio.cnpj || '';
  setEnderecoFields(convenio);
  fields.numero.value = convenio.numero || '';
  fields.diarioData.value = convenio.diarioData || '';
  fields.diarioPagina.value = convenio.diarioPagina || convenio.diario || '';
  fields.valorContrato.value = convenio.valorContrato ?? convenio.valorMensal ?? 0;
  fields.inicio.value = convenio.inicio || '';
  fields.fim.value = convenio.fim || '';
  fields.observacoes.value = convenio.observacoes || '';
  applyClientData({ ...convenio, responsaveis: getContractResponsaveis(convenio), valores: getContractValues(convenio) });
  responsaveisState = getContractResponsaveis(convenio).map((responsavel) => ({ ...responsavel }));
  renderResponsaveisForm();
  formTitle.textContent = 'Editar convênio';
  submitButton.textContent = 'Atualizar convênio';
  setActiveView('cadastro-view');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renewContract(convenio) {
  const endedContract = {
    ...convenio,
    fim: previousDate(today)
  };

  saveList(STORAGE_CONVENIOS, getConvenios().map((item) => item.id === convenio.id ? endedContract : item));

  resetForm();
  fields.nome.value = convenio.nome || '';
  fields.cnpj.value = convenio.cnpj || '';
  setEnderecoFields(convenio);
  fields.valorContrato.value = convenio.valorContrato ?? convenio.valorMensal ?? 0;
  fields.classeA && (fields.classeA.value = convenio.classeA || 0);
  fields.classeB && (fields.classeB.value = convenio.classeB || 0);
  fields.classeC && (fields.classeC.value = convenio.classeC || 0);
  fields.classeD && (fields.classeD.value = convenio.classeD || 0);
  fields.observacoes.value = convenio.observacoes || '';
  applyClientData({ ...convenio, responsaveis: getContractResponsaveis(convenio), valores: getContractValues(convenio) });

  formTitle.textContent = 'Renovar contrato';
  submitButton.textContent = 'Salvar novo contrato';
  selectedConvenioId = convenio.id;
  renderAll();
  setActiveView('cadastro-view');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateCnpjList() {
  const seen = new Set();
  cnpjList.innerHTML = getConvenios()
    .filter((item) => item.cnpj && !seen.has(item.cnpj) && seen.add(item.cnpj))
    .map((item) => `<option value="${escapeHtml(item.cnpj)}">${escapeHtml(item.nome || '')}</option>`)
    .join('');
}

function updateSummary() {
  const convenios = getConvenios();
  const ativos = convenios.filter((item) => getSituacao(item).active);
  const clientes = new Set(convenios.map((item) => item.cnpj).filter(Boolean));

  totals.convenios.textContent = convenios.length;
  totals.ativos.textContent = ativos.length;
  totals.inativos.textContent = convenios.length - ativos.length;
  totals.clientes.textContent = clientes.size;
}

function renderTableRows(target, convenios) {
  if (!convenios.length) {
    target.innerHTML = '<tr><td class="empty" colspan="7">Nenhum contrato nesta situação.</td></tr>';
    return;
  }

  target.innerHTML = convenios.map((convenio) => {
    const situacao = getSituacao(convenio);

    return `
      <tr>
        <td><strong>${escapeHtml(convenio.nome)}</strong></td>
        <td>${escapeHtml(convenio.cnpj || '-')}</td>
        <td>${escapeHtml(convenio.numero || '-')}</td>
        <td>${dinheiro.format(Number(convenio.valorContrato ?? convenio.valorMensal ?? 0))}</td>
        <td>${formatPeriod(convenio.inicio, convenio.fim)}</td>
        <td><span class="badge ${situacao.className}">${situacao.label}</span></td>
        <td>
          <div class="actions">
            <button type="button" data-action="details" data-id="${convenio.id}">Detalhes</button>
            ${situacao.active ? `<button type="button" data-action="renew" data-id="${convenio.id}">Renovar</button>` : ''}
            <button type="button" data-action="edit" data-id="${convenio.id}">Editar</button>
            <button type="button" class="danger" data-action="delete" data-id="${convenio.id}">Excluir</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderTables() {
  const convenios = getConvenios().sort((a, b) => (b.inicio || '').localeCompare(a.inicio || ''));
  const ativos = convenios.filter((item) => getSituacao(item).active);
  const inativos = convenios.filter((item) => !getSituacao(item).active);

  activeCount.textContent = ativos.length === 1 ? '1 contrato ativo.' : `${ativos.length} contratos ativos.`;
  inactiveCount.textContent = inativos.length === 1 ? '1 contrato não ativo.' : `${inativos.length} contratos não ativos.`;
  renderTableRows(ativosBody, ativos);
  renderTableRows(inativosBody, inativos);
}

function detailItem(label, value) {
  return `<div class="detail-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value || '-')}</strong></div>`;
}

function removeContract(id) {
  saveList(STORAGE_CONVENIOS, getConvenios().filter((item) => item.id !== id));
  saveList(STORAGE_VALORES, getValores().filter((item) => item.convenioId !== id));
  saveList(STORAGE_RESPONSAVEIS, getResponsaveis().filter((item) => item.convenioId !== id));

  if (selectedConvenioId === id) {
    selectedConvenioId = '';
    detailsPanel.hidden = true;
    detailsEmpty.hidden = false;
  }

  renderAll();
}

function renderDetails(id) {
  const convenio = getConvenios().find((item) => item.id === id);
  if (!convenio) return;

  selectedConvenioId = id;
  const valores = getContractValues(convenio);
  const responsaveis = getContractResponsaveis(convenio);
  const historicoContratos = getClientContracts(convenio.cnpj);
  const situacao = getSituacao(convenio);

  detailsHeading.textContent = convenio.nome || 'Detalhes do convênio';
  detailsSubtitle.textContent = `Contrato ${convenio.numero || '-'} | ${situacao.label}`;

  const valoresHtml = valores.length ? `
    <h3 class="section-title">Valores por classe</h3>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Classe</th>
            <th>Grupo</th>
            <th>12h</th>
            <th>8h</th>
            <th>6h</th>
            <th>Passagem</th>
            <th>Alimentação</th>
            <th>Vigência</th>
          </tr>
        </thead>
        <tbody>
          ${valores.map((valor) => `
            <tr>
              <td>Classe ${escapeHtml(valor.classe)}</td>
              <td>${escapeHtml(valor.grupo || gruposClasse[valor.classe])}</td>
              <td>${dinheiro.format(Number(valor.servico12 || 0))}</td>
              <td>${dinheiro.format(Number(valor.servico8 || 0))}</td>
              <td>${dinheiro.format(Number(valor.servico6 || 0))}</td>
              <td>${dinheiro.format(Number(valor.passagem || 0))}</td>
              <td>${dinheiro.format(Number(valor.alimentacao || 0))}</td>
              <td>${formatPeriod(valor.inicio, valor.fim)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  ` : '';

  const responsaveisHtml = responsaveis.length ? `
    <h3 class="section-title">Responsáveis</h3>
    <div class="table-wrap">
      <table class="compact-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>CPF</th>
            <th>Contato</th>
            <th>Função</th>
            <th>Atuação</th>
          </tr>
        </thead>
        <tbody>
          ${responsaveis.map((responsavel) => `
            <tr>
              <td><strong>${escapeHtml(responsavel.nome)}</strong></td>
              <td>${escapeHtml(responsavel.cpf || '-')}</td>
              <td>${escapeHtml(responsavel.email || '-')}${responsavel.telefone ? `<br><small>${escapeHtml(responsavel.telefone)}</small>` : ''}</td>
              <td>${escapeHtml(responsavel.funcao || '-')}</td>
              <td>${formatPeriod(responsavel.inicio, responsavel.fim)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  ` : '';

  const historicoHtml = historicoContratos.length > 1 ? `
    <h3 class="section-title">Histórico de contratos do cliente</h3>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Contrato</th>
            <th>Valor</th>
            <th>Vigência</th>
            <th>Diário Oficial</th>
            <th>Situação</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${historicoContratos.map((item) => {
            const itemSituacao = getSituacao(item);

            return `
              <tr>
                <td>${escapeHtml(item.numero || '-')}</td>
                <td>${dinheiro.format(Number(item.valorContrato ?? item.valorMensal ?? 0))}</td>
                <td>${formatPeriod(item.inicio, item.fim)}</td>
                <td>${formatDateOrDash(item.diarioData)}${item.diarioPagina ? `<br><small>Página ${escapeHtml(item.diarioPagina)}</small>` : ''}</td>
                <td><span class="badge ${itemSituacao.className}">${itemSituacao.label}</span></td>
                <td>
                  <div class="actions">
                    <button type="button" data-action="edit-history" data-id="${item.id}">Editar</button>
                    <button type="button" class="danger" data-action="delete-history" data-id="${item.id}">Apagar</button>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  ` : '';

  detailsContent.innerHTML = `
    <h3 class="section-title">Dados do convênio</h3>
    <div class="details-grid">
      ${detailItem('Nome', convenio.nome)}
      ${detailItem('CNPJ', convenio.cnpj)}
      ${detailItem('Situação pela vigência', situacao.label)}
      ${detailItem('Endereço', formatEndereco(convenio.enderecoDados, convenio.endereco))}
      ${detailItem('Nº do contrato', convenio.numero)}
      ${detailItem('Valor do contrato', dinheiro.format(Number(convenio.valorContrato ?? convenio.valorMensal ?? 0)))}
      ${detailItem('Publicação no Diário Oficial', `${formatDateOrDash(convenio.diarioData)}\nPágina ${convenio.diarioPagina || '-'}`)}
      ${detailItem('Vigência', formatPeriod(convenio.inicio, convenio.fim))}
      ${detailItem('Observações', convenio.observacoes)}
    </div>
    ${valoresHtml}
    ${responsaveisHtml}
    ${historicoHtml}
  `;

  detailsEmpty.hidden = true;
  detailsPanel.hidden = false;
  setActiveView('detalhes-view');
}

function renderAll() {
  updateCnpjList();
  renderTables();
  updateSummary();

  if (selectedConvenioId && getConvenios().some((item) => item.id === selectedConvenioId)) {
    renderDetails(selectedConvenioId);
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const payload = collectPayload();
  const convenios = getConvenios();
  const next = editingId.value
    ? convenios.map((item) => item.id === payload.id ? payload : item)
    : [...convenios, payload];

  saveList(STORAGE_CONVENIOS, next);
  syncRelatedStorage(payload.id, payload.valores, payload.responsaveis);
  selectedConvenioId = payload.id;
  resetForm();
  renderAll();
  setActiveView('tabela-view');
});

addResponsavelButton.addEventListener('click', addResponsavelFromFields);
clearResponsavelButton.addEventListener('click', clearResponsavelFields);
clearButton.addEventListener('click', resetForm);
cancelButton.addEventListener('click', resetForm);
fields.cnpj.addEventListener('change', () => {
  if (!editingId.value && getLatestByCnpj(fields.cnpj.value.trim())) {
    loadCnpjData();
  }
});

closeDetails.addEventListener('click', () => {
  detailsPanel.hidden = true;
  detailsEmpty.hidden = false;
  selectedConvenioId = '';
});

tabs.forEach((tab) => {
  tab.addEventListener('click', () => setActiveView(tab.dataset.view));
});

document.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  if (button.dataset.action === 'edit-form-responsavel') {
    const responsavel = responsaveisState.find((item) => item.id === button.dataset.id);
    if (!responsavel) return;

    fields.responsavelNome.value = responsavel.nome || '';
    fields.responsavelCpf.value = responsavel.cpf || '';
    fields.responsavelEmail.value = responsavel.email || '';
    fields.responsavelTelefone.value = responsavel.telefone || '';
    fields.responsavelFuncao.value = responsavel.funcao || '';
    fields.responsavelInicio.value = responsavel.inicio || '';
    fields.responsavelFim.value = responsavel.fim || '';
    fields.responsavelObservacoes.value = responsavel.observacoes || '';
    responsaveisState = responsaveisState.filter((item) => item.id !== responsavel.id);
    renderResponsaveisForm();
    return;
  }

  if (button.dataset.action === 'remove-form-responsavel') {
    responsaveisState = responsaveisState.filter((item) => item.id !== button.dataset.id);
    renderResponsaveisForm();
    return;
  }

  const convenio = getConvenios().find((item) => item.id === button.dataset.id);
  if (!convenio) return;

  if (button.dataset.action === 'details') renderDetails(convenio.id);
  if (button.dataset.action === 'renew') renewContract(convenio);
  if (button.dataset.action === 'edit' || button.dataset.action === 'edit-history') fillForm(convenio);
  if ((button.dataset.action === 'delete' || button.dataset.action === 'delete-history') && confirm('Excluir este contrato e seus dados vinculados?')) {
    removeContract(convenio.id);
  }
});

renderResponsaveisForm();
renderAll();
