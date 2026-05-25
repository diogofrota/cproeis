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
  const links = {
    'menu-criar-vagas': `criar-vagas.html?${idParam}`,
    'menu-acompanhamento': `acompanhamento.html?${idParam}`,
    'menu-vagas': `vagas.html?${idParam}`,
    'menu-cursos': `cursos.html?${idParam}`,
    'menu-criar-curso': `criar-curso.html?${idParam}`,
    'menu-historico-curso': `historico-curso.html?${idParam}`
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
inicializarSairConvenio();
