const DIRETOR_REGIONS_STORAGE = 'cproeis_diretor_regioes';
const DIRETOR_CLASSIFICATIONS_STORAGE = 'cproeis_diretor_contratos_regioes';
const DIRETOR_CONTRACTS_STORAGE = 'cproeis_contratos_convenios';
const DIRETOR_GSI_CONTRACT_USERS_STORAGE = 'cproeis_gsi_usuarios_contrato';
const DIRETOR_GSI_CONTRACT_USERS_REMOVED_STORAGE = 'cproeis_gsi_usuarios_contrato_removidos';
const DIRETOR_CLASSIFICATION_PAGE_SIZE = 10;
const diretorMoney = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

let diretorAppliedClassificationFilters = diretorCreateEmptyClassificationFilters();
let diretorClassificationCurrentPage = 1;

function diretorEscapeHtml(value) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Escapa textos antes de inserir no HTML das tabelas do Acesso Diretor,
   * evitando que dados digitados localmente sejam interpretados como marcação.
   * PARÂMETROS E RETORNO: Recebe value como qualquer valor simples e retorna string escapada.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava dados; opera apenas sobre o valor recebido.
   * TODO: Em produção, manter escape no frontend e também sanitizar respostas no backend.
   */
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function diretorNormalizeText(value) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Normaliza texto para filtros, removendo acentos, diferenças de caixa
   * e espaços duplicados.
   * PARÂMETROS E RETORNO: Recebe value como string/valor simples e retorna string normalizada.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não acessa armazenamento; transforma somente o valor em memória.
   * TODO: Em produção, aplicar busca normalizada no banco ou serviço de pesquisa.
   */
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function diretorOnlyDigits(value) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Remove qualquer caractere não numérico de documentos usados nos filtros.
   * PARÂMETROS E RETORNO: Recebe value como string/valor simples e retorna somente os dígitos.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não acessa armazenamento; transforma apenas o valor recebido.
   * TODO: Em produção, centralizar normalização de documentos em utilitário compartilhado.
   */
  return String(value || '').replace(/\D/g, '');
}

function diretorReadList(key) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Lê uma lista JSON do LocalStorage com fallback seguro para array vazio.
   * PARÂMETROS E RETORNO: Recebe key como string e retorna array de objetos.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê LocalStorage na chave informada; não grava dados.
   * TODO: Em produção, trocar por chamadas assíncronas com tratamento de falha e permissões.
   */
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function diretorSaveList(key, list) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Persiste uma lista do Acesso Diretor no LocalStorage.
   * PARÂMETROS E RETORNO: Recebe key como string e list como array; não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Grava JSON em LocalStorage nas chaves do módulo diretor.
   * TODO: Em produção, substituir por endpoint transacional com auditoria do usuário executor.
   */
  localStorage.setItem(key, JSON.stringify(Array.isArray(list) ? list : []));
}

function diretorMakeId(prefix) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Gera identificador local para regiões e classificações enquanto o
   * sistema opera sem backend.
   * PARÂMETROS E RETORNO: Recebe prefix como string e retorna identificador único textual.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; o ID é persistido depois dentro dos registros.
   * TODO: Em produção, usar identificador gerado pelo banco de dados.
   */
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function diretorFormatDate(value) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Formata datas ISO para exibição em padrão brasileiro.
   * PARÂMETROS E RETORNO: Recebe value como string `YYYY-MM-DD` ou data ISO completa e retorna
   * `DD/MM/YYYY`, mantendo traço quando não houver valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava armazenamento; apenas formata o valor recebido.
   * TODO: Em produção, centralizar datas com timezone oficial da aplicação.
   */
  if (!value) return '-';
  const datePart = String(value).slice(0, 10);
  const [year, month, day] = datePart.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function diretorFormatCnpj(value) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Aplica máscara visual ao CNPJ dos contratos listados para classificação.
   * PARÂMETROS E RETORNO: Recebe value como string e retorna CNPJ formatado ou o valor original.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; lê somente o valor recebido do contrato.
   * TODO: Em produção, reutilizar utilitário global de documentos para evitar duplicidade.
   */
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length !== 14) return value || '-';
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

function diretorFormatMoney(value) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Formata valores financeiros dos contratos na tabela do diretor.
   * PARÂMETROS E RETORNO: Recebe value como número/string numérica e retorna moeda BRL.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava dados; formata somente o valor já carregado.
   * TODO: Em produção, receber valores monetários em centavos pela API para evitar arredondamentos.
   */
  return diretorMoney.format(Number(value || 0));
}

