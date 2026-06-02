const POLICIAL_COURSES_STORAGE = 'cproeis_convenios_cursos_capacitacao';
const POLICIAL_COURSES_ENROLLMENTS_STORAGE = 'cproeis_policiais_cursos_inscricoes';
const POLICIAL_COURSES_BULLETINS_STORAGE = 'cproeis_policiais_cursos_boletins';
const POLICIAL_LICENSE_STORAGE = 'cproeis_policiais_habilitacoes';
const POLICIAL_CURRENT_STORAGE = 'cproeis_acesso_policial_atual';

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Lê uma lista JSON do LocalStorage para montar as tabelas de cursos do policial.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} key - Chave local consultada.
 * @returns {Array<object>} Lista persistida ou array vazio.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê LocalStorage; não grava dados.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, buscar estas tabelas por API autenticada e paginada.
 */
function policialCourseLoadList(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (error) {
    return [];
  }
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Resolve o ID do policial ativo por sessão local ou URL.
 *
 * PARÂMETROS E RETORNO:
 * @returns {string} ID do policial ativo ou string vazia.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê `cproeis_acesso_policial_atual` e o parâmetro `id` da URL; não grava dados.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, usar identidade autenticada do policial, sem query string editável.
 */
function policialCourseGetPolicialId() {
  return localStorage.getItem(POLICIAL_CURRENT_STORAGE) || new URLSearchParams(window.location.search).get('id') || '';
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Formata data ISO simples para exibição nas tabelas.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} value - Data em YYYY-MM-DD ou ISO completo.
 * @returns {string} Data em DD/MM/YYYY ou hífen.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa armazenamento; transforma apenas o valor recebido.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Centralizar formatação em utilitário comum do sistema.
 */
function policialCourseFormatDate(value) {
  if (!value) return '-';
  const date = value.includes('T') ? value.slice(0, 10) : value;
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Calcula a situação operacional da CNH registrada.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} license - Registro de habilitação vinculado ao policial.
 * @returns {string} Situação textual da habilitação.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não lê nem grava dados; usa apenas o objeto recebido em memória.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, validar categoria, vencimento e autenticidade documental em serviço próprio.
 */
function policialCourseLicenseStatus(license) {
  if (!license?.categoria?.includes('A')) return 'Sem categoria A';
  if (!license?.vencimento) return 'Pendente';
  return new Date(`${license.vencimento}T23:59:59`) >= new Date() ? 'Válida para moto' : 'Vencida';
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Renderiza a tabela de cursos em que o policial está inscrito.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} policialId - ID do policial ativo.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê `cproeis_policiais_cursos_inscricoes` e `cproeis_convenios_cursos_capacitacao`;
 * escreve somente no DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, substituir cruzamento local por consulta de inscrições do policial no backend.
 */
function policialCourseRenderEnrollments(policialId) {
  const body = document.getElementById('enrollment-body');
  const count = document.getElementById('enrollment-count');
  if (!body) return;

  const courses = policialCourseLoadList(POLICIAL_COURSES_STORAGE);
  const enrollments = policialCourseLoadList(POLICIAL_COURSES_ENROLLMENTS_STORAGE)
    .filter((item) => item.policialId === policialId);

  body.innerHTML = '';
  count.textContent = enrollments.length ? `${enrollments.length} curso(s) inscrito(s).` : 'Nenhum curso inscrito.';

  if (!enrollments.length) {
    body.innerHTML = '<tr><td class="empty" colspan="5">Nenhuma inscrição em curso de capacitação.</td></tr>';
    return;
  }

  enrollments.forEach((enrollment) => {
    const course = courses.find((item) => item.id === enrollment.courseId) || {};
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${course.tipoNome || '-'}</strong><span class="status-note">${course.titulo || '-'}</span></td>
      <td>${course.convenioNome || '-'}</td>
      <td>${policialCourseFormatDate(course.inicio)} até ${policialCourseFormatDate(course.fim)}</td>
      <td>${course.cargaHoraria ? `${course.cargaHoraria}h` : '-'}</td>
      <td><span class="badge">${enrollment.status || 'Inscrito'}</span></td>
    `;
    body.appendChild(row);
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Renderiza cursos enviados pelo policial para validação por BOL PM.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} policialId - ID do policial ativo.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê `cproeis_policiais_cursos_boletins` e escreve somente no DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, exibir retorno da conferência automática do boletim e decisão do auditor.
 */
function policialCourseRenderBulletins(policialId) {
  const body = document.getElementById('bulletin-course-body');
  const count = document.getElementById('bulletin-course-count');
  if (!body) return;

  const bulletins = policialCourseLoadList(POLICIAL_COURSES_BULLETINS_STORAGE)
    .filter((item) => item.policialId === policialId);

  body.innerHTML = '';
  count.textContent = bulletins.length ? `${bulletins.length} publicação(ões) enviada(s).` : 'Nenhuma publicação enviada.';

  if (!bulletins.length) {
    body.innerHTML = '<tr><td class="empty" colspan="5">Nenhum curso informado por publicação em boletim.</td></tr>';
    return;
  }

  bulletins.forEach((item) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.tipoNome || '-'}</td>
      <td>${item.bolNumero || '-'}</td>
      <td>${policialCourseFormatDate(item.bolData)}</td>
      <td>${item.pagina || '-'}</td>
      <td><span class="badge">${item.status || 'Aguardando verificação'}</span></td>
    `;
    body.appendChild(row);
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Renderiza as habilitações de moto cadastradas pelo policial.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} policialId - ID do policial ativo.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê `cproeis_policiais_habilitacoes` e escreve somente no DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, buscar CNH validada em tabela própria com anexos protegidos.
 */
function policialCourseRenderLicenses(policialId) {
  const body = document.getElementById('license-course-body');
  const count = document.getElementById('license-course-count');
  if (!body) return;

  const licenses = policialCourseLoadList(POLICIAL_LICENSE_STORAGE)
    .filter((item) => item.policialId === policialId);

  body.innerHTML = '';
  count.textContent = licenses.length ? `${licenses.length} habilitação(ões) cadastrada(s).` : 'Nenhuma habilitação cadastrada.';

  if (!licenses.length) {
    body.innerHTML = '<tr><td class="empty" colspan="5">Nenhuma habilitação de moto cadastrada.</td></tr>';
    return;
  }

  licenses.forEach((license) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${license.numero || '-'}</td>
      <td>${license.categoria || '-'}</td>
      <td>${policialCourseFormatDate(license.vencimento)}</td>
      <td><span class="badge">${policialCourseLicenseStatus(license)}</span></td>
      <td>${license.origem || '-'}</td>
    `;
    body.appendChild(row);
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Inicializa todas as tabelas de cursos e habilitação da página.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê o policial ativo e as tabelas locais relacionadas; não grava dados.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, carregar todos os blocos por endpoint único do perfil operacional do policial.
 */
function policialCourseInit() {
  const policialId = policialCourseGetPolicialId();
  const summary = document.getElementById('course-summary');
  if (!policialId) {
    if (summary) summary.textContent = 'Selecione um policial antes de consultar cursos.';
    return;
  }

  policialCourseRenderEnrollments(policialId);
  policialCourseRenderBulletins(policialId);
  policialCourseRenderLicenses(policialId);
  if (summary) summary.textContent = 'Consulta carregada a partir das tabelas locais do policial.';
}

policialCourseInit();
