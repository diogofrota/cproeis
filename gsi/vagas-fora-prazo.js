const STORAGE_VAGAS = 'cproeis_convenios_vagas';
const STORAGE_CONVENIOS = 'cproeis_contratos_convenios';

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
 * Lê uma lista JSON salva no navegador e devolve sempre um array seguro para renderização.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} key - Chave do LocalStorage consultada.
 * @returns {Array<object>} Lista armazenada ou array vazio quando a chave não existir ou estiver inválida.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Realiza leitura no LocalStorage; não grava dados.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: substituir leitura local por endpoint autenticado do GSI com paginação e tratamento de indisponibilidade.
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
 * Grava uma lista JSON no navegador preservando o armazenamento local usado pelo protótipo.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} key - Chave do LocalStorage que será atualizada.
 * @param {Array<object>} list - Lista serializável que será persistida.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Grava dados diretamente no LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: substituir esta gravação por endpoint transacional com usuário decisor, protocolo e trilha de auditoria.
 */
function saveList(key, list) {
  localStorage.setItem(key, JSON.stringify(list));
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Escapa texto exibido na tabela para evitar que dados salvos no navegador sejam interpretados como HTML.
 *
 * PARÂMETROS E RETORNO:
 * @param {unknown} value - Valor que será exibido no DOM.
 * @returns {string} Texto seguro com caracteres HTML sensíveis convertidos em entidades.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não lê nem grava armazenamento; protege apenas a renderização dos dados já carregados.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: manter sanitização também no backend e aplicar política CSP quando o sistema estiver online.
 */
function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Converte uma data ISO simples para o padrão brasileiro usado nas tabelas do sistema.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} value - Data no formato YYYY-MM-DD.
 * @returns {string} Data no formato DD/MM/YYYY ou hífen quando o valor estiver ausente.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa armazenamento; transforma somente o valor recebido.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: centralizar formatação em utilitário compartilhado quando houver modularização do frontend.
 */
function formatDate(value) {
  if (!value) return '-';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Formata data e hora de solicitação da permissão GSI para leitura operacional.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} value - Data/hora ISO gravada quando o convênio solicitou permissão.
 * @returns {string} Data e hora local ou hífen quando não houver valor.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa LocalStorage; lê apenas o valor recebido do objeto da vaga.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: usar fuso horário oficial do servidor para auditoria de prazos em produção.
 */
function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Retorna todas as vagas que já foram enviadas para avaliação do GSI.
 *
 * PARÂMETROS E RETORNO:
 * @returns {Array<object>} Vagas com `permissaoGsiStatus` igual a `solicitada`.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê a chave `cproeis_convenios_vagas` no LocalStorage, gravada pelo módulo de convênios.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: consultar fila de solicitações do backend para impedir manipulação local do status pelo navegador.
 */
function getSolicitacoesGsi() {
  return loadList(STORAGE_VAGAS).filter((vaga) => vaga.permissaoGsiStatus === 'solicitada');
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Atualiza a decisão do GSI sobre uma vaga fora do prazo, registrando autorização ou negativa sem apagar o histórico.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} vagaId - Identificador da vaga que receberá a decisão.
 * @param {'aprovada'|'negada'} status - Resultado da avaliação do GSI.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê e regrava a lista `cproeis_convenios_vagas` no LocalStorage. Quando aprovada, marca a vaga como liberada
 * para que a futura página do perfil do policial consiga localizar automaticamente as vagas autorizadas.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: enviar esta decisão para workflow online com autenticação do avaliador, justificativa obrigatória e logs imutáveis.
 */
function decideSolicitacaoGsi(vagaId, status) {
  const decidedAt = new Date().toISOString();
  const vagas = loadList(STORAGE_VAGAS).map((vaga) => {
    if (vaga.id !== vagaId) return vaga;

    if (status === 'aprovada') {
      return {
        ...vaga,
        permissaoGsiStatus: 'aprovada',
        permissaoGsiDecididaAt: decidedAt,
        permissaoGsiAutorizadaAt: decidedAt,
        liberadaParaPolicial: true,
        liberadaPor: 'GSI'
      };
    }

    return {
      ...vaga,
      permissaoGsiStatus: 'negada',
      permissaoGsiDecididaAt: decidedAt,
      permissaoGsiNegadaAt: decidedAt,
      liberadaParaPolicial: false,
      liberadaPor: ''
    };
  });

  saveList(STORAGE_VAGAS, vagas);
  renderGsiVagasTable();
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Cria um mapa de convênios por ID para enriquecer a tabela do GSI com nome e número do contrato.
 *
 * PARÂMETROS E RETORNO:
 * @returns {Map<string, object>} Mapa em que a chave é o ID do convênio e o valor é o cadastro completo.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê a chave `cproeis_contratos_convenios` no LocalStorage; não grava dados.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: buscar estes dados por relacionamento no banco e aplicar regras de sigilo por perfil do usuário.
 */
function getConvenioMap() {
  return new Map(loadList(STORAGE_CONVENIOS).map((convenio) => [convenio.id, convenio]));
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Preenche o filtro de convênio usando somente convênios que possuem vagas solicitadas ao GSI.
 *
 * PARÂMETROS E RETORNO:
 * @param {Array<object>} vagas - Lista de solicitações carregadas do LocalStorage.
 * @param {Map<string, object>} convenioMap - Relação de convênios indexada por ID.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava armazenamento; altera apenas as opções do select no DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: carregar filtros a partir de metadados do endpoint para evitar listas grandes no navegador.
 */
function renderConvenioFilter(vagas, convenioMap) {
  const select = document.getElementById('filter-convenio');
  if (!select) return;

  const currentValue = select.value;
  const options = [...new Set(vagas.map((vaga) => vaga.convenioId).filter(Boolean))]
    .map((id) => convenioMap.get(id))
    .filter(Boolean)
    .sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || '')));

  select.innerHTML = '<option value="">Todos</option>' + options
    .map((convenio) => `<option value="${escapeHtml(convenio.id)}">${escapeHtml(convenio.nome || convenio.numero || convenio.id)}</option>`)
    .join('');
  select.value = options.some((convenio) => convenio.id === currentValue) ? currentValue : '';
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Aplica filtros textuais e estruturados sobre as solicitações pendentes do GSI.
 *
 * PARÂMETROS E RETORNO:
 * @param {Array<object>} vagas - Lista de vagas solicitadas ao GSI.
 * @param {Map<string, object>} convenioMap - Relação de convênios indexada por ID.
 * @returns {Array<object>} Vagas filtradas conforme campos preenchidos pelo usuário.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não lê nem grava LocalStorage; trabalha em memória com os dados já carregados.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: mover filtros para query no backend quando houver grande volume de solicitações.
 */