function diretorNormalizeContractType(value) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Padroniza o tipo de convênio para filtro e exibição na tabela do diretor.
   * PARÂMETROS E RETORNO: Recebe value como texto livre e retorna rótulo normalizado ou vazio.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não acessa armazenamento; atua sobre dados carregados do contrato.
   * TODO: Em produção, trocar estes rótulos por IDs vindos de tabela de domínio do backend.
   */
  const normalized = String(value || '').replace(/\s+/g, ' ').trim();
  const key = normalized
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
  const labels = {
    municipio: 'Município',
    concessionaria: 'Concessionária',
    orgaopublico: 'Órgão Público',
    outros: 'Outros'
  };

  return labels[key] || normalized;
}

function diretorGetContractStatus(contract) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Calcula a situação operacional do contrato para filtro e coluna
   * "Situação" da tabela do diretor.
   * PARÂMETROS E RETORNO: Recebe contract como objeto de contrato e retorna objeto com label,
   * active e className.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; usa datas persistidas no contrato em memória.
   * TODO: Em produção, calcular situação no backend usando calendário oficial e regras de aditivo.
   */
  const today = diretorToday();
  if (contract?.inicio && today < contract.inicio) {
    return { label: 'Aguardando', active: false, className: 'inactive' };
  }

  if (contract?.fim && today > contract.fim) {
    return { label: 'Encerrado', active: false, className: 'inactive' };
  }

  return { label: 'Ativo', active: true, className: '' };
}

function diretorToday() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Retorna a data corrente no formato esperado pelos inputs de data.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e retorna string `YYYY-MM-DD`.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava dados; usa apenas relógio local do navegador.
   * TODO: Em produção, usar data oficial do servidor para registros administrativos.
   */
  return new Date().toISOString().slice(0, 10);
}

function diretorGetRegions() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Recupera as CPAs cadastradas pelo diretor em ordem alfabética.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e retorna array de CPAs.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê `cproeis_diretor_regioes` do LocalStorage.
   * TODO: Em produção, buscar CPAs ativas por API com paginação.
   */
  return diretorReadList(DIRETOR_REGIONS_STORAGE)
    .filter((region) => !region.tipo || region.tipo === 'CPA')
    .sort((a, b) => diretorNormalizeText(a.nome).localeCompare(diretorNormalizeText(b.nome)));
}

function diretorGetClassifications() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Recupera os vínculos contrato-CPA existentes no Acesso Diretor.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e retorna array de classificações.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê `cproeis_diretor_contratos_regioes` do LocalStorage.
   * TODO: Em produção, consultar classificação vigente e histórico por API.
   */
  return diretorReadList(DIRETOR_CLASSIFICATIONS_STORAGE);
}

function diretorGetContracts() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Carrega contratos cadastrados no módulo de contratos para serem
   * distribuídos por CPA.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e retorna array de contratos.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê `cproeis_contratos_convenios` do LocalStorage; não grava.
   * TODO: Em produção, consumir somente contratos ativos/autorizados por endpoint do backend.
   */
  return diretorReadList(DIRETOR_CONTRACTS_STORAGE)
    .sort((a, b) => diretorNormalizeText(a.nome).localeCompare(diretorNormalizeText(b.nome)));
}

function diretorGetContractOperationalAccessSummary(contractId) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Recupera os usuários de acesso operacional vinculados a um contrato
   * para exibição consultiva na tela do diretor.
   * PARÂMETROS E RETORNO: Recebe contractId como string e retorna objeto com arrays active e removed.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê `cproeis_gsi_usuarios_contrato` e
   * `cproeis_gsi_usuarios_contrato_removidos`; não grava dados.
   * TODO: Em produção, buscar esse resumo no endpoint consolidado do diretor com paginação/histórico.
   */
  const belongsToContract = (user) => user.contratoId === contractId || user.escopoContrato === contractId;
  return {
    active: diretorReadList(DIRETOR_GSI_CONTRACT_USERS_STORAGE).filter(belongsToContract),
    removed: diretorReadList(DIRETOR_GSI_CONTRACT_USERS_REMOVED_STORAGE).filter(belongsToContract)
  };
}

