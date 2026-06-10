const RETIRAR_STORAGE_CONVENIOS = 'cproeis_contratos_convenios';
const RETIRAR_STORAGE_REVISAO = 'cproeis_contratos_revisao_responsavel';
const RETIRAR_JSON_API = window.CPROEISContratosJsonApi || null;

const retirarParams = new URLSearchParams(window.location.search);
let retirarConvenioId = retirarParams.get('id') || '';
let retirarResponsavelId = retirarParams.get('responsavelId') || '';

const retirarForm = document.getElementById('retirar-responsavel-form');
const retirarPageSubtitle = document.getElementById('retirar-page-subtitle');
const retirarCancelButton = document.getElementById('cancel-retirar-responsavel');
const retirarFields = {
  convenio: document.getElementById('retirar-convenio'),
  responsavel: document.getElementById('retirar-responsavel'),
  dataFinal: document.getElementById('retirar-data-final')
};
const retirarHints = {
  convenio: document.getElementById('retirar-convenio-hint'),
  responsavel: document.getElementById('retirar-responsavel-hint'),
  dataFinal: document.getElementById('retirar-data-final-hint')
};

let retirarConvenioAtual = null;

function retirarLoadList(key) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Lê uma lista persistida no LocalStorage com retorno seguro.
   * PARÂMETROS E RETORNO: Recebe key como string e retorna array de objetos.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê LocalStorage na chave informada; não grava dados.
   * TODO: Em produção, trocar por consulta autenticada à API de contratos.
   */
  if (RETIRAR_JSON_API?.readJsonList) return RETIRAR_JSON_API.readJsonList(key);
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (error) {
    return [];
  }
}

function retirarSetFieldState(key, valid) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Atualiza feedback visual dos campos obrigatórios da retirada.
   * PARÂMETROS E RETORNO: Recebe key como string e valid como booleano; retorna o booleano.
   * ARMAZENAMENTO E PERSISTÊNCIA: Altera apenas classes no DOM; não grava dados.
   * TODO: Em produção, exibir mensagens de validação vindas do backend quando houver regra online.
   */
  retirarFields[key]?.classList.toggle('invalid', !valid);
  retirarHints[key]?.classList.toggle('hidden', valid);
  return valid;
}

function retirarGetResponsaveisAtivos(convenio = retirarConvenioAtual) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Resolve responsáveis ativos do convênio selecionado.
   * PARÂMETROS E RETORNO: Recebe convenio como objeto opcional e retorna array de responsáveis sem data fim.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê dados em memória vindos de `cproeis_contratos_convenios`.
   * TODO: Em produção, buscar responsáveis ativos por endpoint paginado e auditável.
   */
  return (convenio?.responsaveis || []).filter((responsavel) => !responsavel.fim);
}

function retirarRenderConvenios() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Preenche o seletor de convênios e atualiza o convênio atual da página.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê `cproeis_contratos_convenios`; escreve apenas no DOM.
   * TODO: Em produção, carregar contratos por API com busca/autocomplete quando a lista crescer.
   */
  const convenios = RETIRAR_JSON_API?.listarConvenios
    ? RETIRAR_JSON_API.listarConvenios().data
    : retirarLoadList(RETIRAR_STORAGE_CONVENIOS);
  if (retirarFields.convenio) {
    retirarFields.convenio.innerHTML = [
      '<option value="">Selecione um contrato</option>',
      ...convenios.map((convenio) => `<option value="${convenio.id}">${convenio.nome || 'Convênio sem nome'} | ${convenio.numero || '-'}</option>`)
    ].join('');
    retirarFields.convenio.value = retirarConvenioId;
  }

  retirarConvenioAtual = convenios.find((convenio) => convenio.id === retirarConvenioId) || null;
}

function retirarRenderResponsaveis() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Preenche o seletor de responsáveis ativos conforme o convênio selecionado.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e não retorna valores.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê `retirarConvenioAtual` em memória; escreve somente no DOM.
   * TODO: Em produção, bloquear retirada quando houver pendências operacionais em aberto.
   */
  const responsaveis = retirarGetResponsaveisAtivos();
  if (retirarFields.responsavel) {
    retirarFields.responsavel.innerHTML = [
      '<option value="">Selecione um responsável ativo</option>',
      ...responsaveis.map((responsavel) => `<option value="${responsavel.id}">${responsavel.nome || 'Responsável sem nome'} | ${responsavel.cpf || 'CPF não informado'}</option>`)
    ].join('');
    retirarFields.responsavel.value = retirarResponsavelId;
  }

  if (retirarFields.dataFinal) {
    retirarFields.dataFinal.min = retirarConvenioAtual?.inicio || '';
    retirarFields.dataFinal.max = retirarConvenioAtual?.fim || '';
    retirarFields.dataFinal.value = retirarFields.dataFinal.value || new Date().toISOString().slice(0, 10);
  }

  if (retirarPageSubtitle) {
    retirarPageSubtitle.textContent = retirarConvenioAtual
      ? `${retirarConvenioAtual.nome || 'Convênio sem nome'} | Contrato ${retirarConvenioAtual.numero || '-'}`
      : 'Selecione o convênio e o responsável que terá o acesso encerrado.';
  }
}

