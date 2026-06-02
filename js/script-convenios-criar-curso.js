const COURSE_CONVENIOS_STORAGE = 'cproeis_contratos_convenios';
const COURSE_TYPES_STORAGE = 'cproeis_convenios_tipos_curso_capacitacao';
const COURSE_CLASSES_STORAGE = 'cproeis_convenios_cursos_capacitacao';
const COURSE_ENROLLMENTS_STORAGE = 'cproeis_policiais_cursos_inscricoes';
const COURSE_TARGET_CLASSES = {
  A: ['Coronel', 'Tenente-Coronel', 'Major'],
  B: ['Capitão', '1º Tenente', '2º Tenente', 'Aspirante'],
  C: ['Subtenente', '1º Sargento', '2º Sargento', '3º Sargento'],
  D: ['Cabo', 'Soldado']
};
const COURSE_CLASS_LABELS = {
  A: 'Classe A',
  B: 'Classe B',
  C: 'Classe C',
  D: 'Classe D'
};
const COURSE_TARGET_RANKS = Object.values(COURSE_TARGET_CLASSES).flat();

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Lê uma lista JSON do LocalStorage com fallback seguro.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} key - Chave consultada no navegador.
 * @returns {Array<object>} Lista encontrada ou array vazio.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê LocalStorage e não grava dados.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, trocar por chamadas autenticadas à API com tratamento de erro.
 */
function courseLoadList(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (error) {
    return [];
  }
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Persiste uma lista JSON no LocalStorage.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} key - Chave de destino.
 * @param {Array<object>} value - Registros que serão salvos.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Grava LocalStorage na chave recebida.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, persistir por endpoint transacional do convênio.
 */
function courseSaveList(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Carrega os tipos de capacitação próprios do convênio ativo.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} convenioId - ID do convênio ativo.
 * @returns {Array<object>} Tipos cadastrados para o convênio.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê `cproeis_convenios_tipos_curso_capacitacao` no LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, consultar tipos por contrato em endpoint próprio do convênio.
 */
