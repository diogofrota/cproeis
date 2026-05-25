const STORAGE_POLICIAIS = 'cproeis_cadastro_policiais';
const STORAGE_VAGAS = 'cproeis_convenios_vagas';
const STORAGE_CONVENIOS = 'cproeis_contratos_convenios';
const STORAGE_POLICIAL_ATUAL = 'cproeis_acesso_policial_atual';

const gruposClasse = {
  A: 'Classe A',
  B: 'Classe B',
  C: 'Classe C',
  D: 'Classe D',
  'C/D': 'Classe C/D'
};

const tiposServico = {
  servico12: 'Serviço 12h',
  servico8: 'Serviço 8h',
  servico6: 'Serviço 6h'
};

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Lê listas JSON salvas no navegador e devolve sempre um array seguro para uso nas telas.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} key - Chave do LocalStorage que será consultada.
 * @returns {Array<object>} Lista persistida ou array vazio em caso de ausência/erro.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê dados do LocalStorage e não realiza gravação.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: substituir leituras locais por API autenticada com tratamento de erro e sessão do policial.
 */
function loadList(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (error) {
    return [];
  }
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Formata data ISO simples para exibição brasileira nas tabelas.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} value - Data no formato YYYY-MM-DD.
 * @returns {string} Data no formato DD/MM/YYYY ou hífen quando ausente.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa armazenamento; transforma somente o valor recebido.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: centralizar formatação de datas em componente compartilhado do sistema.
 */
function formatDate(value) {
  if (!value) return '-';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Busca o policial selecionado na URL para montar menu e filtros individuais.
 *
 * PARÂMETROS E RETORNO:
 * @returns {object|null} Policial encontrado no cadastro local ou nulo quando o ID é inválido.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê o parâmetro `id` da URL e consulta `cproeis_cadastro_policiais` no LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: trocar query string por token de sessão autenticado quando existir login real do policial.
 */
function getSelectedPolicial() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Recupera o policial em sessão local, priorizando o ID da URL quando
   * o usuário acabou de clicar em Logar e mantendo esse ID nas navegações internas do menu.
   * PARÂMETROS E RETORNO: Não recebe parâmetros; retorna o objeto do policial encontrado ou null.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê o parâmetro id da URL, lê a lista de policiais em LocalStorage
   * e grava o ID atual em cproeis_acesso_policial_atual para manter a sessão local do protótipo.
   * TODO: Em produção, substituir esta sessão local por autenticação real com expiração e logout seguro.
   */
  const params = new URLSearchParams(window.location.search);
  const urlId = params.get('id') || '';
  const storedId = localStorage.getItem(STORAGE_POLICIAL_ATUAL) || '';
  const id = urlId || storedId;
  const policial = loadList(STORAGE_POLICIAIS).find((item) => item.id === id) || null;

  if (policial && urlId) {
    localStorage.setItem(STORAGE_POLICIAL_ATUAL, policial.id);
  }

  return policial;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Define as classes de vaga compatíveis com o posto/graduação do policial.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} policial - Registro cadastral do policial.
 * @returns {Array<string>} Classes de vaga permitidas para o perfil funcional.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não lê nem grava dados; calcula a elegibilidade em memória a partir de `postoGraduacao`.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: substituir esta tabela local por regra oficial parametrizada pelo GSI/CPROEIS em banco de dados.
 */
function getEligibleClasses(policial) {
  const posto = policial?.postoGraduacao || '';
  const classeA = ['Major', 'Tenente-Coronel', 'Coronel'];
  const classeB = ['Aspirante', '2º Tenente', '1º Tenente', 'Capitão'];
  const classeCD = ['Soldado', 'Cabo', '3º Sargento', '2º Sargento', '1º Sargento', 'Subtenente'];

  if (classeA.includes(posto)) return ['A'];
  if (classeB.includes(posto)) return ['B'];
  if (classeCD.includes(posto)) return ['C/D', 'C', 'D'];
  return [];
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Verifica se o policial está apto para visualizar vagas operacionais.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} policial - Registro cadastral do policial.
 * @returns {boolean} Verdadeiro quando o policial está ativo e com condição sanitária compatível.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa armazenamento; usa apenas campos já lidos do LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: consultar impedimentos, bloqueios e escalas conflitantes em serviços do backend.
 */
function isPolicialOperationallyEligible(policial) {
  const statusOk = policial?.situacaoFuncional === 'Ativo' || policial?.situacaoFuncional === 'Adido';
  const sanitaryOk = ['APTO_A', 'APTO_B'].includes(policial?.situacaoSanitaria);
  return Boolean(statusOk && sanitaryOk);
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Calcula a quinta-feira de liberação automática da vaga, igual à regra usada pelo módulo de convênios.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} dataServico - Data da vaga no formato YYYY-MM-DD.
 * @returns {Date|null} Data de liberação automática ou nulo quando inválida.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não lê nem grava dados; calcula em memória.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: centralizar esta regra em serviço único para evitar divergência entre convênio, GSI e policial.
 */
