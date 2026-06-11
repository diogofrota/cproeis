(function initContratosJsonApi() {
  /*
   * DESCRIÇÃO DO BLOCO: Cria uma camada única de comunicação JSON para o módulo de contratos.
   * Hoje ela simula a API usando LocalStorage/sessionStorage, mas todas as telas passam a tratar
   * entrada e saída como payloads JSON, no mesmo formato esperado de um backend.
   * PARÂMETROS E RETORNO: Não recebe parâmetros; publica `window.CPROEISContratosJsonApi`.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê/grava LocalStorage nas chaves do módulo de contratos e
   * lê/grava sessionStorage para rascunhos de revisão.
   * TODO: Em produção, substituir as funções internas por chamadas `fetch` com autenticação,
   * tratamento de erro HTTP, logs de auditoria e controle de concorrência no banco.
   */
  const STORAGE_KEYS = {
    convenios: 'cproeis_contratos_convenios',
    valores: 'cproeis_contratos_valores',
    responsaveis: 'cproeis_contratos_responsaveis',
    limitesVagas: 'cproeis_contratos_limites_vagas',
    renovacoes: 'cproeis_contratos_renovacoes',
    historicos: 'cproeis_contratos_historicos',
    diretorCpas: 'cproeis_diretor_regioes',
    diretorContratosCpas: 'cproeis_diretor_contratos_regioes',
    gsiUsuariosContrato: 'cproeis_gsi_usuarios_contrato',
    gsiUsuariosContratoRemovidos: 'cproeis_gsi_usuarios_contrato_removidos',
    revisaoConvenio: 'cproeis_contratos_revisao_convenio',
    revisaoResponsavel: 'cproeis_contratos_revisao_responsavel'
  };

  const API_CONTRACT = {
    /*
     * DESCRIÇÃO DO BLOCO: Centraliza o desenho inicial dos endpoints que substituirão o
     * LocalStorage quando o módulo de contratos migrar para uma API real.
     * PARÂMETROS E RETORNO: Não recebe parâmetros; expõe strings de rota e versão de schema
     * para as funções da camada `CPROEISContratosJsonApi`.
     * ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava dados; serve como contrato em memória
     * para manter as telas acopladas ao adaptador, não ao banco ou SQL.
     * TODO: Em produção, mover baseUrl para configuração de ambiente e sincronizar estas rotas
     * com OpenAPI/Swagger oficial do backend.
     */
    schemaVersion: '2026-06-05-responsaveis-sem-nivel',
    baseUrl: '/api',
    endpoints: {
      convenios: '/contratos/convenios',
      convenioById: (id) => `/contratos/convenios/${encodeURIComponent(id)}`,
      valores: (convenioId) => `/contratos/convenios/${encodeURIComponent(convenioId)}/valores`,
      limitesVagas: (convenioId) => `/contratos/convenios/${encodeURIComponent(convenioId)}/limites-vagas`,
      responsaveis: (convenioId) => `/contratos/convenios/${encodeURIComponent(convenioId)}/responsaveis`,
      responsavelById: (convenioId, responsavelId) => `/contratos/convenios/${encodeURIComponent(convenioId)}/responsaveis/${encodeURIComponent(responsavelId)}`,
      renovacoes: '/contratos/renovacoes',
      historicos: '/contratos/historicos',
      diretorCpas: '/diretor/cpas',
      diretorContratosCpas: '/diretor/contratos-cpas',
      gsiUsuariosContrato: (convenioId) => `/contratos/convenios/${encodeURIComponent(convenioId)}/usuarios-operacionais`,
      gsiUsuariosContratoRemovidos: (convenioId) => `/contratos/convenios/${encodeURIComponent(convenioId)}/usuarios-operacionais/removidos`,
      revisaoConvenio: '/contratos/convenios/revisoes',
      revisaoResponsavel: '/contratos/responsaveis/revisoes'
    }
  };

  function buildApiRequestOptions(method = 'GET', payload = null) {
    /*
     * DESCRIÇÃO DA FUNÇÃO: Monta opções padronizadas para futuras chamadas `fetch` da API,
     * mantendo headers JSON e credenciais no mesmo ponto.
     * PARÂMETROS E RETORNO: Recebe method como string HTTP e payload como objeto opcional;
     * retorna objeto de configuração compatível com `fetch`.
     * ARMAZENAMENTO E PERSISTÊNCIA: Não acessa LocalStorage nem sessionStorage; apenas prepara
     * dados em memória para a requisição futura.
     * TODO: Em produção, incluir token CSRF/JWT, correlation-id e política de timeout/cancelamento.
     */
    const options = {
      method,
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-CPROEIS-Schema': API_CONTRACT.schemaVersion
      }
    };

    if (payload !== null) options.body = JSON.stringify(payload);
    return options;
  }

  async function requestJson(endpoint, options = buildApiRequestOptions()) {
    /*
     * DESCRIÇÃO DA FUNÇÃO: Define o caminho de migração para chamadas HTTP reais sem espalhar
     * `fetch` pelas telas de contratos.
     * PARÂMETROS E RETORNO: Recebe endpoint como string relativa e options como configuração
     * de `fetch`; retorna uma Promise com o JSON de resposta ou lança erro em falha HTTP.
     * ARMAZENAMENTO E PERSISTÊNCIA: Não usa armazenamento local; buscará dados na API quando
     * as funções públicas deixarem de usar os helpers locais.
     * TODO: Em produção, ativar esta função nas operações públicas, tratar 401/403 de forma
     * centralizada e registrar falhas em observabilidade.
     */
    const response = await fetch(`${API_CONTRACT.baseUrl}${endpoint}`, options);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const error = new Error(data?.message || 'Falha ao comunicar com a API.');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  function readJsonList(key) {
    /*
     * DESCRIÇÃO DA FUNÇÃO: Lê uma lista JSON do armazenamento local com retorno seguro.
     * PARÂMETROS E RETORNO: Recebe key como string; retorna array de objetos.
     * ARMAZENAMENTO E PERSISTÊNCIA: Lê LocalStorage na chave informada; não grava dados.
     * TODO: Em produção, trocar por GET em endpoint paginado e validar o schema recebido.
     */
    try {
      const parsed = JSON.parse(localStorage.getItem(key));
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function writeJsonList(key, list) {
    /*
     * DESCRIÇÃO DA FUNÇÃO: Grava uma lista como JSON no armazenamento local do protótipo.
     * PARÂMETROS E RETORNO: Recebe key como string e list como array; retorna o próprio array gravado.
     * ARMAZENAMENTO E PERSISTÊNCIA: Grava LocalStorage usando JSON.stringify.
     * TODO: Em produção, substituir por POST/PUT/PATCH com retorno do registro salvo pelo banco.
     */
    const safeList = Array.isArray(list) ? list : [];
    localStorage.setItem(key, JSON.stringify(safeList));
    return safeList;
  }

  function readSessionJson(key) {
    /*
     * DESCRIÇÃO DA FUNÇÃO: Recupera um rascunho JSON temporário usado nas telas de revisão.
     * PARÂMETROS E RETORNO: Recebe key como string; retorna objeto JSON ou null.
     * ARMAZENAMENTO E PERSISTÊNCIA: Lê sessionStorage, que dura apenas a aba atual do navegador.
     * TODO: Em produção, substituir por rascunho salvo no backend com expiração e dono autenticado.
     */
    try {
      return JSON.parse(sessionStorage.getItem(key)) || null;
    } catch (error) {
      return null;
    }
  }

  function writeSessionJson(key, payload) {
    /*
     * DESCRIÇÃO DA FUNÇÃO: Salva um rascunho JSON temporário para conferência antes da gravação final.
     * PARÂMETROS E RETORNO: Recebe key como string e payload como objeto; retorna o payload salvo.
     * ARMAZENAMENTO E PERSISTÊNCIA: Grava sessionStorage em formato JSON.
     * TODO: Em produção, trocar por endpoint de rascunho transacional com validação de schema.
     */
    sessionStorage.setItem(key, JSON.stringify(payload || {}));
    return payload;
  }

  function removeSessionJson(key) {
    /*
     * DESCRIÇÃO DA FUNÇÃO: Remove um rascunho JSON depois da confirmação ou descarte do fluxo.
     * PARÂMETROS E RETORNO: Recebe key como string e não retorna valor.
     * ARMAZENAMENTO E PERSISTÊNCIA: Remove sessionStorage da chave informada.
     * TODO: Em produção, invalidar o rascunho no backend para evitar reenvio duplicado.
     */
    sessionStorage.removeItem(key);
  }

  function buildJsonResponse(data, message = 'OK') {
    /*
     * DESCRIÇÃO DA FUNÇÃO: Padroniza respostas locais no mesmo formato esperado de uma API JSON.
     * PARÂMETROS E RETORNO: Recebe data como qualquer valor serializável e message como string;
     * retorna objeto com ok, message e data.
     * ARMAZENAMENTO E PERSISTÊNCIA: Não acessa armazenamento; apenas embrulha dados em memória.
     * TODO: Em produção, alinhar este envelope ao contrato oficial da API.
     */
    return {
      ok: true,
      message,
      data
    };
  }

  function listarConvenios() {
    /*
     * DESCRIÇÃO DA FUNÇÃO: Retorna todos os convênios cadastrados como resposta JSON.
     * PARÂMETROS E RETORNO: Não recebe parâmetros; retorna { ok, message, data: Array }.
     * ARMAZENAMENTO E PERSISTÊNCIA: Lê LocalStorage em `cproeis_contratos_convenios`.
     * TODO: Em produção, aceitar filtros, paginação e ordenação via query string da API.
     */
    return buildJsonResponse(readJsonList(STORAGE_KEYS.convenios), 'Convênios carregados.');
  }

  function buscarConvenioPorId(convenioId) {
    /*
     * DESCRIÇÃO DA FUNÇÃO: Localiza um convênio pelo identificador usado nas telas de contratos.
     * PARÂMETROS E RETORNO: Recebe convenioId como string; retorna resposta JSON com objeto ou null.
     * ARMAZENAMENTO E PERSISTÊNCIA: Lê LocalStorage em `cproeis_contratos_convenios`.
     * TODO: Em produção, trocar por GET /convenios/{id} e tratar 404/403 separadamente.
     */
    const convenio = readJsonList(STORAGE_KEYS.convenios).find((item) => item.id === convenioId) || null;
    return buildJsonResponse(convenio, convenio ? 'Convênio localizado.' : 'Convênio não encontrado.');
  }

  function confirmarCadastroConvenio(payload) {
    /*
     * DESCRIÇÃO DA FUNÇÃO: Persiste o JSON revisado do convênio e sincroniza tabelas auxiliares.
     * PARÂMETROS E RETORNO: Recebe payload como objeto completo de convênio; retorna resposta JSON
     * com o convênio gravado.
     * ARMAZENAMENTO E PERSISTÊNCIA: Grava LocalStorage em convênios, valores, responsáveis e limites.
     * TODO: Em produção, enviar este payload para endpoint transacional único, evitando gravação parcial.
     */
    if (!payload?.id) {
      return { ok: false, message: 'Payload de convênio sem identificador.', data: null };
    }

    const convenios = readJsonList(STORAGE_KEYS.convenios);
    const exists = convenios.some((item) => item.id === payload.id);
    writeJsonList(
      STORAGE_KEYS.convenios,
      exists ? convenios.map((item) => item.id === payload.id ? payload : item) : [...convenios, payload]
    );
    writeJsonList(STORAGE_KEYS.valores, [
      ...readJsonList(STORAGE_KEYS.valores).filter((item) => item.convenioId !== payload.id),
      ...(payload.valores || [])
    ]);
    writeJsonList(STORAGE_KEYS.responsaveis, [
      ...readJsonList(STORAGE_KEYS.responsaveis).filter((item) => item.convenioId !== payload.id),
      ...(payload.responsaveis || [])
    ]);
    writeJsonList(STORAGE_KEYS.limitesVagas, [
      ...readJsonList(STORAGE_KEYS.limitesVagas).filter((item) => item.convenioId !== payload.id),
      ...(payload.limitesVagasDiarias || [])
    ]);

    return buildJsonResponse(payload, 'Convênio confirmado.');
  }

  function adicionarResponsavel(draft) {
    /*
     * DESCRIÇÃO DA FUNÇÃO: Confirma o JSON de inclusão de responsável em um convênio.
     * PARÂMETROS E RETORNO: Recebe draft com convenioId e responsavel; retorna resposta JSON
     * com o responsável gravado.
     * ARMAZENAMENTO E PERSISTÊNCIA: Grava LocalStorage em `cproeis_contratos_convenios` e
     * `cproeis_contratos_responsaveis`.
     * TODO: Em produção, substituir por POST /convenios/{id}/responsaveis com auditoria.
     */
    const responsavel = draft?.responsavel;
    if (!draft?.convenioId || !responsavel?.id) {
      return { ok: false, message: 'Payload de responsável incompleto.', data: null };
    }

    writeJsonList(STORAGE_KEYS.convenios, readJsonList(STORAGE_KEYS.convenios).map((convenio) => (
      convenio.id === draft.convenioId
        ? { ...convenio, responsaveis: [...(convenio.responsaveis || []), responsavel] }
        : convenio
    )));
    writeJsonList(STORAGE_KEYS.responsaveis, [...readJsonList(STORAGE_KEYS.responsaveis), responsavel]);
    return buildJsonResponse(responsavel, 'Responsável adicionado.');
  }

  function retirarResponsavel(draft) {
    /*
     * DESCRIÇÃO DA FUNÇÃO: Confirma o JSON de retirada de responsável, registrando a data final.
     * PARÂMETROS E RETORNO: Recebe draft com convenioId e responsavel; retorna resposta JSON
     * com o responsável atualizado.
     * ARMAZENAMENTO E PERSISTÊNCIA: Atualiza LocalStorage em convênios e responsáveis.
     * TODO: Em produção, substituir por PATCH /convenios/{id}/responsaveis/{responsavelId}
     * com controle de permissões e registro de operador.
     */
    const responsavel = draft?.responsavel;
    if (!draft?.convenioId || !responsavel?.id) {
      return { ok: false, message: 'Payload de retirada incompleto.', data: null };
    }

    const updateResponsavel = (item) => item.id === responsavel.id ? { ...item, fim: responsavel.fim } : item;
    writeJsonList(STORAGE_KEYS.convenios, readJsonList(STORAGE_KEYS.convenios).map((convenio) => (
      convenio.id === draft.convenioId
        ? { ...convenio, responsaveis: (convenio.responsaveis || []).map(updateResponsavel) }
        : convenio
    )));
    writeJsonList(STORAGE_KEYS.responsaveis, readJsonList(STORAGE_KEYS.responsaveis).map(updateResponsavel));
    return buildJsonResponse({ ...responsavel }, 'Responsável retirado.');
  }

  window.CPROEISContratosJsonApi = {
    STORAGE_KEYS,
    API_CONTRACT,
    listarConvenios,
    buscarConvenioPorId,
    confirmarCadastroConvenio,
    adicionarResponsavel,
    retirarResponsavel,
    buildApiRequestOptions,
    requestJson,
    readJsonList,
    writeJsonList,
    readSessionJson,
    writeSessionJson,
    removeSessionJson
  };
}());
