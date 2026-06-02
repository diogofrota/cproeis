const BULLETIN_TYPES_STORAGE = 'cproeis_gsi_tipos_curso_capacitacao';
const BULLETIN_REQUESTS_STORAGE = 'cproeis_policiais_cursos_boletins';
const BULLETIN_CURRENT_POLICIAL = 'cproeis_acesso_policial_atual';

const BULLETIN_DEFAULT_TYPES = [
  { id: 'tipo-curso-01', nome: 'Patrulha Escolar', status: 'Ativo' },
  { id: 'tipo-curso-02', nome: 'Maria da Penha', status: 'Ativo' },
  { id: 'tipo-curso-03', nome: '60+', status: 'Ativo' },
  { id: 'tipo-curso-04', nome: 'Fiscalização do TRE', status: 'Ativo' }
];

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Lê uma lista JSON do LocalStorage com fallback seguro.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} key - Chave local consultada.
 * @returns {Array<object>} Lista persistida ou array vazio.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê LocalStorage; não grava dados.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, consultar tipos e solicitações por API autenticada.
 */
function bulletinLoadList(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (error) {
    return [];
  }
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Grava uma lista JSON no LocalStorage.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} key - Chave de destino.
 * @param {Array<object>} value - Lista a ser persistida.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Grava LocalStorage na chave informada.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, gravar solicitações com workflow de análise e trilha de auditoria.
 */
function bulletinSaveList(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Garante lista mínima de tipos de curso para seleção no envio de boletim.
 *
 * PARÂMETROS E RETORNO:
 * @returns {Array<object>} Tipos oficiais ativos ou exemplos iniciais.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê e pode gravar `cproeis_gsi_tipos_curso_capacitacao` no LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, remover seed e exigir cadastro oficial do GSI.
 */
function bulletinEnsureTypes() {
  const existing = bulletinLoadList(BULLETIN_TYPES_STORAGE);
  if (existing.length) return existing;
  bulletinSaveList(BULLETIN_TYPES_STORAGE, BULLETIN_DEFAULT_TYPES);
  return BULLETIN_DEFAULT_TYPES;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Resolve ID do policial ativo.
 *
 * PARÂMETROS E RETORNO:
 * @returns {string} ID do policial ativo ou string vazia.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê URL e `cproeis_acesso_policial_atual`; não grava dados.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, usar identidade autenticada em vez de query string.
 */
function bulletinGetPolicialId() {
  return new URLSearchParams(window.location.search).get('id') || localStorage.getItem(BULLETIN_CURRENT_POLICIAL) || '';
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Formata data ISO simples.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} value - Data em YYYY-MM-DD.
 * @returns {string} Data DD/MM/YYYY ou hífen.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa armazenamento; transforma somente string recebida.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Centralizar utilitário de datas do sistema.
 */
function bulletinFormatDate(value) {
  if (!value) return '-';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Preenche o select com tipos de curso criados pelo GSI.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê `cproeis_gsi_tipos_curso_capacitacao`; escreve opções no DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, consultar somente cursos vigentes e aceitos para publicação em boletim.
 */
function bulletinHydrateTypes() {
  const select = document.getElementById('bulletin-course-type');
  if (!select) return;

  select.innerHTML = '<option value="">Selecione</option>';
  bulletinEnsureTypes()
    .filter((type) => (type.status || 'Ativo') === 'Ativo')
    .forEach((type) => {
      const option = document.createElement('option');
      option.value = type.id;
      option.textContent = type.nome;
      select.appendChild(option);
    });
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Renderiza solicitações de validação enviadas pelo policial.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê `cproeis_policiais_cursos_boletins` e escreve a tabela no DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, mostrar retorno da análise automática e do auditor responsável.
 */
function bulletinRenderRequests() {
  const body = document.getElementById('bulletin-body');
  const count = document.getElementById('bulletin-count');
  if (!body) return;

  const policialId = bulletinGetPolicialId();
  const requests = bulletinLoadList(BULLETIN_REQUESTS_STORAGE).filter((item) => item.policialId === policialId);
  body.innerHTML = '';
  count.textContent = requests.length ? `${requests.length} solicitação(ões) enviada(s).` : 'Nenhuma solicitação enviada.';

  if (!requests.length) {
    body.innerHTML = '<tr><td class="empty" colspan="5">Envie uma publicação para iniciar a verificação.</td></tr>';
    return;
  }

  requests.slice().reverse().forEach((request) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${request.tipoNome || '-'}</td>
      <td>${request.bolNumero || '-'}</td>
      <td>${bulletinFormatDate(request.bolData)}</td>
      <td>${request.pagina || '-'}</td>
      <td><span class="badge">${request.status || 'Aguardando verificação'}</span></td>
    `;
    body.appendChild(row);
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Salva uma solicitação de validação de curso por BOL PM.
 *
 * PARÂMETROS E RETORNO:
 * @param {SubmitEvent} event - Evento de envio do formulário.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê campos do DOM e grava `cproeis_policiais_cursos_boletins` no LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, validar existência do BOL, página, nome do policial e curso por processamento automatizado.
 */
function bulletinHandleSubmit(event) {
  event.preventDefault();

  const policialId = bulletinGetPolicialId();
  const feedback = document.getElementById('bulletin-feedback');
  if (!policialId) {
    feedback.textContent = 'Selecione um policial antes de enviar publicação.';
    return;
  }

  const select = document.getElementById('bulletin-course-type');
  const type = bulletinEnsureTypes().find((item) => item.id === select.value);
  const requests = bulletinLoadList(BULLETIN_REQUESTS_STORAGE);
  requests.push({
    id: `boletim-curso-${Date.now()}`,
    policialId,
    tipoId: type?.id || select.value,
    tipoNome: type?.nome || select.selectedOptions[0]?.textContent || '',
    bolNumero: document.getElementById('bulletin-number').value.trim(),
    bolData: document.getElementById('bulletin-date').value,
    pagina: document.getElementById('bulletin-page').value.trim(),
    observacoes: document.getElementById('bulletin-notes').value.trim(),
    status: 'Aguardando verificação',
    createdAt: new Date().toISOString()
  });

  bulletinSaveList(BULLETIN_REQUESTS_STORAGE, requests);
  event.target.reset();
  feedback.textContent = 'Publicação enviada para verificação local demonstrativa.';
  bulletinHydrateTypes();
  bulletinRenderRequests();
}

bulletinHydrateTypes();
bulletinRenderRequests();
document.getElementById('bulletin-form')?.addEventListener('submit', bulletinHandleSubmit);
