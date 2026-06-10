const STORAGE_CONVENIOS = 'cproeis_contratos_convenios';
const STORAGE_REVISAO_RESPONSAVEL = 'cproeis_contratos_revisao_responsavel';
const RESPONSAVEL_JSON_API = window.CPROEISContratosJsonApi || null;

const params = new URLSearchParams(window.location.search);
let convenioId = params.get('id') || '';
const form = document.getElementById('responsavel-form');
const pageTitle = document.getElementById('responsavel-page-title');
const pageSubtitle = document.getElementById('responsavel-page-subtitle');
const cancelButton = document.getElementById('cancel-responsavel');

const fields = {
  convenio: document.getElementById('responsavel-convenio'),
  nome: document.getElementById('responsavel-nome'),
  cpf: document.getElementById('responsavel-cpf'),
  email: document.getElementById('responsavel-email'),
  telefone: document.getElementById('responsavel-telefone'),
  inicio: document.getElementById('responsavel-inicio')
};

const hints = {
  convenio: document.getElementById('responsavel-convenio-hint'),
  nome: document.getElementById('responsavel-nome-hint'),
  cpf: document.getElementById('responsavel-cpf-hint'),
  email: document.getElementById('responsavel-email-hint'),
  telefone: document.getElementById('responsavel-telefone-hint'),
  inicio: document.getElementById('responsavel-inicio-hint')
};

let convenioAtual = null;

function loadList(key) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Lê uma lista JSON do LocalStorage com tolerância a dados ausentes ou corrompidos.
   * PARÂMETROS E RETORNO: Recebe key como string e retorna array.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê LocalStorage na chave informada; não grava dados.
   * TODO: Em produção, trocar leitura local por consulta autenticada à API de contratos.
   */
  if (RESPONSAVEL_JSON_API?.readJsonList) return RESPONSAVEL_JSON_API.readJsonList(key);
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (error) {
    return [];
  }
}

function onlyDigits(value) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Remove caracteres não numéricos para validação e máscara de CPF/telefone.
   * PARÂMETROS E RETORNO: Recebe value como string e retorna string contendo somente dígitos.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não acessa armazenamento; transforma apenas o valor recebido.
   * TODO: Em produção, centralizar sanitização em utilitário compartilhado entre módulos.
   */
  return String(value || '').replace(/\D/g, '');
}

function normalizeText(value) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Normaliza espaços em textos digitados antes da validação e persistência.
   * PARÂMETROS E RETORNO: Recebe value como string e retorna string aparada com espaços simples.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava dados; apenas formata entrada em memória.
   * TODO: Em produção, aplicar normalização também no backend para consistência dos registros.
   */
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function titleCaseText(value) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Padroniza nomes próprios para apresentação e gravação local do responsável.
   * PARÂMETROS E RETORNO: Recebe value como string e retorna texto em caixa de título simples.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; o retorno é usado no payload salvo.
   * TODO: Em produção, respeitar exceções oficiais de grafia vindas de cadastro centralizado.
   */
  return normalizeText(value).toLowerCase().replace(/(^|\s)(\S)/g, (_, space, letter) => `${space}${letter.toUpperCase()}`);
}

function formatCpf(value) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Aplica máscara visual de CPF quando há 11 dígitos preenchidos.
   * PARÂMETROS E RETORNO: Recebe value como string e retorna CPF mascarado ou o valor numérico parcial.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não acessa armazenamento; o retorno é gravado no payload do responsável.
   * TODO: Em produção, validar CPF por regra oficial e impedir duplicidade por serviço centralizado.
   */
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length !== 11) return digits;

  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function formatPhone(value) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Aplica máscara de telefone brasileiro para melhorar leitura no cadastro.
   * PARÂMETROS E RETORNO: Recebe value como string e retorna telefone formatado ou dígitos parciais.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não acessa armazenamento; o retorno é gravado no payload do responsável.
   * TODO: Em produção, validar telefone por biblioteca/serviço compatível com DDD e números corporativos.
   */
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length === 11) return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  if (digits.length === 10) return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  return digits;
}

function makeId() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Gera identificador local para o novo responsável no protótipo.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e retorna string pseudoaleatória.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados diretamente; o ID retornado compõe o payload persistido.
   * TODO: Em produção, usar identificador gerado pelo banco/API para garantir unicidade global.
   */
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function setFieldState(key, isValid) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Atualiza o estado visual de validação de um campo do formulário.
   * PARÂMETROS E RETORNO: Recebe key como string e isValid como booleano; retorna o próprio booleano.
   * ARMAZENAMENTO E PERSISTÊNCIA: Altera apenas classes no DOM; não lê nem grava LocalStorage.
   * TODO: Em produção, integrar mensagens retornadas por validação assíncrona do servidor.
   */
  fields[key]?.classList.toggle('invalid', !isValid);
  hints[key]?.classList.toggle('hidden', isValid);
  return isValid;
}

