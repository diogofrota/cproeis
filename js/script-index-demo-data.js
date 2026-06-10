const DEMO_KEYS = {
  convenios: 'cproeis_contratos_convenios',
  valores: 'cproeis_contratos_valores',
  responsaveis: 'cproeis_contratos_responsaveis',
  limitesVagas: 'cproeis_contratos_limites_vagas',
  contratosHistoricos: 'cproeis_contratos_historicos',
  contratosSchema: 'cproeis_contratos_schema_version',
  policiais: 'cproeis_cadastro_policiais',
  policialReset: 'cproeis_cadastro_policial_reset_version',
  sanitario: 'cproeis_historico_sanitario',
  funcional: 'cproeis_historico_funcional',
  comportamento: 'cproeis_historico_comportamento',
  unidade: 'cproeis_historico_unidade',
  status: 'cproeis_historico_situacao_funcional',
  vagas: 'cproeis_convenios_vagas',
  servicos: 'cproeis_convenios_servicos',
  gsiTiposCurso: 'cproeis_gsi_tipos_curso_capacitacao',
  convenioTiposCurso: 'cproeis_convenios_tipos_curso_capacitacao',
  convenioCursos: 'cproeis_convenios_cursos_capacitacao',
  cursoInscricoes: 'cproeis_policiais_cursos_inscricoes',
  cursoBoletins: 'cproeis_policiais_cursos_boletins',
  habilitacoes: 'cproeis_policiais_habilitacoes',
  convenioAtual: 'cproeis_convenio_atual',
  convenioResponsavelAtual: 'cproeis_convenio_responsavel_atual',
  policialAtual: 'cproeis_acesso_policial_atual'
};

const DEMO_TODAY = new Date().toISOString().slice(0, 10);
/*
 * DESCRIÇÃO DO BLOCO:
 * Resolve as massas simuladas por domínio, priorizando os arquivos separados de contratos e
 * policiais e mantendo compatibilidade com o arquivo antigo `dados-demo.js`.
 *
 * PARÂMETROS E RETORNO:
 * Não recebe parâmetros nem retorna valores; apenas define constantes usadas pelas funções de seed.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê objetos globais em memória (`window.CPROEIS_CONTRATOS_SIMULADOS`,
 * `window.CPROEIS_POLICIAIS_SIMULADOS`, configurações mensais de vagas ou
 * `window.CPROEIS_DADOS_SIMULADOS`) e não grava dados.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Quando houver backend, substituir estes objetos globais por chamadas assíncronas com
 * tratamento de erro e validação de origem dos dados.
 */
const DEMO_CONTRATOS_DATA = window.CPROEIS_CONTRATOS_SIMULADOS
  || window.CPROEIS_DADOS_SIMULADOS
  || { convenios: [], responsaveisConvenio: [] };
const DEMO_POLICIAIS_DATA = window.CPROEIS_POLICIAIS_SIMULADOS
  || window.CPROEIS_DADOS_SIMULADOS
  || { policiais: [] };
const DEMO_DEFAULT_VAGAS_DATA = {
  classesOficiais: ['A', 'B'],
  turnos: {
    servico12: ['08:00', '20:00'],
    servico8: ['08:00', '16:00'],
    servico6: ['14:00', '20:00']
  },
  labelsServico: {
    oficial: 'Supervisão',
    praca: 'Policiamento',
    apoio: 'Apoio'
  },
  pontoReferencia: 'Portaria principal'
};
const DEMO_VAGAS_DATA_BY_PERIOD = {
  current: window.CPROEIS_VAGAS_MES_ATUAL_SIMULADAS || window.CPROEIS_VAGAS_SIMULADAS || DEMO_DEFAULT_VAGAS_DATA,
  previous: window.CPROEIS_VAGAS_MES_ANTERIOR_SIMULADAS || window.CPROEIS_VAGAS_SIMULADAS || DEMO_DEFAULT_VAGAS_DATA
};
const DEMO_CURSOS_DATA = window.CPROEIS_CURSOS_SIMULADOS || {
  gsiTipos: [],
  convenioTipos: [],
  convenioCursos: [],
  conclusoesConvenio: [],
  publicacoesGsi: [],
  habilitacoes: []
};
const DEMO_VAGAS_COM_CURSO_DATA = window.CPROEIS_VAGAS_COM_CURSO_SIMULADAS || {
  periodoDias: 14,
  requisitos: []
};

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Carrega uma lista persistida no LocalStorage com tolerância para dados ausentes ou inválidos.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} key - Chave do LocalStorage.
 * @returns {Array<object>} Lista persistida ou array vazio quando não houver dados válidos.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê LocalStorage, mas não grava nenhuma alteração.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, substituir LocalStorage por chamadas autenticadas a uma API de homologação.
 */
function demoLoadList(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Persiste uma lista em JSON na chave indicada do LocalStorage.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} key - Chave do LocalStorage.
 * @param {Array<object>} value - Lista a ser persistida.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Grava LocalStorage na chave recebida.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, mover seeds para rotina controlada no backend e impedir uso em ambiente real.
 */
function demoSaveList(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Atualiza a mensagem da área de ferramentas de teste na página inicial.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} message - Texto exibido ao usuário.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa armazenamento; altera apenas o DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, substituir por componente de toast/alerta padronizado.
 */
function demoFeedback(message) {
  const target = document.getElementById('demo-feedback');
  if (target) target.textContent = message;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Soma dias a uma data no formato YYYY-MM-DD e devolve nova data no mesmo formato.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} value - Data base em YYYY-MM-DD.
 * @param {number} days - Quantidade de dias somada.
 * @returns {string} Data resultante em YYYY-MM-DD.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não lê nem grava dados; calcula tudo em memória.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Centralizar utilitários de data do sistema para evitar divergência entre módulos.
 */
function demoAddDays(value, days) {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Calcula a diferença inteira de dias entre duas datas em formato YYYY-MM-DD.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} start - Data inicial em YYYY-MM-DD.
 * @param {string} end - Data final em YYYY-MM-DD.
 * @returns {number} Quantidade de dias entre as datas.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não lê nem grava dados; calcula tudo em memória.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Centralizar cálculo de calendário em módulo compartilhado quando o sistema tiver backend.
 */
function demoDiffDays(start, end) {
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  return Math.round((endDate - startDate) / 86400000);
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Calcula a quantidade inclusiva de dias entre início e fim de um contrato demo.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} start - Data inicial em YYYY-MM-DD.
 * @param {string} end - Data final em YYYY-MM-DD.
 * @returns {number} Quantidade de dias considerada na prova real do contrato.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; o retorno é usado para calcular `valorContrato` na massa demo.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, considerar calendário operacional do contrato em vez de todos os dias corridos.
 */
