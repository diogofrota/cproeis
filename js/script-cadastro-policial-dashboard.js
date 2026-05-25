const STORAGE_KEY = 'cproeis_cadastro_policiais';

const chartColors = [
  '#1f2a8a',
  '#2563eb',
  '#0f766e',
  '#16a34a',
  '#ca8a04',
  '#dc2626',
  '#7c3aed',
  '#475569'
];

function loadPoliciais() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Carrega os policiais cadastrados para alimentar os indicadores do dashboard.
   * PARÂMETROS E RETORNO: Não recebe parâmetros; retorna um array de policiais ou array vazio em caso de erro.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê a chave STORAGE_KEY do localStorage, a mesma usada pelo cadastro.
   * TODO: Em produção, trocar a leitura local por endpoint de estatísticas paginado e protegido por perfil.
   */
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function displayValue(value) {
  return value || 'Não informado';
}

function countBy(items, key) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Agrupa os policiais por um campo e conta quantos registros existem em cada valor.
   * PARÂMETROS E RETORNO: Recebe um array de objetos e a chave a ser agrupada; retorna objeto com contagens.
   * ARMAZENAMENTO E PERSISTÊNCIA: Usa apenas dados em memória carregados do localStorage; não grava dados.
   * TODO: Em produção, mover agregações para consultas SQL com GROUP BY para grandes volumes.
   */
  return items.reduce((accumulator, item) => {
    const label = displayValue(item[key]);
    accumulator[label] = (accumulator[label] || 0) + 1;
    return accumulator;
  }, {});
}

function toChartData(groupedData) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Converte um objeto de contagem em arrays de labels e valores aceitos pelo Chart.js.
   * PARÂMETROS E RETORNO: Recebe objeto no formato {label: quantidade}; retorna {labels, values}.
   * ARMAZENAMENTO E PERSISTÊNCIA: Trabalha somente com estrutura em memória e não persiste alterações.
   * TODO: Em produção, padronizar ordenação e cores por domínio em uma camada compartilhada.
   */
  const entries = Object.entries(groupedData).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return {
    labels: entries.map(([label]) => label),
    values: entries.map(([, value]) => value)
  };
}

function renderSummary(policiais) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Atualiza os cartões de resumo com totais úteis para leitura rápida do efetivo.
   * PARÂMETROS E RETORNO: Recebe array de policiais e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê dados em memória e escreve apenas nos elementos HTML de resumo.
   * TODO: Em ambiente online, incluir filtros por período, unidade e situação funcional.
   */
  const unidades = new Set(policiais.map((policial) => policial.unidade).filter(Boolean));
  const ativos = policiais.filter((policial) => policial.situacaoFuncional === 'Ativo').length;
  const comComportamento = policiais.filter((policial) => policial.comportamento).length;

  document.getElementById('total-policiais').textContent = policiais.length;
  document.getElementById('total-unidades').textContent = unidades.size;
  document.getElementById('total-ativos').textContent = ativos;
  document.getElementById('total-comportamento').textContent = comComportamento;
}

function renderChart(canvasId, title, groupedData, type = 'bar') {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Renderiza um gráfico Chart.js para uma dimensão do cadastro de policiais.
   * PARÂMETROS E RETORNO: Recebe id do canvas, título, objeto de contagem e tipo do gráfico; não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê dados agregados em memória e desenha no canvas; não grava localStorage.
   * TODO: Em produção, tratar estados de carregamento/erro vindos da API e permitir exportação dos gráficos.
   */
  const canvas = document.getElementById(canvasId);
  const chartData = toChartData(groupedData);

  if (!canvas || chartData.labels.length === 0 || typeof Chart === 'undefined') return;

  new Chart(canvas, {
    type,
    data: {
      labels: chartData.labels,
      datasets: [{
        label: title,
        data: chartData.values,
        backgroundColor: chartColors,
        borderColor: '#ffffff',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: type !== 'bar',
          position: 'bottom'
        }
      },
      scales: type === 'bar' ? {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      } : {}
    }
  });
}

function renderDashboard() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Orquestra a leitura dos dados e a montagem completa dos cartões e gráficos.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê os policiais do localStorage e escreve resultados no DOM/canvas.
   * TODO: Em produção, substituir por chamada a serviço de BI/API com cache, permissões e filtros.
   */
  const policiais = loadPoliciais();
  const statusElement = document.getElementById('dashboard-status');

  renderSummary(policiais);

  if (typeof Chart === 'undefined') {
    statusElement.textContent = 'Não foi possível carregar a biblioteca de gráficos.';
    return;
  }

  if (policiais.length === 0) {
    statusElement.textContent = 'Nenhum policial cadastrado para gerar indicadores.';
    return;
  }

  renderChart('posto-chart', 'Posto/Graduação', countBy(policiais, 'postoGraduacao'));
  renderChart('unidade-chart', 'Unidade', countBy(policiais, 'unidade'));
  renderChart('situacao-chart', 'Situação Funcional', countBy(policiais, 'situacaoFuncional'), 'doughnut');
  renderChart('sanitaria-chart', 'Condição Sanitária', countBy(policiais, 'situacaoSanitaria'), 'doughnut');
  renderChart('comportamento-chart', 'Comportamento', countBy(policiais, 'comportamento'));

  statusElement.textContent = 'Indicadores atualizados com base nos cadastros salvos neste navegador.';
}

renderDashboard();

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Inicializa o menu hamburger do cadastro de policiais, abrindo a lista de páginas do módulo
 * dentro do cabeçalho e fechando ao escolher uma opção, clicar fora ou pressionar Escape.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void} Não retorna valores; conecta eventos aos elementos do DOM quando eles existem.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa LocalStorage nem APIs; grava apenas estado temporário em aria-expanded, aria-hidden
 * e na classe CSS is-open do header.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: integrar o item ativo e as permissões do menu ao roteamento autenticado em produção.
 */
function inicializarMenuHamburgerCadastroPolicial() {
  const moduleHeader = document.querySelector('.module-header');
  const menuToggle = document.querySelector('.menu-toggle');
  const moduleMenu = document.querySelector('#cadastro-policial-menu');

  if (!moduleHeader || !menuToggle || !moduleMenu) {
    return;
  }

  function definirEstadoMenu(shouldOpen) {
    menuToggle.setAttribute('aria-expanded', String(shouldOpen));
    menuToggle.setAttribute('aria-label', shouldOpen ? 'Fechar menu do cadastro de policiais' : 'Abrir menu do cadastro de policiais');
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

inicializarMenuHamburgerCadastroPolicial();
