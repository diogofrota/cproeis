const GSI_COURSE_TYPES_STORAGE = 'cproeis_gsi_tipos_curso_capacitacao';

const GSI_DEFAULT_COURSE_TYPES = [
  { id: 'tipo-curso-01', nome: 'Patrulha Escolar', codigo: 'PATRULHA_ESCOLAR', status: 'Ativo', observacoes: 'Curso base para atuação em ambiente escolar.' },
  { id: 'tipo-curso-02', nome: 'Maria da Penha', codigo: 'MARIA_DA_PENHA', status: 'Ativo', observacoes: 'Curso para atuação em proteção à mulher.' },
  { id: 'tipo-curso-03', nome: '60+', codigo: '60_MAIS', status: 'Ativo', observacoes: 'Curso voltado à proteção e atendimento de idosos.' },
  { id: 'tipo-curso-04', nome: 'Fiscalização do TRE', codigo: 'FISCALIZACAO_TRE', status: 'Ativo', observacoes: 'Curso para operações eleitorais e apoio ao TRE.' }
];

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Carrega uma lista JSON do LocalStorage com retorno seguro.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} key - Chave persistida no navegador.
 * @returns {Array<object>} Lista de registros ou array vazio.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê LocalStorage e não grava dados.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, substituir por consulta paginada à API administrativa do GSI.
 */
function gsiCourseLoadList(key) {
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
 * @param {string} key - Chave persistida no navegador.
 * @param {Array<object>} value - Lista de registros.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Grava LocalStorage na chave informada.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, persistir em banco com auditoria de usuário, data e alteração feita.
 */
function gsiCourseSaveList(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Cria os tipos de curso iniciais quando a base local ainda está vazia.
 *
 * PARÂMETROS E RETORNO:
 * @returns {Array<object>} Lista atual de tipos de curso.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê e, se necessário, grava `cproeis_gsi_tipos_curso_capacitacao` no LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, remover seed local e manter dados oficiais via painel administrativo.
 */
function gsiEnsureDefaultCourseTypes() {
  const existing = gsiCourseLoadList(GSI_COURSE_TYPES_STORAGE);
  if (existing.length) return existing;
  gsiCourseSaveList(GSI_COURSE_TYPES_STORAGE, GSI_DEFAULT_COURSE_TYPES);
  return GSI_DEFAULT_COURSE_TYPES;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Gera identificador local para um novo tipo de curso.
 *
 * PARÂMETROS E RETORNO:
 * @returns {string} Identificador local único o suficiente para o protótipo.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa armazenamento; o ID retornado é salvo posteriormente na lista de cursos.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, trocar por ID gerado pelo banco de dados.
 */
function gsiCourseCreateId() {
  return `tipo-curso-${Date.now()}`;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Renderiza a tabela de tipos oficiais de curso do GSI.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê `cproeis_gsi_tipos_curso_capacitacao` e escreve somente no DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, adicionar paginação, edição controlada e bloqueio de exclusão quando houver vínculo.
 */
function gsiRenderCourseTypes() {
  const body = document.getElementById('course-type-body');
  const count = document.getElementById('course-type-count');
  if (!body) return;

  const types = gsiEnsureDefaultCourseTypes();
  body.innerHTML = '';
  count.textContent = `${types.length} tipo(s) cadastrado(s).`;

  types.forEach((type) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${type.nome || '-'}</td>
      <td>${type.codigo || '-'}</td>
      <td><span class="badge">${type.status || 'Ativo'}</span></td>
      <td>${type.observacoes || '-'}</td>
    `;
    body.appendChild(row);
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Captura o formulário do GSI e adiciona um novo tipo de curso à lista oficial.
 *
 * PARÂMETROS E RETORNO:
 * @param {SubmitEvent} event - Evento de envio do formulário.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê campos do DOM e grava `cproeis_gsi_tipos_curso_capacitacao` no LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, validar duplicidade no backend e registrar auditoria da inclusão.
 */
function gsiHandleCourseTypeSubmit(event) {
  event.preventDefault();

  const name = document.getElementById('course-type-name').value.trim();
  const codeInput = document.getElementById('course-type-code').value.trim();
  const status = document.getElementById('course-type-status').value;
  const notes = document.getElementById('course-type-notes').value.trim();
  const feedback = document.getElementById('course-type-feedback');

  const types = gsiEnsureDefaultCourseTypes();
  const code = codeInput || name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');
  const duplicate = types.some((type) => type.nome.toLowerCase() === name.toLowerCase() || type.codigo === code);
  if (duplicate) {
    feedback.textContent = 'Este tipo de curso já existe na lista do GSI.';
    return;
  }

  types.push({ id: gsiCourseCreateId(), nome: name, codigo: code, status, observacoes: notes });
  gsiCourseSaveList(GSI_COURSE_TYPES_STORAGE, types);
  event.target.reset();
  feedback.textContent = 'Tipo de curso salvo para uso dos convênios e policiais.';
  gsiRenderCourseTypes();
}

document.getElementById('course-type-form')?.addEventListener('submit', gsiHandleCourseTypeSubmit);
gsiRenderCourseTypes();
