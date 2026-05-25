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