function demoCountContractDays(start, end) {
  if (!start || !end || end < start) return 0;
  return demoDiffDays(start, end) + 1;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Calcula módulo sempre positivo para manter a variação sintética estável em datas futuras e passadas.
 *
 * PARÂMETROS E RETORNO:
 * @param {number} value - Valor numérico de entrada.
 * @param {number} divisor - Divisor usado no cálculo de módulo.
 * @returns {number} Resto positivo entre zero e divisor menos um.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não lê nem grava dados; apenas normaliza números em memória.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Substituir esta lógica sintética por regras oficiais de escala quando houver backend.
 */
function demoPositiveModulo(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Retorna o período completo do mês atual ou do mês anterior para geração de vagas simuladas.
 *
 * PARÂMETROS E RETORNO:
 * @param {'current'|'previous'} period - Período desejado: mês atual ou mês anterior.
 * @returns {{label: string, start: string, end: string}} Datas inicial/final em YYYY-MM-DD e rótulo do período.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa LocalStorage; usa somente a data atual em memória.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, receber competências fechadas do backend para evitar divergência de fuso e calendário.
 */
function demoGetMonthPeriod(period) {
  const today = new Date(`${DEMO_TODAY}T00:00:00`);
  const year = today.getFullYear();
  const month = today.getMonth();
  const targetStart = period === 'previous'
    ? new Date(year, month - 1, 1)
    : new Date(year, month, 1);
  const targetEnd = period === 'previous'
    ? new Date(year, month, 0)
    : new Date(year, month + 1, 0);
  const formatDate = (date) => [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');

  return {
    label: period === 'previous' ? 'mês anterior' : 'mês atual',
    start: formatDate(targetStart),
    end: formatDate(targetEnd)
  };
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Seleciona a configuração de demo correspondente ao botão de vagas acionado.
 *
 * PARÂMETROS E RETORNO:
 * @param {'current'|'previous'} period - Período associado ao botão de criação de vagas.
 * @returns {object} Configuração de classes, turnos, rótulos e ponto de referência.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê constantes em memória carregadas dos arquivos `dados-vagas-mes-atual-demo.js` e
 * `dados-vagas-mes-anterior-demo.js`; não grava dados.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, buscar a configuração da competência em API própria, com tratamento de erro
 * para arquivo/endpoint indisponível.
 */
function demoGetVagasData(period) {
  return DEMO_VAGAS_DATA_BY_PERIOD[period] || DEMO_DEFAULT_VAGAS_DATA;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Formata número sequencial como identificador estável para registros de teste.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} prefix - Prefixo textual do identificador.
 * @param {number} index - Índice numérico.
 * @returns {string} Identificador padronizado.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; os IDs são usados pelos objetos persistidos depois.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Usar UUID ou chave gerada por banco em ambiente real.
 */
function demoId(prefix, index) {
  return `${prefix}-${String(index).padStart(2, '0')}`;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Cria um texto simples de endereço a partir dos campos separados do cadastro novo de convênio.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} endereco - Objeto com logradouro, número, complemento, bairro, cidade, UF e CEP.
 * @returns {string} Endereço consolidado para compatibilidade com telas antigas.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; apenas transforma o objeto em memória antes de persistir o convênio demo.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, manter endereço normalizado em tabela própria e montar textos somente na camada de apresentação.
 */
function demoFormatEndereco(endereco = {}) {
  const via = [endereco.logradouro, endereco.numero].filter(Boolean).join(', ');
  const complemento = endereco.complemento ? ` - ${endereco.complemento}` : '';
  const localidade = [endereco.bairro, `${endereco.cidade || ''}/${endereco.uf || ''}`].filter(Boolean).join(' - ');
  const cep = endereco.cep ? `CEP ${endereco.cep}` : '';

  return [via ? `${via}${complemento}` : '', localidade, cep].filter(Boolean).join(' - ');
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Resolve um campo que pode estar no formato novo organizado por seção ou no formato antigo plano.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} config - Convênio de demonstração carregado da fixture.
 * @param {string} section - Nome da seção organizada, como `identificacao` ou `contrato`.
 * @param {string} field - Nome do campo dentro da seção.
 * @param {*} fallback - Valor usado quando o campo não existe.
 * @returns {*} Valor encontrado na seção, no objeto raiz ou o fallback.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa armazenamento; apenas lê o objeto em memória antes da persistência em LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Quando houver backend, validar schema da fixture antes de carregar o seed administrativo.
 */
function demoField(config = {}, section, field, fallback = '') {
  if (config[section] && config[section][field] !== undefined) return config[section][field];
  if (config[field] !== undefined) return config[field];
  return fallback;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Gera texto curto sem acentos para e-mails de teste dos responsáveis de convênio.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} value - Texto base do convênio ou responsável.
 * @returns {string} Slug seguro para compor e-mail fictício.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa armazenamento; o retorno é usado no objeto do responsável antes da gravação local.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, substituir e-mails sintéticos por identidade autenticada do responsável.
 */
function demoSlug(value) {
  return String(value || 'convenio')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/(^\.|\.$)/g, '');
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Cria valores de serviço por classe para um convênio de demonstração.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} convenioId - ID do convênio vinculado aos valores.
 * @param {number} offset - Índice usado para variar discretamente os valores.
 * @param {object} config - Convênio de demonstração, preferencialmente com `valoresPorClasse`
 * e `beneficios` explícitos.
 * @returns {Array<object>} Lista de valores por classe e tipo de serviço.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados diretamente; o retorno é salvo em `cproeis_contratos_valores`.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Versionar valores por vigência e por publicação oficial.
 */
function demoBuildValores(convenioId, offset, config = {}) {
  const passagem = Number(demoField(config, 'beneficios', 'passagem', 18 + (offset % 3)));
  const alimentacao = Number(demoField(config, 'beneficios', 'alimentacao', 32 + (offset % 4)));
  const valoresConfigurados = Array.isArray(config.valoresPorClasse) ? config.valoresPorClasse : null;

  if (valoresConfigurados?.length) {
    return valoresConfigurados.map((item) => ({
      id: `${convenioId}-valor-${String(item.classe || '').toLowerCase()}`,
      convenioId,
      classe: item.classe,
      grupo: item.grupo || '',
      servico12: Number(item.servico12 || 0),
      servico8: Number(item.servico8 || 0),
      servico6: Number(item.servico6 || 0),
      passagem: Number(item.passagem ?? passagem),
      alimentacao: Number(item.alimentacao ?? alimentacao),
      decreto: item.decreto || '',
      inicio: item.inicio || '',
      fim: item.fim || '',
      publicacao: item.publicacao || '',
      status: item.status || 'Vigente'
    }));
  }

  return [
    { id: `${convenioId}-valor-a`, convenioId, classe: 'A', servico12: 780 + offset, servico8: 540 + offset, servico6: 420 + offset, passagem, alimentacao },
    { id: `${convenioId}-valor-b`, convenioId, classe: 'B', servico12: 680 + offset, servico8: 480 + offset, servico6: 360 + offset, passagem, alimentacao },
    { id: `${convenioId}-valor-c`, convenioId, classe: 'C', servico12: 560 + offset, servico8: 390 + offset, servico6: 300 + offset, passagem, alimentacao },
    { id: `${convenioId}-valor-d`, convenioId, classe: 'D', servico12: 480 + offset, servico8: 340 + offset, servico6: 260 + offset, passagem, alimentacao }
  ];
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Calcula o valor final de contrato demo a partir dos limites diários, valores unitários,
 * passagem/alimentação e dias de vigência.
 *
 * PARÂMETROS E RETORNO:
 * @param {Array<object>} valores - Valores unitários por classe e turno.
 * @param {Array<object>} limites - Quantidade máxima diária por classe e turno.
 * @param {string} inicio - Início da vigência em YYYY-MM-DD.
 * @param {string} fim - Fim da vigência em YYYY-MM-DD.
 * @returns {number} Valor total calculado para preencher `valorContrato`.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados diretamente; o retorno é salvo no objeto do convênio demo.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Reaproveitar a mesma regra do backend financeiro quando a aplicação sair do modo LocalStorage.
 */
function demoCalculateValorContrato(valores, limites, inicio, fim) {
  const valorBase = valores[0] || {};
  const passagemAlimentacao = Number(valorBase.passagem || 0) + Number(valorBase.alimentacao || 0);
  const totalDiario = ['A', 'B', 'C', 'D'].reduce((total, classe) => {
    const valor = valores.find((item) => item.classe === classe) || {};
    const limite = limites.find((item) => item.classe === classe) || {};
    const turnos = (Number(valor.servico12 || 0) * Number(limite.servico12 || 0))
      + (Number(valor.servico8 || 0) * Number(limite.servico8 || 0))
      + (Number(valor.servico6 || 0) * Number(limite.servico6 || 0));
    const vagas = Number(limite.servico12 || 0) + Number(limite.servico8 || 0) + Number(limite.servico6 || 0);

    return total + turnos + (vagas * passagemAlimentacao);
  }, 0);

  return totalDiario * demoCountContractDays(inicio, fim);
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Cria os limites diários de vagas por classe e turno para um convênio de demonstração.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} convenioId - ID do convênio vinculado aos limites operacionais.
 * @param {number} offset - Índice usado para variar os limites entre contratos demo.
 * @param {object} config - Convênio de demonstração, preferencialmente com `limitesVagasDiarias`.
 * @returns {Array<object>} Lista de limites por classe com totais para 12h, 8h e 6h.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados diretamente; o retorno é salvo dentro do convênio em `limitesVagasDiarias`
 * e na chave `cproeis_contratos_limites_vagas`.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, validar estes limites em tabela contratual própria e bloquear geração
 * de vagas no backend quando a quantidade diária por classe/turno for excedida.
 */
function demoBuildLimitesVagasDiarias(convenioId, offset, config = {}) {
  if (Array.isArray(config.limitesVagasDiarias) && config.limitesVagasDiarias.length) {
    return config.limitesVagasDiarias.map((item) => ({
      id: `${convenioId}-limite-classe-${item.classe}`,
      convenioId,
      classe: item.classe,
      grupo: item.grupo || '',
      servico12: Number(item.servico12 || 0),
      servico8: Number(item.servico8 || 0),
      servico6: Number(item.servico6 || 0)
    }));
  }

  const variation = offset % 4;

  return [
    { id: `${convenioId}-limite-classe-A`, convenioId, classe: 'A', grupo: 'Oficiais superiores', servico12: 2 + variation, servico8: 2 + variation, servico6: 1 + variation },
    { id: `${convenioId}-limite-classe-B`, convenioId, classe: 'B', grupo: 'Oficiais intermediários e subalternos', servico12: 4 + variation, servico8: 3 + variation, servico6: 2 + variation },
    { id: `${convenioId}-limite-classe-C`, convenioId, classe: 'C', grupo: 'Praças subtenentes e sargentos', servico12: 8 + variation, servico8: 6 + variation, servico6: 4 + variation },
    { id: `${convenioId}-limite-classe-D`, convenioId, classe: 'D', grupo: 'Cabos e soldados', servico12: 12 + variation, servico8: 10 + variation, servico6: 8 + variation }
  ];
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Monta a configuração semanal de funcionamento no mesmo formato gravado pela tela nova de cadastro.
 *
 * PARÂMETROS E RETORNO:
 * @param {Array<object>} limites - Linhas de total diário por classe e turno.
 * @param {Array<string>} selectedKeys - Chaves de dias marcados no contrato.
 * @returns {{modo: string, diasSelecionados: Array<string>, dias: Array<object>}} Configuração semanal persistível.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados diretamente; o retorno é embutido em cada convênio salvo no LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, validar os dias selecionados contra calendário oficial e exceções contratuais.
 */
function demoBuildLimitesVagasSemana(limites, selectedKeys = []) {
  const diasSemana = [
    { key: 'segunda', label: 'Segunda-feira' },
    { key: 'terca', label: 'Terça-feira' },
    { key: 'quarta', label: 'Quarta-feira' },
    { key: 'quinta', label: 'Quinta-feira' },
    { key: 'sexta', label: 'Sexta-feira' },
    { key: 'sabado', label: 'Sábado' },
    { key: 'domingo', label: 'Domingo' }
  ];
  const selectedSet = new Set(selectedKeys);
  const totalPorClasse = ['A', 'B', 'C', 'D'].reduce((acc, classe) => {
    const row = limites.find((item) => item.classe === classe) || {};
    acc[classe] = Number(row.servico6 || 0) + Number(row.servico8 || 0) + Number(row.servico12 || 0);
    return acc;
  }, {});

  return {
    modo: 'dias-selecionados',
    diasSelecionados: selectedKeys,
    dias: diasSemana.map((dia) => {
      const ativo = selectedSet.has(dia.key);
      return {
        key: dia.key,
        label: dia.label,
        ativo,
        classeA: ativo ? totalPorClasse.A : 0,
        classeB: ativo ? totalPorClasse.B : 0,
        classeC: ativo ? totalPorClasse.C : 0,
        classeD: ativo ? totalPorClasse.D : 0
      };
    })
  };
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Cria exatamente um responsável operacional para o convênio de demonstração.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} convenioId - ID do convênio.
 * @param {string} convenioNome - Nome usado para montar o responsável.
 * @param {number} index - Índice numérico para CPF, telefone e e-mail.
 * @param {string} inicioContrato - Data inicial do contrato usada como início do primeiro responsável.
 * @param {object} config - Convênio de demonstração com `responsaveis` explícitos, quando houver.
 * @returns {object} Responsável apto a acessar o módulo de convênio.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava diretamente; o retorno é salvo dentro do convênio e em `cproeis_contratos_responsaveis`.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Relacionar responsáveis a usuários autenticados e perfis oficiais, sem reintroduzir níveis
 * de acesso no cadastro do convênio.
 */
function demoBuildResponsavel(convenioId, convenioNome, index, inicioContrato, config = {}) {
  const responsavelConfigurado = Array.isArray(config.responsaveis) ? config.responsaveis[0] : null;
  const nomeResponsavel = responsavelConfigurado?.nome
    || config.responsavel
    || DEMO_CONTRATOS_DATA.responsaveisConvenio?.[index - 1]
    || `Responsável Operacional ${index}`;

  return {
    id: `${convenioId}-resp-01`,
    convenioId,
    nome: nomeResponsavel,
    cpf: responsavelConfigurado?.cpf || `123.45${index}.${String(600 + index).padStart(3, '0')}-${String(10 + index).slice(-2)}`,
    email: responsavelConfigurado?.email || `${demoSlug(nomeResponsavel)}@demo.cproeis.local`,
    telefone: responsavelConfigurado?.telefone || `(21) 99${index}10-${String(4500 + index).padStart(4, '0')}`,
    funcoes: [],
    funcao: '',
    inicio: responsavelConfigurado?.inicio || inicioContrato,
    fim: responsavelConfigurado?.fim || ''
  };
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Monta convênios vigentes de demonstração, usando a massa completa atual quando disponível e
 * mantendo compatibilidade com a lista antiga de nomes.
 *
 * PARÂMETROS E RETORNO:
 * @returns {{convenios: Array<object>, responsaveis: Array<object>, valores: Array<object>, limitesVagas: Array<object>}} Base sintética.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava diretamente; a função `seedDemoContratos` persiste o retorno no LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Substituir dados fictícios por fixtures oficiais de homologação quando disponíveis.
 */
function demoBuildConvenios() {
  const rows = DEMO_CONTRATOS_DATA.convenios;

  const convenios = [];
  const responsaveis = [];
  const valores = [];
  const limitesVagas = [];

  rows.forEach((row, index) => {
    const config = typeof row === 'string' ? { nome: row } : row;
    const convenioId = demoId('conv-demo', index + 1);
    const nome = demoField(config, 'identificacao', 'nome', `Convênio Demo ${index + 1}`);
    const convenioValores = demoBuildValores(convenioId, index * 10, config);
    const convenioLimitesVagas = demoBuildLimitesVagasDiarias(convenioId, index, config);
    const selectedDays = Array.isArray(config.diasSelecionados) && config.diasSelecionados.length
      ? config.diasSelecionados
      : ['segunda', 'terca', 'quarta', 'quinta', 'sexta'];
    const limitesVagasSemana = demoBuildLimitesVagasSemana(convenioLimitesVagas, selectedDays);
    const inicio = demoField(config, 'vigencia', 'inicio', demoAddDays(DEMO_TODAY, -90 - index));
    const fim = demoField(config, 'vigencia', 'fim', demoAddDays(DEMO_TODAY, 150 + (index * 20)));
    const responsavel = demoBuildResponsavel(convenioId, nome, index + 1, inicio, config);
    const valorContratoCalculado = demoCalculateValorContrato(convenioValores, convenioLimitesVagas, inicio, fim);
    const enderecoDados = (config.endereco && typeof config.endereco === 'object' ? config.endereco : null) || config.enderecoDados || {
      logradouro: 'Rua Operacional',
      numero: String(100 + index),
      complemento: '',
      bairro: 'Centro',
      cidade: 'Rio de Janeiro',
      uf: 'RJ',
      cep: `20000-00${index}`
    };

    convenios.push({
      id: convenioId,
      nome,
      cnpj: demoField(config, 'identificacao', 'cnpj', `${String(12 + index).padStart(2, '0')}.${String(345 + index).padStart(3, '0')}.${String(670 + index).padStart(3, '0')}/0001-${String(10 + index).padStart(2, '0')}`),
      tipoConveniado: demoField(config, 'identificacao', 'tipoConveniado', index % 2 === 0 ? 'Órgão Público' : 'Concessionária'),
      endereco: demoFormatEndereco(enderecoDados),
      enderecoDados,
      numero: demoField(config, 'contrato', 'numero', `SEI-${String(123456 + index)}/789012/34${String(50 + index)}`),
      diarioData: demoField(config, 'publicacao', 'data', inicio),
      diarioPagina: demoField(config, 'publicacao', 'pagina', `Página ${12 + index}`),
      valorContrato: Number(demoField(config, 'contrato', 'valorContrato', valorContratoCalculado)),
      inicio,
      fim,
      classeA: 0,
      classeB: 0,
      classeC: 0,
      classeD: 0,
      valores: convenioValores,
      limitesVagasDiarias: convenioLimitesVagas,
      limitesVagasSemana,
      responsaveis: [responsavel]
    });

    responsaveis.push(responsavel);
    valores.push(...convenioValores);
    limitesVagas.push(...convenioLimitesVagas);
  });

  return { convenios, responsaveis, valores, limitesVagas };
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Limpa o escopo local de contratos e dados operacionais dependentes antes de carregar a massa
 * demo no formato vigente.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Remove chaves de LocalStorage ligadas a contratos, responsáveis, sessão de convênio, serviços
 * e vagas para evitar mistura com registros antigos fora do formato atual.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, substituir esta limpeza total por ambiente de homologação isolado e scripts
 * de reset controlados por autorização administrativa.
 */
function demoClearContratosWorkspace() {
  [
    DEMO_KEYS.convenios,
    DEMO_KEYS.valores,
    DEMO_KEYS.responsaveis,
    DEMO_KEYS.limitesVagas,
    DEMO_KEYS.contratosHistoricos,
    DEMO_KEYS.convenioAtual,
    DEMO_KEYS.convenioResponsavelAtual,
    DEMO_KEYS.servicos,
    DEMO_KEYS.vagas
  ].forEach((key) => localStorage.removeItem(key));
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Monta 20 policiais de demonstração com postos variados, incluindo oficiais e praças.
 *
 * PARÂMETROS E RETORNO:
 * @returns {Array<object>} Lista de policiais pronta para persistência.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava diretamente; `seedDemoPoliciais` salva o retorno em `cproeis_cadastro_policiais`.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Remover dados sintéticos fora de ambiente de teste.
 */
function demoBuildPoliciais() {
  const rows = DEMO_POLICIAIS_DATA.policiais;

  return rows.map((row, index) => {
    const [rg, idFuncional, nomeCompleto, nomeGuerra, postoGraduacao, grupoHierarquico, grupoOficial, comportamento, unidade] = row;
    return {
      id: demoId('pol-demo', index + 1),
      rg,
      idFuncional,
      nomeCompleto,
      nomeGuerra,
      telefone: `(21) 98${String(3000 + index).slice(0, 4)}-${String(1100 + index).padStart(4, '0')}`,
      email: `${nomeCompleto.toLowerCase().replaceAll(' ', '.')}@pmerj.rj.gov.br`,
      dataEntrada: demoAddDays(DEMO_TODAY, -3650 + index),
      postoGraduacao,
      grupoHierarquico,
      grupoOficial,
      situacaoFuncional: 'Ativo',
      unidade,
      situacaoSanitaria: 'APTO_A',
      comportamento,
      historicoSanitario: []
    };
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Cria históricos iniciais para os policiais simulados, mantendo as telas de detalhe consistentes.
 *
 * PARÂMETROS E RETORNO:
 * @param {Array<object>} policiais - Policiais gerados para teste.
 * @returns {object} Coleção de históricos por tipo.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava diretamente; os arrays retornados são salvos por `seedDemoPoliciais`.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em ambiente online, esses históricos devem ser transacionais e auditados.
 */
function demoBuildHistoricos(policiais) {
  return {
    sanitario: policiais.map((policial, index) => ({
      id: `hist-san-${index + 1}`,
      idFuncional: policial.idFuncional,
      dataInicio: policial.dataEntrada,
      dataTermino: '',
      bolpm: `BOL ${120 + index}/2026`,
      dataBolpm: DEMO_TODAY,
      situacaoSanitaria: policial.situacaoSanitaria
    })),
    funcional: policiais.map((policial, index) => ({
      id: `hist-func-${index + 1}`,
      idFuncional: policial.idFuncional,
      postoGraduacao: policial.postoGraduacao,
      grupoHierarquico: policial.grupoHierarquico,
      grupoOficial: policial.grupoOficial,
      dataAlteracao: policial.dataEntrada,
      bolpm: `BOL ${140 + index}/2026`,
      dataBolpm: DEMO_TODAY
    })),
    comportamento: policiais.filter((policial) => policial.comportamento).map((policial, index) => ({
      id: `hist-comp-${index + 1}`,
      idFuncional: policial.idFuncional,
      comportamento: policial.comportamento,
      dataAlteracao: policial.dataEntrada,
      bolpm: `BOL ${160 + index}/2026`,
      dataBolpm: DEMO_TODAY
    })),
    unidade: policiais.map((policial, index) => ({
      id: `hist-unid-${index + 1}`,
      idFuncional: policial.idFuncional,
      unidade: policial.unidade,
      dataApresentacao: policial.dataEntrada,
      bolpm: `BOL ${180 + index}/2026`,
      dataBolpm: DEMO_TODAY
    })),
    status: policiais.map((policial, index) => ({
      id: `hist-status-${index + 1}`,
      idFuncional: policial.idFuncional,
      situacaoFuncional: policial.situacaoFuncional,
      dataAlteracao: policial.dataEntrada,
      bolpm: `BOL ${200 + index}/2026`,
      dataBolpm: DEMO_TODAY
    }))
  };
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Carrega contratos, responsáveis, valores, limites diários de vagas e histórico contratual
 * de teste no armazenamento local.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Grava `cproeis_contratos_schema_version`, `cproeis_contratos_convenios`,
 * `cproeis_contratos_responsaveis`, `cproeis_contratos_valores` e
 * `cproeis_contratos_limites_vagas`, além de `cproeis_contratos_historicos`
 * no LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, carregar contratos por API administrativa com autenticação, auditoria e
 * validação de vigência antes da persistência.
 */
function seedDemoContratos() {
  demoClearContratosWorkspace();
  const { convenios, responsaveis, valores, limitesVagas } = demoBuildConvenios();

  localStorage.setItem(DEMO_KEYS.contratosSchema, '2026-06-05-responsaveis-sem-nivel');
  demoSaveList(DEMO_KEYS.convenios, convenios);
  demoSaveList(DEMO_KEYS.responsaveis, responsaveis);
  demoSaveList(DEMO_KEYS.valores, valores);
  demoSaveList(DEMO_KEYS.limitesVagas, limitesVagas);
  demoSaveList(DEMO_KEYS.contratosHistoricos, []);
  demoFeedback(`Contratos carregados: ${convenios.length} convênios, ${responsaveis.length} responsáveis e limites diários de vagas.`);
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Carrega policiais de teste e seus históricos operacionais no armazenamento local.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Grava `cproeis_cadastro_policial_reset_version`, `cproeis_cadastro_policiais`,
 * `cproeis_historico_sanitario`, `cproeis_historico_funcional`,
 * `cproeis_historico_comportamento`, `cproeis_historico_unidade` e
 * `cproeis_historico_situacao_funcional` no LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, importar policiais por integração segura com a base oficial de efetivo,
 * preservando trilha de auditoria para cada alteração cadastral.
 */
function seedDemoPoliciais() {
  const policiais = demoBuildPoliciais();
  const historicos = demoBuildHistoricos(policiais);

  localStorage.setItem(DEMO_KEYS.policialReset, '2026-05-15-input-ajustes');
  demoSaveList(DEMO_KEYS.policiais, policiais);
  demoSaveList(DEMO_KEYS.sanitario, historicos.sanitario);
  demoSaveList(DEMO_KEYS.funcional, historicos.funcional);
  demoSaveList(DEMO_KEYS.comportamento, historicos.comportamento);
  demoSaveList(DEMO_KEYS.unidade, historicos.unidade);
  demoSaveList(DEMO_KEYS.status, historicos.status);
  demoFeedback('Policiais carregados: 20 registros e históricos iniciais.');
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Mantém uma rotina agregadora para carregar contratos e policiais em uma única chamada quando
 * algum teste antigo ainda usar o comportamento anterior.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Grava as mesmas chaves de LocalStorage manipuladas por `seedDemoContratos` e `seedDemoPoliciais`.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Remover esta compatibilidade quando os testes e fluxos internos usarem somente os botões
 * separados por domínio.
 */
function seedDemoRegisters() {
  seedDemoContratos();
  seedDemoPoliciais();
  demoFeedback('Cadastros carregados: 10 convênios, 10 responsáveis e 20 policiais.');
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Monta o endereço textual do serviço demo a partir do endereço estruturado do convênio.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} endereco - Endereço estruturado do convênio.
 * @returns {string} Endereço formatado para gravação no serviço.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não lê nem grava dados; apenas transforma o objeto recebido em texto.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, manter endereço em tabela normalizada e usar geocodificação/validação oficial.
 */
function demoFormatServicoEndereco(endereco = {}) {
  const linha1 = [endereco.logradouro, endereco.numero].filter(Boolean).join(', ');
  const linha2 = [endereco.complemento, endereco.bairro].filter(Boolean).join(' - ');
  const linha3 = [endereco.cidade, endereco.uf].filter(Boolean).join('/');
  const cep = endereco.cep ? `CEP ${endereco.cep}` : '';
  return [linha1, linha2, linha3, cep].filter(Boolean).join(' | ');
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Cria três serviços de apresentação para cada convênio demo, um para Classe A, um para Classe B
 * e um para Classe C/D, simulando o cadastro feito pelo responsável do convênio.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} convenio - Convênio de demonstração.
 * @param {number} convenioIndex - Índice usado para variar local e ponto de referência.
 * @returns {Array<object>} Serviços prontos para gravação em `cproeis_convenios_servicos`.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava diretamente; o retorno é salvo por `seedDemoServicos`.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, serviços devem ser criados pelo responsável autenticado e auditados por contrato.
 */
function demoBuildServicosConvenio(convenio, convenioIndex) {
  const enderecoDados = {
    cep: convenio.enderecoDados?.cep || `20000-0${String(convenioIndex).padStart(2, '0')}`,
    logradouro: convenio.enderecoDados?.logradouro || 'Rua Operacional',
    numero: convenio.enderecoDados?.numero || String(100 + convenioIndex),
    complemento: convenio.enderecoDados?.complemento || '',
    bairro: convenio.enderecoDados?.bairro || 'Centro',
    cidade: convenio.enderecoDados?.cidade || 'Rio de Janeiro',
    uf: convenio.enderecoDados?.uf || 'RJ'
  };
  const enderecoServico = demoFormatServicoEndereco(enderecoDados);
  const baseId = `servico-demo-${convenio.id}`;
  const nomeBase = convenio.nome || `Convênio ${convenioIndex + 1}`;

  return [
    {
      id: `${baseId}-classe-a`,
      convenioId: convenio.id,
      convenioNome: nomeBase,
      classeReferencia: 'A',
      nomeServico: `Supervisão Classe A - ${nomeBase}`,
      localServico: `Base de supervisão - ${nomeBase}`,
      enderecoDados,
      enderecoServico,
      pontoReferencia: 'Apresentação com o coordenador operacional.',
      status: 'Ativo',
      createdAt: new Date().toISOString()
    },
    {
      id: `${baseId}-classe-b`,
      convenioId: convenio.id,
      convenioNome: nomeBase,
      classeReferencia: 'B',
      nomeServico: `Coordenação Classe B - ${nomeBase}`,
      localServico: `Sala de coordenação - ${nomeBase}`,
      enderecoDados,
      enderecoServico,
      pontoReferencia: 'Apresentação na recepção administrativa.',
      status: 'Ativo',
      createdAt: new Date().toISOString()
    },
    {
      id: `${baseId}-classe-cd`,
      convenioId: convenio.id,
      convenioNome: nomeBase,
      classeReferencia: 'C/D',
      nomeServico: `Policiamento Classe C/D - ${nomeBase}`,
      localServico: `Ponto de policiamento - ${nomeBase}`,
      enderecoDados,
      enderecoServico,
      pontoReferencia: 'Apresentação na portaria principal.',
      status: 'Ativo',
      createdAt: new Date().toISOString()
    }
  ];
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Carrega serviços de apresentação demo para todos os convênios cadastrados.
 *
 * PARÂMETROS E RETORNO:
 * @returns {Array<object>} Lista de serviços gravada no LocalStorage.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê `cproeis_contratos_convenios` e grava `cproeis_convenios_servicos`, substituindo apenas
 * serviços com ID iniciado por `servico-demo-`.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, remover seed e criar serviços por tela autenticada do responsável.
 */
function seedDemoServicos() {
  let convenios = demoLoadList(DEMO_KEYS.convenios);
  if (!convenios.length) {
    seedDemoContratos();
    convenios = demoLoadList(DEMO_KEYS.convenios);
  }

  const servicos = convenios.flatMap((convenio, index) => demoBuildServicosConvenio(convenio, index));
  const existing = demoLoadList(DEMO_KEYS.servicos)
    .filter((servico) => !String(servico.id || '').startsWith('servico-demo-'));
  const merged = [...existing, ...servicos].sort((a, b) => (
    String(a.convenioNome || '').localeCompare(String(b.convenioNome || ''), 'pt-BR')
    || String(a.nomeServico || '').localeCompare(String(b.nomeServico || ''), 'pt-BR')
  ));

  demoSaveList(DEMO_KEYS.servicos, merged);
  demoFeedback(`Serviços demo criados: ${servicos.length} serviços, 3 para cada convênio.`);
  return merged;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Retorna o valor unitário de uma vaga com base no convênio, classe e tipo de serviço.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} convenio - Convênio com valores cadastrados.
 * @param {string} classe - Classe da vaga.
 * @param {string} tipoServico - Tipo de serviço.
 * @returns {number} Valor unitário calculado.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; lê somente o objeto de convênio em memória.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Centralizar cálculo financeiro em serviço de domínio compartilhado.
 */
function demoGetValorUnitario(convenio, classe, tipoServico) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Resolve o valor unitário sintético usado na geração de vagas de demonstração.
   * A criação operacional só deve persistir classes A, B e C/D; para C/D, usa C como valor provisório
   * agregado até a FOPAG calcular pagamento por graduação individual.
   * PARÂMETROS E RETORNO: Recebe convenio (object), classe (string) e tipoServico (string);
   * retorna Number com o valor cadastrado para a classe de referência.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; lê somente os valores já carregados do convênio em memória.
   * TODO: Na FOPAG, pagar C/D por policial: Soldado/Cabo pela classe D e Sargento/Subtenente pela classe C.
   */
  const lookupClass = classe === 'C/D' ? 'C' : classe;
  const row = (convenio.valores || []).find((valor) => valor.classe === lookupClass) || {};
  return Number(row[tipoServico] || 0);
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Define se um convênio deve gerar vaga em determinado dia, criando rotinas diversificadas.
 *
 * PARÂMETROS E RETORNO:
 * @param {number} convenioIndex - Índice do convênio.
 * @param {number} dayOffset - Dia relativo a partir de hoje.
 * @returns {boolean} Verdadeiro quando deve haver vaga no dia.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; calcula a rotina em memória.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Substituir rotinas sintéticas por escalas reais por convênio.
 */
function demoShouldCreateVaga(convenioIndex, dayOffset) {
  const date = new Date(`${demoAddDays(DEMO_TODAY, dayOffset)}T00:00:00`);
  const day = date.getDay();
  const weekday = day >= 1 && day <= 5;
  const weekend = day === 0 || day === 6;
  const rules = [
    true,
    weekday,
    weekend,
    dayOffset % 2 === 0,
    dayOffset % 3 === 0,
    dayOffset % 4 !== 1,
    day === 2 || day === 4 || weekend,
    dayOffset % 5 === 0 || weekday,
    dayOffset % 7 <= 2,
    day === 1 || day === 3 || day === 5
  ];
  return Boolean(rules[convenioIndex % rules.length]);
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Localiza um serviço demo compatível com a classe da vaga dentro do convênio informado.
 *
 * PARÂMETROS E RETORNO:
 * @param {Array<object>} servicos - Lista de serviços carregados de `cproeis_convenios_servicos`.
 * @param {string} convenioId - ID do convênio da vaga.
 * @param {string} classe - Classe operacional da vaga.
 * @returns {object|null} Serviço correspondente ou nulo quando não houver cadastro.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; consulta somente a lista em memória carregada previamente do LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, a vaga deve persistir `servicoId` e resolver nome/endereço por relacionamento no backend.
 */
function demoFindServicoForClasse(servicos, convenioId, classe) {
  const classeReferencia = classe === 'C/D' ? 'C/D' : classe;
  return servicos.find((servico) => (
    servico.convenioId === convenioId &&
    servico.classeReferencia === classeReferencia &&
    servico.status !== 'Inativo'
  )) || null;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Gera as vagas de um convênio para um dia, respeitando a regra de no máximo uma vaga de oficial por dia,
 * a norma operacional de criação apenas nas classes A, B e C/D, e usando serviços previamente cadastrados.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} convenio - Convênio de teste.
 * @param {number} convenioIndex - Índice do convênio.
 * @param {number} dayOffset - Dia relativo a partir de hoje.
 * @param {object} vagasData - Configuração sintética do arquivo demo do botão acionado.
 * @param {Array<object>} servicos - Serviços de apresentação já cadastrados para os convênios.
 * @returns {Array<object>} Vagas geradas para o dia.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava diretamente; lê serviços em memória e a lista retornada é salva por `seedDemoVagasForPeriod`.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Quando a FOPAG for evoluída, separar pagamento de C/D por graduação usando valores C e D do contrato.
 */
function demoBuildVagasForDay(convenio, convenioIndex, dayOffset, vagasData = DEMO_DEFAULT_VAGAS_DATA, servicos = []) {
  if (!demoShouldCreateVaga(convenioIndex, dayOffset)) return [];

  const dataServico = demoAddDays(DEMO_TODAY, dayOffset);
  const localBase = convenio.nome || 'Convênio';
  const daily = [];
  const officialClasses = vagasData.classesOficiais || ['A', 'B'];
  const officialClass = officialClasses[demoPositiveModulo(convenioIndex + dayOffset, officialClasses.length)];
  const addOfficial = dayOffset % (3 + (convenioIndex % 3)) === 0;
  const tipoOficial = dayOffset % 2 === 0 ? 'servico12' : 'servico8';
  const pracaModulo = demoPositiveModulo(dayOffset, 3);
  const tipoPraca = pracaModulo === 0 ? 'servico12' : (pracaModulo === 1 ? 'servico8' : 'servico6');
  const turnos = {
    servico12: ['08:00', '20:00'],
    servico8: ['08:00', '16:00'],
    servico6: ['14:00', '20:00'],
    ...(vagasData.turnos || {})
  };
  const labels = vagasData.labelsServico || {};

  if (addOfficial) {
    const [horaInicio, horaFim] = turnos[tipoOficial];
    daily.push({
      classe: officialClass,
      tipoServico: tipoOficial,
      quantidade: 1,
      nomeServico: `${labels.oficial || 'Supervisão'} ${localBase}`,
      horaInicio,
      horaFim
    });
  }

  const [horaInicio, horaFim] = turnos[tipoPraca];
  daily.push({
    classe: 'C/D',
    tipoServico: tipoPraca,
    quantidade: 1 + demoPositiveModulo(convenioIndex + dayOffset, 4),
    nomeServico: `${labels.praca || 'Policiamento'} ${localBase}`,
    horaInicio,
    horaFim
  });

  if ((convenioIndex + dayOffset) % 6 === 0) {
    daily.push({
      classe: 'C/D',
      tipoServico: 'servico6',
      quantidade: 1 + demoPositiveModulo(dayOffset, 2),
      nomeServico: `${labels.apoio || 'Apoio'} ${localBase}`,
      horaInicio: '18:00',
      horaFim: '00:00'
    });
  }

  return daily.map((item, index) => {
    const servico = demoFindServicoForClasse(servicos, convenio.id, item.classe);
    const valorUnitario = demoGetValorUnitario(convenio, item.classe, item.tipoServico);
    return {
      id: `vaga-demo-${convenio.id}-${dataServico}-${index + 1}`,
      convenioId: convenio.id,
      dataServico,
      servicoId: servico?.id || '',
      nomeServico: servico?.nomeServico || item.nomeServico,
      localServico: servico?.localServico || localBase,
      enderecoServico: servico?.enderecoServico || convenio.endereco,
      enderecoDados: servico?.enderecoDados || convenio.enderecoDados || {},
      pontoReferencia: servico?.pontoReferencia || vagasData.pontoReferencia || 'Portaria principal',
      classe: item.classe,
      tipoServico: item.tipoServico,
      horaInicio: item.horaInicio,
      horaFim: item.horaFim,
      quantidade: item.quantidade,
      valorUnitario,
      valorTotal: valorUnitario * item.quantidade,
      preenchidas: 0,
      policialEscalado: '',
      cursoObrigatorio: '',
      createdAt: new Date().toISOString()
    };
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Gera vagas simuladas para todos os dias do mês atual ou do mês anterior, usando o arquivo
 * de demo específico do botão acionado.
 *
 * PARÂMETROS E RETORNO:
 * @param {'current'|'previous'} period - Define se a competência gerada é o mês atual ou o mês anterior.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê convênios de `cproeis_contratos_convenios`, lê vagas existentes em `cproeis_convenios_vagas`
 * e grava a mesma chave substituindo somente vagas de demonstração dentro do mês escolhido.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, bloquear geração automática fora de ambiente de homologação, validar a
 * competência no backend e registrar usuário executor.
 */
function seedDemoVagasForPeriod(period) {
  let convenios = demoLoadList(DEMO_KEYS.convenios);
  if (!convenios.length) {
    seedDemoContratos();
    convenios = demoLoadList(DEMO_KEYS.convenios);
  }

  let servicos = demoLoadList(DEMO_KEYS.servicos).filter((servico) => String(servico.id || '').startsWith('servico-demo-'));
  if (!servicos.length) {
    seedDemoServicos();
    servicos = demoLoadList(DEMO_KEYS.servicos).filter((servico) => String(servico.id || '').startsWith('servico-demo-'));
  }

  const monthPeriod = demoGetMonthPeriod(period);
  const vagasData = demoGetVagasData(period);
  const vagas = [];
  convenios.forEach((convenio, convenioIndex) => {
    const startOffset = demoDiffDays(DEMO_TODAY, monthPeriod.start);
    const endOffset = demoDiffDays(DEMO_TODAY, monthPeriod.end);
    for (let dayOffset = startOffset; dayOffset <= endOffset; dayOffset += 1) {
      vagas.push(...demoBuildVagasForDay(convenio, convenioIndex, dayOffset, vagasData, servicos));
    }
  });

  const existingVagas = demoLoadList(DEMO_KEYS.vagas);
  const otherPeriods = existingVagas.filter((vaga) => (
    !String(vaga.id || '').startsWith('vaga-demo-')
    || vaga.dataServico < monthPeriod.start
    || vaga.dataServico > monthPeriod.end
  ));
  const mergedVagas = [...otherPeriods, ...vagas].sort((a, b) => (
    String(a.dataServico || '').localeCompare(String(b.dataServico || ''))
    || String(a.convenioId || '').localeCompare(String(b.convenioId || ''))
    || String(a.nomeServico || '').localeCompare(String(b.nomeServico || ''))
  ));

  demoSaveList(DEMO_KEYS.vagas, mergedVagas);
  demoFeedback(`Vagas do ${monthPeriod.label} geradas: ${vagas.length} vagas entre ${monthPeriod.start} e ${monthPeriod.end}.`);
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Gera vagas simuladas para o mês atual.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Usa `seedDemoVagasForPeriod` para ler contratos e gravar vagas em `cproeis_convenios_vagas`.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, substituir por criação de competência operacional validada no backend.
 */
function seedDemoVagasMesAtual() {
  seedDemoVagasForPeriod('current');
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Gera vagas simuladas para todos os dias do mês anterior.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Usa `seedDemoVagasForPeriod` para ler contratos e gravar vagas em `cproeis_convenios_vagas`.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, exigir fechamento/reabertura de competência antes de alterar mês anterior.
 */
function seedDemoVagasMesAnterior() {
  seedDemoVagasForPeriod('previous');
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Mantém compatibilidade com a rotina antiga de vagas, carregando mês anterior e mês atual em sequência.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Grava `cproeis_convenios_vagas` por meio das rotinas mensais separadas.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Remover esta compatibilidade quando todas as telas chamarem apenas as ações mensais.
 */
function seedDemoVagas() {
  seedDemoVagasMesAnterior();
  seedDemoVagasMesAtual();
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Localiza um tipo de curso de convênio dentro da fixture de demonstração.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} typeId - Identificador do tipo de capacitação do convênio.
 * @returns {object} Tipo de capacitação encontrado ou objeto vazio.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não lê nem grava LocalStorage; consulta somente `DEMO_CURSOS_DATA` em memória.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, resolver tipos de curso por chave de banco com validação do convênio proprietário.
 */
function demoFindCursoConvenioTipo(typeId) {
  return (DEMO_CURSOS_DATA.convenioTipos || []).find((type) => type.id === typeId) || {};
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Monta as turmas de capacitação dos convênios com prazos calculados a partir da data atual.
 *
 * PARÂMETROS E RETORNO:
 * @param {Array<object>} convenios - Convênios carregados no demo.
 * @returns {Array<object>} Cursos prontos para gravação em `cproeis_convenios_cursos_capacitacao`.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados diretamente; lê fixtures em memória e o retorno é persistido por `seedDemoCursos`.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, separar turma, tipo, instrutor, inscrições e conclusão em entidades próprias.
 */
function demoBuildCursosConvenio(convenios) {
  return (DEMO_CURSOS_DATA.convenioCursos || []).map((course, index) => {
    const type = demoFindCursoConvenioTipo(course.tipoId);
    const convenio = convenios.find((item) => item.id === course.convenioId) || {};
    const inscricaoInicio = index === 0 ? demoAddDays(DEMO_TODAY, -2) : demoAddDays(DEMO_TODAY, index);
    const inscricaoFim = demoAddDays(DEMO_TODAY, 10 + index);
    const inicio = demoAddDays(DEMO_TODAY, 15 + (index * 3));
    const fim = demoAddDays(inicio, 1);

    return {
      id: course.id,
      convenioId: course.convenioId,
      convenioNome: convenio.nome || '',
      tipoId: course.tipoId,
      tipoNome: type.nome || '',
      origemTipo: 'Convênio',
      titulo: course.titulo || '',
      inscricaoInicio,
      inscricaoFim,
      inicio,
      fim,
      cargaHoraria: Number(course.cargaHoraria || 0),
      vagas: Number(course.vagas || 0),
      targetMode: course.targetMode || 'todos',
      targetClasses: course.targetClasses || [],
      targetPostos: course.targetPostos || [],
      targetLabel: course.targetLabel || 'Todos os policiais',
      local: course.local || '',
      status: 'Aberto',
      createdAt: new Date().toISOString()
    };
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Cria inscrições, publicações em boletim e habilitações usadas para validar requisitos das vagas demo.
 *
 * PARÂMETROS E RETORNO:
 * @returns {{inscricoes: Array<object>, boletins: Array<object>, habilitacoes: Array<object>}} Bases locais.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava diretamente; o retorno é persistido em LocalStorage por `seedDemoCursos`.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, validar conclusões por workflow oficial, evitando que o frontend declare aptidão.
 */
function demoBuildQualificacoesPoliciais() {
  const gsiTypes = DEMO_CURSOS_DATA.gsiTipos || [];
  const inscricoes = (DEMO_CURSOS_DATA.conclusoesConvenio || []).map((item, index) => ({
    id: `demo-inscricao-curso-${index + 1}`,
    courseId: item.courseId,
    policialId: item.policialId,
    status: item.status || 'Concluído',
    createdAt: demoAddDays(DEMO_TODAY, -45 + index),
    concludedAt: item.status === 'Inscrito' ? '' : demoAddDays(DEMO_TODAY, -20 + index)
  }));
  const boletins = (DEMO_CURSOS_DATA.publicacoesGsi || []).map((item, index) => {
    const type = gsiTypes.find((curso) => curso.id === item.tipoId) || {};
    return {
      id: `demo-boletim-curso-${index + 1}`,
      policialId: item.policialId,
      tipoId: item.tipoId,
      tipoNome: type.nome || item.tipoNome || '',
      bolNumero: item.bolNumero || `BOL PM ${120 + index}/2026`,
      bolData: demoAddDays(DEMO_TODAY, -30 + index),
      pagina: item.pagina || String(10 + index),
      observacoes: 'Registro validado para demonstração.',
      status: item.status || 'Validado',
      createdAt: new Date().toISOString()
    };
  });
  const habilitacoes = (DEMO_CURSOS_DATA.habilitacoes || []).map((item, index) => ({
    id: `demo-habilitacao-${index + 1}`,
    policialId: item.policialId,
    numero: item.numero || '',
    categoria: item.categoria || '',
    vencimento: demoAddDays(DEMO_TODAY, Number(item.vencimentoOffsetDias || 365)),
    origem: item.origem || 'Demo',
    status: item.status || 'Validada',
    updatedAt: new Date().toISOString()
  }));

  return { inscricoes, boletins, habilitacoes };
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Carrega tipos do GSI, tipos de capacitação dos convênios, turmas e qualificações concluídas.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Garante contratos e policiais quando necessário e grava `cproeis_gsi_tipos_curso_capacitacao`,
 * `cproeis_convenios_tipos_curso_capacitacao`, `cproeis_convenios_cursos_capacitacao`,
 * `cproeis_policiais_cursos_inscricoes`, `cproeis_policiais_cursos_boletins` e
 * `cproeis_policiais_habilitacoes` no LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, executar seeds apenas em ambiente controlado e bloquear atualização manual
 * de conclusões, boletins e habilitações pelo navegador.
 */
function seedDemoCursos() {
  let convenios = demoLoadList(DEMO_KEYS.convenios);
  if (!convenios.length) {
    seedDemoContratos();
    convenios = demoLoadList(DEMO_KEYS.convenios);
  }

  if (!demoLoadList(DEMO_KEYS.policiais).length) {
    seedDemoPoliciais();
  }

  const gsiTypes = DEMO_CURSOS_DATA.gsiTipos || [];
  const convenioTypes = DEMO_CURSOS_DATA.convenioTipos || [];
  const courses = demoBuildCursosConvenio(convenios);
  const qualificacoes = demoBuildQualificacoesPoliciais();

  demoSaveList(DEMO_KEYS.gsiTiposCurso, gsiTypes);
  demoSaveList(DEMO_KEYS.convenioTiposCurso, convenioTypes);
  demoSaveList(DEMO_KEYS.convenioCursos, courses);
  demoSaveList(DEMO_KEYS.cursoInscricoes, qualificacoes.inscricoes);
  demoSaveList(DEMO_KEYS.cursoBoletins, qualificacoes.boletins);
  demoSaveList(DEMO_KEYS.habilitacoes, qualificacoes.habilitacoes);
  demoFeedback(`Cursos demo carregados: ${gsiTypes.length} tipos GSI, ${courses.length} turmas e qualificações para policiais.`);
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Gera vagas futuras com requisitos específicos de curso GSI, curso de convênio ou habilitação de moto.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê convênios e cursos do LocalStorage, cria registros futuros e grava `cproeis_convenios_vagas`,
 * substituindo apenas vagas anteriores da mesma família demo (`vaga-demo-curso-`).
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, validar requisitos por tabela parametrizada e aplicar a mesma regra no endpoint
 * de listagem e aceite da vaga pelo policial.
 */
function seedDemoVagasComCurso() {
  let convenios = demoLoadList(DEMO_KEYS.convenios);
  if (!convenios.length || !demoLoadList(DEMO_KEYS.convenioCursos).length) {
    seedDemoCursos();
    convenios = demoLoadList(DEMO_KEYS.convenios);
  }

  const requisitos = DEMO_VAGAS_COM_CURSO_DATA.requisitos || [];
  const totalDias = Number(DEMO_VAGAS_COM_CURSO_DATA.periodoDias || 14);
  const vagas = [];

  for (let dayOffset = 0; dayOffset <= totalDias; dayOffset += 1) {
    const requisito = requisitos[demoPositiveModulo(dayOffset, requisitos.length || 1)];
    if (!requisito) continue;

    const convenio = convenios.find((item) => item.id === requisito.convenioId) || convenios[0] || {};
    const dataServico = demoAddDays(DEMO_TODAY, dayOffset);
    const valorUnitario = demoGetValorUnitario(convenio, requisito.classe, requisito.tipoServico);

    vagas.push({
      id: `vaga-demo-curso-${dataServico}-${requisito.tipo}-${requisito.id}`,
      convenioId: convenio.id,
      dataServico,
      nomeServico: requisito.nomeServico || `Serviço com requisito - ${requisito.nome}`,
      localServico: convenio.nome || 'Convênio demo',
      enderecoServico: convenio.endereco || '',
      pontoReferencia: 'Ponto de apresentação informado no demo',
      classe: requisito.classe || 'C/D',
      tipoServico: requisito.tipoServico || 'servico8',
      horaInicio: requisito.horaInicio || '08:00',
      horaFim: requisito.horaFim || '16:00',
      quantidade: Number(requisito.quantidade || 1),
      valorUnitario,
      valorTotal: valorUnitario * Number(requisito.quantidade || 1),
      preenchidas: 0,
      policialEscalado: '',
      cursoObrigatorio: requisito.nome || '',
      requisitoTipo: requisito.tipo,
      requisitoId: requisito.id,
      requisitoNome: requisito.nome,
      liberadaParaPolicial: true,
      createdAt: new Date().toISOString()
    });
  }

  const existingVagas = demoLoadList(DEMO_KEYS.vagas)
    .filter((vaga) => !String(vaga.id || '').startsWith('vaga-demo-curso-'));
  demoSaveList(DEMO_KEYS.vagas, [...existingVagas, ...vagas].sort((a, b) => (
    String(a.dataServico || '').localeCompare(String(b.dataServico || ''))
    || String(a.nomeServico || '').localeCompare(String(b.nomeServico || ''))
  )));
  demoFeedback(`Vagas futuras com curso/habilitação geradas: ${vagas.length} vagas a partir de ${DEMO_TODAY}.`);
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Limpa somente dados do sistema CPROEIS no LocalStorage do navegador.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Remove todas as chaves iniciadas por `cproeis_` do LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, remover este recurso da tela inicial e oferecer limpeza apenas para ambiente local.
 */
function clearDemoCache() {
  Object.keys(localStorage)
    .filter((key) => key.startsWith('cproeis_'))
    .forEach((key) => localStorage.removeItem(key));
  demoFeedback('Cache local do CPROEIS limpo neste navegador.');
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Liga os botões de teste da página inicial às rotinas separadas de seed e limpeza.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava diretamente; apenas conecta eventos que executam as funções de persistência
 * de contratos, policiais, vagas e limpeza de cache.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Remover bind de ferramentas de teste em builds de produção.
 */
function bindDemoTools() {
  document.getElementById('seed-demo-contratos')?.addEventListener('click', seedDemoContratos);
  document.getElementById('seed-demo-policiais')?.addEventListener('click', seedDemoPoliciais);
  document.getElementById('seed-demo-servicos')?.addEventListener('click', seedDemoServicos);
  document.getElementById('seed-demo-cursos')?.addEventListener('click', seedDemoCursos);
  document.getElementById('seed-demo-vagas-mes-atual')?.addEventListener('click', seedDemoVagasMesAtual);
  document.getElementById('seed-demo-vagas-mes-anterior')?.addEventListener('click', seedDemoVagasMesAnterior);
  document.getElementById('seed-demo-vagas-com-curso')?.addEventListener('click', seedDemoVagasComCurso);
  document.getElementById('clear-demo-cache')?.addEventListener('click', clearDemoCache);
}

bindDemoTools();