function applyFilters(vagas, convenioMap) {
  const text = String(document.getElementById('filter-text')?.value || '').trim().toLowerCase();
  const convenioId = document.getElementById('filter-convenio')?.value || '';
  const classe = document.getElementById('filter-classe')?.value || '';
  const date = document.getElementById('filter-date')?.value || '';

  return vagas.filter((vaga) => {
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

    return (!text || searchable.includes(text))
      && (!convenioId || vaga.convenioId === convenioId)
      && (!classe || vaga.classe === classe)
      && (!date || vaga.dataServico === date);
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Renderiza a tabela de vagas fora do prazo enviadas ao GSI para avaliação.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê vagas e convênios do LocalStorage por meio das funções auxiliares e escreve apenas HTML no DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: adicionar ações de aprovar, indeferir e registrar justificativa em workflow transacional no backend.
 */
function renderGsiVagasTable() {
  const body = document.getElementById('gsi-vagas-body');
  if (!body) return;

  const vagas = getSolicitacoesGsi();
  const convenioMap = getConvenioMap();
  renderConvenioFilter(vagas, convenioMap);

  const filtered = applyFilters(vagas, convenioMap)
    .sort((a, b) => String(a.permissaoGsiSolicitadaAt || '').localeCompare(String(b.permissaoGsiSolicitadaAt || '')));

  if (!filtered.length) {
    body.innerHTML = '<tr><td class="empty" colspan="10">Nenhuma vaga enviada para avaliação do GSI.</td></tr>';
    return;
  }

  body.innerHTML = filtered.map((vaga) => {
    const convenio = convenioMap.get(vaga.convenioId) || {};
    const convenioLabel = convenio.nome || convenio.numero || 'Convênio não identificado';
    const contratoLabel = convenio.numero ? `<span class="status-note">Contrato ${escapeHtml(convenio.numero)}</span>` : '';

    return `
      <tr>
        <td>${formatDate(vaga.dataServico)}</td>
        <td>${escapeHtml(convenioLabel)}${contratoLabel}</td>
        <td>${escapeHtml(vaga.nomeServico || '-')}</td>
        <td>${escapeHtml(gruposClasse[vaga.classe] || vaga.classe || '-')}</td>
        <td>${escapeHtml(tiposServico[vaga.tipoServico] || vaga.tipoServico || '-')}</td>
        <td>${escapeHtml(vaga.horaInicio || '-')} até ${escapeHtml(vaga.horaFim || '-')}</td>
        <td>${escapeHtml(vaga.quantidade || 0)}</td>
        <td>${escapeHtml(vaga.localServico || vaga.enderecoServico || '-')}</td>
        <td>
          <span class="badge">Aguardando GSI</span>
          <span class="status-note">Solicitada em ${escapeHtml(formatDateTime(vaga.permissaoGsiSolicitadaAt))}</span>
        </td>
        <td>
          <div class="actions">
            <button type="button" class="approve-action" data-action="approve-gsi-request" data-id="${escapeHtml(vaga.id)}">Autorizar</button>
            <button type="button" class="deny-action" data-action="deny-gsi-request" data-id="${escapeHtml(vaga.id)}">Negar</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Trata cliques nos botões de autorização e negativa exibidos na tabela do GSI.
 *
 * PARÂMETROS E RETORNO:
 * @param {MouseEvent} event - Evento de clique capturado no documento.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava diretamente; delega a atualização do LocalStorage para `decideSolicitacaoGsi`.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: substituir confirmações simples por modal com justificativa e bloqueio de duplo envio em chamadas assíncronas.
 */
function handleGsiDecisionClick(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  if (button.dataset.action === 'approve-gsi-request') {
    if (confirm('Autorizar esta vaga fora do prazo e liberar para o perfil do policial?')) {
      decideSolicitacaoGsi(button.dataset.id, 'aprovada');
    }
  }

  if (button.dataset.action === 'deny-gsi-request') {
    if (confirm('Negar esta solicitação de vaga fora do prazo?')) {
      decideSolicitacaoGsi(button.dataset.id, 'negada');
    }
  }
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Inicializa a tela de vagas fora do prazo e registra eventos de filtro.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Aciona leitura inicial do LocalStorage e, depois, apenas reage a mudanças nos filtros da interface.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: substituir atualização manual por estado sincronizado com API e notificações em tempo real para o GSI.
 */
function initGsiVagasForaPrazo() {
  renderGsiVagasTable();

  ['filter-text', 'filter-convenio', 'filter-classe', 'filter-date'].forEach((id) => {
    const element = document.getElementById(id);
    if (!element) return;
    element.addEventListener(id === 'filter-text' ? 'input' : 'change', renderGsiVagasTable);
  });

  document.addEventListener('click', handleGsiDecisionClick);
}

initGsiVagasForaPrazo();
