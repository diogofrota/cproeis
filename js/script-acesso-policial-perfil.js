const PROFILE_POLICE_STORAGE = 'cproeis_cadastro_policiais';
const PROFILE_CURRENT_POLICIAL = 'cproeis_acesso_policial_atual';
const PROFILE_HISTORY_HEALTH = 'cproeis_historico_sanitario';
const PROFILE_HISTORY_FUNCTIONAL = 'cproeis_historico_funcional';
const PROFILE_HISTORY_BEHAVIOR = 'cproeis_historico_comportamento';
const PROFILE_HISTORY_UNIT = 'cproeis_historico_unidade';
const PROFILE_HISTORY_STATUS = 'cproeis_historico_situacao_funcional';
const PROFILE_COURSES_STORAGE = 'cproeis_convenios_cursos_capacitacao';
const PROFILE_COURSE_ENROLLMENTS = 'cproeis_policiais_cursos_inscricoes';
const PROFILE_COURSE_BULLETINS = 'cproeis_policiais_cursos_boletins';
const PROFILE_LICENSES = 'cproeis_policiais_habilitacoes';
const PROFILE_COMPLETED_STATUS = new Set(['concluido', 'concluído', 'aprovado', 'aprovada', 'validado', 'validada', 'habilitado', 'habilitada']);

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Lê uma lista JSON do LocalStorage para montar o perfil somente leitura.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} key - Chave local consultada.
 * @returns {Array<object>} Lista persistida ou array vazio.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê LocalStorage; não grava dados.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, buscar perfil e históricos em API autenticada, com autorização do policial.
 */