function diretorRenderContractOperationalAccessSummary(summary) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Monta o resumo expansível dos acessos operacionais do contrato para
   * a tabela do diretor, separando ativos e retirados.
   * PARÂMETROS E RETORNO: Recebe summary com arrays active/removed e retorna string HTML segura.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava armazenamento; renderiza dados já carregados.
   * TODO: Em produção, trocar o resumo inline por componente com paginação quando houver muitos usuários.
   */
  const active = Array.isArray(summary?.active) ? summary.active : [];
  const removed = Array.isArray(summary?.removed) ? summary.removed : [];
  const total = active.length + removed.length;

  if (!total) return '<span class="director-access-empty">Nenhum acesso</span>';

  const renderUser = (user, status) => `
    <li>
      <strong>${diretorEscapeHtml(user.nome || 'Sem nome')}</strong>
      <span>${diretorEscapeHtml(status)}</span>
    </li>
  `;

  return `
    <details class="director-access-details">
      <summary>${active.length} ativo(s) / ${removed.length} retirado(s)</summary>
      <ul>
        ${active.map((user) => renderUser(user, 'Ativo')).join('')}
        ${removed.map((user) => renderUser(user, 'Retirado')).join('')}
      </ul>
    </details>
  `;
}

function diretorRenderRegionsTable() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Renderiza a tabela de CPAs e total de contratos classificados em cada CPA.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê CPAs e classificações do LocalStorage; escreve apenas no DOM.
   * TODO: Em produção, receber o total consolidado do backend para reduzir processamento local.
   */
  const body = document.getElementById('director-regions-body');
  if (!body) return;

  const textFilter = diretorNormalizeText(document.getElementById('director-region-filter-text')?.value || '');
  const classifications = diretorGetClassifications();
  const rows = diretorGetRegions().filter((region) => {
    const searchable = diretorNormalizeText([region.nome, region.descricao].join(' '));
    return !textFilter || searchable.includes(textFilter);
  });

  const count = document.getElementById('director-regions-count');
  if (count) count.textContent = `${rows.length} CPA(s) exibida(s) de ${diretorGetRegions().length} cadastrada(s).`;

  if (!rows.length) {
    body.innerHTML = '<tr><td class="empty" colspan="3">Nenhuma CPA encontrada.</td></tr>';
    return;
  }

  body.innerHTML = rows.map((region) => {
    const total = classifications.filter((item) => item.regiaoId === region.id).length;
    return `
      <tr>
        <td><strong>${diretorEscapeHtml(region.nome)}</strong></td>
        <td>${diretorEscapeHtml(region.descricao || '-')}</td>
        <td>${total}</td>
      </tr>
    `;
  }).join('');
}

function diretorBindRegionsFilters() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Conecta filtros da tabela de CPAs à renderização local.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Registra listeners no DOM; não grava dados.
   * TODO: Em produção, persistir filtros na URL para compartilhamento da consulta.
   */
  ['director-region-filter-text'].forEach((id) => {
    const field = document.getElementById(id);
    if (!field) return;
    field.addEventListener('input', diretorRenderRegionsTable);
    field.addEventListener('change', diretorRenderRegionsTable);
  });
}

function diretorFillRegionOptions(select, includeAllOption = false) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Preenche selects de CPA usados na distribuição e nos filtros.
   * PARÂMETROS E RETORNO: Recebe select como HTMLSelectElement e includeAllOption como booleano;
   * não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê `cproeis_diretor_regioes`; escreve opções no DOM.
   * TODO: Em produção, carregar opções ativas com cache e invalidação por versão.
   */
  if (!select) return;
  const firstOption = includeAllOption
    ? '<option value="">Todos</option>'
    : '<option value="">Selecione</option>';

  select.innerHTML = [
    firstOption,
    ...(includeAllOption ? ['<option value="nao-classificado">Não classificado</option>'] : []),
    ...diretorGetRegions().map((region) => (
      `<option value="${diretorEscapeHtml(region.id)}">${diretorEscapeHtml(region.nome)}</option>`
    ))
  ].join('');
}

function diretorCreateEmptyClassificationFilters() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Define o estado vazio dos filtros aplicados na distribuição de contratos
   * do diretor, separando o preenchimento do formulário do filtro efetivamente executado.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e retorna objeto com filtros e ordenação padrão.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava dados; mantém somente estado em memória.
   * TODO: Em produção, sincronizar estes filtros com query params da API paginada.
   */
  return {
    name: '',
    cnpj: '',
    status: 'active',
    type: '',
    region: '',
    orderBy: 'situacao-inicio'
  };
}

