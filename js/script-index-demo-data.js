const DEMO_KEYS = {
  convenios: 'cproeis_contratos_convenios',
  valores: 'cproeis_contratos_valores',
  responsaveis: 'cproeis_contratos_responsaveis',
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
  convenioAtual: 'cproeis_convenio_atual',
  convenioResponsavelAtual: 'cproeis_convenio_responsavel_atual',
  policialAtual: 'cproeis_acesso_policial_atual'
};

const DEMO_TODAY = new Date().toISOString().slice(0, 10);
const DEMO_DATA = window.CPROEIS_DADOS_SIMULADOS || { convenios: [], policiais: [] };

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
 * Cria valores de serviço por classe para um convênio de demonstração.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} convenioId - ID do convênio vinculado aos valores.
 * @param {number} offset - Índice usado para variar discretamente os valores.
 * @returns {Array<object>} Lista de valores por classe e tipo de serviço.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados diretamente; o retorno é salvo em `cproeis_contratos_valores`.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Versionar valores por vigência e por publicação oficial.
 */
function demoBuildValores(convenioId, offset) {
  return [
    { id: `${convenioId}-valor-a`, convenioId, classe: 'A', servico12: 780 + offset, servico8: 540 + offset, servico6: 420 + offset },
    { id: `${convenioId}-valor-b`, convenioId, classe: 'B', servico12: 680 + offset, servico8: 480 + offset, servico6: 360 + offset },
    { id: `${convenioId}-valor-c`, convenioId, classe: 'C', servico12: 560 + offset, servico8: 390 + offset, servico6: 300 + offset },
    { id: `${convenioId}-valor-d`, convenioId, classe: 'D', servico12: 480 + offset, servico8: 340 + offset, servico6: 260 + offset }
  ];
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Cria exatamente um responsável operacional para o convênio de demonstração.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} convenioId - ID do convênio.
 * @param {string} convenioNome - Nome usado para montar o responsável.
 * @param {number} index - Índice numérico para CPF, telefone e e-mail.
 * @returns {object} Responsável apto a acessar o módulo de convênio.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava diretamente; o retorno é salvo dentro do convênio e em `cproeis_contratos_responsaveis`.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Relacionar responsáveis a usuários autenticados e perfis oficiais.
 */
