const CONVENIOS_SESSION_STORAGE = 'cproeis_contratos_convenios';
const CONVENIO_ATUAL_STORAGE = 'cproeis_convenio_atual';
const CONVENIO_RESPONSAVEL_ATUAL_STORAGE = 'cproeis_convenio_responsavel_atual';

/*
  DESCRIÇÃO DA FUNÇÃO: Lê uma lista JSON do LocalStorage com retorno seguro para array vazio.
  PARÂMETROS E RETORNO: Recebe key (string) e retorna Array<object>.
  ARMAZENAMENTO E PERSISTÊNCIA: Lê LocalStorage; não grava dados.
  TODO: Em produção, substituir por chamada autenticada à API de convênios.
*/
function carregarListaSessaoConvenio(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (error) {
    return [];
  }
}

/*
  DESCRIÇÃO DA FUNÇÃO: Formata data ISO simples para exibição no cabeçalho do convênio.
  PARÂMETROS E RETORNO: Recebe value (string YYYY-MM-DD) e retorna data em DD/MM/YYYY ou hífen.
  ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava dados; apenas transforma o valor recebido.
  TODO: Centralizar formatação de data em utilitário comum do projeto.
*/
function formatarDataSessaoConvenio(value) {
  if (!value) return '-';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

/*
  DESCRIÇÃO DA FUNÇÃO: Converte uma data ISO simples em Date local, evitando deslocamentos
  de fuso horário no cálculo de dias até o vencimento do convênio.
  PARÂMETROS E RETORNO: Recebe value (string YYYY-MM-DD) e retorna Date válido ou Invalid Date.
  ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava dados; apenas transforma o valor recebido.
  TODO: Em produção, centralizar cálculo de datas no backend para impedir divergência por relógio local.
*/
function criarDataLocalSessaoConvenio(value) {
  if (!value) return new Date(NaN);
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/*
  DESCRIÇÃO DA FUNÇÃO: Garante que o CSS do alerta global de vencimento esteja disponível em
  qualquer página do responsável sem depender do arquivo CSS específico da tela.
  PARÂMETROS E RETORNO: Não recebe parâmetros e não retorna valores; injeta uma tag style uma única vez.
  ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava LocalStorage; altera somente o DOM da página atual.
  TODO: Em produção, mover estas regras para um stylesheet compartilhado versionado pelo sistema.
*/
function garantirEstiloAlertaVencimentoConvenio() {
  if (document.getElementById('convenio-expiration-alert-style')) return;

  const style = document.createElement('style');
  style.id = 'convenio-expiration-alert-style';
  style.textContent = `
    .contract-expiration-alert {
      width: min(1800px, calc(100% - 24px));
      margin: 28px auto 0;
      padding: 14px 16px;
      border: 1px solid #f1b7b2;
      border-left: 5px solid #dc3545;
      border-radius: 8px;
      background: #fff5f5;
      color: #842029;
      box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
    }

    main > .contract-expiration-alert:first-child {
      width: 100%;
      margin: 0 0 16px;
    }

    .contract-expiration-alert.is-hidden {
      display: none;
    }

    .contract-expiration-alert strong {
      display: block;
      margin-bottom: 3px;
      color: #842029;
      font-size: 15px;
    }

    .contract-expiration-alert span {
      display: block;
      color: #9f3a4a;
      font-size: 14px;
      font-weight: 700;
      line-height: 1.35;
    }
  `;
  document.head.appendChild(style);
}

/*
  DESCRIÇÃO DA FUNÇÃO: Injeta ajuste visual do menu do responsável para acomodar todas as
  opções diretas, incluindo renovação de contrato, sem depender de editar cada CSS legado.
  PARÂMETROS E RETORNO: Não recebe parâmetros e não retorna valores; cria uma tag style única.
  ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava LocalStorage; altera somente o DOM da página.
  TODO: Em produção, mover esta largura responsiva para o CSS compartilhado oficial do módulo.
*/
function garantirEstiloMenuResponsavelConvenio() {
  if (document.getElementById('convenio-session-menu-style')) return;

  const style = document.createElement('style');
  style.id = 'convenio-session-menu-style';
  style.textContent = `
    .module-header .module-menu a {
      width: clamp(178px, 12vw, 215px);
    }

    @media (max-width: 760px) {
      .module-header .module-menu a {
        width: min(100%, 320px);
      }
    }
  `;
  document.head.appendChild(style);
}

/*
  DESCRIÇÃO DA FUNÇÃO: Localiza ou cria o contêiner do alerta global logo após o header,
  mantendo compatibilidade com a tela de criação de vagas que já possuía esse elemento.
  PARÂMETROS E RETORNO: Não recebe parâmetros e retorna HTMLElement|null com o alerta disponível.
  ARMAZENAMENTO E PERSISTÊNCIA: Não usa LocalStorage; cria apenas um nó DOM temporário na página.
  TODO: Em produção, substituir criação local por componente compartilhado de notificações do convênio.
*/
function obterContainerAlertaVencimentoConvenio() {
  const existing = document.getElementById('contract-expiration-alert');
  if (existing) return existing;

  const header = document.querySelector('.module-header');
  if (!header) return null;

  const alertBox = document.createElement('div');
  alertBox.id = 'contract-expiration-alert';
  alertBox.className = 'contract-expiration-alert is-hidden';
  alertBox.setAttribute('role', 'alert');
  header.insertAdjacentElement('afterend', alertBox);
  return alertBox;
}

/*
  DESCRIÇÃO DA FUNÇÃO: Renderiza o alerta de vencimento em todas as telas do responsável logado
  quando o contrato estiver vencido ou faltarem 120 dias ou menos para o fim da vigência.
  PARÂMETROS E RETORNO: Recebe convenio (object|null) com campo fim em YYYY-MM-DD; não retorna valores.
  ARMAZENAMENTO E PERSISTÊNCIA: Lê somente o objeto de convênio já resolvido da sessão local e atualiza
  o DOM; não grava LocalStorage nem altera contratos.
  TODO: Em produção, transformar o limite de 120 dias em configuração administrativa e registrar ciência do alerta por responsável.
*/
function renderizarAlertaVencimentoConvenio(convenio) {
  garantirEstiloAlertaVencimentoConvenio();

  const alertBox = obterContainerAlertaVencimentoConvenio();
  if (!alertBox) return;

  alertBox.classList.add('is-hidden');
  alertBox.textContent = '';

  if (!convenio?.fim) return;

  const endDate = criarDataLocalSessaoConvenio(convenio.fim);
  const currentDate = criarDataLocalSessaoConvenio(new Date().toISOString().slice(0, 10));
  if (Number.isNaN(endDate.getTime()) || Number.isNaN(currentDate.getTime())) return;

  const daysUntilExpiration = Math.ceil((endDate - currentDate) / 86400000);
  if (daysUntilExpiration > 120) return;

  const expired = daysUntilExpiration < 0;
  const absoluteDays = Math.abs(daysUntilExpiration);
  const dayLabel = absoluteDays === 1 ? 'dia' : 'dias';
  const title = expired ? 'Contrato vencido' : 'Atenção ao vencimento do contrato';
  const message = expired
    ? `O contrato venceu há ${absoluteDays} ${dayLabel}, em ${formatarDataSessaoConvenio(convenio.fim)}.`
    : `Faltam ${daysUntilExpiration} ${dayLabel} para o vencimento do contrato, em ${formatarDataSessaoConvenio(convenio.fim)}.`;

  const titleElement = document.createElement('strong');
  titleElement.textContent = title;

  const messageElement = document.createElement('span');
  messageElement.textContent = `${message} Verifique a renovação ou o planejamento das próximas vagas.`;

  alertBox.append(titleElement, messageElement);
  alertBox.classList.remove('is-hidden');
}

/*
  DESCRIÇÃO DA FUNÇÃO: Resolve o convênio e responsável ativos para as páginas internas,
  priorizando dados da URL e usando LocalStorage como sessão local do protótipo.
  PARÂMETROS E RETORNO: Não recebe parâmetros; retorna objeto com convenio e responsavel.
  ARMAZENAMENTO E PERSISTÊNCIA: Lê URL e LocalStorage; grava convênio/responsável ativos quando
  há dados válidos na navegação de login.
  TODO: Em produção, trocar esta sessão local por autenticação real e autorização por função.
*/
function obterSessaoConvenio() {
  const params = new URLSearchParams(window.location.search);
  const urlConvenioId = params.get('id') || '';
  const urlResponsavel = params.get('responsavel') || '';
  const convenioId = urlConvenioId || localStorage.getItem(CONVENIO_ATUAL_STORAGE) || '';
  const responsavelId = urlResponsavel || localStorage.getItem(CONVENIO_RESPONSAVEL_ATUAL_STORAGE) || '';
  const convenio = carregarListaSessaoConvenio(CONVENIOS_SESSION_STORAGE).find((item) => item.id === convenioId) || null;

  if (!convenio) {
    return { convenio: null, responsavel: null };
  }

  const responsavel = (convenio.responsaveis || []).find((item) => {
    const ids = [item.id, item.cpf, item.nome].filter(Boolean).map(String);
    return ids.includes(responsavelId);
  }) || null;

  if (urlConvenioId) {
    localStorage.setItem(CONVENIO_ATUAL_STORAGE, convenio.id);
  }

  if (responsavel && urlResponsavel) {
    localStorage.setItem(CONVENIO_RESPONSAVEL_ATUAL_STORAGE, responsavel.id || responsavel.cpf || responsavel.nome || '');
  }

  return { convenio, responsavel };
}

/*
  DESCRIÇÃO DA FUNÇÃO: Aplica os dados do convênio logado ao header e aos links internos do menu.
  PARÂMETROS E RETORNO: Recebe convenio (object|null) e responsavel (object|null); não retorna valores.
  ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; atualiza textos e hrefs no DOM.
  TODO: Em produção, gerar menus por permissões do responsável autenticado.
*/
function aplicarSessaoConvenioNoHeader(convenio, responsavel) {
  /*
    DESCRIÇÃO DA FUNÇÃO: Aplica a sessão do convênio logado ao cabeçalho e normaliza os links
    do menu em páginas de `convenios/` e na página compartilhada em `contratos/`.
    PARÂMETROS E RETORNO: Recebe convenio (object|null) e responsavel (object|null); não retorna valores.
    ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; lê apenas window.location.pathname para decidir
    prefixos relativos e atualiza textos/hrefs no DOM com o responsável já resolvido da sessão local.
    TODO: Em produção, montar estes links a partir de rotas autenticadas do backend e validar permissões por responsável.
  */
  const title = document.getElementById('page-title');
  const subtitle = document.getElementById('page-subtitle');

  if (!convenio) {
    if (title) title.textContent = 'Convênio não disponível';
    if (subtitle) subtitle.textContent = 'Retorne ao acesso do convênio e selecione um responsável autorizado.';
    return;
  }

  if (title) title.textContent = 'Acesso do Convênio';
  if (subtitle) {
    subtitle.textContent = [
      convenio.nome || 'Convênio sem nome',
      `Contrato ${convenio.numero || '-'}`,
      `Vigência ${formatarDataSessaoConvenio(convenio.inicio)} até ${formatarDataSessaoConvenio(convenio.fim)}`,
      responsavel?.nome ? `Responsável: ${responsavel.nome}` : 'Responsável não informado'
    ].join(' | ');
  }

  const responsavelRef = responsavel ? (responsavel.id || responsavel.cpf || responsavel.nome || '') : '';
  const idParam = `id=${encodeURIComponent(convenio.id)}${responsavelRef ? `&responsavel=${encodeURIComponent(responsavelRef)}` : ''}`;
  const isContratosPage = window.location.pathname.includes('/contratos/');
  const convenioPath = isContratosPage ? '../convenios/' : '';
  const contratosPath = isContratosPage ? '' : '../contratos/';
  const links = {
    'menu-criar-vagas': `${convenioPath}criar-vagas.html?${idParam}`,
    'menu-acompanhamento': `${convenioPath}acompanhamento.html?${idParam}`,
    'menu-vagas': `${convenioPath}vagas.html?${idParam}`,
    'menu-vagas-calendario': `${convenioPath}vagas-calendario.html?${idParam}`,
    'menu-perfil-convenio': `${convenioPath}perfil.html?${idParam}`,
    'menu-dados-contrato': `${convenioPath}dados-contrato.html?${idParam}`,
    'menu-servicos': `${convenioPath}servicos.html?${idParam}`,
    'menu-criar-servico': `${convenioPath}criar-servico.html?${idParam}`,
    'menu-criar-curso': `${convenioPath}criar-curso.html?${idParam}`,
    'menu-historico-curso': `${convenioPath}historico-curso.html?${idParam}`,
    'menu-inscritos-curso': `${convenioPath}inscritos-curso.html?${idParam}`,
    'menu-renovacao-contrato': `${convenioPath}renovacao-contrato.html?${idParam}`,
    'menu-detalhes-convenio': `${contratosPath}detalhes-convenio.html?${idParam}`,
    'course-details-link': `${contratosPath}detalhes-convenio.html?${idParam}`
  };

  Object.entries(links).forEach(([id, href]) => {
    const link = document.getElementById(id);
    if (link) link.href = href;
  });
}

/*
  DESCRIÇÃO DA FUNÇÃO: Configura a opção Sair do menu do convênio, limpando a sessão local
  e retornando à tabela de responsáveis para novo login.
  PARÂMETROS E RETORNO: Não recebe parâmetros nem retorna valores; registra listeners nos links
  marcados com data-logout-convenio.
  ARMAZENAMENTO E PERSISTÊNCIA: Remove cproeis_convenio_atual e cproeis_convenio_responsavel_atual
  do LocalStorage; não altera contratos, vagas ou responsáveis cadastrados.
  TODO: Em produção, invalidar a sessão do responsável no backend e registrar auditoria de logout.
*/
function inicializarSairConvenio() {
  document.querySelectorAll('[data-logout-convenio="true"]').forEach((link) => {
    link.addEventListener('click', () => {
      localStorage.removeItem(CONVENIO_ATUAL_STORAGE);
      localStorage.removeItem(CONVENIO_RESPONSAVEL_ATUAL_STORAGE);
    });
  });
}

const sessaoConvenio = obterSessaoConvenio();
aplicarSessaoConvenioNoHeader(sessaoConvenio.convenio, sessaoConvenio.responsavel);
garantirEstiloMenuResponsavelConvenio();
renderizarAlertaVencimentoConvenio(sessaoConvenio.convenio);
inicializarSairConvenio();
