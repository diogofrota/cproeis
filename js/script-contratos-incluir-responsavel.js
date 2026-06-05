const STORAGE_CONVENIOS = 'cproeis_contratos_convenios';
const STORAGE_RESPONSAVEIS = 'cproeis_contratos_responsaveis';

const params = new URLSearchParams(window.location.search);
const convenioId = params.get('id') || '';
const form = document.getElementById('responsavel-form');
const pageTitle = document.getElementById('responsavel-page-title');
const pageSubtitle = document.getElementById('responsavel-page-subtitle');
const cancelButton = document.getElementById('cancel-responsavel');

const fields = {
  nome: document.getElementById('responsavel-nome'),
  cpf: document.getElementById('responsavel-cpf'),
  email: document.getElementById('responsavel-email'),
  telefone: document.getElementById('responsavel-telefone'),
  inicio: document.getElementById('responsavel-inicio')
};

const hints = {
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
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (error) {
    return [];
  }
}

function saveList(key, list) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Persiste uma lista serializada no LocalStorage para manter compatibilidade
   * com o protótipo atual de contratos.
   * PARÂMETROS E RETORNO: Recebe key como string e list como array; não retorna valores.
   * ARMAZENAMENTO E PERSISTÊNCIA: Grava LocalStorage na chave informada.
   * TODO: Em produção, substituir por chamada assíncrona com tratamento de erro e confirmação do servidor.
   */
  localStorage.setItem(key, JSON.stringify(list));
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

function saveResponsavel(responsavel) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Insere o novo responsável no convênio selecionado e na lista auxiliar de responsáveis.
   * PARÂMETROS E RETORNO: Recebe responsavel como objeto e não retorna valores.
   * ARMAZENAMENTO E PERSISTÊNCIA: Grava LocalStorage nas chaves cproeis_contratos_convenios e
   * cproeis_contratos_responsaveis, preservando os demais convênios e responsáveis.
   * TODO: Em produção, substituir por transação de backend para evitar divergência entre coleções.
   */
  const convenios = loadList(STORAGE_CONVENIOS);
  const updatedConvenios = convenios.map((convenio) => {
    if (convenio.id !== convenioId) return convenio;

    const responsaveis = Array.isArray(convenio.responsaveis) ? convenio.responsaveis : [];
    return {
      ...convenio,
      responsaveis: [...responsaveis, responsavel]
    };
  });

  saveList(STORAGE_CONVENIOS, updatedConvenios);
  saveList(STORAGE_RESPONSAVEIS, [
    ...loadList(STORAGE_RESPONSAVEIS),
    responsavel
  ]);
}

function loadConvenio() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Carrega o convênio informado na URL e prepara o formulário de inclusão.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e não retorna valores.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê cproeis_contratos_convenios no LocalStorage e escreve somente no DOM.
   * TODO: Em produção, buscar o contrato por endpoint com tratamento para acesso negado ou registro inexistente.
   */
  convenioAtual = loadList(STORAGE_CONVENIOS).find((convenio) => convenio.id === convenioId) || null;

  if (!convenioAtual) {
    if (pageTitle) pageTitle.textContent = 'Convênio não encontrado';
    if (pageSubtitle) pageSubtitle.textContent = 'Volte para a tabela e selecione um contrato válido.';
    if (form) form.hidden = true;
    return;
  }

  if (pageTitle) pageTitle.textContent = 'Novo responsável';
  if (pageSubtitle) pageSubtitle.textContent = `${convenioAtual.nome || 'Convênio sem nome'} | Contrato ${convenioAtual.numero || '-'}`;
  fields.inicio.value = convenioAtual.inicio || '';
  fields.inicio.min = convenioAtual.inicio || '';
  fields.inicio.max = convenioAtual.fim || '';
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
    validateForm();
  });
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

    saveResponsavel(buildResponsavelPayload());
    window.location.href = `detalhes-convenio.html?id=${encodeURIComponent(convenioId)}`;
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
    window.location.href = convenioId
      ? `detalhes-convenio.html?id=${encodeURIComponent(convenioId)}`
      : 'tabela-convenios.html';
  });
}

loadConvenio();
