const P1_UNIT_SESSION_KEYS = {
  policiais: 'cproeis_cadastro_policiais',
  acessosP1: 'cproeis_ras_acessos_p1',
  policialAtual: 'cproeis_p1_unidade_policial_atual',
  unidadeAtual: 'cproeis_p1_unidade_atual'
};

/**
 * DESCRIÇÃO DA FUNÇÃO: Lê uma lista JSON do LocalStorage usada pelas páginas internas da P/1.
 * PARÂMETROS E RETORNO: Recebe `key` (string) e retorna Array<object>.
 * ARMAZENAMENTO E PERSISTÊNCIA: Lê cproeis_cadastro_policiais ou cproeis_ras_acessos_p1 no
 * LocalStorage, sem gravar dados.
 * TODO: Em produção, substituir por chamada autenticada a uma API da P/1 Unidade.
 */
function p1UnitReadList(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (error) {
    return [];
  }
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Escapa valores dinâmicos antes de escrever textos de sessão no DOM.
 * PARÂMETROS E RETORNO: Recebe `value` (qualquer valor simples) e retorna string segura.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava dados; opera apenas sobre o valor recebido.
 * TODO: Em produção, manter sanitização também nos dados retornados pelo backend.
 */
function p1UnitEscapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Retorna as chaves locais possíveis para identificar um policial cadastrado.
 * PARÂMETROS E RETORNO: Recebe `policial` (object) e retorna Array<string>.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não acessa armazenamento; usa somente o objeto em memória.
 * TODO: Em produção, padronizar identificação por ID imutável vindo do banco de dados.
 */
function p1UnitGetPolicialKeys(policial) {
  return [policial?.id, policial?.rg, policial?.matricula, policial?.nomeCompleto, policial?.nomeGuerra]
    .filter(Boolean)
    .map((value) => String(value).trim());
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Retorna nome de exibição do policial responsável pela P/1.
 * PARÂMETROS E RETORNO: Recebe `policial` (object) e retorna string.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava dados; usa dados já carregados.
 * TODO: Em produção, centralizar identificação do efetivo em componente compartilhado.
 */
function p1UnitGetPolicialName(policial) {
  return policial?.nomeCompleto || policial?.nomeGuerra || policial?.nome || policial?.rg || 'Policial sem nome';
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Resolve a sessão administrativa da P/1 por URL ou LocalStorage local.
 * PARÂMETROS E RETORNO: Não recebe parâmetros; retorna object com policial e acesso ou null.
 * ARMAZENAMENTO E PERSISTÊNCIA: Lê parâmetros da URL, cproeis_p1_unidade_policial_atual,
 * cproeis_p1_unidade_atual, cproeis_cadastro_policiais e cproeis_ras_acessos_p1; grava os
 * identificadores atuais no LocalStorage quando a URL informa um login.
 * TODO: Em produção, substituir query string e LocalStorage por sessão autenticada e perfil
 * administrativo validado no servidor.
 */
function p1UnitResolveSession() {
  const params = new URLSearchParams(window.location.search);
  const requestedId = params.get('id') || localStorage.getItem(P1_UNIT_SESSION_KEYS.policialAtual) || '';
  const requestedUnit = params.get('unidade') || localStorage.getItem(P1_UNIT_SESSION_KEYS.unidadeAtual) || '';
  const policiais = p1UnitReadList(P1_UNIT_SESSION_KEYS.policiais);
  const acessos = p1UnitReadList(P1_UNIT_SESSION_KEYS.acessosP1);
  const policial = policiais.find((item) => p1UnitGetPolicialKeys(item).includes(String(requestedId).trim())) || null;
  const policialKeys = p1UnitGetPolicialKeys(policial);
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
    localStorage.setItem(P1_UNIT_SESSION_KEYS.policialAtual, requestedId);
    localStorage.setItem(P1_UNIT_SESSION_KEYS.unidadeAtual, acesso.unidade || requestedUnit);
  }

  return policial && acesso ? { policial, acesso } : null;
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Mantém os parâmetros da sessão P/1 nos links internos do módulo.
 * PARÂMETROS E RETORNO: Recebe `context` (object|null); não retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; altera apenas hrefs de links no DOM.
 * TODO: Em produção, remover propagação manual de parâmetros e usar roteamento autenticado.
 */
function p1UnitApplySessionLinks(context) {
  if (!context) return;

  const id = p1UnitGetPolicialKeys(context.policial)[0] || context.acesso.policialId || '';
  const unidade = context.acesso.unidade || '';

  document.querySelectorAll('[data-p1-session-link]').forEach((link) => {
    const href = link.getAttribute('href') || '';
    if (!href || href.startsWith('../')) return;
    const url = new URL(href, window.location.href);
    url.searchParams.set('id', id);
    url.searchParams.set('unidade', unidade);
    link.setAttribute('href', `${url.pathname.split('/').pop()}${url.search}`);
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Renderiza o menu completo da P/1 Unidade com a mesma estrutura do menu
 * operacional do convênio.
 * PARÂMETROS E RETORNO: Não recebe parâmetros nem retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava dados; substitui apenas os links do menu no DOM.
 * TODO: Em produção, montar este menu a partir das rotas liberadas para o perfil administrativo.
 */
function p1UnitRenderOperationalMenu() {
  const menu = document.getElementById('p1-unidade-menu');
  if (!menu) return;

  menu.innerHTML = `
    <a href="criar-vagas.html" data-p1-session-link>Criar vagas de serviço</a>
    <a href="acompanhamento.html" data-p1-session-link>Acompanhar limite mensal</a>
    <a href="vagas.html" data-p1-session-link>Vagas criadas</a>
    <a href="vagas-calendario.html" data-p1-session-link>Vagas calendário</a>
    <a href="perfil.html" data-p1-session-link>Perfil</a>
    <a href="dados-contrato.html" data-p1-session-link>Dados da autorização</a>
    <a href="servicos.html" data-p1-session-link>Serviços cadastrados</a>
    <a href="criar-servico.html" data-p1-session-link>Criar serviço</a>
    <a href="criar-curso.html" data-p1-session-link>Criar curso</a>
    <a href="historico-curso.html" data-p1-session-link>Histórico de curso</a>
    <a href="inscritos-curso.html" data-p1-session-link>Inscritos em cursos</a>
    <a href="renovacao-contrato.html" data-p1-session-link>Renovação de autorização</a>
    <a class="menu-back-link" href="p1-unidade.html" data-history-back="false">Sair</a>
  `;
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Atualiza cabeçalho e blocos de status das páginas internas da P/1.
 * PARÂMETROS E RETORNO: Recebe `context` (object|null); não retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; escreve textos de apresentação no DOM.
 * TODO: Em produção, exibir também número da autorização e trilha de auditoria retornados pela API.
 */
function p1UnitRenderSession(context) {
  const title = document.getElementById('p1-page-title');
  const subtitle = document.getElementById('p1-page-subtitle');
  const status = document.getElementById('p1-session-status');

  if (!context) {
    if (title) title.textContent = 'P/1 Unidade - acesso não autorizado';
    if (subtitle) subtitle.textContent = 'Selecione um responsável ativo na tela de acesso da P/1 Unidade.';
    if (status) status.innerHTML = '<strong>Acesso bloqueado.</strong><span>Nenhum vínculo P/1 RAS ativo foi localizado para esta sessão.</span>';
    return;
  }

  if (title?.dataset.baseTitle) {
    title.textContent = `${title.dataset.baseTitle} - ${context.acesso.unidade}`;
  }

  if (subtitle) {
    subtitle.textContent = `${p1UnitGetPolicialName(context.policial)} | ${context.policial.postoGraduacao || '-'} | Responsável P/1 RAS`;
  }

  if (status) {
    status.innerHTML = `<strong>${p1UnitEscapeHtml(context.acesso.unidade)}</strong><span>${p1UnitEscapeHtml(p1UnitGetPolicialName(context.policial))} está logado como responsável P/1 RAS.</span>`;
  }
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Inicializa sessão visual e navegação das páginas internas da P/1.
 * PARÂMETROS E RETORNO: Não recebe parâmetros nem retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: Lê e, quando necessário, grava identificadores de sessão no
 * LocalStorage para manter navegação local entre páginas.
 * TODO: Em produção, mover toda autorização para middleware/rota protegida no backend.
 */
function p1UnitSessionInit() {
  const context = p1UnitResolveSession();
  p1UnitRenderOperationalMenu();
  p1UnitRenderSession(context);
  p1UnitApplySessionLinks(context);
}

document.addEventListener('DOMContentLoaded', p1UnitSessionInit);
