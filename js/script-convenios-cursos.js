const STORAGE_CONVENIOS = 'cproeis_contratos_convenios';

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Carrega os convênios cadastrados no navegador para identificar se a tela de cursos foi aberta
 * a partir de um convênio específico.
 *
 * PARÂMETROS E RETORNO:
 * @returns {Array<object>} Lista de convênios persistidos ou array vazio quando não houver dados válidos.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê dados do LocalStorage na chave `cproeis_contratos_convenios`; não grava informações.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: substituir esta leitura local por consulta autenticada ao backend quando o módulo de cursos for online.
 */
function loadConvenios() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_CONVENIOS)) || [];
  } catch (error) {
    return [];
  }
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Formata uma data ISO simples para o padrão brasileiro usado no cabeçalho do convênio.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} value - Data no formato YYYY-MM-DD.
 * @returns {string} Data formatada como DD/MM/YYYY ou hífen quando o valor não existir.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa armazenamento; transforma apenas o valor recebido.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: centralizar formatação de datas em utilitário compartilhado quando houver build modular.
 */
function formatDate(value) {
  if (!value) return '-';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Localiza o convênio informado na URL e atualiza a página para refletir o contrato selecionado.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê o parâmetro `id` da URL e consulta o LocalStorage de convênios; grava apenas textos e links no DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: trocar o uso de query string por sessão segura e carregar permissões do usuário antes de exibir opções.
 */
function hydrateCursoMenu() {
  const params = new URLSearchParams(window.location.search);
  const convenioId = params.get('id') || '';
  const backLink = document.getElementById('back-menu-link');
  const query = params.toString();
  const currentPage = window.location.pathname.split('/').pop();

  if (convenioId && backLink && currentPage === 'cursos.html') {
    backLink.href = `operacao.html?${query}`;
  }

  if (convenioId && backLink && currentPage !== 'cursos.html') {
    backLink.href = `cursos.html?${query}`;
  }

  const convenio = loadConvenios().find((item) => item.id === convenioId);
  if (!convenio) return;

  document.getElementById('page-title').textContent = convenio.nome || 'Cursos';
  document.getElementById('page-subtitle').textContent = `Contrato ${convenio.numero || '-'} | Vigência de ${formatDate(convenio.inicio)} até ${formatDate(convenio.fim)}`;
}

hydrateCursoMenu();

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
function inicializarMenuHamburgerConveniosCursos() {
  const moduleHeader = document.querySelector('.module-header');
  const menuToggle = document.querySelector('.menu-toggle');
  const moduleMenu = document.querySelector('.module-menu');

  if (!moduleHeader || !menuToggle || !moduleMenu) {
    return;
  }

  function definirEstadoMenu(shouldOpen) {
    menuToggle.setAttribute('aria-expanded', String(shouldOpen));
    menuToggle.setAttribute('aria-label', shouldOpen ? 'Fechar menu de cursos' : 'Abrir menu de cursos');
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

inicializarMenuHamburgerConveniosCursos();