function isDateInsideContract(dateValue) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Verifica se a data de início do novo responsável respeita a vigência do convênio.
   * PARÂMETROS E RETORNO: Recebe dateValue como string yyyy-mm-dd e retorna booleano.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê convenioAtual em memória; não grava dados.
   * TODO: Em produção, validar a vigência no backend para impedir manipulação direta do formulário.
   */
  if (!dateValue || !convenioAtual) return true;
  if (convenioAtual.inicio && dateValue < convenioAtual.inicio) return false;
  if (convenioAtual.fim && dateValue > convenioAtual.fim) return false;
  return true;
}

function validateForm() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Valida o formulário de inclusão antes de persistir o responsável no convênio.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e retorna booleano geral.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê os inputs do DOM e alterna feedback visual; não grava dados.
   * TODO: Em produção, repetir validação no servidor e exibir erros estruturados da API.
   */
  const email = normalizeText(fields.email.value);
  const cpfDigits = onlyDigits(fields.cpf.value);
  const phoneDigits = onlyDigits(fields.telefone.value);

  return [
    setFieldState('convenio', Boolean(convenioAtual)),
    setFieldState('nome', normalizeText(fields.nome.value).length >= 3),
    setFieldState('cpf', !cpfDigits || cpfDigits.length === 11),
    setFieldState('email', !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)),
    setFieldState('telefone', !phoneDigits || [10, 11].includes(phoneDigits.length)),
    setFieldState('inicio', isDateInsideContract(fields.inicio.value))
  ].every(Boolean);
}

function buildResponsavelPayload() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Monta o objeto de responsável a partir dos campos validados da página.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e retorna objeto de responsável.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê inputs do DOM e convenioAtual em memória; o retorno será gravado
   * em cproeis_contratos_convenios e cproeis_contratos_responsaveis.
   * TODO: Em produção, enviar DTO sem campos legados de função quando o modelo online estiver definido.
   */
  return {
    id: makeId(),
    convenioId,
    nome: titleCaseText(fields.nome.value),
    cpf: formatCpf(fields.cpf.value),
    email: normalizeText(fields.email.value).toLowerCase(),
    telefone: formatPhone(fields.telefone.value),
    funcoes: [],
    funcao: '',
    inicio: fields.inicio.value || convenioAtual?.inicio || '',
    fim: ''
  };
}

function saveResponsavelReviewDraft(responsavel) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Salva a inclusão de responsável como rascunho para conferência antes
   * da gravação definitiva.
   * PARÂMETROS E RETORNO: Recebe responsavel como objeto e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Grava sessionStorage em `cproeis_contratos_revisao_responsavel`;
   * não altera LocalStorage.
   * TODO: Em produção, armazenar este rascunho em fluxo transacional do backend com expiração.
   */
  const draft = {
    tipo: 'adicionar',
    convenioId,
    convenio: {
      id: convenioAtual?.id || '',
      nome: convenioAtual?.nome || '',
      cnpj: convenioAtual?.cnpj || '',
      numero: convenioAtual?.numero || ''
    },
    responsavel
  };

  if (RESPONSAVEL_JSON_API?.writeSessionJson) {
    RESPONSAVEL_JSON_API.writeSessionJson(STORAGE_REVISAO_RESPONSAVEL, draft);
    return;
  }
  sessionStorage.setItem(STORAGE_REVISAO_RESPONSAVEL, JSON.stringify(draft));
}

function loadConvenio() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Carrega a lista de convênios, seleciona o contrato escolhido e prepara
   * o formulário de inclusão de responsável.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e não retorna valores.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê cproeis_contratos_convenios no LocalStorage e escreve somente no DOM.
   * TODO: Em produção, buscar o contrato por endpoint com tratamento para acesso negado ou registro inexistente.
   */
  const convenios = RESPONSAVEL_JSON_API?.listarConvenios
    ? RESPONSAVEL_JSON_API.listarConvenios().data
    : loadList(STORAGE_CONVENIOS);
  if (fields.convenio) {
    fields.convenio.innerHTML = [
      '<option value="">Selecione um contrato</option>',
      ...convenios.map((convenio) => `<option value="${convenio.id}">${convenio.nome || 'Convênio sem nome'} | ${convenio.numero || '-'}</option>`)
    ].join('');
    fields.convenio.value = convenioId;
  }

  convenioAtual = convenios.find((convenio) => convenio.id === convenioId) || null;

  if (!convenioAtual) {
    if (pageTitle) pageTitle.textContent = 'Novo responsável';
    if (pageSubtitle) pageSubtitle.textContent = 'Selecione o contrato que receberá o novo responsável.';
    if (fields.inicio) {
      fields.inicio.value = '';
      fields.inicio.removeAttribute('min');
      fields.inicio.removeAttribute('max');
    }
    return;
  }

  if (pageTitle) pageTitle.textContent = 'Novo responsável';
  if (pageSubtitle) pageSubtitle.textContent = `${convenioAtual.nome || 'Convênio sem nome'} | Contrato ${convenioAtual.numero || '-'}`;
  fields.inicio.value = convenioAtual.inicio || '';
  fields.inicio.min = convenioAtual.inicio || '';
  fields.inicio.max = convenioAtual.fim || '';
}

