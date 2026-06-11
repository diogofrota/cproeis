const RESPONSAVEIS_TABLE_STORAGE_CONVENIOS = 'cproeis_contratos_convenios';
const RESPONSAVEIS_TABLE_STORAGE_RESPONSAVEIS = 'cproeis_contratos_responsaveis';
const RESPONSAVEIS_TABLE_STORAGE_DIRETOR_REGIOES = 'cproeis_diretor_regioes';
const RESPONSAVEIS_TABLE_STORAGE_DIRETOR_CLASSIFICACOES = 'cproeis_diretor_contratos_regioes';
const RESPONSAVEIS_TABLE_JSON_API = window.CPROEISContratosJsonApi || null;

const responsaveisTableBody = document.getElementById('responsaveis-body');
const responsaveisCount = document.getElementById('responsaveis-count');
const responsaveisFilterIds = [
  'responsavel-filter-text',
  'responsavel-filter-type',
  'responsavel-filter-director-region',
  'responsavel-filter-status'
];

function responsaveisEscapeHtml(value) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Sanitiza valores textuais antes de inserir na tabela de responsáveis,
   * reduzindo risco de HTML acidental vindo do cadastro local.
   * PARÂMETROS E RETORNO: Recebe value como qualquer tipo primitivo e retorna string segura.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava armazenamento; opera somente sobre o valor recebido.
   * TODO: Em produção, manter sanitização no frontend e validar/escapar também no backend.
   */
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function responsaveisNormalizeText(value) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Normaliza texto para comparação de filtros sem diferenciar acentos,
   * caixa ou espaços duplicados.
   * PARÂMETROS E RETORNO: Recebe value como string/valor simples e retorna string normalizada.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não acessa LocalStorage; apenas transforma o valor em memória.
   * TODO: Em produção, mover normalização de busca para índice/pesquisa no banco de dados.
   */
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function responsaveisReadList(key) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Lê listas de responsáveis e contratos pela camada de dados do módulo,
   * mantendo a tabela como esqueleto visual que apenas recebe arrays prontos.
   * PARÂMETROS E RETORNO: Recebe key como string de armazenamento e retorna array de objetos.
   * ARMAZENAMENTO E PERSISTÊNCIA: Usa `CPROEISContratosJsonApi.readJsonList`, que hoje lê
   * LocalStorage e futuramente poderá consultar a API sem alterar esta página.
   * TODO: Em produção, trocar a implementação do adaptador por chamada assíncrona com loading,
   * erro e paginação.
   */
  if (RESPONSAVEIS_TABLE_JSON_API?.readJsonList) return RESPONSAVEIS_TABLE_JSON_API.readJsonList(key);
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function responsaveisFormatDate(value) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Converte datas ISO do cadastro para o padrão brasileiro usado nas
   * tabelas operacionais.
   * PARÂMETROS E RETORNO: Recebe value como string `YYYY-MM-DD` e retorna string `DD/MM/YYYY`
   * ou traço quando não houver data válida.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava dados; formata apenas o valor recebido.
   * TODO: Em produção, centralizar formatação de datas em utilitário compartilhado do sistema.
   */
  if (!value) return '-';
  const [year, month, day] = String(value).split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function responsaveisGetDirectorRegionMaps() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Monta mapas de apoio com CPAs criadas pelo diretor e classificações
   * contrato-CPA, permitindo consulta e filtro no módulo de contratos sem alterar o contrato.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e retorna objeto com regionById e classificationByContract.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê `cproeis_diretor_regioes` e
   * `cproeis_diretor_contratos_regioes`; não grava dados.
   * TODO: Em produção, consumir uma visão consolidada do backend para respeitar permissões e histórico.
   */
  const regionById = new Map(
    responsaveisReadList(RESPONSAVEIS_TABLE_STORAGE_DIRETOR_REGIOES)
      .filter((region) => !region.tipo || region.tipo === 'CPA')
      .map((region) => [region.id, region])
  );
  const classificationByContract = new Map(
    responsaveisReadList(RESPONSAVEIS_TABLE_STORAGE_DIRETOR_CLASSIFICACOES)
      .map((classification) => [classification.contratoId, classification])
  );

  return { regionById, classificationByContract };
}