function getAutomaticOfferDeadline(dataServico) {
  if (!dataServico) return null;
  const date = new Date(`${dataServico}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  date.setDate(date.getDate() - 4);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Indica se uma vaga já foi liberada para o policial, seja por prazo automático ou por autorização do GSI.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} vaga - Vaga persistida pelo módulo de convênios.
 * @returns {boolean} Verdadeiro quando a vaga pode aparecer no acesso do policial.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; lê campos da vaga já carregada do LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: validar disponibilidade em API, considerando saldo de vagas e bloqueios em tempo real.
 */
function isVagaLiberada(vaga) {
  if (vaga.permissaoGsiStatus === 'aprovada' || vaga.liberadaParaPolicial === true) return true;

  const releaseAt = getAutomaticOfferDeadline(vaga.dataServico);
  const createdAt = vaga.createdAt ? new Date(vaga.createdAt) : new Date(0);
  return Boolean(releaseAt && createdAt <= releaseAt && new Date() >= releaseAt);
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Verifica se uma vaga é compatível com o cadastro funcional do policial.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} vaga - Vaga persistida pelo convênio.
 * @param {object} policial - Policial selecionado na URL.
 * @returns {boolean} Verdadeiro quando a vaga deve ser exibida ao policial.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; cruza em memória as vagas e o cadastro lidos do LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: incluir cursos concluídos, impedimentos administrativos e regras de escala quando essas tabelas forem criadas.
 */
function isVagaCompativelComPolicial(vaga, policial) {
  if (!isPolicialOperationallyEligible(policial)) return false;
  if (!isVagaLiberada(vaga)) return false;
  if (Number(vaga.preenchidas || 0) >= Number(vaga.quantidade || 0)) return false;

  const allowedClasses = getEligibleClasses(policial);
  return allowedClasses.includes(vaga.classe);
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Renderiza a tabela inicial de policiais com botão de login por registro, exibindo todos os
 * policiais cadastrados sem filtro textual nesta tela.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê `cproeis_cadastro_policiais` do LocalStorage e escreve linhas no DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: substituir a listagem pública por autenticação individual e busca protegida por credenciais.
 */
function renderPoliciaisAccessTable() {
  const body = document.getElementById('policiais-body');
  if (!body) return;

  const policiais = loadList(STORAGE_POLICIAIS)
    .sort((a, b) => String(a.nomeCompleto || '').localeCompare(String(b.nomeCompleto || '')));

  document.getElementById('table-count').textContent = policiais.length
    ? `${policiais.length} policial(is) encontrado(s).`
    : 'Nenhum policial encontrado.';

  body.innerHTML = '';
  if (!policiais.length) {
    const row = body.insertRow();
    const cell = row.insertCell();
    cell.className = 'empty';
    cell.colSpan = 8;
    cell.textContent = 'Nenhum policial cadastrado para acesso.';
    return;
  }

  policiais.forEach((policial) => {
    const row = body.insertRow();
    [
      policial.rg,
      policial.idFuncional,
      policial.nomeCompleto,
      policial.postoGraduacao,
      policial.unidade,
      policial.situacaoSanitaria,
      policial.situacaoFuncional
    ].forEach((value) => {
      row.insertCell().textContent = value || '-';
    });

    const actionCell = row.insertCell();
    const actions = document.createElement('div');
    actions.className = 'actions';
    const link = document.createElement('a');
    link.className = 'login-action';
    link.href = `vagas.html?id=${encodeURIComponent(policial.id)}`;
    link.textContent = 'Logar';
    actions.appendChild(link);
    actionCell.appendChild(actions);
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Preenche o cabeçalho e os links internos das páginas do policial selecionado.
 *
 * PARÂMETROS E RETORNO:
 * @param {object|null} policial - Policial selecionado pela URL.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; altera textos e hrefs no DOM com base no cadastro local.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: carregar identidade do policial pela sessão autenticada e não por parâmetro de URL.
 */
function hydratePolicialPage(policial) {
  const title = document.getElementById('page-title');
  const subtitle = document.getElementById('page-subtitle');
  if (!title || !subtitle) return;

  if (!policial) {
    title.textContent = 'Policial não encontrado';
    subtitle.textContent = 'Retorne à lista e selecione um policial cadastrado.';
    return;
  }

  title.textContent = policial.nomeGuerra || policial.nomeCompleto || 'Menu do policial';
  subtitle.textContent = `${policial.postoGraduacao || '-'} | ${policial.unidade || '-'} | ${policial.situacaoSanitaria || '-'}`;

  const idParam = `id=${encodeURIComponent(policial.id)}`;
  const internalLinks = {
    'vagas.html': `vagas.html?${idParam}`,
    'historico-servico.html': `historico-servico.html?${idParam}`,
    'tabela-servico.html': `tabela-servico.html?${idParam}`,
    'pagamentos.html': `pagamentos.html?${idParam}`,
    'cursos.html': `cursos.html?${idParam}`
  };

  Object.entries(internalLinks).forEach(([baseHref, nextHref]) => {
    const link = document.querySelector(`.module-menu a[href="${baseHref}"]`);
    if (link) link.href = nextHref;
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Renderiza vagas liberadas e compatíveis com o policial selecionado.
 *
 * PARÂMETROS E RETORNO:
 * @param {object|null} policial - Policial selecionado pela URL.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê `cproeis_convenios_vagas` e `cproeis_contratos_convenios` no LocalStorage; não grava dados.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: quando houver aceite de vaga, gravar candidatura/escala em tabela própria para impedir duplicidade.
 */
function renderVagasDisponiveis(policial) {
  const body = document.getElementById('vagas-body');
  if (!body) return;

  const convenioMap = new Map(loadList(STORAGE_CONVENIOS).map((convenio) => [convenio.id, convenio]));
  const text = String(document.getElementById('vaga-filter')?.value || '').trim().toLowerCase();
  const date = document.getElementById('vaga-date-filter')?.value || '';

  const vagas = loadList(STORAGE_VAGAS)
    .filter((vaga) => isVagaCompativelComPolicial(vaga, policial))
    .filter((vaga) => {
      const convenio = convenioMap.get(vaga.convenioId) || {};
      const searchable = [
        convenio.nome,
        convenio.numero,
        vaga.nomeServico,
        vaga.localServico,
        vaga.enderecoServico,
        gruposClasse[vaga.classe],
        tiposServico[vaga.tipoServico]
      ].join(' ').toLowerCase();
      return (!text || searchable.includes(text)) && (!date || vaga.dataServico === date);
    })
    .sort((a, b) => String(a.dataServico || '').localeCompare(String(b.dataServico || '')));

  document.getElementById('vagas-count').textContent = vagas.length
    ? `${vagas.length} vaga(s) disponível(is) para o perfil.`
    : 'Nenhuma vaga disponível para o perfil no momento.';

  body.innerHTML = '';
  if (!vagas.length) {
    const row = body.insertRow();
    const cell = row.insertCell();
    cell.className = 'empty';
    cell.colSpan = 8;
    cell.textContent = 'Nenhuma vaga liberada e compatível com este policial.';
    return;
  }

  vagas.forEach((vaga) => {
    const convenio = convenioMap.get(vaga.convenioId) || {};
    const row = body.insertRow();
    [
      formatDate(vaga.dataServico),
      convenio.nome || convenio.numero || '-',
      vaga.nomeServico || '-',
      gruposClasse[vaga.classe] || vaga.classe || '-',
      tiposServico[vaga.tipoServico] || vaga.tipoServico || '-',
      `${vaga.horaInicio || '-'} até ${vaga.horaFim || '-'}`,
      vaga.localServico || vaga.enderecoServico || '-'
    ].forEach((value) => {
      row.insertCell().textContent = value;
    });

    const statusCell = row.insertCell();
    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = vaga.permissaoGsiStatus === 'aprovada' ? 'Autorizada GSI' : 'Liberada';
    statusCell.appendChild(badge);
    const note = document.createElement('span');
    note.className = 'status-note';
    note.textContent = `${Number(vaga.quantidade || 0) - Number(vaga.preenchidas || 0)} vaga(s) em aberto.`;
    statusCell.appendChild(note);
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Inicializa a página correta do módulo de acesso do policial conforme os elementos presentes no DOM.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Coordena leituras de LocalStorage e eventos de filtro das páginas internas; não grava dados nesta etapa inicial.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: separar scripts por página quando o módulo ganhar candidatura, pagamentos e histórico real de serviços.
 */
function init() {
  if (document.getElementById('policiais-body')) {
    renderPoliciaisAccessTable();
    return;
  }

  const policial = getSelectedPolicial();
  hydratePolicialPage(policial);

  if (document.getElementById('vagas-body')) {
    renderVagasDisponiveis(policial);
    document.getElementById('vaga-filter')?.addEventListener('input', () => renderVagasDisponiveis(policial));
    document.getElementById('vaga-date-filter')?.addEventListener('change', () => renderVagasDisponiveis(policial));
  }
}

init();

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
function inicializarMenuHamburgerAcessoPolicialAcesso() {
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

inicializarMenuHamburgerAcessoPolicialAcesso();