function diretorGetClassificationFiltersFromDom() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Lê os filtros digitados na tela de distribuição de contratos do diretor.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e retorna objeto normalizado para comparação.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê apenas inputs/selects do DOM; não acessa LocalStorage.
   * TODO: Em produção, enviar estes campos para o endpoint de consulta paginada.
   */
  return {
    name: diretorNormalizeText(document.getElementById('director-classification-filter-name')?.value || ''),
    cnpj: diretorOnlyDigits(document.getElementById('director-classification-filter-cnpj')?.value || ''),
    status: document.getElementById('director-classification-filter-status')?.value || '',
    type: diretorNormalizeContractType(document.getElementById('director-classification-filter-type')?.value || ''),
    region: document.getElementById('director-classification-filter-region')?.value || '',
    orderBy: document.getElementById('director-classification-sort-order')?.value || 'situacao-inicio'
  };
}

function diretorBuildClassificationRows() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Monta linhas enriquecidas com todos os contratos e sua distribuição atual,
   * incluindo contratos ainda não classificados.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e retorna array de linhas para a tabela.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê contratos, regiões e classificações do LocalStorage.
   * TODO: Em produção, obter esta visão já consolidada por endpoint paginado do diretor.
   */
  const regions = new Map(diretorGetRegions().map((region) => [region.id, region]));
  const classifications = new Map(diretorGetClassifications().map((classification) => [classification.contratoId, classification]));

  return diretorGetContracts()
    .map((contract) => {
      const classification = classifications.get(contract.id) || {};
      return {
        ...classification,
        contratoId: contract.id,
        contrato: contract,
        regiao: regions.get(classification.regiaoId) || {}
      };
    });
}

function diretorApplyClassificationFilters(rows, filters = diretorAppliedClassificationFilters) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Aplica os filtros confirmados pelo diretor sobre a lista consolidada
   * de contratos e CPAs.
   * PARÂMETROS E RETORNO: Recebe rows como array de linhas e filters como objeto; retorna array filtrado.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava armazenamento; filtra somente dados em memória.
   * TODO: Em produção, enviar estes critérios para endpoint paginado sem carregar todos os contratos.
   */
  return rows.filter((row) => {
    const contractName = diretorNormalizeText(row.contrato.nome);
    const contractCnpj = diretorOnlyDigits(row.contrato.cnpj);
    const contractType = diretorNormalizeContractType(row.contrato.tipoConveniado);
    const contractStatus = diretorGetContractStatus(row.contrato);

    return (!filters.name || contractName.includes(filters.name))
      && (!filters.cnpj || contractCnpj.includes(filters.cnpj))
      && (!filters.status
        || (filters.status === 'active' ? contractStatus.active : !contractStatus.active))
      && (!filters.type || contractType === filters.type)
      && (!filters.region
        || (filters.region === 'nao-classificado' ? !row.regiaoId : row.regiaoId === filters.region));
  });
}

function diretorSortClassificationRows(rows, orderBy = 'situacao-inicio') {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Ordena a tabela de distribuição do diretor conforme o critério escolhido.
   * PARÂMETROS E RETORNO: Recebe rows como array e orderBy como string; retorna nova lista ordenada.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não acessa LocalStorage; ordena somente os registros recebidos.
   * TODO: Em produção, alinhar estes critérios com os índices e parâmetros de ordenação da API.
   */
  const byName = (a, b) => diretorNormalizeText(a.contrato.nome).localeCompare(diretorNormalizeText(b.contrato.nome));
  const byStart = (a, b) => String(a.contrato.inicio || '').localeCompare(String(b.contrato.inicio || ''));
  const byValue = (a, b) => Number(a.contrato.valorContrato || 0) - Number(b.contrato.valorContrato || 0);
  const byDistribution = (a, b) => {
    const distributionA = a.regiao.nome || 'Não classificado';
    const distributionB = b.regiao.nome || 'Não classificado';
    return diretorNormalizeText(distributionA).localeCompare(diretorNormalizeText(distributionB)) || byName(a, b);
  };

  return [...rows].sort((a, b) => {
    if (orderBy === 'nome-asc') return byName(a, b);
    if (orderBy === 'nome-desc') return byName(b, a);
    if (orderBy === 'inicio-asc') return byStart(a, b) || byName(a, b);
    if (orderBy === 'inicio-desc') return byStart(b, a) || byName(a, b);
    if (orderBy === 'valor-asc') return byValue(a, b) || byName(a, b);
    if (orderBy === 'valor-desc') return byValue(b, a) || byName(a, b);
    if (orderBy === 'distribuicao-asc') return byDistribution(a, b);

    const activeDiff = Number(diretorGetContractStatus(b.contrato).active) - Number(diretorGetContractStatus(a.contrato).active);
    if (activeDiff) return activeDiff;
    const startDiff = byStart(a, b);
    if (startDiff) return startDiff;
    return byName(a, b);
  });
}