function demoBuildResponsavel(convenioId, convenioNome, index) {
  const base = convenioNome.split(' ')[0];
  const nomeResponsavel = DEMO_DATA.responsaveisConvenio?.[index - 1] || `Responsável Operacional ${index}`;
  return {
    id: `${convenioId}-resp-01`,
    convenioId,
    nome: nomeResponsavel,
    cpf: `123.45${index}.${String(600 + index).padStart(3, '0')}-${String(10 + index).slice(-2)}`,
    email: `${base.toLowerCase()}.operacional@demo.cproeis.local`,
    telefone: `(21) 99${index}10-${String(4500 + index).padStart(4, '0')}`,
    funcoes: ['Gerar vagas'],
    inicio: DEMO_TODAY,
    fim: demoAddDays(DEMO_TODAY, 420)
  };
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Monta 10 convênios vigentes de demonstração, cada um com um responsável e valores por classe.
 *
 * PARÂMETROS E RETORNO:
 * @returns {{convenios: Array<object>, responsaveis: Array<object>, valores: Array<object>}} Base sintética.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava diretamente; a função `seedDemoRegisters` persiste o retorno no LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Substituir dados fictícios por fixtures oficiais de homologação quando disponíveis.
 */
function demoBuildConvenios() {
  const names = DEMO_DATA.convenios;

  const convenios = [];
  const responsaveis = [];
  const valores = [];

  names.forEach((nome, index) => {
    const convenioId = demoId('conv-demo', index + 1);
    const responsavel = demoBuildResponsavel(convenioId, nome, index + 1);
    const convenioValores = demoBuildValores(convenioId, index * 10);
    const inicio = demoAddDays(DEMO_TODAY, -90 - index);
    const fim = demoAddDays(DEMO_TODAY, 150 + (index * 20));

    convenios.push({
      id: convenioId,
      nome,
      cnpj: `${String(12 + index).padStart(2, '0')}.${String(345 + index).padStart(3, '0')}.${String(670 + index).padStart(3, '0')}/0001-${String(10 + index).padStart(2, '0')}`,
      tipoConveniado: index % 2 === 0 ? 'Órgão Público' : 'Concessionária',
      endereco: `Rua Operacional, ${100 + index} - Rio de Janeiro/RJ - CEP 20000-00${index}`,
      enderecoDados: {
        logradouro: 'Rua Operacional',
        numero: String(100 + index),
        complemento: '',
        bairro: 'Centro',
        cidade: 'Rio de Janeiro',
        uf: 'RJ',
        cep: `20000-00${index}`
      },
      numero: `SEI-${String(123456 + index)}/789012/34${String(50 + index)}`,
      diarioData: inicio,
      diarioPagina: `Página ${12 + index}`,
      valorContrato: 1800000 + (index * 220000),
      inicio,
      fim,
      classeA: 0,
      classeB: 0,
      classeC: 0,
      classeD: 0,
      valores: convenioValores,
      responsaveis: [responsavel]
    });

    responsaveis.push(responsavel);
    valores.push(...convenioValores);
  });

  return { convenios, responsaveis, valores };
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Monta 20 policiais de demonstração com postos variados, incluindo oficiais e praças.
 *
 * PARÂMETROS E RETORNO:
 * @returns {Array<object>} Lista de policiais pronta para persistência.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava diretamente; `seedDemoRegisters` salva o retorno em `cproeis_cadastro_policiais`.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Remover dados sintéticos fora de ambiente de teste.
 */
function demoBuildPoliciais() {
  const rows = DEMO_DATA.policiais;

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
 * Não grava diretamente; os arrays retornados são salvos por `seedDemoRegisters`.
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
 * Carrega contratos, responsáveis, valores e policiais de teste no armazenamento local.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Grava várias chaves `cproeis_*` no LocalStorage para popular as telas do sistema.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Remover este recurso do ambiente de produção ou protegê-lo por perfil técnico.
 */
function seedDemoRegisters() {
  const { convenios, responsaveis, valores } = demoBuildConvenios();
  const policiais = demoBuildPoliciais();
  const historicos = demoBuildHistoricos(policiais);

  localStorage.setItem(DEMO_KEYS.contratosSchema, '2026-05-15-endereco-separado');
  demoSaveList(DEMO_KEYS.convenios, convenios);
  demoSaveList(DEMO_KEYS.responsaveis, responsaveis);
  demoSaveList(DEMO_KEYS.valores, valores);
  demoSaveList(DEMO_KEYS.contratosHistoricos, []);
  localStorage.setItem(DEMO_KEYS.policialReset, '2026-05-15-input-ajustes');
  demoSaveList(DEMO_KEYS.policiais, policiais);
  demoSaveList(DEMO_KEYS.sanitario, historicos.sanitario);
  demoSaveList(DEMO_KEYS.funcional, historicos.funcional);
  demoSaveList(DEMO_KEYS.comportamento, historicos.comportamento);
  demoSaveList(DEMO_KEYS.unidade, historicos.unidade);
  demoSaveList(DEMO_KEYS.status, historicos.status);
  demoFeedback('Cadastros carregados: 10 convênios, 10 responsáveis e 20 policiais.');
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
 * Gera as vagas de um convênio para um dia, respeitando a regra de no máximo uma vaga de oficial por dia
 * e a norma operacional de criação apenas nas classes A, B e C/D.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} convenio - Convênio de teste.
 * @param {number} convenioIndex - Índice do convênio.
 * @param {number} dayOffset - Dia relativo a partir de hoje.
 * @returns {Array<object>} Vagas geradas para o dia.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava diretamente; a lista retornada é salva por `seedDemoVagas`.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Quando a FOPAG for evoluída, separar pagamento de C/D por graduação usando valores C e D do contrato.
 */
function demoBuildVagasForDay(convenio, convenioIndex, dayOffset) {
  if (!demoShouldCreateVaga(convenioIndex, dayOffset)) return [];

  const dataServico = demoAddDays(DEMO_TODAY, dayOffset);
  const localBase = convenio.nome || 'Convênio';
  const daily = [];
  const officialClasses = ['A', 'B'];
  const officialClass = officialClasses[(convenioIndex + dayOffset) % officialClasses.length];
  const addOfficial = dayOffset % (3 + (convenioIndex % 3)) === 0;
  const tipoOficial = dayOffset % 2 === 0 ? 'servico12' : 'servico8';
  const tipoPraca = dayOffset % 3 === 0 ? 'servico12' : (dayOffset % 3 === 1 ? 'servico8' : 'servico6');
  const turnos = {
    servico12: ['08:00', '20:00'],
    servico8: ['08:00', '16:00'],
    servico6: ['14:00', '20:00']
  };

  if (addOfficial) {
    const [horaInicio, horaFim] = turnos[tipoOficial];
    daily.push({
      classe: officialClass,
      tipoServico: tipoOficial,
      quantidade: 1,
      nomeServico: `Supervisão ${localBase}`,
      horaInicio,
      horaFim
    });
  }

  const [horaInicio, horaFim] = turnos[tipoPraca];
  daily.push({
    classe: 'C/D',
    tipoServico: tipoPraca,
    quantidade: 1 + ((convenioIndex + dayOffset) % 4),
    nomeServico: `Policiamento ${localBase}`,
    horaInicio,
    horaFim
  });

  if ((convenioIndex + dayOffset) % 6 === 0) {
    daily.push({
      classe: 'C/D',
      tipoServico: 'servico6',
      quantidade: 1 + (dayOffset % 2),
      nomeServico: `Apoio ${localBase}`,
      horaInicio: '18:00',
      horaFim: '00:00'
    });
  }

  return daily.map((item, index) => {
    const valorUnitario = demoGetValorUnitario(convenio, item.classe, item.tipoServico);
    return {
      id: `vaga-demo-${convenio.id}-${dataServico}-${index + 1}`,
      convenioId: convenio.id,
      dataServico,
      nomeServico: item.nomeServico,
      localServico: localBase,
      enderecoServico: convenio.endereco,
      pontoReferencia: 'Portaria principal',
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
 * Gera vagas simuladas por até três meses a partir da data atual.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê convênios de `cproeis_contratos_convenios` e grava vagas em `cproeis_convenios_vagas`.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, bloquear geração automática fora de ambiente de homologação e registrar usuário executor.
 */
function seedDemoVagas() {
  let convenios = demoLoadList(DEMO_KEYS.convenios);
  if (!convenios.length) {
    seedDemoRegisters();
    convenios = demoLoadList(DEMO_KEYS.convenios);
  }

  const vagas = [];
  convenios.forEach((convenio, convenioIndex) => {
    for (let dayOffset = 0; dayOffset <= 90; dayOffset += 1) {
      vagas.push(...demoBuildVagasForDay(convenio, convenioIndex, dayOffset));
    }
  });

  demoSaveList(DEMO_KEYS.vagas, vagas);
  demoFeedback(`Vagas simuladas geradas: ${vagas.length} vagas entre hoje e os próximos 90 dias.`);
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
 * Liga os botões de teste da página inicial às rotinas de seed e limpeza.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava diretamente; apenas conecta eventos que executam as funções de persistência.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Remover bind de ferramentas de teste em builds de produção.
 */
function bindDemoTools() {
  document.getElementById('seed-demo-registers')?.addEventListener('click', seedDemoRegisters);
  document.getElementById('seed-demo-vagas')?.addEventListener('click', seedDemoVagas);
  document.getElementById('clear-demo-cache')?.addEventListener('click', clearDemoCache);
}

bindDemoTools();
