const ENROLL_COURSE_CONVENIOS = 'cproeis_contratos_convenios';
const ENROLL_COURSE_CURRENT = 'cproeis_convenio_atual';
const ENROLL_COURSE_COURSES = 'cproeis_convenios_cursos_capacitacao';
const ENROLL_COURSE_ENROLLMENTS = 'cproeis_policiais_cursos_inscricoes';
const ENROLL_COURSE_POLICE = 'cproeis_cadastro_policiais';

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Lê uma lista JSON do LocalStorage com retorno seguro para array vazio.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} key - Chave do LocalStorage consultada.
 * @returns {Array<object>} Lista persistida ou array vazio.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê LocalStorage; não grava dados.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, substituir por consulta autenticada à API de cursos.
 */
function enrollCourseLoadList(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (error) {
    return [];
  }
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Escapa texto antes de inserir na tabela de inscritos.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} value - Valor exibido.
 * @returns {string} Texto seguro para HTML.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não lê nem grava dados; apenas transforma o valor recebido.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Manter sanitização mesmo com dados vindos de API para defesa em profundidade.
 */
function enrollCourseEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Formata data ISO simples ou timestamp para DD/MM/YYYY.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} value - Data em YYYY-MM-DD ou ISO completo.
 * @returns {string} Data formatada ou hífen.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa armazenamento; transforma apenas o argumento.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Centralizar formatação de datas em helper compartilhado.
 */
function enrollCourseFormatDate(value) {
  if (!value) return '-';
  const date = String(value).slice(0, 10);
  const [year, month, day] = date.split('-');
  return year && month && day ? `${day}/${month}/${year}` : '-';
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Resolve o convênio ativo pela URL ou pela sessão local.
 *
 * PARÂMETROS E RETORNO:
 * @returns {object|null} Convênio ativo ou null.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê URL, `cproeis_convenio_atual` e `cproeis_contratos_convenios`; grava o convênio atual quando há ID válido na URL.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Resolver o convênio por token de sessão do responsável em produção.
 */
function enrollCourseGetConvenio() {
  const params = new URLSearchParams(window.location.search);
  const urlId = params.get('id') || '';
  const convenioId = urlId || localStorage.getItem(ENROLL_COURSE_CURRENT) || '';
  const convenio = enrollCourseLoadList(ENROLL_COURSE_CONVENIOS).find((item) => item.id === convenioId) || null;

  if (convenio && urlId) {
    localStorage.setItem(ENROLL_COURSE_CURRENT, convenio.id);
  }

  return convenio;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Lista cursos de capacitação criados pelo convênio ativo.
 *
 * PARÂMETROS E RETORNO:
 * @param {object|null} convenio - Convênio ativo usado como filtro.
 * @returns {Array<object>} Cursos vinculados ao convênio.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê `cproeis_convenios_cursos_capacitacao` no LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Buscar cursos por endpoint com filtros de situação e período.
 */
function enrollCourseGetCourses(convenio) {
  return enrollCourseLoadList(ENROLL_COURSE_COURSES)
    .filter((course) => !convenio || course.convenioId === convenio.id)
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Preenche o select de cursos disponíveis para consulta de inscritos.
 *
 * PARÂMETROS E RETORNO:
 * @param {Array<object>} courses - Cursos do convênio.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; escreve somente opções no DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Permitir busca por nome/turma quando o volume de cursos crescer.
 */
function enrollCourseHydrateSelect(courses) {
  const select = document.getElementById('enrollment-course-select');
  if (!select) return;

  select.innerHTML = courses.length ? '' : '<option value="">Nenhum curso criado</option>';
  courses.forEach((course) => {
    const option = document.createElement('option');
    option.value = course.id;
    option.textContent = `${course.tipoNome || '-'} - ${course.titulo || '-'}`;
    select.appendChild(option);
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Renderiza policiais inscritos no curso selecionado.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê inscrições em `cproeis_policiais_cursos_inscricoes` e policiais em `cproeis_cadastro_policiais`; escreve a tabela no DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, retornar inscritos já unidos com dados funcionais em consulta paginada.
 */
function enrollCourseRenderTable() {
  const body = document.getElementById('enrollment-course-body');
  const count = document.getElementById('enrollment-course-count');
  const courseId = document.getElementById('enrollment-course-select')?.value || '';
  if (!body) return;

  if (!courseId) {
    body.innerHTML = '<tr><td class="empty" colspan="5">Nenhum curso selecionado.</td></tr>';
    if (count) count.textContent = 'Selecione uma capacitação para consultar os inscritos.';
    return;
  }

  const police = enrollCourseLoadList(ENROLL_COURSE_POLICE);
  const enrollments = enrollCourseLoadList(ENROLL_COURSE_ENROLLMENTS)
    .filter((item) => item.courseId === courseId)
    .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));

  if (count) count.textContent = enrollments.length
    ? `${enrollments.length} policial(is) inscrito(s) neste curso.`
    : 'Nenhum policial inscrito neste curso.';

  if (!enrollments.length) {
    body.innerHTML = '<tr><td class="empty" colspan="5">Nenhum policial inscrito neste curso.</td></tr>';
    return;
  }

  body.innerHTML = enrollments.map((enrollment) => {
    const policial = police.find((item) => item.id === enrollment.policialId) || {};
    return `
      <tr>
        <td>${enrollCourseEscape(policial.nomeCompleto || policial.nomeGuerra || enrollment.policialId || '-')}</td>
        <td>${enrollCourseEscape(policial.postoGraduacao || '-')}</td>
        <td>${enrollCourseEscape(policial.unidade || '-')}</td>
        <td>${enrollCourseFormatDate(enrollment.createdAt)}</td>
        <td><span class="badge">${enrollCourseEscape(enrollment.status || 'Inscrito')}</span></td>
      </tr>
    `;
  }).join('');
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Inicializa a consulta de inscritos por curso do convênio.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê convênio, cursos, inscrições e policiais no LocalStorage; não grava dados.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Adicionar exportação oficial e controle de presença quando houver backend.
 */
function enrollCourseInit() {
  const convenio = enrollCourseGetConvenio();
  const courses = enrollCourseGetCourses(convenio);
  enrollCourseHydrateSelect(courses);
  enrollCourseRenderTable();

  document.getElementById('enrollment-course-select')?.addEventListener('change', enrollCourseRenderTable);
}

enrollCourseInit();