function diretorPaginateClassificationRows(rows) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Separa a distribuição do diretor em páginas de 10 contratos por vez.
   * PARÂMETROS E RETORNO: Recebe rows como array filtrado/ordenado e retorna linhas da página,
   * total de páginas, página atual e total filtrado.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; usa apenas `diretorClassificationCurrentPage`
   * em memória.
   * TODO: Em produção, substituir o recorte local por paginação real no endpoint do diretor.
   */
  const totalFiltered = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / DIRETOR_CLASSIFICATION_PAGE_SIZE));
  diretorClassificationCurrentPage = Math.min(Math.max(1, diretorClassificationCurrentPage), totalPages);
  const startIndex = (diretorClassificationCurrentPage - 1) * DIRETOR_CLASSIFICATION_PAGE_SIZE;

  return {
    rows: rows.slice(startIndex, startIndex + DIRETOR_CLASSIFICATION_PAGE_SIZE),
    totalPages,
    currentPage: diretorClassificationCurrentPage,
    totalFiltered
  };
}

function diretorRenderClassificationPagination(pageInfo) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Atualiza texto e estado dos botões da paginação da distribuição.
   * PARÂMETROS E RETORNO: Recebe pageInfo com currentPage e totalPages; não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava LocalStorage; altera somente o DOM.
   * TODO: Em produção, refletir a página na URL e buscar a página diretamente no backend.
   */
  const status = document.getElementById('director-classification-pagination-status');
  const previous = document.getElementById('director-classification-page-prev');
  const next = document.getElementById('director-classification-page-next');

  if (status) status.textContent = `Página ${pageInfo.currentPage} de ${pageInfo.totalPages}`;
  if (previous) previous.disabled = pageInfo.currentPage <= 1;
  if (next) next.disabled = pageInfo.currentPage >= pageInfo.totalPages;
}

function diretorRenderClassificationsTable() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Renderiza a tabela de distribuição do diretor com todos os contratos,
   * permitindo alterar a CPA diretamente em cada linha.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê contratos/classificações e acessos operacionais do
   * LocalStorage; escreve somente no DOM.
   * TODO: Em produção, adicionar paginação, histórico e salvamento por endpoint transacional.
   */
  const body = document.getElementById('director-classifications-body');
  if (!body) return;

  const allRows = diretorBuildClassificationRows();
  const filteredRows = diretorApplyClassificationFilters(allRows);
  const orderedRows = diretorSortClassificationRows(filteredRows, diretorAppliedClassificationFilters.orderBy);
  const pageInfo = diretorPaginateClassificationRows(orderedRows);
  const rows = pageInfo.rows;

  const count = document.getElementById('director-classifications-count');
  if (count) {
    const totalLabel = allRows.length === 1 ? '1 cadastrado' : `${allRows.length} cadastrados`;
    count.textContent = rows.length === 1
      ? `1 contrato exibido de ${totalLabel}.`
      : `${rows.length} contratos exibidos de ${totalLabel}.`;
  }

  if (!rows.length) {
    body.innerHTML = '<tr><td class="empty" colspan="13">Nenhum contrato encontrado para os filtros selecionados.</td></tr>';
    diretorRenderClassificationPagination(pageInfo);
    return;
  }

  const regions = diretorGetRegions();
  const buildRegionOptions = (selectedRegionId) => [
    '<option value="">Sem distribuição</option>',
    ...regions.map((region) => (
      `<option value="${diretorEscapeHtml(region.id)}"${region.id === selectedRegionId ? ' selected' : ''}>${diretorEscapeHtml(region.nome)}</option>`
    ))
  ].join('');

  body.innerHTML = rows.map((row) => {
    const accessSummary = diretorGetContractOperationalAccessSummary(row.contratoId);
    const status = diretorGetContractStatus(row.contrato);
    const contractType = diretorNormalizeContractType(row.contrato.tipoConveniado) || 'Não informado';
    return `
      <tr>
        <td><strong>${diretorEscapeHtml(row.contrato.nome || 'Contrato não encontrado')}</strong></td>
        <td>${diretorEscapeHtml(diretorFormatCnpj(row.contrato.cnpj))}</td>
        <td>${diretorEscapeHtml(contractType)}</td>
        <td>${diretorEscapeHtml(row.regiao.nome || 'Não classificado')}</td>
        <td>${diretorRenderContractOperationalAccessSummary(accessSummary)}</td>
        <td>${diretorEscapeHtml(row.contrato.numero || '-')}</td>
        <td>${diretorFormatMoney(row.contrato.valorContrato)}</td>
        <td>${diretorFormatDate(row.contrato.inicio)}</td>
        <td>${diretorFormatDate(row.contrato.fim)}</td>
        <td><span class="director-status-text ${diretorEscapeHtml(status.className)}">${diretorEscapeHtml(status.label)}</span></td>
        <td>${diretorFormatDate(row.dataClassificacao)}</td>
        <td>
          <select class="director-inline-select" data-director-row-region="${diretorEscapeHtml(row.contratoId)}">
            ${buildRegionOptions(row.regiaoId || '')}
          </select>
        </td>
        <td><button type="button" class="director-row-save" data-director-save-contract="${diretorEscapeHtml(row.contratoId)}">Salvar</button></td>
      </tr>
    `;
  }).join('');
  diretorRenderClassificationPagination(pageInfo);
}