function restoreResponsavelReviewDraft() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Restaura os campos da inclusão quando o usuário volta da página de revisão
   * para corrigir dados antes da confirmação.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê sessionStorage em `cproeis_contratos_revisao_responsavel`;
   * escreve somente nos inputs do DOM.
   * TODO: Em produção, restaurar rascunhos por ID de fluxo retornado pelo backend.
   */
  if (params.get('draft') !== '1') return;
  let draft = null;
  try {
    draft = RESPONSAVEL_JSON_API?.readSessionJson
      ? RESPONSAVEL_JSON_API.readSessionJson(STORAGE_REVISAO_RESPONSAVEL)
      : JSON.parse(sessionStorage.getItem(STORAGE_REVISAO_RESPONSAVEL));
  } catch (error) {
    draft = null;
  }
  if (draft?.tipo !== 'adicionar') return;

  convenioId = draft.convenioId || convenioId;
  if (fields.convenio) fields.convenio.value = convenioId;
  loadConvenio();
  fields.nome.value = draft.responsavel?.nome || '';
  fields.cpf.value = draft.responsavel?.cpf || '';
  fields.email.value = draft.responsavel?.email || '';
  fields.telefone.value = draft.responsavel?.telefone || '';
  fields.inicio.value = draft.responsavel?.inicio || fields.inicio.value;
}

Object.entries(fields).forEach(([key, field]) => {
  if (!field) return;

  field.addEventListener('input', () => {
    /*
     * DESCRIÇÃO DO BLOCO: Normaliza CPF e telefone durante a digitação e remove erro assim que o campo
     * volta a ficar válido.
     * PARÂMETROS E RETORNO: O listener recebe evento nativo e não retorna valores.
     * ARMAZENAMENTO E PERSISTÊNCIA: Altera somente inputs e mensagens do DOM; não grava LocalStorage.
     * TODO: Em produção, aplicar debounce se a validação passar a consultar serviço remoto.
     */
    if (key === 'cpf') field.value = formatCpf(field.value);
    if (key === 'telefone') field.value = formatPhone(field.value);
    if (key === 'nome') field.value = titleCaseText(field.value);
    if (key === 'email') field.value = normalizeText(field.value).toLowerCase();
    if (key === 'convenio') {
      convenioId = field.value;
      loadConvenio();
    }
    validateForm();
  });
});

fields.convenio?.addEventListener('change', () => {
  /*
   * DESCRIÇÃO DO BLOCO: Atualiza o contrato selecionado quando o usuário escolhe outro convênio
   * no seletor principal da página.
   * PARÂMETROS E RETORNO: O listener recebe evento change e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê apenas o valor do select e atualiza estado em memória; a
   * gravação acontece somente no submit.
   * TODO: Em produção, carregar dados do convênio selecionado por API e exibir loading.
   */
  convenioId = fields.convenio.value;
  loadConvenio();
  validateForm();
});

if (form) {
  form.addEventListener('submit', (event) => {
    /*
     * DESCRIÇÃO DO BLOCO: Intercepta o envio local do formulário, valida, persiste o responsável e
     * retorna para a tela de detalhes do convênio.
     * PARÂMETROS E RETORNO: Recebe evento submit e não retorna valores.
     * ARMAZENAMENTO E PERSISTÊNCIA: Grava LocalStorage por saveResponsavel e altera window.location.
     * TODO: Em produção, aguardar resposta da API antes de redirecionar e exibir erro sem perder rascunho.
     */
    event.preventDefault();
    if (!convenioAtual || !validateForm()) return;

    saveResponsavelReviewDraft(buildResponsavelPayload());
    window.location.href = 'revisar-responsavel.html';
  });
}

if (cancelButton) {
  cancelButton.addEventListener('click', () => {
    /*
     * DESCRIÇÃO DO BLOCO: Cancela a inclusão e retorna para os detalhes do convênio quando houver ID válido.
     * PARÂMETROS E RETORNO: Listener sem parâmetros explícitos e sem retorno.
     * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; altera apenas window.location.
     * TODO: Em produção, pedir confirmação se houver rascunho preenchido.
     */
    window.location.href = 'tabela-convenios.html';
  });
}

loadConvenio();
restoreResponsavelReviewDraft();
