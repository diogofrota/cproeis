const LICENSE_STORAGE = 'cproeis_policiais_habilitacoes';
const LICENSE_CURRENT_POLICIAL = 'cproeis_acesso_policial_atual';

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Lê uma lista JSON do LocalStorage com fallback seguro.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} key - Chave consultada.
 * @returns {Array<object>} Lista persistida ou array vazio.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê LocalStorage e não grava dados.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, substituir por API autenticada e escopada ao policial logado.
 */
function licenseLoadList(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (error) {
    return [];
  }
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Grava uma lista no LocalStorage em JSON.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} key - Chave de destino.
 * @param {Array<object>} value - Lista que será gravada.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Grava LocalStorage na chave recebida.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, persistir em tabela de habilitações com auditoria e validação documental.
 */
function licenseSaveList(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Resolve o ID do policial ativo por URL ou sessão local.
 *
 * PARÂMETROS E RETORNO:
 * @returns {string} ID do policial ativo ou string vazia.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê URL e `cproeis_acesso_policial_atual`; não grava dados.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, usar identidade autenticada do servidor.
 */
function licenseGetPolicialId() {
  return new URLSearchParams(window.location.search).get('id') || localStorage.getItem(LICENSE_CURRENT_POLICIAL) || '';
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Formata data ISO simples para DD/MM/YYYY.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} value - Data em YYYY-MM-DD.
 * @returns {string} Data formatada ou hífen.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa armazenamento; apenas transforma string.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Centralizar formatação de datas em utilitário compartilhado.
 */
function licenseFormatDate(value) {
  if (!value) return '-';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Define a situação da habilitação conforme categoria e vencimento.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} license - Registro de habilitação.
 * @returns {string} Situação textual para exibição.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não lê nem grava dados; calcula em memória.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, validar categoria e vencimento contra regras oficiais e bloqueios administrativos.
 */
function licenseGetStatus(license) {
  if (!license?.categoria?.includes('A')) return 'Sem categoria A';
  if (!license?.vencimento) return 'Pendente';
  return new Date(`${license.vencimento}T23:59:59`) >= new Date() ? 'Válida para moto' : 'Vencida';
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Renderiza a habilitação vinculada ao policial ativo.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê `cproeis_policiais_habilitacoes` e escreve a tabela no DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, carregar somente registros autorizados por usuário autenticado.
 */
function licenseRenderTable() {
  const body = document.getElementById('license-body');
  const count = document.getElementById('license-count');
  if (!body) return;

  const policialId = licenseGetPolicialId();
  const licenses = licenseLoadList(LICENSE_STORAGE).filter((item) => item.policialId === policialId);
  body.innerHTML = '';
  count.textContent = licenses.length ? `${licenses.length} registro(s) de habilitação.` : 'Nenhuma habilitação cadastrada.';

  if (!licenses.length) {
    body.innerHTML = '<tr><td class="empty" colspan="5">Informe a CNH ou use a leitura por IA demonstrativa.</td></tr>';
    return;
  }

  licenses.slice().reverse().forEach((license) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${license.numero || '-'}</td>
      <td>${license.categoria || '-'}</td>
      <td>${licenseFormatDate(license.vencimento)}</td>
      <td><span class="badge">${licenseGetStatus(license)}</span></td>
      <td>${license.origem || '-'}</td>
    `;
    body.appendChild(row);
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Preenche o formulário com dados fictícios simulando leitura automática por IA.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; escreve apenas nos campos do DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Substituir este preenchimento por leitura OCR/IA do arquivo enviado, com revisão do usuário.
 */
function licenseFillAiDemo() {
  document.getElementById('license-number').value = '01234567890';
  document.getElementById('license-category').value = 'AB';
  document.getElementById('license-expiration').value = '2029-12-31';
  document.getElementById('license-feedback').textContent = 'Demonstração: dados extraídos automaticamente para revisão antes de salvar.';
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Salva os dados da habilitação do policial ativo.
 *
 * PARÂMETROS E RETORNO:
 * @param {SubmitEvent} event - Evento de envio do formulário.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê campos do DOM e grava `cproeis_policiais_habilitacoes` no LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, anexar documento em storage seguro, validar autenticidade e proteger dados sensíveis.
 */
function licenseHandleSubmit(event) {
  event.preventDefault();

  const policialId = licenseGetPolicialId();
  const feedback = document.getElementById('license-feedback');
  if (!policialId) {
    feedback.textContent = 'Selecione um policial antes de salvar habilitação.';
    return;
  }

  const licenses = licenseLoadList(LICENSE_STORAGE);
  licenses.push({
    id: `habilitacao-${Date.now()}`,
    policialId,
    numero: document.getElementById('license-number').value.trim(),
    categoria: document.getElementById('license-category').value,
    vencimento: document.getElementById('license-expiration').value,
    origem: document.getElementById('license-file').files.length ? 'Documento enviado' : 'Preenchimento manual/demo',
    status: 'Aguardando validação',
    updatedAt: new Date().toISOString()
  });

  licenseSaveList(LICENSE_STORAGE, licenses);
  event.target.reset();
  feedback.textContent = 'Habilitação salva na base local do policial.';
  licenseRenderTable();
}

document.getElementById('license-ai-demo')?.addEventListener('click', licenseFillAiDemo);
document.getElementById('license-form')?.addEventListener('submit', licenseHandleSubmit);
licenseRenderTable();