function diretorSaveContractDistributionFromRow(contractId) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Atualiza a distribuição de um contrato diretamente a partir da linha
   * da tabela do diretor.
   * PARÂMETROS E RETORNO: Recebe contractId como string e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê o select da linha no DOM e grava/substitui o vínculo em
   * `cproeis_diretor_contratos_regioes`; se o select ficar vazio, remove a classificação vigente.
   * TODO: Em produção, substituir a gravação local por PATCH/DELETE com auditoria do diretor.
   */
  const select = [...document.querySelectorAll('[data-director-row-region]')]
    .find((field) => field.dataset.directorRowRegion === contractId);
  const regionId = select?.value || '';
  const current = diretorGetClassifications().filter((item) => item.contratoId !== contractId);
  const next = regionId
    ? [
      ...current,
      {
        id: diretorMakeId('classificacao'),
        contratoId: contractId,
        regiaoId: regionId,
        dataClassificacao: diretorToday(),
        atualizadoEm: new Date().toISOString()
      }
    ]
    : current;

  diretorSaveList(DIRETOR_CLASSIFICATIONS_STORAGE, next);
  diretorRenderRegionsTable();
  diretorRenderClassificationsTable();

  const feedback = document.getElementById('director-classification-feedback');
  if (feedback) feedback.textContent = regionId ? 'CPA do contrato atualizada.' : 'Distribuição do contrato removida.';
}

function diretorBindClassificationFilters() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Conecta filtros e botões de alteração da tabela de distribuição do diretor.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Registra listeners no DOM; não grava dados.
   * TODO: Em produção, refletir filtros na URL e salvar alterações por endpoint autenticado.
   */
  diretorFillRegionOptions(document.getElementById('director-classification-filter-region'), true);

  document.getElementById('director-classification-filter-apply')?.addEventListener('click', () => {
    diretorAppliedClassificationFilters = diretorGetClassificationFiltersFromDom();
    diretorClassificationCurrentPage = 1;
    diretorRenderClassificationsTable();
  });

  document.getElementById('director-classifications-body')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-director-save-contract]');
    if (!button) return;
    diretorSaveContractDistributionFromRow(button.dataset.directorSaveContract);
  });
}

function diretorBindClassificationPagination() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Liga os botões Anterior e Próxima da tabela de distribuição do diretor.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Atualiza somente a página atual em memória; não grava dados.
   * TODO: Em produção, trocar a troca local por chamada ao endpoint com page e limit.
   */
  const previous = document.getElementById('director-classification-page-prev');
  const next = document.getElementById('director-classification-page-next');

  if (previous && previous.dataset.paginationBound !== 'true') {
    previous.dataset.paginationBound = 'true';
    previous.addEventListener('click', () => {
      diretorClassificationCurrentPage -= 1;
      diretorRenderClassificationsTable();
    });
  }

  if (next && next.dataset.paginationBound !== 'true') {
    next.dataset.paginationBound = 'true';
    next.addEventListener('click', () => {
      diretorClassificationCurrentPage += 1;
      diretorRenderClassificationsTable();
    });
  }
}

diretorBindRegionsFilters();
diretorRenderRegionsTable();
diretorBindClassificationFilters();
diretorBindClassificationPagination();
diretorRenderClassificationsTable();