function responsaveisFillDirectorRegionFilter() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Preenche o filtro de distribuição do diretor com as CPAs
   * cadastradas no Acesso Diretor.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê `cproeis_diretor_regioes`; escreve somente opções no DOM.
   * TODO: Em produção, carregar as opções por endpoint e tratar indisponibilidade da API.
   */
  const select = document.getElementById('responsavel-filter-director-region');
  if (!select) return;

  const currentValue = select.value;
  const regions = responsaveisReadList(RESPONSAVEIS_TABLE_STORAGE_DIRETOR_REGIOES)
    .filter((region) => !region.tipo || region.tipo === 'CPA')
    .sort((a, b) => responsaveisNormalizeText(a.nome).localeCompare(responsaveisNormalizeText(b.nome)));

  select.innerHTML = [
    '<option value="">Todos</option>',
    '<option value="nao-classificado">Não classificado</option>',
    ...regions.map((region) => (
      `<option value="${responsaveisEscapeHtml(region.id)}">${responsaveisEscapeHtml(region.nome || 'CPA sem nome')}</option>`
    ))
  ].join('');
  select.value = currentValue === 'nao-classificado' || regions.some((region) => region.id === currentValue)
    ? currentValue
    : '';
}

function responsaveisBuildRows() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Cruza contratos e responsáveis para criar linhas enriquecidas com
   * tipo de convênio e classificação feita pelo diretor, permitindo filtros gerenciais por
   * enquadramento do contrato e distribuição operacional remodelável.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e retorna array de linhas de tabela.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê `cproeis_contratos_convenios` e
   * `cproeis_contratos_responsaveis`, além das chaves de distribuição do diretor; não altera persistência.
   * TODO: Em produção, realizar este join no backend para evitar carregar todos os contratos.
   */
  const convenios = responsaveisReadList(RESPONSAVEIS_TABLE_STORAGE_CONVENIOS);
  const responsaveis = responsaveisReadList(RESPONSAVEIS_TABLE_STORAGE_RESPONSAVEIS);
  const convenioMap = new Map(convenios.map((convenio) => [convenio.id, convenio]));
  const { regionById, classificationByContract } = responsaveisGetDirectorRegionMaps();
  const rowsByKey = new Map();

  const addResponsavel = (responsavel, convenioFallback = null) => {
    const convenio = convenioMap.get(responsavel.convenioId) || convenioFallback || {};
    const directorClassification = classificationByContract.get(convenio.id || responsavel.convenioId) || {};
    const directorRegion = regionById.get(directorClassification.regiaoId) || {};
    const key = [
      responsavel.convenioId || convenio.id || '',
      responsavel.id || '',
      responsavel.cpf || '',
      responsavel.email || '',
      responsavel.nome || ''
    ].join('|');

    if (rowsByKey.has(key)) return;

    rowsByKey.set(key, {
      ...responsavel,
      contratoNome: convenio.nome || responsavel.convenioNome || 'Contrato não encontrado',
      contratoNumero: convenio.numero || '',
      tipoConveniado: convenio.tipoConveniado || '',
      diretorRegiaoId: directorRegion.id || '',
      diretorRegiaoNome: directorRegion.nome || '',
      diretorRegiaoTipo: directorRegion.tipo || '',
      detalhesUrl: convenio.id ? `detalhes-convenio.html?id=${encodeURIComponent(convenio.id)}` : ''
    });
  };

  responsaveis.forEach((responsavel) => addResponsavel(responsavel));
  convenios.forEach((convenio) => {
    (convenio.responsaveis || []).forEach((responsavel) => {
      addResponsavel({ ...responsavel, convenioId: responsavel.convenioId || convenio.id }, convenio);
    });
  });

  return [...rowsByKey.values()].sort((a, b) => {
    const contratoCompare = responsaveisNormalizeText(a.contratoNome).localeCompare(responsaveisNormalizeText(b.contratoNome));
    if (contratoCompare) return contratoCompare;
    return responsaveisNormalizeText(a.nome).localeCompare(responsaveisNormalizeText(b.nome));
  });
}

function responsaveisGetFilters() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Coleta os filtros atuais da tela de responsáveis para aplicar sobre
   * as linhas montadas em memória.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e retorna objeto com texto, tipo, distribuição
   * do diretor e situação.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê apenas inputs/selects do DOM; não grava armazenamento.
   * TODO: Em produção, enviar estes critérios como query params para endpoint paginado.
   */
  return {
    text: responsaveisNormalizeText(document.getElementById('responsavel-filter-text')?.value || ''),
    type: document.getElementById('responsavel-filter-type')?.value || '',
    directorRegion: document.getElementById('responsavel-filter-director-region')?.value || '',
    status: document.getElementById('responsavel-filter-status')?.value || ''
  };
}

