const AVAILABLE_COURSES_STORAGE = 'cproeis_convenios_cursos_capacitacao';
const AVAILABLE_ENROLLMENTS_STORAGE = 'cproeis_policiais_cursos_inscricoes';
const AVAILABLE_POLICE_STORAGE = 'cproeis_cadastro_policiais';
const AVAILABLE_CURRENT_POLICIAL = 'cproeis_acesso_policial_atual';
const AVAILABLE_CLASS_BY_RANK = {
  'Coronel': 'A',
  'Tenente-Coronel': 'A',
  'Major': 'A',
  'Capitão': 'B',
  '1º Tenente': 'B',
  '2º Tenente': 'B',
  'Aspirante': 'B',
  'Subtenente': 'C',
  '1º Sargento': 'C',
  '2º Sargento': 'C',
  '3º Sargento': 'C',
  'Cabo': 'D',
  'Soldado': 'D'
};
const AVAILABLE_TODAY = new Date().toISOString().slice(0, 10);

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Lê lista JSON do LocalStorage com fallback para array vazio.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} key - Chave consultada no navegador.
 * @returns {Array<object>} Lista persistida ou vazia.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê LocalStorage; não grava dados.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, carregar cursos e inscrições por API autenticada.
 */
function availableLoadList(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (error) {
    return [];
  }
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Grava lista JSON no LocalStorage.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} key - Chave de destino.
 * @param {Array<object>} value - Lista a ser persistida.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Grava LocalStorage na chave recebida.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, inscrever por endpoint transacional com bloqueio de concorrência.
 */
