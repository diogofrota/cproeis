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

/*
  DESCRIÇÃO DA FUNÇÃO: Injeta uma regra visual única para botões vazios de menu, mantendo o mesmo
  tamanho dos links existentes sem permitir clique, foco por teclado ou leitura por tecnologias assistivas.
  PARÂMETROS E RETORNO: Não recebe parâmetros e não retorna valores; cria uma tag <style> apenas uma vez
  quando ainda não existe no documento.
  ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava LocalStorage ou APIs; altera somente o DOM atual ao
  adicionar CSS transitório para a sessão da página.
  TODO: Em produção, mover esta regra para o CSS principal do design system quando os menus forem
  consolidados em um componente compartilhado.
*/
function garantirEstiloDosEspacosDeMenu() {
  if (document.getElementById('menu-placeholder-style')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'menu-placeholder-style';
  style.textContent = `
    .module-header .module-menu {
      width: min(1800px, calc(100% - 24px)) !important;
      justify-content: space-between !important;
    }

    .module-menu a.menu-placeholder {
      pointer-events: none;
      color: transparent !important;
      user-select: none;
      cursor: default;
    }

    .module-menu a.menu-placeholder:hover,
    .module-menu a.menu-placeholder:focus-visible {
      transform: none !important;
      box-shadow: none !important;
    }
  `;

  document.head.appendChild(style);
}

/*
  DESCRIÇÃO DA FUNÇÃO: Calcula quantos botões cabem em uma linha do menu atual para que as páginas
  possam receber botões vazios e manter uma quantidade fixa por linha.
  PARÂMETROS E RETORNO: Recebe o elemento HTMLElement do menu e uma lista de links reais visíveis;
  retorna um número inteiro com a capacidade estimada da linha.
  ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; lê apenas medidas do DOM renderizado e estilos
  computados da página atual.
  TODO: Em produção, substituir a estimativa por uma variável explícita do componente de menu, evitando
  dependência de medição visual quando o layout for renderizado pelo backend ou por framework.
*/
function calcularCapacidadeDaLinhaDoMenu(menu, linksReais) {
  const estilo = window.getComputedStyle(menu);
  const colunasGrid = estilo.gridTemplateColumns && estilo.gridTemplateColumns !== 'none'
    ? estilo.gridTemplateColumns.split(' ').filter(Boolean).length
    : 0;

  if (estilo.display.includes('grid') && colunasGrid > 1) {
    return colunasGrid;
  }

  const primeiroLink = linksReais[0];
  const larguraMenu = menu.getBoundingClientRect().width;
  const larguraLink = primeiroLink.getBoundingClientRect().width;
  const espacoColuna = Number.parseFloat(estilo.columnGap || estilo.gap) || 0;
  const capacidadePorMedida = Math.floor((larguraMenu + espacoColuna) / (larguraLink + espacoColuna));

  if (capacidadePorMedida > 1) {
    return capacidadePorMedida;
  }

  const topoPrimeiraLinha = Math.round(primeiroLink.getBoundingClientRect().top);
  const itensNaPrimeiraLinha = linksReais.filter((link) => (
    Math.abs(Math.round(link.getBoundingClientRect().top) - topoPrimeiraLinha) <= 2
  )).length;

  return Math.max(1, itensNaPrimeiraLinha);
}

/*
  DESCRIÇÃO DA FUNÇÃO: Completa cada .module-menu com botões vazios ao final da última linha,
  estabilizando a posição dos botões reais entre páginas com quantidades diferentes de opções.
  PARÂMETROS E RETORNO: Não recebe parâmetros e não retorna valores; percorre os menus existentes no DOM.
  ARMAZENAMENTO E PERSISTÊNCIA: Não usa LocalStorage, arrays persistentes ou APIs; remove e recria apenas
  elementos DOM com a classe .menu-placeholder conforme o tamanho atual da tela.
  TODO: Em produção, trocar os placeholders por uma configuração declarativa por perfil de acesso, caso
  a quantidade fixa por linha precise variar por módulo ou permissão do usuário.
*/
function preencherLinhasDosMenusComEspacos() {
  garantirEstiloDosEspacosDeMenu();

  document.querySelectorAll('.module-menu').forEach((menu) => {
    menu.querySelectorAll('.menu-placeholder').forEach((placeholder) => placeholder.remove());

    const linksReais = Array.from(menu.querySelectorAll(':scope > a')).filter((link) => {
      const estilo = window.getComputedStyle(link);
      return !link.classList.contains('menu-placeholder') && estilo.display !== 'none';
    });

    if (!linksReais.length) {
      return;
    }

    const capacidadeLinha = calcularCapacidadeDaLinhaDoMenu(menu, linksReais);
    const resto = linksReais.length % capacidadeLinha;
    const totalEspacos = resto === 0 ? 0 : capacidadeLinha - resto;

    for (let indice = 0; indice < totalEspacos; indice += 1) {
      const placeholder = document.createElement('a');
      placeholder.className = 'menu-placeholder';
      placeholder.href = '#';
      placeholder.setAttribute('aria-hidden', 'true');
      placeholder.setAttribute('tabindex', '-1');
      placeholder.dataset.historyBack = 'false';
      placeholder.textContent = '';
      menu.appendChild(placeholder);
    }
  });
}

/*
  DESCRIÇÃO DA FUNÇÃO: Agenda o preenchimento dos menus após o navegador concluir o layout, evitando
  cálculo com dimensões ainda incompletas.
  PARÂMETROS E RETORNO: Não recebe parâmetros e não retorna valores; usa requestAnimationFrame para
  executar o ajuste no próximo ciclo visual.
  ARMAZENAMENTO E PERSISTÊNCIA: Não persiste dados; usa apenas uma variável local para controlar o
  agendamento temporário da execução.
  TODO: Em produção, integrar este agendamento ao ciclo de montagem do componente de menu para evitar
  listeners globais quando houver roteamento SPA.
*/
function inicializarPreenchimentoFixoDosMenus() {
  let framePendente = null;

  const agendarPreenchimento = () => {
    if (framePendente) {
      window.cancelAnimationFrame(framePendente);
    }

    framePendente = window.requestAnimationFrame(() => {
      framePendente = null;
      preencherLinhasDosMenusComEspacos();
    });
  };

  agendarPreenchimento();
  window.addEventListener('load', agendarPreenchimento);
  window.addEventListener('resize', agendarPreenchimento);
}

inicializarVoltarPorHistorico();
inicializarPreenchimentoFixoDosMenus();