function responsaveisEnsureDefaultStatusFilter() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Mantém a tabela de responsáveis iniciando pelos registros ativos,
   * carregando inativos somente quando o usuário escolher essa situação ou Todos.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava LocalStorage; altera apenas o select no DOM.
   * TODO: Em produção, enviar `status=active` como filtro padrão da consulta paginada.
   */
  const statusFilter = document.getElementById('responsavel-filter-status');
  if (statusFilter && !statusFilter.value) statusFilter.value = 'active';
}

function responsaveisApplyFilters(rows, filters) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Filtra responsáveis por busca textual, tipo de convênio, distribuição
   * do diretor e existência de data fim.
   * PARÂMETROS E RETORNO: Recebe rows como array e filters como objeto; retorna novo array filtrado.
   * ARMAZENAMENTO E PERSISTÊNCIA: Opera somente em arrays locais montados a partir do LocalStorage.
   * TODO: Em produção, espelhar esta regra no backend e manter frontend apenas como consumidor.
   */
  return rows.filter((row) => {
    const searchable = responsaveisNormalizeText([
      row.nome,
      row.cpf,
      row.email,
      row.telefone,
      row.contratoNome,
      row.contratoNumero,
      row.tipoConveniado,
      row.diretorRegiaoNome,
      row.diretorRegiaoTipo
    ].join(' '));
    const status = row.fim ? 'ended' : 'active';

    return (!filters.text || searchable.includes(filters.text))
      && (!filters.type || row.tipoConveniado === filters.type)
      && (!filters.directorRegion
        || (filters.directorRegion === 'nao-classificado' ? !row.diretorRegiaoId : row.diretorRegiaoId === filters.directorRegion))
      && (!filters.status || status === filters.status);
  });
}

function responsaveisRenderTable() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Renderiza a tabela e o contador de responsáveis conforme filtros atuais.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê indiretamente LocalStorage por `responsaveisBuildRows` e
   * escreve somente HTML no DOM.
   * TODO: Em produção, trocar renderização total por paginação/virtualização quando houver muitos registros.
   */
  if (!responsaveisTableBody) return;

  const allRows = responsaveisBuildRows();
  const filteredRows = responsaveisApplyFilters(allRows, responsaveisGetFilters());

  if (responsaveisCount) {
    responsaveisCount.textContent = `${filteredRows.length} responsável(is) exibido(s) de ${allRows.length} cadastrado(s).`;
  }

  if (!filteredRows.length) {
    responsaveisTableBody.innerHTML = '<tr><td class="empty" colspan="9">Nenhum responsável encontrado para os filtros selecionados.</td></tr>';
    return;
  }

  responsaveisTableBody.innerHTML = filteredRows.map((row) => `
      <tr>
        <td><strong>${responsaveisEscapeHtml(row.nome || '-')}</strong></td>
        <td>${responsaveisEscapeHtml(row.cpf || '-')}</td>
        <td>${responsaveisEscapeHtml(row.email || '-')}</td>
        <td>${responsaveisEscapeHtml(row.telefone || '-')}</td>
        <td>${responsaveisEscapeHtml(row.contratoNome || '-')}</td>
        <td>${responsaveisEscapeHtml(row.tipoConveniado || 'Não informado')}</td>
        <td>${row.diretorRegiaoNome ? responsaveisEscapeHtml(row.diretorRegiaoNome) : 'Não classificado'}</td>
        <td>${responsaveisFormatDate(row.inicio)}</td>
        <td>${responsaveisFormatDate(row.fim)}</td>
      </tr>
    `).join('');
}

function responsaveisBindFilters() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Conecta os campos de filtro à renderização da tabela de responsáveis.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Registra listeners no DOM; não lê nem grava LocalStorage.
   * TODO: Em produção, sincronizar filtros na URL para permitir compartilhamento de consultas.
  */
  responsaveisFillDirectorRegionFilter();
  responsaveisEnsureDefaultStatusFilter();

  responsaveisFilterIds.forEach((id) => {
    const field = document.getElementById(id);
    if (!field) return;
    field.addEventListener('input', responsaveisRenderTable);
    field.addEventListener('change', responsaveisRenderTable);
  });

  document.getElementById('clear-responsavel-filters')?.addEventListener('click', () => {
    responsaveisFilterIds.forEach((id) => {
      const field = document.getElementById(id);
      if (!field) return;
      field.value = id === 'responsavel-filter-status' ? 'active' : '';
    });
    responsaveisRenderTable();
  });
}

responsaveisBindFilters();
responsaveisRenderTable();
