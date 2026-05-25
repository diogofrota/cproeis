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
function inicializarMenuHamburgerAcessoComandante() {
  const moduleHeader = document.querySelector('.module-header');
  const menuToggle = document.querySelector('.menu-toggle');
  const moduleMenu = document.querySelector('.module-menu');

  if (!moduleHeader || !menuToggle || !moduleMenu) {
    return;
  }

  function definirEstadoMenu(shouldOpen) {
    menuToggle.setAttribute('aria-expanded', String(shouldOpen));
    menuToggle.setAttribute('aria-label', shouldOpen ? 'Fechar menu de acesso comandante' : 'Abrir menu de acesso comandante');
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

inicializarMenuHamburgerAcessoComandante();