function availableSaveList(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Resolve o policial ativo para inscrição em cursos.
 *
 * PARÂMETROS E RETORNO:
 * @returns {string} ID do policial ativo.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê URL e `cproeis_acesso_policial_atual`; não grava dados.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, usar sessão autenticada e não permitir troca de ID por query string.
 */
function availableGetPolicialId() {
  return new URLSearchParams(window.location.search).get('id') || localStorage.getItem(AVAILABLE_CURRENT_POLICIAL) || '';
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Resolve o cadastro completo do policial ativo para aplicar filtros de elegibilidade.
 *
 * PARÂMETROS E RETORNO:
 * @returns {object|null} Policial ativo encontrado no cadastro local.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê `cproeis_cadastro_policiais` e a sessão local do policial; não grava dados.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, recuperar posto/graduação pela sessão autenticada e não por LocalStorage.
 */
function availableGetPolicial() {
  const policialId = availableGetPolicialId();
  return availableLoadList(AVAILABLE_POLICE_STORAGE).find((item) => item.id === policialId) || null;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Confere se a turma aberta atende a classe ou posto/graduação do policial.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} course - Turma criada pelo convênio com regra de público-alvo.
 * @param {object|null} policial - Cadastro do policial logado.
 * @returns {boolean} Verdadeiro quando a turma pode ser exibida ao policial.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; usa objetos já carregados das tabelas locais.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, repetir esta validação no backend antes de listar e antes de gravar inscrição.
 */
function availableIsCourseEligible(course, policial) {
  const mode = course.targetMode || 'todos';
  if (mode === 'todos') return true;
  if (!policial) return false;

  const rank = policial.postoGraduacao || '';
  const classKey = AVAILABLE_CLASS_BY_RANK[rank] || '';

  if (mode === 'classe') {
    return !course.targetClasses?.length || course.targetClasses.includes(classKey);
  }

  if (mode === 'posto') {
    return !course.targetPostos?.length || course.targetPostos.includes(rank);
  }

  return true;
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
 * Não acessa armazenamento; transforma string em memória.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Centralizar formatação em utilitário compartilhado.
 */
function availableFormatDate(value) {
  if (!value) return '-';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Verifica se a data atual está dentro do prazo de inscrição da capacitação.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} course - Turma com inscricaoInicio e inscricaoFim em YYYY-MM-DD.
 * @returns {boolean} Verdadeiro quando o policial pode solicitar inscrição.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; compara datas do curso carregado do LocalStorage com a data local atual.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, usar data/hora do servidor para evitar manipulação do relógio do navegador.
 */
function availableIsInsideEnrollmentPeriod(course) {
  const start = course?.inscricaoInicio || '';
  const end = course?.inscricaoFim || '';
  if (start && AVAILABLE_TODAY < start) return false;
  if (end && AVAILABLE_TODAY > end) return false;
  return true;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Renderiza cursos disponíveis e ações de inscrição do policial.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê `cproeis_convenios_cursos_capacitacao` e `cproeis_policiais_cursos_inscricoes`;
 * escreve tabela no DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, filtrar por elegibilidade, curso obrigatório e disponibilidade real de vagas no backend.
 */
function availableRenderCourses() {
  const body = document.getElementById('available-course-body');
  const count = document.getElementById('available-course-count');
  if (!body) return;

  const policialId = availableGetPolicialId();
  const policial = availableGetPolicial();
  const enrollments = availableLoadList(AVAILABLE_ENROLLMENTS_STORAGE);
  const courses = availableLoadList(AVAILABLE_COURSES_STORAGE)
    .filter((course) => (course.status || 'Aberto') === 'Aberto')
    .filter((course) => availableIsCourseEligible(course, policial));

  body.innerHTML = '';
  count.textContent = courses.length ? `${courses.length} curso(s) aberto(s) para inscrição.` : 'Nenhum curso disponível.';

  if (!courses.length) {
    body.innerHTML = '<tr><td class="empty" colspan="7">Aguarde o convênio criar cursos de capacitação.</td></tr>';
    return;
  }

  courses.forEach((course) => {
    const enrolledCount = enrollments.filter((item) => item.courseId === course.id).length;
    const alreadyEnrolled = enrollments.some((item) => item.courseId === course.id && item.policialId === policialId);
    const insideEnrollmentPeriod = availableIsInsideEnrollmentPeriod(course);
    const availableSlots = Math.max(Number(course.vagas || 0) - enrolledCount, 0);
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${course.tipoNome || '-'}</strong><span class="status-note">${course.titulo || '-'}</span></td>
      <td>${course.convenioNome || '-'}</td>
      <td>${availableFormatDate(course.inscricaoInicio)} até ${availableFormatDate(course.inscricaoFim)}</td>
      <td>${availableFormatDate(course.inicio)} até ${availableFormatDate(course.fim)}</td>
      <td>${availableSlots} de ${course.vagas || 0}</td>
      <td><span class="badge">${alreadyEnrolled ? 'Inscrito' : insideEnrollmentPeriod ? 'Aberto' : 'Fora do prazo'}</span></td>
      <td class="actions"></td>
    `;

    const actions = row.querySelector('.actions');
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = alreadyEnrolled ? 'Inscrito' : insideEnrollmentPeriod ? 'Inscrever' : 'Fora do prazo';
    button.disabled = alreadyEnrolled || availableSlots <= 0 || !insideEnrollmentPeriod;
    button.addEventListener('click', () => availableEnroll(course.id));
    actions.appendChild(button);
    body.appendChild(row);
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Inscreve o policial ativo no curso selecionado.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} courseId - ID da turma escolhida.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê inscrições atuais e grava `cproeis_policiais_cursos_inscricoes` no LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, validar vaga restante e conflito de agenda em transação no backend.
 */
function availableEnroll(courseId) {
  const policialId = availableGetPolicialId();
  const policial = availableGetPolicial();
  const feedback = document.getElementById('available-course-feedback');
  if (!policialId) {
    feedback.textContent = 'Selecione um policial antes de se inscrever.';
    return;
  }

  const course = availableLoadList(AVAILABLE_COURSES_STORAGE).find((item) => item.id === courseId);
  if (!availableIsCourseEligible(course || {}, policial)) {
    feedback.textContent = 'Esta capacitação não está disponível para a sua classe ou posto/graduação.';
    availableRenderCourses();
    return;
  }

  if (!availableIsInsideEnrollmentPeriod(course)) {
    feedback.textContent = 'O prazo de inscrição desta capacitação não está aberto.';
    availableRenderCourses();
    return;
  }

  const enrollments = availableLoadList(AVAILABLE_ENROLLMENTS_STORAGE);
  if (enrollments.some((item) => item.courseId === courseId && item.policialId === policialId)) return;

  enrollments.push({
    id: `inscricao-curso-${Date.now()}`,
    courseId,
    policialId,
    status: 'Inscrito',
    createdAt: new Date().toISOString()
  });
  availableSaveList(AVAILABLE_ENROLLMENTS_STORAGE, enrollments);
  feedback.textContent = 'Inscrição registrada na base local do policial.';
  availableRenderCourses();
}

availableRenderCourses();
