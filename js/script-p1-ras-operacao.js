const P1_RAS_KEYS = {
  policiais: 'cproeis_cadastro_policiais',
  acessosP1: 'cproeis_ras_acessos_p1',
  vagas: 'cproeis_ras_vagas',
  policialAtual: 'cproeis_acesso_policial_atual',
  p1UnidadePolicialAtual: 'cproeis_p1_unidade_policial_atual',
  p1UnidadeAtual: 'cproeis_p1_unidade_atual'
};

/**
 * DESCRIÇÃO DA FUNÇÃO: Lê listas do LocalStorage usadas pela operação RAS da P/1.
 * PARÂMETROS E RETORNO: Recebe `key` (string) e retorna Array<object>.
 * ARMAZENAMENTO E PERSISTÊNCIA: Lê cproeis_cadastro_policiais, cproeis_ras_acessos_p1 ou
 * cproeis_ras_vagas no LocalStorage.
 * TODO: Em produção, substituir por repository/API autenticada com tratamento de erro.
 */
function p1RasReadList(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (error) {
    return [];
  }
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Grava listas da operação P/1 RAS no LocalStorage.
 * PARÂMETROS E RETORNO: Recebe `key` (string) e `records` (Array<object>); não retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: Grava cproeis_ras_vagas no LocalStorage.
 * TODO: Em produção, trocar por endpoint transacional com auditoria e validação de saldo GSI.
 */
function p1RasSaveList(key, records) {
  localStorage.setItem(key, JSON.stringify(records));
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Cria identificador local para uma vaga RAS.
 * PARÂMETROS E RETORNO: Não recebe parâmetros; retorna string única.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não acessa armazenamento; o retorno é persistido pelo chamador.
 * TODO: Em produção, usar ID gerado pelo banco de dados.
 */
function p1RasCreateId() {
  return `ras-vaga-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Escapa valores antes de renderizar tabelas.
 * PARÂMETROS E RETORNO: Recebe `value` (qualquer valor simples) e retorna string segura para HTML.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava dados.
 * TODO: Em produção, manter codificação no frontend e backend.
 */
function p1RasEscapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Formata data ISO simples para leitura brasileira.
 * PARÂMETROS E RETORNO: Recebe `value` (string yyyy-mm-dd) e retorna string dd/mm/yyyy ou hífen.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não acessa armazenamento.
 * TODO: Em produção, centralizar formatação de datas em utilitário compartilhado.
 */
function p1RasFormatDate(value) {
  if (!value) return '-';
  const [year, month, day] = value.split('-');
  return day && month && year ? `${day}/${month}/${year}` : value;
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Retorna nome exibível do policial.
 * PARÂMETROS E RETORNO: Recebe `policial` (object) e retorna string.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não acessa armazenamento; usa dados em memória.
 * TODO: Em produção, usar componente compartilhado de identificação do efetivo.
 */
function p1RasGetPolicialName(policial) {
  return policial?.nomeCompleto || policial?.nomeGuerra || policial?.nome || policial?.rg || 'Policial sem nome';
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Retorna identificador local do policial para comparar com vínculo P/1.
 * PARÂMETROS E RETORNO: Recebe `policial` (object) e retorna string.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não acessa armazenamento; usa dados em memória.
 * TODO: Em produção, usar chave primária oficial da tabela de policiais.
 */
function p1RasGetPolicialId(policial) {
  return String(policial?.id || policial?.rg || policial?.matricula || policial?.nomeCompleto || '').trim();
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Retorna todas as chaves locais possíveis para reconhecer o policial em
 * vínculos P/1 RAS gravados com ID, RG ou matrícula.
 * PARÂMETROS E RETORNO: Recebe `policial` (object) e retorna Array<string>.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não acessa armazenamento; compara somente dados já carregados.
 * TODO: Em produção, remover compatibilidade por múltiplas chaves e usar ID oficial do banco.
 */
function p1RasGetPolicialKeys(policial) {
  return [policial?.id, policial?.rg, policial?.matricula, policial?.nomeCompleto, policial?.nomeGuerra]
    .filter(Boolean)
    .map((value) => String(value).trim());
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Resolve o responsável P/1 RAS ativo a partir da URL ou sessão local.
 * PARÂMETROS E RETORNO: Não recebe parâmetros; retorna object com policial e vínculo ou null.
 * ARMAZENAMENTO E PERSISTÊNCIA: Lê URL, cproeis_acesso_policial_atual, cproeis_cadastro_policiais
 * e cproeis_ras_acessos_p1 no LocalStorage.
 * TODO: Em produção, validar permissão por sessão autenticada e endpoint de autorização.
 */
function p1RasResolveAccess() {
  const params = new URLSearchParams(window.location.search);
  const requestedId = params.get('id')
    || localStorage.getItem(P1_RAS_KEYS.p1UnidadePolicialAtual)
    || localStorage.getItem(P1_RAS_KEYS.policialAtual)
    || '';
  const requestedUnit = params.get('unidade') || localStorage.getItem(P1_RAS_KEYS.p1UnidadeAtual) || '';
  const policiais = p1RasReadList(P1_RAS_KEYS.policiais);
  const acessos = p1RasReadList(P1_RAS_KEYS.acessosP1);
  const policial = policiais.find((item) => p1RasGetPolicialKeys(item).includes(String(requestedId).trim())) || null;
  const policialKeys = p1RasGetPolicialKeys(policial);
  const acesso = acessos.find((item) => {
    const accessKeys = [item?.policialId, item?.rg, item?.nomePolicial]
      .filter(Boolean)
      .map((value) => String(value).trim());

    return item.status === 'ativo'
      && !item.dataSaida
      && accessKeys.some((key) => policialKeys.includes(key))
      && (!requestedUnit || item.unidade === requestedUnit);
  }) || null;

  if (policial && acesso && params.get('id')) {
    localStorage.setItem(P1_RAS_KEYS.p1UnidadePolicialAtual, requestedId);
    localStorage.setItem(P1_RAS_KEYS.p1UnidadeAtual, acesso.unidade || requestedUnit);
  }

  return policial && acesso ? { policial, acesso } : null;
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Retorna policiais cadastrados na unidade sob responsabilidade da P/1.
 * PARÂMETROS E RETORNO: Recebe `unidade` (string) e retorna Array<object>.
 * ARMAZENAMENTO E PERSISTÊNCIA: Lê cproeis_cadastro_policiais no LocalStorage.
 * TODO: Em produção, buscar efetivo da unidade via endpoint paginado e filtrado por situação.
 */
function p1RasGetUnitPoliciais(unidade) {
  return p1RasReadList(P1_RAS_KEYS.policiais)
    .filter((policial) => policial.unidade === unidade)
    .sort((a, b) => p1RasGetPolicialName(a).localeCompare(p1RasGetPolicialName(b), 'pt-BR'));
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Renderiza dados do acesso autorizado no cabeçalho e status da página.
 * PARÂMETROS E RETORNO: Recebe `context` (object|null); não retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; altera somente DOM.
 * TODO: Em produção, mostrar também identificador da autorização retornado pelo backend.
 */
function p1RasRenderAccessStatus(context) {
  const title = document.getElementById('p1-page-title');
  const subtitle = document.getElementById('p1-page-subtitle');
  const status = document.getElementById('p1-access-status');

  if (!context) {
    title.textContent = 'P/1 Unidade - acesso não autorizado';
    subtitle.textContent = 'Este policial não possui vínculo ativo como responsável P/1 RAS.';
    status.textContent = 'A criação de vagas está bloqueada até existir vínculo ativo no RAS.';
    document.getElementById('p1-ras-vaga-form').querySelectorAll('input, select, textarea, button').forEach((field) => {
      field.disabled = true;
    });
    return;
  }

  title.textContent = `P/1 Unidade - ${context.acesso.unidade}`;
  subtitle.textContent = `${p1RasGetPolicialName(context.policial)} | ${context.policial.postoGraduacao || '-'} | Responsável P/1 RAS`;
  status.textContent = `Unidade autorizada: ${context.acesso.unidade}.`;
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Preenche o seletor de policial compulsório com policiais da unidade.
 * PARÂMETROS E RETORNO: Recebe `policiais` (Array<object>); não retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; escreve opções no DOM.
 * TODO: Em produção, validar impedimentos e conflitos antes de permitir escala compulsória.
 */
function p1RasRenderCompulsoryOptions(policiais) {
  const select = document.getElementById('p1-ras-policial-compulsorio');
  select.innerHTML = '<option value="">Selecione para compulsória</option>' + policiais.map((policial) => `
    <option value="${p1RasEscapeHtml(p1RasGetPolicialId(policial))}">${p1RasEscapeHtml(p1RasGetPolicialName(policial))} - RG ${p1RasEscapeHtml(policial.rg || '-')}</option>
  `).join('');
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Renderiza a tabela de policiais cadastrados na unidade da P/1.
 * PARÂMETROS E RETORNO: Recebe `policiais` (Array<object>); não retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; escreve tabela no DOM.
 * TODO: Em produção, adicionar filtros, paginação e situação de bloqueio em tempo real.
 */
function p1RasRenderPoliceTable(policiais) {
  const body = document.getElementById('p1-police-body');
  document.getElementById('p1-police-count').textContent = `${policiais.length} policiais cadastrados na unidade.`;

  if (!policiais.length) {
    body.innerHTML = '<tr><td class="empty-row" colspan="5">Nenhum policial cadastrado nesta unidade.</td></tr>';
    return;
  }

  body.innerHTML = policiais.map((policial) => `
    <tr>
      <td><strong>${p1RasEscapeHtml(p1RasGetPolicialName(policial))}</strong></td>
      <td>${p1RasEscapeHtml(policial.rg || '-')}</td>
      <td>${p1RasEscapeHtml(policial.postoGraduacao || '-')}</td>
      <td>${p1RasEscapeHtml(policial.situacaoFuncional || '-')}</td>
      <td>${p1RasEscapeHtml(policial.situacaoSanitaria || '-')}</td>
    </tr>
  `).join('');
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Renderiza vagas RAS criadas pela P/1 da unidade.
 * PARÂMETROS E RETORNO: Recebe `unidade` (string); não retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: Lê cproeis_ras_vagas no LocalStorage.
 * TODO: Em produção, buscar vagas por unidade via API com status oficial de aprovação/escala.
 */
function p1RasRenderVagas(unidade) {
  const body = document.getElementById('p1-ras-vagas-body');
  const vagas = p1RasReadList(P1_RAS_KEYS.vagas)
    .filter((vaga) => vaga.unidade === unidade)
    .sort((a, b) => String(b.dataServico || '').localeCompare(String(a.dataServico || '')));
  document.getElementById('p1-ras-vagas-count').textContent = `${vagas.length} vagas RAS criadas para a unidade.`;

  if (!vagas.length) {
    body.innerHTML = '<tr><td class="empty-row" colspan="6">Nenhuma vaga RAS criada.</td></tr>';
    return;
  }

  body.innerHTML = vagas.map((vaga) => `
    <tr>
      <td>${p1RasEscapeHtml(p1RasFormatDate(vaga.dataServico))}</td>
      <td>${p1RasEscapeHtml(vaga.nomeServico)}</td>
      <td>${p1RasEscapeHtml(vaga.classe)}</td>
      <td>${p1RasEscapeHtml(vaga.quantidade)}</td>
      <td>${p1RasEscapeHtml(vaga.tipoEscala)}</td>
      <td>${p1RasEscapeHtml(vaga.policialCompulsorioNome || '-')}</td>
    </tr>
  `).join('');
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Alterna o campo de policial compulsório conforme tipo de escala.
 * PARÂMETROS E RETORNO: Não recebe parâmetros nem retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não acessa armazenamento; altera apenas estado do DOM.
 * TODO: Em produção, mover regras de escala compulsória para validação server-side.
 */
function p1RasSyncCompulsoryField() {
  const isCompulsory = document.getElementById('p1-ras-tipo-escala').value === 'compulsoria';
  const select = document.getElementById('p1-ras-policial-compulsorio');
  select.disabled = !isCompulsory;
  if (!isCompulsory) select.value = '';
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Cria uma vaga RAS normal ou compulsória para a unidade da P/1.
 * PARÂMETROS E RETORNO: Recebe `event` (SubmitEvent) e `context` (object); não retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: Lê formulário e grava novo registro em cproeis_ras_vagas.
 * TODO: Em produção, enviar payload para backend validar saldo GSI, conflitos e auditoria.
 */
function p1RasHandleSubmit(event, context) {
  event.preventDefault();
  if (!context) return;

  const tipoEscala = document.getElementById('p1-ras-tipo-escala').value;
  const policialCompulsorioId = document.getElementById('p1-ras-policial-compulsorio').value;
  const unitPoliciais = p1RasGetUnitPoliciais(context.acesso.unidade);
  const policialCompulsorio = unitPoliciais.find((policial) => p1RasGetPolicialId(policial) === policialCompulsorioId) || null;

  if (tipoEscala === 'compulsoria' && !policialCompulsorio) {
    const feedback = document.getElementById('p1-ras-feedback');
    feedback.textContent = 'Selecione o policial que será escalado compulsoriamente.';
    feedback.classList.remove('ok');
    return;
  }

  const now = new Date().toISOString();
  const vagas = p1RasReadList(P1_RAS_KEYS.vagas);
  vagas.push({
    id: p1RasCreateId(),
    origem: 'RAS',
    unidade: context.acesso.unidade,
    responsavelP1Id: p1RasGetPolicialId(context.policial),
    responsavelP1Nome: p1RasGetPolicialName(context.policial),
    nomeServico: document.getElementById('p1-ras-evento').value.trim(),
    dataServico: document.getElementById('p1-ras-data').value,
    classe: document.getElementById('p1-ras-classe').value,
    quantidade: Number(document.getElementById('p1-ras-quantidade').value || 0),
    horaInicio: document.getElementById('p1-ras-inicio').value,
    horaTermino: document.getElementById('p1-ras-termino').value,
    tipoEscala,
    policialCompulsorioId: policialCompulsorio ? p1RasGetPolicialId(policialCompulsorio) : '',
    policialCompulsorioNome: policialCompulsorio ? p1RasGetPolicialName(policialCompulsorio) : '',
    observacao: document.getElementById('p1-ras-observacao').value.trim(),
    status: tipoEscala === 'compulsoria' ? 'compulsoria_criada' : 'normal_criada',
    criadoEm: now,
    atualizadoEm: now
  });

  p1RasSaveList(P1_RAS_KEYS.vagas, vagas);
  event.target.reset();
  p1RasSyncCompulsoryField();
  const feedback = document.getElementById('p1-ras-feedback');
  feedback.textContent = 'Vaga RAS criada e salva no LocalStorage.';
  feedback.classList.add('ok');
  p1RasRenderVagas(context.acesso.unidade);
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Inicializa a operação RAS da P/1.
 * PARÂMETROS E RETORNO: Não recebe parâmetros nem retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: Lê LocalStorage na inicialização e conecta submit que grava
 * cproeis_ras_vagas.
 * TODO: Em produção, carregar estado inicial via API autenticada e atualizar por eventos do backend.
 */
function p1RasInit() {
  const context = p1RasResolveAccess();
  const unitPoliciais = context ? p1RasGetUnitPoliciais(context.acesso.unidade) : [];

  p1RasRenderAccessStatus(context);
  p1RasRenderCompulsoryOptions(unitPoliciais);
  p1RasRenderPoliceTable(unitPoliciais);
  if (context) p1RasRenderVagas(context.acesso.unidade);
  document.getElementById('p1-ras-tipo-escala').addEventListener('change', p1RasSyncCompulsoryField);
  document.getElementById('p1-ras-vaga-form').addEventListener('submit', (event) => p1RasHandleSubmit(event, context));
}

document.addEventListener('DOMContentLoaded', p1RasInit);