function profileLoadList(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (error) {
    return [];
  }
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Resolve o policial ativo para a consulta de perfil.
 *
 * PARÂMETROS E RETORNO:
 * @returns {object|null} Registro do policial ou nulo quando não encontrado.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê URL, `cproeis_acesso_policial_atual` e `cproeis_cadastro_policiais`; não grava dados.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, usar sessão autenticada em vez de permitir seleção por query string.
 */
function profileGetPolicial() {
  const id = new URLSearchParams(window.location.search).get('id') || localStorage.getItem(PROFILE_CURRENT_POLICIAL) || '';
  return profileLoadList(PROFILE_POLICE_STORAGE).find((item) => item.id === id) || null;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Retorna o vínculo usado para cruzar históricos com o policial.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} policial - Registro cadastral do policial.
 * @returns {string} ID funcional, ID interno ou RG.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa armazenamento; usa apenas o objeto recebido.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, padronizar chave relacional imutável entre policial e históricos.
 */
function profileHistoryLink(policial) {
  return policial?.idFuncional || policial?.id || policial?.rg || '';
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Formata valores vazios para exibição e datas para DD/MM/YYYY.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} value - Valor textual ou data ISO.
 * @returns {string} Valor exibível.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não lê nem grava dados; transforma apenas o valor recebido.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Centralizar formatação em helper compartilhado.
 */
function profileFormat(value) {
  if (!value) return '-';
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [year, month, day] = value.slice(0, 10).split('-');
    return `${day}/${month}/${year}`;
  }
  return String(value);
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Renderiza os dados cadastrais principais do policial.
 *
 * PARÂMETROS E RETORNO:
 * @param {object|null} policial - Policial ativo.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; escreve os campos no DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, mascarar dados sensíveis conforme perfil de acesso.
 */
function profileRenderGrid(policial) {
  const grid = document.getElementById('profile-grid');
  const hint = document.getElementById('profile-hint');
  if (!grid) return;

  if (!policial) {
    grid.innerHTML = '<div class="detail-item"><span>Status</span><strong>Policial não encontrado</strong></div>';
    if (hint) hint.textContent = 'Retorne ao acesso do policial e selecione um cadastro.';
    return;
  }

  const fields = [
    ['Nome completo', policial.nomeCompleto],
    ['Nome de guerra', policial.nomeGuerra],
    ['RG', policial.rg],
    ['ID funcional', policial.idFuncional],
    ['Posto/Graduação', policial.postoGraduacao],
    ['Grupo hierárquico', policial.grupoHierarquico],
    ['Unidade', policial.unidade],
    ['Comportamento', policial.comportamento],
    ['Situação funcional', policial.situacaoFuncional],
    ['Situação sanitária', policial.situacaoSanitaria],
    ['Telefone', policial.telefone],
    ['E-mail', policial.email],
    ['Data de entrada', policial.dataEntrada]
  ];

  grid.innerHTML = fields.map(([label, value]) => `
    <div class="detail-item">
      <span>${label}</span>
      <strong>${profileFormat(value)}</strong>
    </div>
  `).join('');
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Renderiza uma tabela histórica somente leitura.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} bodyId - ID do tbody de destino.
 * @param {Array<object>} rows - Registros históricos já filtrados.
 * @param {Array<string>} fields - Campos exibidos na ordem das colunas.
 * @param {number} colspan - Quantidade de colunas para estado vazio.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; escreve apenas no DOM com dados já lidos do LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, adicionar paginação e assinatura digital dos históricos oficiais.
 */
function profileRenderHistoryTable(bodyId, rows, fields, colspan) {
  const body = document.getElementById(bodyId);
  if (!body) return;

  body.innerHTML = '';
  if (!rows.length) {
    body.innerHTML = `<tr><td class="empty" colspan="${colspan}">Nenhum histórico informado.</td></tr>`;
    return;
  }

  rows.forEach((item) => {
    const row = document.createElement('tr');
    row.innerHTML = fields.map((field) => `<td>${profileFormat(item[field])}</td>`).join('');
    body.appendChild(row);
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Calcula a situação da habilitação de moto cadastrada no perfil.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} license - Registro de habilitação do policial.
 * @returns {string} Situação textual da CNH.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não lê nem grava dados; usa apenas o objeto de habilitação recebido.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, validar CNH em serviço oficial/documental antes de liberar habilitação operacional.
 */
function profileLicenseStatus(license) {
  if (!license?.categoria?.includes('A')) return 'Sem categoria A';
  if (!license?.vencimento) return 'Pendente';
  return new Date(`${license.vencimento}T23:59:59`) >= new Date() ? 'Válida para moto' : 'Vencida';
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Verifica se um status representa curso concluído ou validado para aparecer no perfil.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} status - Situação textual da inscrição, publicação ou validação.
 * @returns {boolean} Verdadeiro quando o curso deve compor o perfil consolidado.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não lê nem grava dados; apenas normaliza o status recebido de tabelas locais.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, trocar status textual por enum oficial retornado pela API.
 */
function profileIsCompletedStatus(status) {
  return PROFILE_COMPLETED_STATUS.has(String(status || '').trim().toLowerCase());
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Renderiza cursos de capacitação concluídos em turmas criadas por convênios.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} policialId - ID interno do policial selecionado.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê `cproeis_policiais_cursos_inscricoes` e `cproeis_convenios_cursos_capacitacao`;
 * escreve a tabela no DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, consultar inscrições diretamente no backend com status oficial da turma.
 */
function profileRenderCourseEnrollments(policialId) {
  const body = document.getElementById('profile-enrollment-body');
  const count = document.getElementById('profile-enrollment-count');
  if (!body) return;

  const courses = profileLoadList(PROFILE_COURSES_STORAGE);
  const enrollments = profileLoadList(PROFILE_COURSE_ENROLLMENTS)
    .filter((item) => item.policialId === policialId && profileIsCompletedStatus(item.status));
  body.innerHTML = '';
  if (count) count.textContent = enrollments.length ? `${enrollments.length} capacitação(ões) concluída(s).` : 'Nenhuma capacitação concluída.';

  if (!enrollments.length) {
    body.innerHTML = '<tr><td class="empty" colspan="5">Nenhuma capacitação concluída em convênio.</td></tr>';
    return;
  }

  enrollments.forEach((enrollment) => {
    const course = courses.find((item) => item.id === enrollment.courseId) || {};
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${profileFormat(course.tipoNome)}</strong><span class="status-note">${profileFormat(course.titulo)}</span></td>
      <td>${profileFormat(course.convenioNome)}</td>
      <td>${profileFormat(course.inicio)} até ${profileFormat(course.fim)}</td>
      <td>${course.cargaHoraria ? `${course.cargaHoraria}h` : '-'}</td>
      <td><span class="badge">${profileFormat(enrollment.status || 'Inscrito')}</span></td>
    `;
    body.appendChild(row);
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Renderiza cursos da Polícia Militar informados por publicação em BOL PM já validada.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} policialId - ID interno do policial selecionado.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê `cproeis_policiais_cursos_boletins` no LocalStorage e escreve a tabela no DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, exibir resultado da conferência automática do BOL e auditoria do GSI.
 */
function profileRenderCourseBulletins(policialId) {
  const body = document.getElementById('profile-bulletin-body');
  const count = document.getElementById('profile-bulletin-count');
  if (!body) return;

  const bulletins = profileLoadList(PROFILE_COURSE_BULLETINS)
    .filter((item) => item.policialId === policialId && profileIsCompletedStatus(item.status));
  body.innerHTML = '';
  if (count) count.textContent = bulletins.length ? `${bulletins.length} curso(s) da Polícia Militar validado(s).` : 'Nenhum curso da Polícia Militar validado.';

  if (!bulletins.length) {
    body.innerHTML = '<tr><td class="empty" colspan="5">Nenhum curso da Polícia Militar validado por boletim.</td></tr>';
    return;
  }

  bulletins.forEach((item) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${profileFormat(item.tipoNome)}</td>
      <td>${profileFormat(item.bolNumero)}</td>
      <td>${profileFormat(item.bolData)}</td>
      <td>${profileFormat(item.pagina)}</td>
      <td><span class="badge">${profileFormat(item.status || 'Aguardando verificação')}</span></td>
    `;
    body.appendChild(row);
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Renderiza habilitações de moto vinculadas ao policial no perfil.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} policialId - ID interno do policial selecionado.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê `cproeis_policiais_habilitacoes` no LocalStorage e escreve a tabela no DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, exibir somente CNHs validadas por OCR/IA e revisão documental.
 */
function profileRenderLicenses(policialId) {
  const body = document.getElementById('profile-license-body');
  const count = document.getElementById('profile-license-count');
  if (!body) return;

  const licenses = profileLoadList(PROFILE_LICENSES).filter((item) => item.policialId === policialId);
  body.innerHTML = '';
  if (count) count.textContent = licenses.length ? `${licenses.length} habilitação(ões) cadastrada(s).` : 'Nenhuma habilitação cadastrada.';

  if (!licenses.length) {
    body.innerHTML = '<tr><td class="empty" colspan="5">Nenhuma habilitação de moto cadastrada.</td></tr>';
    return;
  }

  licenses.forEach((license) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${profileFormat(license.numero)}</td>
      <td>${profileFormat(license.categoria)}</td>
      <td>${profileFormat(license.vencimento)}</td>
      <td><span class="badge">${profileLicenseStatus(license)}</span></td>
      <td>${profileFormat(license.origem)}</td>
    `;
    body.appendChild(row);
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Inicializa a página de perfil com dados cadastrais e históricos sem ações de edição.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê `cproeis_cadastro_policiais`, todas as chaves `cproeis_historico_*` e as tabelas locais
 * de cursos/habilitação; não grava dados.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, montar perfil em endpoint seguro que agregue cadastro e históricos oficiais.
 */
function profileInit() {
  const policial = profileGetPolicial();
  profileRenderGrid(policial);
  const policialId = policial?.id || '';
  profileRenderCourseBulletins(policialId);
  profileRenderCourseEnrollments(policialId);
  profileRenderLicenses(policialId);
}

profileInit();
