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
    revisaoConvenio: 'cproeis_contratos_revisao_convenio',
    revisaoResponsavel: 'cproeis_contratos_revisao_responsavel'
  };

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
    listarConvenios,
    buscarConvenioPorId,
    confirmarCadastroConvenio,
    adicionarResponsavel,
    retirarResponsavel,
    readJsonList,
    writeJsonList,
    readSessionJson,
    writeSessionJson,
    removeSessionJson
  };
}());
