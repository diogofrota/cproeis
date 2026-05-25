const ACESSO_POLICIAL_STORAGE = 'cproeis_cadastro_policiais';
const ACESSO_POLICIAL_ATUAL = 'cproeis_acesso_policial_atual';

/*
  DESCRIÇÃO DA FUNÇÃO: Lê uma lista JSON do LocalStorage com fallback seguro para array vazio.
  PARÂMETROS E RETORNO: Recebe key (string) e retorna Array<object> com os registros encontrados.
  ARMAZENAMENTO E PERSISTÊNCIA: Lê LocalStorage; não grava dados.
  TODO: Em produção, trocar esta leitura local por API autenticada e tratamento de expiração de sessão.
*/
function carregarListaAcessoPolicial(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (error) {
    return [];
  }
}

/*
  DESCRIÇÃO DA FUNÇÃO: Resolve o policial ativo do módulo, priorizando o ID vindo pela URL e,
  quando ele não existir, reaproveitando o ID salvo no login anterior.
  PARÂMETROS E RETORNO: Não recebe parâmetros; retorna object|null com o policial encontrado.
  ARMAZENAMENTO E PERSISTÊNCIA: Lê a URL e LocalStorage; grava cproeis_acesso_policial_atual
  quando há um policial válido para manter navegação entre páginas internas.
  TODO: Em produção, substituir por sessão de usuário no servidor com logout invalidando token.
*/
function obterPolicialAtivo() {
  const params = new URLSearchParams(window.location.search);
  const urlId = params.get('id') || '';
  const storedId = localStorage.getItem(ACESSO_POLICIAL_ATUAL) || '';
  const policiais = carregarListaAcessoPolicial(ACESSO_POLICIAL_STORAGE);

  let policial = policiais.find((item) => item.id === urlId) || null;
  if (!policial && !urlId) {
    policial = policiais.find((item) => item.id === storedId) || null;
  }

  if (policial) {
    localStorage.setItem(ACESSO_POLICIAL_ATUAL, policial.id);
  }

  return policial;
}

/*
  DESCRIÇÃO DA FUNÇÃO: Atualiza o cabeçalho e os links do menu das páginas internas do policial
  com os dados do policial logado.
  PARÂMETROS E RETORNO: Recebe policial (object|null) e não retorna valores.
  ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados além do ID já salvo por obterPolicialAtivo; altera
  somente texto e hrefs no DOM.
  TODO: Em produção, buscar permissões do menu conforme perfil e situação funcional do policial.
*/
function aplicarSessaoPolicialNoMenu(policial) {
  const title = document.getElementById('page-title');
  const subtitle = document.getElementById('page-subtitle');

  if (!policial) {
    if (title) title.textContent = 'Policial não encontrado';
    if (subtitle) subtitle.textContent = 'Retorne à lista e selecione um policial cadastrado.';
    return;
  }

  if (title) title.textContent = 'Acesso do Policial';
  if (subtitle) {
    subtitle.textContent = [
      policial.nomeCompleto || policial.nomeGuerra || 'Policial sem nome',
      policial.postoGraduacao || '-',
      policial.unidade || '-',
      policial.situacaoSanitaria || '-',
      policial.situacaoFuncional || '-'
    ].join(' | ');
  }

  const idParam = `id=${encodeURIComponent(policial.id)}`;
  const menuLinks = {
    'vagas.html': `vagas.html?${idParam}`,
    'historico-servico.html': `historico-servico.html?${idParam}`,
    'tabela-servico.html': `tabela-servico.html?${idParam}`,
    'pagamentos.html': `pagamentos.html?${idParam}`,
    'cursos.html': `cursos.html?${idParam}`
  };

  Object.entries(menuLinks).forEach(([baseHref, nextHref]) => {
    const link = document.querySelector(`.module-menu a[href="${baseHref}"]`);
    if (link) link.href = nextHref;
  });
}

/*
  DESCRIÇÃO DA FUNÇÃO: Configura a opção Sair para encerrar a sessão local do policial e voltar
  para a tela de seleção/login de policiais.
  PARÂMETROS E RETORNO: Não recebe parâmetros e não retorna valores; registra listener em links
  marcados com data-logout-policial.
  ARMAZENAMENTO E PERSISTÊNCIA: Remove cproeis_acesso_policial_atual do LocalStorage.
  TODO: Em produção, invalidar sessão no backend, limpar tokens e registrar auditoria de logout.
*/
function inicializarSairAcessoPolicial() {
  document.querySelectorAll('[data-logout-policial="true"]').forEach((link) => {
    link.addEventListener('click', () => {
      localStorage.removeItem(ACESSO_POLICIAL_ATUAL);
    });
  });
}

aplicarSessaoPolicialNoMenu(obterPolicialAtivo());
inicializarSairAcessoPolicial();
