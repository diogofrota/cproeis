const CONTRACT_PROFILE_CONTRACTS = 'cproeis_contratos_convenios';
const CONTRACT_PROFILE_VALUES = 'cproeis_contratos_valores';
const CONTRACT_PROFILE_CURRENT = 'cproeis_convenio_atual';

const contractProfileMoney = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Lê uma lista JSON do LocalStorage com fallback para array vazio.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} key - Chave do LocalStorage consultada.
 * @returns {Array<object>} Lista persistida ou array vazio.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê LocalStorage; não grava dados.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: substituir por consulta autenticada de contrato quando houver backend.
 */
function contractProfileLoadList(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (error) {
    return [];
  }
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Escapa texto renderizado na página de dados do contrato.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} value - Valor exibido.
 * @returns {string} Texto seguro para HTML.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; apenas transforma o valor recebido.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: manter sanitização mesmo com dados retornados por API.
 */
function contractProfileEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Formata data ISO para DD/MM/YYYY e valores vazios para hífen.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} value - Data ou texto.
 * @returns {string} Valor formatado para leitura.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa armazenamento; transforma somente o argumento.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: mover para helper compartilhado de data.
 */
function contractProfileFormat(value) {
  if (!value) return '-';
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [year, month, day] = value.slice(0, 10).split('-');
    return `${day}/${month}/${year}`;
  }
  return String(value);
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Monta endereço em múltiplas linhas no padrão da ficha de detalhes.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} endereco - Dados estruturados do endereço.
 * @param {string} fallback - Endereço legado quando não houver estrutura.
 * @returns {string} Endereço formatado.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não lê nem grava dados externos; usa objeto do contrato carregado.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: normalizar endereço no backend e manter CEP validado por serviço oficial.
 */
function contractProfileAddress(endereco, fallback = '') {
  if (!endereco) return fallback || '-';
  const linha1 = [endereco.logradouro, endereco.numero].filter(Boolean).join(', ');
  const linha2 = [endereco.complemento, endereco.bairro].filter(Boolean).join(' - ');
  const linha3 = [endereco.cidade, endereco.uf].filter(Boolean).join('/');
  const linha4 = endereco.cep ? `CEP ${endereco.cep}` : '';
  return [linha1, linha2, linha3, linha4].filter(Boolean).join('\n') || fallback || '-';
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Resolve o contrato ativo pelo parâmetro de URL ou pela sessão local do convênio.
 *
 * PARÂMETROS E RETORNO:
 * @returns {object|null} Convênio/contrato ativo.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê URL, `cproeis_convenio_atual` e `cproeis_contratos_convenios`; grava a sessão quando há ID na URL.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: obter o contrato por sessão autenticada do responsável.
 */
function contractProfileGetConvenio() {
  const params = new URLSearchParams(window.location.search);
  const urlId = params.get('id') || '';
  const convenioId = urlId || localStorage.getItem(CONTRACT_PROFILE_CURRENT) || '';
  const convenio = contractProfileLoadList(CONTRACT_PROFILE_CONTRACTS).find((item) => item.id === convenioId) || null;
  if (convenio && urlId) localStorage.setItem(CONTRACT_PROFILE_CURRENT, convenio.id);
  return convenio;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Obtém valores por classe do contrato atual, aceitando registros embarcados ou tabela separada.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} convenio - Convênio ativo.
 * @returns {Array<object>} Valores por classe vinculados ao contrato.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê `cproeis_contratos_valores` quando o contrato não traz `valores` embutido.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: buscar valores por contrato em endpoint próprio e controlar versão da tabela financeira.
 */
function contractProfileGetValues(convenio) {
  if (convenio?.valores?.length) return convenio.valores;
  return contractProfileLoadList(CONTRACT_PROFILE_VALUES).filter((item) => item.convenioId === convenio?.id);
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Renderiza uma ficha de detalhes somente leitura.
 *
 * PARÂMETROS E RETORNO:
 * @param {Array<Array<string>>} fields - Pares de rótulo e valor.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; escreve a ficha no DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: reutilizar como componente compartilhado do projeto.
 */
function contractProfileRenderDetails(fields) {
  const target = document.getElementById('contract-profile-grid');
  if (!target) return;

  target.innerHTML = fields.map(([label, value]) => `
    <div class="detail-item">
      <span>${contractProfileEscape(label)}</span>
      <strong>${contractProfileEscape(contractProfileFormat(value))}</strong>
    </div>
  `).join('');
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Renderiza a tabela de valores contratuais por classe.
 *
 * PARÂMETROS E RETORNO:
 * @param {object|null} convenio - Convênio ativo.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê valores do LocalStorage ou do objeto do contrato; não grava dados.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: destacar vigência da tabela de valores quando houver histórico financeiro.
 */
function contractProfileRenderValues(convenio) {
  const body = document.getElementById('contract-values-body');
  if (!body) return;

  const values = contractProfileGetValues(convenio);
  if (!values.length) {
    body.innerHTML = '<tr><td class="empty" colspan="6">Nenhum valor por classe cadastrado.</td></tr>';
    return;
  }

  body.innerHTML = values.map((item) => `
    <tr>
      <td>${contractProfileEscape(item.grupo || item.classe || '-')}</td>
      <td>${contractProfileMoney.format(Number(item.servico12 || 0))}</td>
      <td>${contractProfileMoney.format(Number(item.servico8 || 0))}</td>
      <td>${contractProfileMoney.format(Number(item.servico6 || 0))}</td>
      <td>${contractProfileMoney.format(Number(item.passagem || 0))}</td>
      <td>${contractProfileMoney.format(Number(item.alimentacao || 0))}</td>
    </tr>
  `).join('');
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Inicializa a página de dados do contrato em modo somente leitura.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê dados contratuais e valores do LocalStorage; não altera nenhum cadastro.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: anexar documentos oficiais e histórico de renovações quando a consulta estiver online.
 */
function contractProfileInit() {
  const convenio = contractProfileGetConvenio();
  const hint = document.getElementById('contract-profile-hint');

  if (!convenio) {
    if (hint) hint.textContent = 'Contrato não encontrado. Acesse novamente pelo login do convênio.';
    contractProfileRenderDetails([['Status', 'Contrato não encontrado']]);
    contractProfileRenderValues(null);
    return;
  }

  contractProfileRenderDetails([
    ['Nome do convênio', convenio.nome],
    ['CNPJ', convenio.cnpj],
    ['Tipo de conveniado', convenio.tipoConveniado || 'Não informado'],
    ['Número do contrato', convenio.numero],
    ['Valor do contrato', contractProfileMoney.format(Number(convenio.valorContrato ?? convenio.valorMensal ?? 0))],
    ['Vigência', `${contractProfileFormat(convenio.inicio)} até ${contractProfileFormat(convenio.fim)}`],
    ['Publicação no Diário Oficial', `${contractProfileFormat(convenio.diarioData)}\nPágina ${convenio.diarioPagina || '-'}`],
    ['Endereço', contractProfileAddress(convenio.enderecoDados, convenio.endereco)]
  ]);

  contractProfileRenderValues(convenio);
}

contractProfileInit();
