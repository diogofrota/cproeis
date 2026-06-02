const SERVICOS_LISTA_STORAGE = 'cproeis_convenios_servicos';
const CONVENIOS_LISTA_STORAGE = 'cproeis_contratos_convenios';
const CONVENIO_ATUAL_STORAGE_LISTA = 'cproeis_convenio_atual';
const CONVENIO_RESPONSAVEL_ATUAL_STORAGE_LISTA = 'cproeis_convenio_responsavel_atual';

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Lê listas JSON do LocalStorage com retorno seguro para array vazio.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} key - Chave local consultada.
 * @returns {Array<object>} Lista persistida ou array vazio.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê LocalStorage; não grava dados.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: migrar para consulta paginada à API de serviços do convênio.
 */
function carregarListaServicosConvenio(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (error) {
    return [];
  }
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Resolve o convênio ativo para filtrar a listagem de serviços.
 *
 * PARÂMETROS E RETORNO:
 * @returns {object|null} Convênio ativo encontrado por URL ou sessão local.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê URL e LocalStorage; grava o convênio atual quando a URL traz um ID válido.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: substituir sessão local por autenticação real do responsável.
 */
function obterConvenioListaServicos() {
  const params = new URLSearchParams(window.location.search);
  const urlId = params.get('id') || '';
  const convenioId = urlId || localStorage.getItem(CONVENIO_ATUAL_STORAGE_LISTA) || '';
  const convenio = carregarListaServicosConvenio(CONVENIOS_LISTA_STORAGE).find((item) => item.id === convenioId) || null;

  if (convenio && urlId) {
    localStorage.setItem(CONVENIO_ATUAL_STORAGE_LISTA, convenio.id);
  }

  return convenio;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Escapa texto antes de renderizar na tabela, evitando HTML acidental em dados locais.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} value - Texto que será exibido.
 * @returns {string} Texto seguro para interpolação em HTML.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não lê nem grava dados; apenas transforma o valor recebido.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: manter escape mesmo com dados vindos de API para defesa em profundidade.
 */
function escaparTextoServico(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Filtra os serviços cadastrados para o convênio logado e ordena por nome.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} convenioId - ID do convênio ativo.
 * @returns {Array<object>} Serviços vinculados ao convênio.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê a chave `cproeis_convenios_servicos` no LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: aplicar filtros de status e paginação no backend quando houver banco.
 */
function obterServicosDoConvenio(convenioId) {
  return carregarListaServicosConvenio(SERVICOS_LISTA_STORAGE)
    .filter((servico) => servico.convenioId === convenioId)
    .sort((a, b) => (a.nomeServico || '').localeCompare(b.nomeServico || ''));
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Atualiza os links de criação de serviço preservando a sessão do convênio.
 *
 * PARÂMETROS E RETORNO:
 * @param {object|null} convenio - Convênio ativo da listagem.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê URL e LocalStorage; atualiza hrefs no DOM sem gravar dados.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: substituir query string por roteador autenticado quando o sistema for online.
 */
function configurarLinksListaServicos(convenio) {
  if (!convenio) return;

  const params = new URLSearchParams(window.location.search);
  const responsavel = params.get('responsavel') || localStorage.getItem(CONVENIO_RESPONSAVEL_ATUAL_STORAGE_LISTA) || '';
  const query = `id=${encodeURIComponent(convenio.id)}${responsavel ? `&responsavel=${encodeURIComponent(responsavel)}` : ''}`;
  const novoServico = document.getElementById('novo-servico-link');
  if (novoServico) novoServico.href = `criar-servico.html?${query}`;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Renderiza a tabela de serviços cadastrados para o responsável do convênio.
 *
 * PARÂMETROS E RETORNO:
 * @param {object|null} convenio - Convênio ativo usado como filtro.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê os serviços de `cproeis_convenios_servicos` e escreve somente o HTML da tabela.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: adicionar edição/inativação com auditoria quando existir backend.
 */
function renderizarServicos(convenio) {
  const body = document.getElementById('servicos-body');
  if (!body) return;

  if (!convenio) {
    body.innerHTML = '<tr><td class="empty" colspan="5">Convênio não encontrado. Acesse novamente pelo login do convênio.</td></tr>';
    return;
  }

  const servicos = obterServicosDoConvenio(convenio.id);
  if (!servicos.length) {
    body.innerHTML = '<tr><td class="empty" colspan="5">Nenhum serviço cadastrado. Crie um serviço para liberar a primeira etapa da criação de vagas.</td></tr>';
    return;
  }

  body.innerHTML = servicos.map((servico) => `
    <tr>
      <td>${escaparTextoServico(servico.nomeServico || '-')}</td>
      <td>${escaparTextoServico(servico.localServico || '-')}</td>
      <td>${escaparTextoServico(servico.enderecoServico || '-')}</td>
      <td>${escaparTextoServico(servico.pontoReferencia || '-')}</td>
      <td>${escaparTextoServico(servico.status || 'Ativo')}</td>
    </tr>
  `).join('');
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Inicializa a página de serviços cadastrados.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê convênio e serviços do LocalStorage; não altera dados.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: sincronizar listagem com API e estados de carregamento/erro.
 */
function iniciarListaServicos() {
  const convenio = obterConvenioListaServicos();
  configurarLinksListaServicos(convenio);
  renderizarServicos(convenio);
}

iniciarListaServicos();
