const GSI_MONITOR_STORAGE_VAGAS = 'cproeis_convenios_vagas';
const GSI_MONITOR_STORAGE_CONVENIOS = 'cproeis_contratos_convenios';

const gsiMonitorClasses = {
  A: 'Classe A',
  B: 'Classe B',
  C: 'Classe C',
  D: 'Classe D',
  'C/D': 'Classe C/D'
};

const gsiMonitorTipos = {
  servico12: 'Serviço 12h',
  servico8: 'Serviço 8h',
  servico6: 'Serviço 6h'
};

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Lê uma lista JSON do LocalStorage para o monitoramento do GSI.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} key - Chave consultada.
 * @returns {Array<object>} Lista persistida ou array vazio.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê LocalStorage e não grava alterações.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Substituir por endpoint de monitoramento com permissões do GSI.
 */
function gsiMonitorLoadList(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (error) {
    return [];
  }
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Escapa conteúdo vindo do LocalStorage antes de exibir na tabela.
 *
 * PARÂMETROS E RETORNO:
 * @param {unknown} value - Valor que será exibido.
 * @returns {string} Texto seguro para HTML.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa armazenamento.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Manter sanitização no backend e usar Content Security Policy em produção.
 */
function gsiMonitorEscape(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Formata uma data ISO para padrão brasileiro.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} value - Data em YYYY-MM-DD ou ISO completo.
 * @returns {string} Data DD/MM/YYYY ou hífen.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não lê nem grava dados.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Centralizar utilitários de data para todos os módulos.
 */
function gsiMonitorFormatDate(value) {
  if (!value) return '-';
  const [year, month, day] = String(value).slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Resume os policiais escalados e presenças de uma vaga.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} vaga - Vaga persistida.
 * @returns {{policiais: string, presencas: number, escalados: number}} Resumo operacional.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; lê apenas o objeto de vaga carregado do LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Consultar escala e presença em entidades separadas quando houver backend.
 */
function gsiMonitorResumoEscala(vaga) {
  const escalados = Array.isArray(vaga.escalados) ? vaga.escalados : [];
  const nomes = escalados.map((escala) => escala.nome).filter(Boolean);
  const presencas = escalados.filter((escala) => escala.presencaConfirmadaAt).length;
  return {
    policiais: nomes.length ? nomes.join(', ') : (vaga.policialEscalado || 'Sem policial'),
    presencas,
    escalados: nomes.length || Number(vaga.preenchidas || 0)
  };
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Popula o filtro de convênios do monitoramento.
 *
 * PARÂMETROS E RETORNO:
 * @param {Array<object>} convenios - Convênios cadastrados.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; escreve opções no DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Carregar opções por API, respeitando permissões e paginação.
 */
function gsiMonitorPopulateConvenios(convenios) {
  const select = document.getElementById('gsi-monitor-convenio');
  if (!select || select.dataset.loaded === 'true') return;
  select.dataset.loaded = 'true';
  select.innerHTML = '<option value="">Todos</option>' + convenios
    .map((convenio) => `<option value="${gsiMonitorEscape(convenio.id)}">${gsiMonitorEscape(convenio.nome || convenio.numero || '-')}</option>`)
    .join('');
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Renderiza todas as vagas criadas pelos convênios para acompanhamento do GSI.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê `cproeis_convenios_vagas` e `cproeis_contratos_convenios` do LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Fazer consulta server-side com trilha de auditoria e filtros oficiais do GSI.
 */
function gsiMonitorRenderVagas() {
  const body = document.getElementById('gsi-monitor-body');
  if (!body) return;

  const convenios = gsiMonitorLoadList(GSI_MONITOR_STORAGE_CONVENIOS);
  const convenioMap = new Map(convenios.map((convenio) => [convenio.id, convenio]));
  gsiMonitorPopulateConvenios(convenios);

  const text = String(document.getElementById('gsi-monitor-text')?.value || '').trim().toLowerCase();
  const date = document.getElementById('gsi-monitor-date')?.value || '';
  const status = document.getElementById('gsi-monitor-status')?.value || '';
  const convenioId = document.getElementById('gsi-monitor-convenio')?.value || '';

  const vagas = gsiMonitorLoadList(GSI_MONITOR_STORAGE_VAGAS)
    .filter((vaga) => !convenioId || vaga.convenioId === convenioId)
    .filter((vaga) => !date || vaga.dataServico === date)
    .filter((vaga) => {
      const resumo = gsiMonitorResumoEscala(vaga);
      if (status === 'sem-policial' && resumo.escalados > 0) return false;
      if (status === 'com-policial' && resumo.escalados <= 0) return false;
      if (status === 'com-presenca' && resumo.presencas <= 0) return false;
      if (status === 'sem-presenca' && resumo.presencas > 0) return false;
      const convenio = convenioMap.get(vaga.convenioId) || {};
      const searchable = [
        convenio.nome,
        convenio.numero,
        vaga.nomeServico,
        vaga.localServico,
        vaga.classe,
        vaga.tipoServico,
        resumo.policiais,
        resumo.presencas ? 'com presença' : 'sem presença'
      ].join(' ').toLowerCase();
      return !text || searchable.includes(text);
    })
    .sort((a, b) => String(a.dataServico || '').localeCompare(String(b.dataServico || '')));

  const count = document.getElementById('gsi-monitor-count');
  if (count) {
    count.textContent = vagas.length
      ? `${vagas.length} vaga(s) criada(s) encontradas no monitoramento.`
      : 'Nenhuma vaga encontrada para os filtros selecionados.';
  }

  if (!vagas.length) {
    body.innerHTML = '<tr><td class="empty" colspan="9">Nenhuma vaga encontrada.</td></tr>';
    return;
  }

  body.innerHTML = vagas.map((vaga) => {
    const convenio = convenioMap.get(vaga.convenioId) || {};
    const resumo = gsiMonitorResumoEscala(vaga);
    const statusLabel = vaga.permissaoGsiStatus === 'aprovada' || vaga.liberadaParaPolicial
      ? 'Autorizada'
      : 'Criada';
    return `
      <tr>
        <td>${gsiMonitorEscape(gsiMonitorFormatDate(vaga.dataServico))}</td>
        <td>${gsiMonitorEscape(convenio.nome || convenio.numero || '-')}</td>
        <td>${gsiMonitorEscape(vaga.nomeServico || '-')}</td>
        <td>${gsiMonitorEscape(gsiMonitorClasses[vaga.classe] || vaga.classe || '-')}</td>
        <td>${gsiMonitorEscape(gsiMonitorTipos[vaga.tipoServico] || vaga.tipoServico || '-')}</td>
        <td>${gsiMonitorEscape(`${vaga.horaInicio || '-'} até ${vaga.horaFim || '-'}`)}</td>
        <td>${gsiMonitorEscape(resumo.policiais)}</td>
        <td><span class="badge">${resumo.presencas ? `${resumo.presencas} presente(s)` : 'Sem presença'}</span></td>
        <td>${gsiMonitorEscape(statusLabel)}</td>
      </tr>
    `;
  }).join('');
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Inicializa filtros do monitoramento do GSI.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; conecta eventos que disparam nova leitura do LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Sincronizar filtros com URL quando houver rotas reais.
 */
function inicializarMonitoramentoVagasGsi() {
  gsiMonitorRenderVagas();
  ['gsi-monitor-text', 'gsi-monitor-date', 'gsi-monitor-status', 'gsi-monitor-convenio'].forEach((id) => {
    document.getElementById(id)?.addEventListener('input', gsiMonitorRenderVagas);
    document.getElementById(id)?.addEventListener('change', gsiMonitorRenderVagas);
  });
}

/*
  DESCRIÇÃO DA FUNÇÃO: Inicializa o menu hamburger do GSI, conectando o botão de abertura
  ao painel de navegação e fechando a lista quando o usuário seleciona um item ou clica fora.
  PARÂMETROS E RETORNO: Não recebe parâmetros diretamente e não retorna valores; atua sobre
  elementos DOM identificados por classe e id.
  ARMAZENAMENTO E PERSISTÊNCIA: Lê apenas o estado visual atual por atributos/classes no DOM
  e grava temporariamente aria-expanded e a classe is-open no menu; não utiliza LocalStorage,
  arrays locais persistentes, variáveis globais permanentes ou APIs.
  TODO: Em produção, integrar o estado ativo do menu com roteamento autenticado e tratar
  navegação assíncrona com feedback de carregamento e tratamento de erro.
*/
function inicializarMenuHamburgerGsi() {
  const moduleHeader = document.querySelector('.module-header');
  const menuToggle = document.querySelector('.menu-toggle');
  const moduleMenu = document.querySelector('#gsi-menu');

  if (!moduleHeader || !menuToggle || !moduleMenu) {
    return;
  }

  /*
    DESCRIÇÃO DO BLOCO: Alterna o estado aberto/fechado do menu e sincroniza a classe visual
    com os atributos aria-expanded e aria-hidden usados por leitores de tela.
    PARÂMETROS E RETORNO: Recebe shouldOpen (boolean), indicando se o painel deve ficar
    visível, e não retorna valor.
    ARMAZENAMENTO E PERSISTÊNCIA: Grava somente estado efêmero no DOM.
    TODO: Em ambiente online, registrar métricas de uso do menu sem expor dados pessoais.
  */
  function definirEstadoMenu(shouldOpen) {
    menuToggle.setAttribute('aria-expanded', String(shouldOpen));
    menuToggle.setAttribute('aria-label', shouldOpen ? 'Fechar menu do GSI' : 'Abrir menu do GSI');
    moduleMenu.setAttribute('aria-hidden', String(!shouldOpen));
    moduleHeader.classList.toggle('is-open', shouldOpen);
  }

  menuToggle.addEventListener('click', () => {
    const shouldOpen = menuToggle.getAttribute('aria-expanded') !== 'true';
    definirEstadoMenu(shouldOpen);
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

inicializarMenuHamburgerGsi();
inicializarMonitoramentoVagasGsi();
