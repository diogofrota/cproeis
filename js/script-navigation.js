/*
  DESCRIÇÃO DA FUNÇÃO: Centraliza o comportamento dos links "Voltar" usados nos menus do sistema,
  fazendo o retorno para a página anterior do navegador quando houver histórico disponível.
  PARÂMETROS E RETORNO: Não recebe parâmetros diretamente e não retorna valores; registra um listener
  global de clique no documento e identifica links com classe .menu-back-link ou .back-link cujo texto
  visível seja "Voltar".
  ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava LocalStorage, arrays persistentes, variáveis globais
  permanentes ou APIs; usa apenas window.history e o href do próprio link como fallback de navegação.
  TODO: Em produção, substituir o retorno por roteamento autenticado, preservando origem segura e evitando
  navegação para páginas externas quando houver histórico fora do sistema.
*/
function inicializarVoltarPorHistorico() {
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a.menu-back-link, a.back-link');

    if (!link || link.textContent.trim() !== 'Voltar' || link.dataset.historyBack === 'false') {
      return;
    }

    if (window.history.length > 1) {
      event.preventDefault();
      window.history.back();
    }
  });
}

inicializarVoltarPorHistorico();
