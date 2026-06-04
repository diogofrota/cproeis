const SERVICOS_STORAGE = 'cproeis_convenios_servicos';
const CONVENIOS_STORAGE = 'cproeis_contratos_convenios';
const CONVENIO_ATUAL_STORAGE_SERVICO = 'cproeis_convenio_atual';
const CONVENIO_RESPONSAVEL_ATUAL_STORAGE_SERVICO = 'cproeis_convenio_responsavel_atual';

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Lê uma lista JSON do LocalStorage com fallback seguro para array vazio.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} key - Chave do LocalStorage consultada.
 * @returns {Array<object>} Lista persistida ou array vazio quando não houver dados válidos.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê LocalStorage; não grava dados.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: substituir por consulta autenticada à API quando os serviços forem tabela do banco.
 */
function carregarListaServico(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (error) {
    return [];
  }
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Grava uma lista JSON no LocalStorage usada pelo protótipo de serviços do convênio.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} key - Chave onde a lista será gravada.
 * @param {Array<object>} value - Lista que será serializada.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Grava diretamente no LocalStorage do navegador.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: trocar por requisição POST/PUT com validação de permissões e tratamento de falhas.
 */
function salvarListaServico(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Resolve o convênio ativo a partir da URL ou da sessão local do responsável.
 *
 * PARÂMETROS E RETORNO:
 * @returns {object|null} Convênio selecionado ou null quando não houver sessão válida.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê URL e LocalStorage; grava o convênio ativo quando a URL informa um ID válido.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: resolver sessão no backend e impedir cadastro quando o responsável não estiver autorizado.
 */
function obterConvenioServicoAtual() {
  const params = new URLSearchParams(window.location.search);
  const urlId = params.get('id') || '';
  const convenioId = urlId || localStorage.getItem(CONVENIO_ATUAL_STORAGE_SERVICO) || '';
  const convenio = carregarListaServico(CONVENIOS_STORAGE).find((item) => item.id === convenioId) || null;

  if (convenio && urlId) {
    localStorage.setItem(CONVENIO_ATUAL_STORAGE_SERVICO, convenio.id);
  }

  return convenio;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Cria um identificador local para o serviço cadastrado.
 *
 * PARÂMETROS E RETORNO:
 * @returns {string} ID único suficiente para o protótipo local.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; usa data atual e número aleatório em memória.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: usar ID gerado pelo banco de dados na criação online.
 */
function criarIdServico() {
  return `servico-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Normaliza texto livre removendo espaços duplicados e aparas nas bordas.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} value - Valor digitado no formulário.
 * @returns {string} Texto limpo para persistência.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; apenas transforma valores recebidos dos inputs.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: compartilhar normalizadores entre módulos quando o frontend for componentizado.
 */
function normalizarTextoServico(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Aplica máscara simples de CEP no campo de endereço.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} value - CEP digitado com ou sem pontuação.
 * @returns {string} CEP no formato 00000-000 ou parcial durante digitação.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; retorna texto formatado para o input e para o objeto persistido.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: centralizar máscaras em biblioteca comum de formulários.
 */
function formatarCepServico(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Retorna apenas dígitos de um valor textual para validar e consultar CEP.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} value - Valor digitado no input.
 * @returns {string} Texto contendo somente números.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não lê nem grava dados; normaliza valor em memória.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: centralizar normalizadores de documento/endereço em utilitário compartilhado.
 */
function obterDigitosServico(value) {
  return String(value || '').replace(/\D/g, '');
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Garante mensagens auxiliares abaixo dos campos do serviço.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não usa LocalStorage; cria elementos temporários no DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: transformar hints em componente acessível compartilhado do design system.
 */
function garantirHintsServico() {
  [
    'nome-servico',
    'local-servico',
    'classe-servico',
    'servico-cep',
    'servico-logradouro',
    'servico-numero',
    'servico-bairro',
    'servico-cidade',
    'servico-uf'
  ].forEach((id) => {
    const input = document.getElementById(id);
    const label = input?.closest('label');
    if (!input || !label || label.querySelector(`[data-field-hint="${id}"]`)) return;

    const hint = document.createElement('span');
    hint.className = 'field-hint hidden';
    hint.dataset.fieldHint = id;
    label.appendChild(hint);
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Atualiza estado visual e mensagem de validação de um campo do serviço.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} id - ID do input/select validado.
 * @param {boolean} valid - Indica se o campo está válido.
 * @param {string} message - Mensagem exibida quando inválido.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; altera classes e texto no DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: receber mensagens de validação da API quando o cadastro for online.
 */
function definirEstadoCampoServico(id, valid, message = '') {
  const input = document.getElementById(id);
  const hint = document.querySelector(`[data-field-hint="${id}"]`);
  if (!input || !hint) return;

  input.classList.toggle('invalid', !valid);
  hint.textContent = valid ? '' : message;
  hint.dataset.status = valid ? '' : 'error';
  hint.classList.toggle('hidden', valid);
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Atualiza mensagem auxiliar específica da consulta de CEP.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} message - Texto exibido abaixo do campo CEP.
 * @param {string} status - Estado visual: loading, success ou error.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; altera apenas DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: registrar falhas do provedor externo quando houver backend.
 */
function definirStatusCepServico(message = '', status = '') {
  const hint = document.querySelector('[data-field-hint="servico-cep"]');
  const input = document.getElementById('servico-cep');
  if (!hint || !input) return;

  hint.textContent = message;
  hint.dataset.status = status;
  hint.classList.toggle('hidden', !message);
  input.classList.toggle('invalid', status === 'error');
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Consulta o ViaCEP para preencher endereço do serviço de apresentação.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} cep - CEP com ou sem máscara.
 * @returns {Promise<object|null>} Endereço normalizado ou null se não encontrado.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; faz requisição GET para https://viacep.com.br/ws/{cep}/json/.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: mover consulta para backend para controlar timeout, log e indisponibilidade.
 */
async function consultarCepServico(cep) {
  const digits = obterDigitosServico(cep);
  if (digits.length !== 8) return null;

  const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
  if (!response.ok) throw new Error('Falha ao consultar CEP.');
  const data = await response.json();
  if (data.erro) return null;

  return {
    cep: formatarCepServico(data.cep || digits),
    logradouro: data.logradouro || '',
    complemento: data.complemento || '',
    bairro: data.bairro || '',
    cidade: data.localidade || '',
    uf: data.uf || ''
  };
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Preenche campos de endereço com o retorno do ViaCEP.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} endereco - Dados retornados pela consulta de CEP.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava LocalStorage; preenche apenas inputs do formulário.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: validar endereço oficial no backend antes de salvar serviço.
 */
function preencherEnderecoPorCepServico(endereco) {
  const mapping = {
    'servico-cep': endereco.cep,
    'servico-logradouro': endereco.logradouro,
    'servico-complemento': endereco.complemento,
    'servico-bairro': endereco.bairro,
    'servico-cidade': endereco.cidade,
    'servico-uf': endereco.uf
  };

  Object.entries(mapping).forEach(([id, value]) => {
    const input = document.getElementById(id);
    if (input && value) {
      input.value = value;
      definirEstadoCampoServico(id, true);
    }
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Executa a consulta de CEP no blur ou quando o campo chega a oito dígitos.
 *
 * PARÂMETROS E RETORNO:
 * @returns {Promise<void>}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê o input de CEP e preenche campos no DOM; não grava LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: usar serviço interno de CEP em produção para reduzir dependência direta do frontend.
 */
async function buscarEnderecoServicoPorCep() {
  const cepInput = document.getElementById('servico-cep');
  const digits = obterDigitosServico(cepInput?.value);

  if (!digits) {
    definirStatusCepServico('');
    return;
  }

  if (digits.length !== 8) {
    definirStatusCepServico('Digite os 8 números do CEP.', 'error');
    return;
  }

  try {
    definirStatusCepServico('Consultando endereço pelo CEP...', 'loading');
    const endereco = await consultarCepServico(digits);
    if (!endereco) {
      definirStatusCepServico('CEP não encontrado. Preencha o endereço manualmente.', 'error');
      return;
    }

    preencherEnderecoPorCepServico(endereco);
    definirStatusCepServico('Endereço preenchido automaticamente pelo CEP.', 'success');
  } catch (error) {
    definirStatusCepServico('Não foi possível consultar o CEP. Preencha manualmente.', 'error');
  }
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Monta o endereço textual usado nas tabelas e no resumo da criação de vagas.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} endereco - Objeto com logradouro, número, complemento, bairro, cidade e UF.
 * @returns {string} Endereço formatado para exibição.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não lê nem grava dados externos; transforma o objeto do formulário.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: persistir endereço normalizado em tabela própria com validação geográfica.
 */
function formatarEnderecoServico(endereco) {
  const linha1 = [endereco.logradouro, endereco.numero].filter(Boolean).join(', ');
  const linha2 = [endereco.complemento, endereco.bairro].filter(Boolean).join(' - ');
  const linha3 = [endereco.cidade, endereco.uf].filter(Boolean).join('/');
  const cep = endereco.cep ? `CEP ${endereco.cep}` : '';
  return [linha1, linha2, linha3, cep].filter(Boolean).join(' | ');
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Coleta e estrutura os dados do formulário de criação de serviço.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} convenio - Convênio ativo que será vinculado ao serviço.
 * @returns {object} Serviço pronto para persistência local.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê inputs do DOM; a gravação acontece depois em `cproeis_convenios_servicos`.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: no ambiente online, enviar este payload para endpoint transacional com auditoria.
 */
function coletarServico(convenio) {
  const enderecoDados = {
    cep: formatarCepServico(document.getElementById('servico-cep')?.value || ''),
    logradouro: normalizarTextoServico(document.getElementById('servico-logradouro')?.value),
    numero: normalizarTextoServico(document.getElementById('servico-numero')?.value),
    complemento: normalizarTextoServico(document.getElementById('servico-complemento')?.value),
    bairro: normalizarTextoServico(document.getElementById('servico-bairro')?.value),
    cidade: normalizarTextoServico(document.getElementById('servico-cidade')?.value),
    uf: normalizarTextoServico(document.getElementById('servico-uf')?.value).slice(0, 2).toUpperCase()
  };

  return {
    id: criarIdServico(),
    convenioId: convenio.id,
    convenioNome: convenio.nome || '',
    nomeServico: normalizarTextoServico(document.getElementById('nome-servico')?.value),
    localServico: normalizarTextoServico(document.getElementById('local-servico')?.value),
    classePadrao: document.getElementById('classe-servico')?.value || '',
    enderecoDados,
    enderecoServico: formatarEnderecoServico(enderecoDados),
    pontoReferencia: normalizarTextoServico(document.getElementById('ponto-referencia')?.value),
    status: 'Ativo',
    createdAt: new Date().toISOString()
  };
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Valida os campos mínimos antes de salvar o serviço de apresentação.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} servico - Payload coletado do formulário.
 * @returns {boolean} Verdadeiro quando o serviço pode ser salvo.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; lê apenas o objeto em memória e marca campos inválidos no DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: substituir validação local por validação de domínio retornada pela API.
 */
function validarServico(servico) {
  const cepDigits = obterDigitosServico(servico.enderecoDados.cep);
  const required = {
    'nome-servico': { valid: servico.nomeServico.length >= 3, message: 'Informe um nome com pelo menos 3 caracteres.' },
    'local-servico': { valid: servico.localServico.length >= 3, message: 'Informe o local de apresentação.' },
    'classe-servico': { valid: ['A', 'B', 'C/D'].includes(servico.classePadrao), message: 'Selecione a classe do serviço.' },
    'servico-cep': { valid: !cepDigits || cepDigits.length === 8, message: 'Digite os 8 números do CEP ou deixe em branco.' },
    'servico-logradouro': { valid: servico.enderecoDados.logradouro.length >= 3, message: 'Informe o logradouro.' },
    'servico-numero': { valid: servico.enderecoDados.numero.length >= 1, message: 'Informe o número.' },
    'servico-bairro': { valid: servico.enderecoDados.bairro.length >= 3, message: 'Informe o bairro com pelo menos 3 caracteres.' },
    'servico-cidade': { valid: servico.enderecoDados.cidade.length >= 3, message: 'Informe a cidade.' },
    'servico-uf': { valid: /^[A-Z]{2}$/.test(servico.enderecoDados.uf), message: 'Informe a UF com 2 letras.' }
  };

  Object.entries(required).forEach(([id, result]) => {
    definirEstadoCampoServico(id, result.valid, result.message);
  });

  return Object.values(required).every((result) => result.valid);
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Monta os links de retorno preservando convênio e responsável na URL.
 *
 * PARÂMETROS E RETORNO:
 * @param {object|null} convenio - Convênio ativo da página.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê parâmetros da URL e LocalStorage de sessão; atualiza hrefs no DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: substituir parâmetros manuais por roteamento autenticado.
 */
function configurarLinksServico(convenio) {
  if (!convenio) return;

  const params = new URLSearchParams(window.location.search);
  const responsavel = params.get('responsavel') || localStorage.getItem(CONVENIO_RESPONSAVEL_ATUAL_STORAGE_SERVICO) || '';
  const query = `id=${encodeURIComponent(convenio.id)}${responsavel ? `&responsavel=${encodeURIComponent(responsavel)}` : ''}`;
  const voltar = document.getElementById('voltar-servicos-link');
  if (voltar) voltar.href = `servicos.html?${query}`;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Inicializa a página de criação de serviço, vinculando submit, máscaras e sessão local.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê convênio em LocalStorage e grava novos serviços em `cproeis_convenios_servicos`.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: implementar edição, inativação e logs de auditoria quando o cadastro estiver online.
 */
function iniciarCriacaoServico() {
  const convenio = obterConvenioServicoAtual();
  const form = document.getElementById('servico-form');
  const status = document.getElementById('servico-status');
  configurarLinksServico(convenio);
  garantirHintsServico();

  document.getElementById('servico-cep')?.addEventListener('input', (event) => {
    event.target.value = formatarCepServico(event.target.value);
    if (obterDigitosServico(event.target.value).length === 8) {
      buscarEnderecoServicoPorCep();
    }
  });

  document.getElementById('servico-cep')?.addEventListener('blur', buscarEnderecoServicoPorCep);

  document.getElementById('servico-uf')?.addEventListener('input', (event) => {
    event.target.value = normalizarTextoServico(event.target.value).replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase();
  });

  form?.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!convenio) {
      if (status) status.textContent = 'Convênio não encontrado. Acesse novamente pelo login do convênio.';
      return;
    }

    const servico = coletarServico(convenio);
    if (!validarServico(servico)) {
      if (status) status.textContent = 'Preencha os campos destacados em vermelho.';
      return;
    }

    const servicos = carregarListaServico(SERVICOS_STORAGE);
    salvarListaServico(SERVICOS_STORAGE, [...servicos, servico]);
    window.location.href = document.getElementById('voltar-servicos-link')?.href || 'servicos.html';
  });
}

iniciarCriacaoServico();