function courseGetConvenioTypes(convenioId) {
  return courseLoadList(COURSE_TYPES_STORAGE)
    .filter((type) => type.convenioId === convenioId && (type.status || 'Ativo') === 'Ativo')
    .sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
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
 * Não lê nem grava dados; apenas transforma string em memória.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Centralizar utilitário de datas em módulo compartilhado.
 */
function courseFormatDate(value) {
  if (!value) return '-';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Localiza o convênio ativo da tela usando URL ou sessão local.
 *
 * PARÂMETROS E RETORNO:
 * @returns {object|null} Convênio encontrado ou nulo.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê URL, `cproeis_convenio_atual` e `cproeis_contratos_convenios`; não grava dados.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, recuperar convênio por sessão autenticada do responsável.
 */
function courseGetActiveConvenio() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id') || localStorage.getItem('cproeis_convenio_atual') || '';
  return courseLoadList(COURSE_CONVENIOS_STORAGE).find((item) => item.id === id) || null;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Popula o select de tipos de curso usando tipos próprios do convênio.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê `cproeis_convenios_tipos_curso_capacitacao` e escreve opções no DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, bloquear a criação de turma até o backend confirmar tipo ativo no contrato.
 */
function courseHydrateTypeOptions() {
  const select = document.getElementById('course-type');
  if (!select) return;

  const convenio = courseGetActiveConvenio();
  const activeTypes = convenio ? courseGetConvenioTypes(convenio.id) : [];
  select.innerHTML = '<option value="">Selecione</option>';
  activeTypes.forEach((type) => {
    const option = document.createElement('option');
    option.value = type.id;
    option.textContent = type.nome;
    option.dataset.name = type.nome;
    select.appendChild(option);
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Renderiza os checkboxes de posto/graduação usados para definir o público-alvo da capacitação.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; cria inputs no DOM que serão lidos ao salvar a turma.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, carregar postos/graduações de tabela parametrizada pelo GSI.
 */
function courseSyncTargetFields() {
  const target = document.getElementById('course-target-rank');
  if (!target || target.children.length) return;

  target.innerHTML = COURSE_TARGET_RANKS.map((rank) => `
    <label class="target-rank-option">
      <input type="checkbox" name="course-target-rank" value="${rank}">
      <span>${rank}</span>
    </label>
  `).join('');
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Coleta a regra de público-alvo da turma a partir dos checkboxes de posto/graduação.
 *
 * PARÂMETROS E RETORNO:
 * @returns {object} Regra com modo, classes, postos e descrição textual.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê selects do DOM; o objeto retornado é salvo junto da turma em `cproeis_convenios_cursos_capacitacao`.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, persistir elegibilidade em tabela relacional para validação na inscrição.
 */
function courseCollectTargetRule() {
  const selectedRanks = [...document.querySelectorAll('input[name="course-target-rank"]:checked')]
    .map((input) => input.value)
    .filter(Boolean);

  if (!selectedRanks.length) {
    return {
      targetMode: 'todos',
      targetClasses: [],
      targetPostos: [],
      targetLabel: 'Todos os policiais'
    };
  }

  return {
    targetMode: 'posto',
    targetClasses: [],
    targetPostos: selectedRanks,
    targetLabel: selectedRanks.join(', ')
  };
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Renderiza os tipos de capacitação cadastrados pelo convênio.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê `cproeis_convenios_tipos_curso_capacitacao` e escreve a tabela no DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, adicionar edição/inativação do tipo com auditoria.
 */
function courseRenderTypes() {
  const body = document.getElementById('course-type-body');
  const convenio = courseGetActiveConvenio();
  if (!body) return;

  const types = convenio ? courseGetConvenioTypes(convenio.id) : [];
  if (!types.length) {
    body.innerHTML = '<tr><td class="empty" colspan="3">Nenhum tipo criado para este convênio.</td></tr>';
    return;
  }

  body.innerHTML = types.map((type) => `
    <tr>
      <td>${type.nome || '-'}</td>
      <td>${type.criterios || '-'}</td>
      <td><span class="badge">${type.status || 'Ativo'}</span></td>
    </tr>
  `).join('');
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Salva um tipo de capacitação próprio do convênio.
 *
 * PARÂMETROS E RETORNO:
 * @param {SubmitEvent} event - Envio do formulário de tipo.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê campos do DOM e grava `cproeis_convenios_tipos_curso_capacitacao` no LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, validar duplicidade e permissões por endpoint transacional.
 */
function courseHandleTypeSubmit(event) {
  event.preventDefault();

  const convenio = courseGetActiveConvenio();
  const feedback = document.getElementById('course-type-feedback');
  if (!convenio) {
    if (feedback) feedback.textContent = 'Selecione um convênio antes de criar tipo.';
    return;
  }

  const name = document.getElementById('course-type-name').value.trim();
  const criterios = document.getElementById('course-type-criteria').value.trim();
  if (name.length < 3) {
    if (feedback) feedback.textContent = 'Informe um nome de tipo com pelo menos 3 caracteres.';
    return;
  }

  const types = courseLoadList(COURSE_TYPES_STORAGE);
  const exists = types.some((type) => type.convenioId === convenio.id && (type.nome || '').toLowerCase() === name.toLowerCase());
  if (exists) {
    if (feedback) feedback.textContent = 'Este tipo de capacitação já existe para o convênio.';
    return;
  }

  types.push({
    id: `tipo-convenio-${Date.now()}`,
    convenioId: convenio.id,
    convenioNome: convenio.nome || '',
    nome: name,
    criterios,
    status: 'Ativo',
    createdAt: new Date().toISOString()
  });

  courseSaveList(COURSE_TYPES_STORAGE, types);
  event.target.reset();
  if (feedback) feedback.textContent = 'Tipo criado para este convênio.';
  courseHydrateTypeOptions();
  courseRenderTypes();
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Conta inscrições já feitas para uma turma.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} courseId - ID da turma.
 * @returns {number} Quantidade de inscrições encontradas.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê `cproeis_policiais_cursos_inscricoes` no LocalStorage; não grava dados.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, calcular inscritos em consulta agregada no backend.
 */
function courseCountEnrollments(courseId) {
  return courseLoadList(COURSE_ENROLLMENTS_STORAGE).filter((item) => item.courseId === courseId).length;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Renderiza os cursos criados pelo convênio ativo.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê `cproeis_convenios_cursos_capacitacao` e inscrições; escreve a tabela no DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, incluir edição, cancelamento e fechamento de turma com auditoria.
 */
function courseRenderClasses() {
  const body = document.getElementById('course-body');
  const count = document.getElementById('course-count');
  if (!body) return;

  const convenio = courseGetActiveConvenio();
  const classes = courseLoadList(COURSE_CLASSES_STORAGE)
    .filter((item) => !convenio || item.convenioId === convenio.id);

  body.innerHTML = '';
  count.textContent = classes.length
    ? `${classes.length} curso(s) criado(s) para este convênio.`
    : 'Nenhum curso criado para este convênio.';

  if (!classes.length) {
    body.innerHTML = '<tr><td class="empty" colspan="8">Cadastre uma turma para liberar inscrição ao policial.</td></tr>';
    return;
  }

  classes.forEach((course) => {
    const enrolled = courseCountEnrollments(course.id);
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${course.tipoNome || '-'}</td>
      <td>${course.titulo || '-'}</td>
      <td>${courseFormatDate(course.inscricaoInicio)} até ${courseFormatDate(course.inscricaoFim)}</td>
      <td>${courseFormatDate(course.inicio)} até ${courseFormatDate(course.fim)}</td>
      <td>${course.targetLabel || 'Todos os policiais'}</td>
      <td>${course.vagas || 0}</td>
      <td>${enrolled}</td>
      <td><span class="badge">${course.status || 'Aberto'}</span></td>
    `;
    body.appendChild(row);
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Salva uma nova turma de curso de capacitação criada pelo convênio.
 *
 * PARÂMETROS E RETORNO:
 * @param {SubmitEvent} event - Evento de envio do formulário.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê campos do DOM, consulta convênio e tipos de curso no LocalStorage e grava
 * `cproeis_convenios_cursos_capacitacao`.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, validar contrato, agenda, capacidade, instrutor e regras de inscrição no backend.
 */
function courseHandleSubmit(event) {
  event.preventDefault();

  const convenio = courseGetActiveConvenio();
  const feedback = document.getElementById('course-feedback');
  if (!convenio) {
    feedback.textContent = 'Selecione um convênio antes de criar curso.';
    return;
  }

  const typeSelect = document.getElementById('course-type');
  const type = courseGetConvenioTypes(convenio.id).find((item) => item.id === typeSelect.value);
  if (!type) {
    feedback.textContent = 'Crie e selecione um tipo de capacitação do convênio antes de salvar a turma.';
    return;
  }

  const inscricaoInicio = document.getElementById('course-enrollment-start').value;
  const inscricaoFim = document.getElementById('course-enrollment-end').value;
  const cursoInicio = document.getElementById('course-start').value;
  const cursoFim = document.getElementById('course-end').value;
  if (inscricaoFim < inscricaoInicio) {
    feedback.textContent = 'O fim das inscrições não pode ser anterior ao início das inscrições.';
    return;
  }

  if (cursoFim < cursoInicio) {
    feedback.textContent = 'O término do curso não pode ser anterior ao início do curso.';
    return;
  }

  const classes = courseLoadList(COURSE_CLASSES_STORAGE);
  const targetRule = courseCollectTargetRule();
  const record = {
    id: `curso-convenio-${Date.now()}`,
    convenioId: convenio.id,
    convenioNome: convenio.nome || '',
    tipoId: type?.id || '',
    tipoNome: type?.nome || typeSelect.selectedOptions[0]?.textContent || '',
    origemTipo: 'Convênio',
    titulo: document.getElementById('course-title').value.trim(),
    inscricaoInicio,
    inscricaoFim,
    inicio: cursoInicio,
    fim: cursoFim,
    cargaHoraria: Number(document.getElementById('course-hours').value || 0),
    vagas: Number(document.getElementById('course-slots').value || 0),
    ...targetRule,
    local: document.getElementById('course-location').value.trim(),
    status: 'Aberto',
    createdAt: new Date().toISOString()
  };

  classes.push(record);
  courseSaveList(COURSE_CLASSES_STORAGE, classes);
  event.target.reset();
  document.querySelectorAll('input[name="course-target-rank"]:checked').forEach((input) => {
    input.checked = false;
  });
  feedback.textContent = 'Curso criado e liberado para visualização dos policiais.';
  courseRenderClasses();
}

courseHydrateTypeOptions();
courseSyncTargetFields();
courseRenderTypes();
courseRenderClasses();
document.getElementById('course-type-form')?.addEventListener('submit', courseHandleTypeSubmit);
document.getElementById('course-form')?.addEventListener('submit', courseHandleSubmit);