function retirarValidateForm() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Valida convênio, responsável e data final antes de encerrar o acesso.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e retorna booleano.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê inputs e estado em memória; não grava dados.
   * TODO: Em produção, repetir a validação no backend antes de confirmar a retirada.
   */
  const dataFinal = retirarFields.dataFinal?.value || '';
  const dentroVigencia = !dataFinal
    || (!retirarConvenioAtual?.inicio || dataFinal >= retirarConvenioAtual.inicio)
    && (!retirarConvenioAtual?.fim || dataFinal <= retirarConvenioAtual.fim);

  return [
    retirarSetFieldState('convenio', Boolean(retirarConvenioAtual)),
    retirarSetFieldState('responsavel', Boolean(retirarResponsavelId)),
    retirarSetFieldState('dataFinal', Boolean(dataFinal) && dentroVigencia)
  ].every(Boolean);
}

function retirarSalvarRascunhoRevisao() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Salva a retirada de responsável como rascunho para conferência antes
   * de gravar a data final.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Grava sessionStorage em `cproeis_contratos_revisao_responsavel`;
   * não altera LocalStorage.
   * TODO: Em produção, criar rascunho no backend com bloqueio contra alterações concorrentes.
   */
  const responsavel = retirarGetResponsaveisAtivos()
    .find((item) => item.id === retirarResponsavelId) || {};

  const draft = {
    tipo: 'retirar',
    convenioId: retirarConvenioId,
    convenio: {
      id: retirarConvenioAtual?.id || '',
      nome: retirarConvenioAtual?.nome || '',
      cnpj: retirarConvenioAtual?.cnpj || '',
      numero: retirarConvenioAtual?.numero || ''
    },
    responsavel: {
      ...responsavel,
      fim: retirarFields.dataFinal.value
    }
  };

  if (RETIRAR_JSON_API?.writeSessionJson) {
    RETIRAR_JSON_API.writeSessionJson(RETIRAR_STORAGE_REVISAO, draft);
    return;
  }
  sessionStorage.setItem(RETIRAR_STORAGE_REVISAO, JSON.stringify(draft));
}

function retirarInit() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Inicializa a página de retirada com seletores preenchidos e listeners ativos.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê LocalStorage para montar seletores; grava somente no submit.
   * TODO: Em produção, carregar dados de forma assíncrona com loading e tratamento de erro.
   */
  retirarRenderConvenios();
  retirarRenderResponsaveis();

  if (retirarParams.get('draft') === '1') {
    /*
     * DESCRIÇÃO DO BLOCO: Restaura o rascunho da retirada quando o usuário volta da revisão
     * para corrigir antes de confirmar.
     * PARÂMETROS E RETORNO: Não recebe parâmetros explícitos e não retorna valor.
     * ARMAZENAMENTO E PERSISTÊNCIA: Lê sessionStorage e escreve somente nos campos do DOM.
     * TODO: Em produção, restaurar por identificador de fluxo controlado no backend.
     */
    try {
      const draft = RETIRAR_JSON_API?.readSessionJson
        ? RETIRAR_JSON_API.readSessionJson(RETIRAR_STORAGE_REVISAO)
        : JSON.parse(sessionStorage.getItem(RETIRAR_STORAGE_REVISAO));
      if (draft?.tipo === 'retirar') {
        retirarConvenioId = draft.convenioId || retirarConvenioId;
        retirarResponsavelId = draft.responsavel?.id || retirarResponsavelId;
        retirarRenderConvenios();
        retirarRenderResponsaveis();
        if (retirarFields.dataFinal) retirarFields.dataFinal.value = draft.responsavel?.fim || retirarFields.dataFinal.value;
      }
    } catch (error) {
      // Mantém o esqueleto vazio quando não houver rascunho válido.
    }
  }
}

retirarFields.convenio?.addEventListener('change', () => {
  retirarConvenioId = retirarFields.convenio.value;
  retirarResponsavelId = '';
  retirarRenderConvenios();
  retirarRenderResponsaveis();
  retirarValidateForm();
});

retirarFields.responsavel?.addEventListener('change', () => {
  retirarResponsavelId = retirarFields.responsavel.value;
  retirarValidateForm();
});

retirarFields.dataFinal?.addEventListener('input', retirarValidateForm);

retirarForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!retirarValidateForm()) return;
  retirarSalvarRascunhoRevisao();
  window.location.href = 'revisar-responsavel.html';
});

retirarCancelButton?.addEventListener('click', () => {
  window.location.href = 'tabela-convenios.html';
});

retirarInit();
