const HIST_STORAGE_POLICIAIS = 'cproeis_cadastro_policiais';
const HIST_STORAGE_VAGAS = 'cproeis_convenios_vagas';
const HIST_STORAGE_CONVENIOS = 'cproeis_contratos_convenios';
const HIST_STORAGE_POLICIAL_ATUAL = 'cproeis_acesso_policial_atual';

let historicoMesAtual = new Date();
historicoMesAtual.setDate(1);

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Lê uma lista JSON do LocalStorage com fallback seguro para array vazio.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} key - Chave do LocalStorage consultada.
 * @returns {Array<object>} Lista persistida ou array vazio quando não houver dados válidos.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê LocalStorage e não realiza gravações.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Substituir por API autenticada que retorne apenas escalas do policial logado.
 */
function histLoadList(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (error) {
    return [];
  }
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Resolve o policial ativo para filtrar as escalas do histórico.
 *
 * PARÂMETROS E RETORNO:
 * @returns {object|null} Policial encontrado pela URL ou pela sessão local.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê a URL, `cproeis_acesso_policial_atual` e `cproeis_cadastro_policiais`; grava o ID atual
 * quando a URL informa um policial válido.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Trocar por sessão autenticada e validada no servidor.
 */
function histGetPolicial() {
  const params = new URLSearchParams(window.location.search);
  const urlId = params.get('id') || '';
  const storedId = localStorage.getItem(HIST_STORAGE_POLICIAL_ATUAL) || '';
  const id = urlId || storedId;
  const policial = histLoadList(HIST_STORAGE_POLICIAIS).find((item) => item.id === id) || null;

  if (policial && urlId) {
    localStorage.setItem(HIST_STORAGE_POLICIAL_ATUAL, policial.id);
  }

  return policial;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Normaliza a lista de escalados de uma vaga, mantendo compatibilidade com campos antigos.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} vaga - Vaga persistida pelo módulo de convênios.
 * @returns {Array<object>} Lista de escalados associados à vaga.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; lê campos em memória da vaga carregada do LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Persistir escalas em tabela própria com status de presença, pagamento e auditoria.
 */
function histGetEscalados(vaga) {
  const escalados = Array.isArray(vaga.escalados) ? vaga.escalados : [];
  if (escalados.length) return escalados;
  if (!vaga.policialEscaladoId && !vaga.policialEscalado) return [];
  return [{
    policialId: vaga.policialEscaladoId || '',
    nome: vaga.policialEscalado || '',
    acceptedAt: vaga.updatedAt || vaga.createdAt || ''
  }];
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Indica se uma vaga pertence ao histórico do policial ativo.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} vaga - Vaga analisada.
 * @param {object} policial - Policial ativo.
 * @returns {boolean} Verdadeiro quando o policial está na lista de escalados da vaga.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; cruza objetos carregados do LocalStorage em memória.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: No backend, consultar por chave de policial e competência para não depender de varredura local.
 */
function histVagaPertenceAoPolicial(vaga, policial) {
  return histGetEscalados(vaga).some((escala) => (
    escala.policialId === policial?.id ||
    escala.idFuncional === policial?.idFuncional ||
    escala.nome === policial?.nomeCompleto
  ));
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Monta a lista de serviços assumidos pelo policial com dados do convênio incorporados.
 *
 * PARÂMETROS E RETORNO:
 * @param {object|null} policial - Policial ativo.
 * @returns {Array<object>} Vagas escaladas ordenadas por data e horário.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê `cproeis_convenios_vagas` e `cproeis_contratos_convenios` do LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Consultar histórico de serviço em endpoint próprio com paginação e filtros de período.
 */
function histGetServicos(policial) {
  const convenioMap = new Map(histLoadList(HIST_STORAGE_CONVENIOS).map((convenio) => [convenio.id, convenio]));
  return histLoadList(HIST_STORAGE_VAGAS)
    .filter((vaga) => histVagaPertenceAoPolicial(vaga, policial))
    .map((vaga) => ({ ...vaga, convenio: convenioMap.get(vaga.convenioId) || {} }))
    .sort((a, b) => (
      String(a.dataServico || '').localeCompare(String(b.dataServico || '')) ||
      String(a.horaInicio || '').localeCompare(String(b.horaInicio || ''))
    ));
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Retorna o título textual do mês exibido no calendário.
 *
 * PARÂMETROS E RETORNO:
 * @param {Date} date - Data dentro do mês desejado.
 * @returns {string} Nome do mês e ano em português.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa armazenamento; usa apenas a data recebida.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Usar biblioteca de internacionalização se o sistema ganhar múltiplos idiomas.
 */
function histMonthTitle(date) {
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Renderiza o calendário mensal com marcações nos dias em que o policial está escalado.
 *
 * PARÂMETROS E RETORNO:
 * @param {Array<object>} servicos - Serviços filtrados para o policial.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; lê a lista recebida em memória e atualiza o DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Permitir clique no dia para abrir detalhes da escala quando houver backend de escala.
 */
function histRenderCalendario(servicos) {
  const calendar = document.getElementById('service-calendar');
  const title = document.getElementById('calendar-title');
  if (!calendar || !title) return;

  const year = historicoMesAtual.getFullYear();
  const month = historicoMesAtual.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const leading = (firstDay.getDay() + 6) % 7;
  const todayIso = new Date().toISOString().slice(0, 10);
  const byDate = new Map();

  servicos.forEach((vaga) => {
    if (!byDate.has(vaga.dataServico)) byDate.set(vaga.dataServico, []);
    byDate.get(vaga.dataServico).push(vaga);
  });

  title.textContent = histMonthTitle(historicoMesAtual);
  calendar.innerHTML = '';

  for (let i = 0; i < leading; i += 1) {
    const blank = document.createElement('div');
    blank.className = 'calendar-day is-muted';
    calendar.appendChild(blank);
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    const dateIso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const items = byDate.get(dateIso) || [];
    const cell = document.createElement('article');
    cell.className = `calendar-day${items.length ? ' has-service' : ''}${dateIso === todayIso ? ' is-today' : ''}`;
    cell.innerHTML = `<span class="day-number">${day}</span>`;

    items.slice(0, 3).forEach((vaga) => {
      const item = document.createElement('div');
      item.className = 'calendar-service';
      item.textContent = `${vaga.horaInicio || '--:--'} ${vaga.convenio.nome || vaga.nomeServico || 'Serviço'}`;
      cell.appendChild(item);
    });

    if (items.length > 3) {
      const more = document.createElement('div');
      more.className = 'calendar-more';
      more.textContent = `+${items.length - 3} serviço(s)`;
      cell.appendChild(more);
    }

    calendar.appendChild(cell);
  }
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Inicializa a tela de histórico do policial, conectando calendário e navegação mensal.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê LocalStorage para obter policial, convênios e vagas; não grava dados.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Recarregar dados por API ao trocar de mês, evitando carregar histórico completo no navegador.
 */
function inicializarHistoricoServicoPolicial() {
  const policial = histGetPolicial();
  const servicos = histGetServicos(policial);
  const count = document.getElementById('historico-count');

  if (count) {
    count.textContent = servicos.length
      ? `${servicos.length} serviço(s) assumido(s) pelo policial.`
      : 'Nenhum serviço assumido até o momento.';
  }

  histRenderCalendario(servicos);

  document.getElementById('calendar-prev')?.addEventListener('click', () => {
    historicoMesAtual.setMonth(historicoMesAtual.getMonth() - 1);
    histRenderCalendario(servicos);
  });

  document.getElementById('calendar-next')?.addEventListener('click', () => {
    historicoMesAtual.setMonth(historicoMesAtual.getMonth() + 1);
    histRenderCalendario(servicos);
  });

  document.getElementById('calendar-today')?.addEventListener('click', () => {
    historicoMesAtual = new Date();
    historicoMesAtual.setDate(1);
    histRenderCalendario(servicos);
  });
}

inicializarHistoricoServicoPolicial();

/*
  DESCRIÇÃO DA FUNÇÃO: Inicializa o menu hamburger padronizado desta página, conectando
  o botão do cabeçalho ao bloco de navegação em linha.
  PARÂMETROS E RETORNO: Não recebe parâmetros e não retorna valores; atua sobre elementos
  DOM marcados com .module-header, .menu-toggle e .module-menu.
  ARMAZENAMENTO E PERSISTÊNCIA: Lê e grava apenas atributos/classes temporários no DOM
  (aria-expanded, aria-hidden e is-open); não utiliza LocalStorage, arrays persistentes ou APIs.
  TODO: Em produção, centralizar este comportamento em componente compartilhado e sincronizar
  o item ativo com o roteamento autenticado.
*/
function inicializarMenuHamburgerAcessoPolicialHistorico() {
  const moduleHeader = document.querySelector('.module-header');
  const menuToggle = document.querySelector('.menu-toggle');
  const moduleMenu = document.querySelector('.module-menu');

  if (!moduleHeader || !menuToggle || !moduleMenu) {
    return;
  }

  function definirEstadoMenu(shouldOpen) {
    menuToggle.setAttribute('aria-expanded', String(shouldOpen));
    menuToggle.setAttribute('aria-label', shouldOpen ? 'Fechar menu do policial' : 'Abrir menu do policial');
    moduleMenu.setAttribute('aria-hidden', String(!shouldOpen));
    moduleHeader.classList.toggle('is-open', shouldOpen);
  }

  menuToggle.addEventListener('click', () => {
    definirEstadoMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
  });

  moduleMenu.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      definirEstadoMenu(false);
    }
  });

  document.addEventListener('click', (event) => {
    if (!moduleHeader.contains(event.target)) {
      definirEstadoMenu(false);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      definirEstadoMenu(false);
      menuToggle.focus();
    }
  });
}

inicializarMenuHamburgerAcessoPolicialHistorico();
