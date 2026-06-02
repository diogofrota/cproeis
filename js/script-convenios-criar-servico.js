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
  const required = {
    'nome-servico': servico.nomeServico.length >= 3,
    'local-servico': servico.localServico.length >= 3,
    'servico-logradouro': servico.enderecoDados.logradouro.length >= 3,
    'servico-numero': servico.enderecoDados.numero.length >= 1,
    'servico-bairro': servico.enderecoDados.bairro.length >= 3,
    'servico-cidade': servico.enderecoDados.cidade.length >= 3,
    'servico-uf': /^[A-Z]{2}$/.test(servico.enderecoDados.uf)
  };

  Object.entries(required).forEach(([id, valid]) => {
    document.getElementById(id)?.classList.toggle('invalid', !valid);
  });

  return Object.values(required).every(Boolean);
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

  document.getElementById('servico-cep')?.addEventListener('input', (event) => {
    event.target.value = formatarCepServico(event.target.value);
  });

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
      if (status) status.textContent = 'Preencha os campos obrigatórios do serviço.';
      return;
    }

    const servicos = carregarListaServico(SERVICOS_STORAGE);
    salvarListaServico(SERVICOS_STORAGE, [...servicos, servico]);
    window.location.href = document.getElementById('voltar-servicos-link')?.href || 'servicos.html';
  });
}

iniciarCriacaoServico();
