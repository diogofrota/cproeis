const FOPAG_STORAGE_VAGAS = 'cproeis_convenios_vagas';
const FOPAG_STORAGE_CONVENIOS = 'cproeis_contratos_convenios';

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Lê listas JSON do LocalStorage com retorno seguro para a FOPAG.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} key - Chave consultada no LocalStorage.
 * @returns {Array<object>} Lista encontrada ou array vazio.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê LocalStorage e não grava dados.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Substituir por API de relatório com filtros processados no servidor.
 */
function fopagLoadList(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (error) {
    return [];
  }
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Formata data ISO para exibição brasileira.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} value - Data em YYYY-MM-DD ou ISO completo.
 * @returns {string} Data DD/MM/YYYY ou hífen.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa armazenamento.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Centralizar formatação de data em utilitário compartilhado do sistema.
 */
function fopagFormatDate(value) {
  if (!value) return '-';
  const [year, month, day] = String(value).slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Escapa dados exibidos em HTML dinâmico do relatório.
 *
 * PARÂMETROS E RETORNO:
 * @param {unknown} value - Valor a ser exibido.
 * @returns {string} Texto seguro para HTML.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não lê nem grava dados.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Manter sanitização também no backend quando houver emissão oficial.
 */
function fopagEscape(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Normaliza textos de filtros para comparação simples por coluna.
 *
 * PARÂMETROS E RETORNO:
 * @param {unknown} value - Valor digitado no filtro ou vindo do registro.
 * @returns {string} Texto minúsculo, sem espaços extras e sem acentos.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não lê nem grava dados; trabalha somente com o valor recebido.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, aplicar filtros no backend com normalização equivalente no banco de dados.
 */
function fopagNormalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Monta registros de presença confirmada a partir das vagas escaladas.
 *
 * PARÂMETROS E RETORNO:
 * @returns {Array<object>} Registros prontos para tabela e exportação.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê `cproeis_convenios_vagas` e `cproeis_contratos_convenios` do LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Gerar relatório a partir de tabela oficial de frequência, evitando varrer vagas no navegador.
 */
function fopagGetPresencas() {
  const convenioMap = new Map(fopagLoadList(FOPAG_STORAGE_CONVENIOS).map((convenio) => [convenio.id, convenio]));
  const registros = [];

  fopagLoadList(FOPAG_STORAGE_VAGAS).forEach((vaga) => {
    const convenio = convenioMap.get(vaga.convenioId) || {};
    (Array.isArray(vaga.escalados) ? vaga.escalados : []).forEach((escala) => {
      if (!escala.presencaConfirmadaAt) return;
      registros.push({
        data: vaga.dataServico || '',
        policial: escala.nome || '-',
        idFuncional: escala.idFuncional || '-',
        postoGraduacao: escala.postoGraduacao || '-',
        unidade: escala.unidade || '-',
        convenio: convenio.nome || convenio.numero || '-',
        servico: vaga.nomeServico || '-',
        horario: `${vaga.horaInicio || '-'} até ${vaga.horaFim || '-'}`,
        presenca: escala.presencaConfirmadaAt
      });
    });
  });

  return registros.sort((a, b) => (
    String(a.data).localeCompare(String(b.data)) ||
    String(a.policial).localeCompare(String(b.policial))
  ));
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Aplica filtros de texto e período sobre os registros da FOPAG.
 *
 * PARÂMETROS E RETORNO:
 * @param {Array<object>} registros - Registros de presença confirmada.
 * @returns {Array<object>} Registros filtrados.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; lê valores dos filtros no DOM e processa em memória.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Processar filtros no backend para relatórios grandes.
 */
function fopagApplyFilters(registros) {
  const filters = {
    start: document.getElementById('fopag-filter-start')?.value || '',
    end: document.getElementById('fopag-filter-end')?.value || '',
    policial: fopagNormalize(document.getElementById('fopag-filter-policial')?.value),
    idFuncional: fopagNormalize(document.getElementById('fopag-filter-id')?.value),
    postoGraduacao: fopagNormalize(document.getElementById('fopag-filter-posto')?.value),
    unidade: fopagNormalize(document.getElementById('fopag-filter-unidade')?.value),
    convenio: fopagNormalize(document.getElementById('fopag-filter-convenio')?.value),
    servico: fopagNormalize(document.getElementById('fopag-filter-servico')?.value),
    horario: fopagNormalize(document.getElementById('fopag-filter-horario')?.value),
    presenca: document.getElementById('fopag-filter-presenca')?.value || ''
  };

  return registros.filter((registro) => {
    if (filters.start && registro.data < filters.start) return false;
    if (filters.end && registro.data > filters.end) return false;
    if (filters.presenca && String(registro.presenca || '').slice(0, 10) !== filters.presenca) return false;
    if (filters.policial && !fopagNormalize(registro.policial).includes(filters.policial)) return false;
    if (filters.idFuncional && !fopagNormalize(registro.idFuncional).includes(filters.idFuncional)) return false;
    if (filters.postoGraduacao && !fopagNormalize(registro.postoGraduacao).includes(filters.postoGraduacao)) return false;
    if (filters.unidade && !fopagNormalize(registro.unidade).includes(filters.unidade)) return false;
    if (filters.convenio && !fopagNormalize(registro.convenio).includes(filters.convenio)) return false;
    if (filters.servico && !fopagNormalize(registro.servico).includes(filters.servico)) return false;
    if (filters.horario && !fopagNormalize(registro.horario).includes(filters.horario)) return false;
    return true;
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Renderiza a tabela de presenças confirmadas para emissão da FOPAG.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê dados por `fopagGetPresencas`; não grava alterações.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Adicionar totais financeiros quando a regra de pagamento estiver consolidada.
 */
function fopagRender() {
  const body = document.getElementById('fopag-body');
  if (!body) return;

  const registros = fopagApplyFilters(fopagGetPresencas());
  const count = document.getElementById('fopag-count');
  if (count) {
    count.textContent = registros.length
      ? `${registros.length} presença(s) confirmada(s) disponível(is) para relatório.`
      : 'Nenhuma presença confirmada disponível para a FOPAG.';
  }

  if (!registros.length) {
    body.innerHTML = '<tr><td class="empty" colspan="9">Nenhum registro encontrado.</td></tr>';
    return;
  }

  body.innerHTML = registros.map((registro) => `
    <tr>
      <td>${fopagEscape(fopagFormatDate(registro.data))}</td>
      <td>${fopagEscape(registro.policial)}</td>
      <td>${fopagEscape(registro.idFuncional)}</td>
      <td>${fopagEscape(registro.postoGraduacao)}</td>
      <td>${fopagEscape(registro.unidade)}</td>
      <td>${fopagEscape(registro.convenio)}</td>
      <td>${fopagEscape(registro.servico)}</td>
      <td>${fopagEscape(registro.horario)}</td>
      <td><span class="badge">${fopagEscape(fopagFormatDate(registro.presenca))}</span></td>
    </tr>
  `).join('');
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Exporta as presenças filtradas em CSV para uso externo pela FOPAG.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê os registros filtrados em memória e cria um arquivo local via Blob; não grava LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Substituir download local por relatório oficial gerado no servidor com hash/auditoria.
 */
function fopagExportCsv() {
  const registros = fopagApplyFilters(fopagGetPresencas());
  const headers = ['Data', 'Policial', 'ID Funcional', 'Posto/Graduacao', 'Unidade', 'Convenio', 'Servico', 'Horario', 'Presenca'];
  const rows = registros.map((registro) => [
    fopagFormatDate(registro.data),
    registro.policial,
    registro.idFuncional,
    registro.postoGraduacao,
    registro.unidade,
    registro.convenio,
    registro.servico,
    registro.horario,
    fopagFormatDate(registro.presenca)
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell || '').replaceAll('"', '""')}"`).join(';'))
    .join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `fopag-presencas-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Inicializa filtros e ações de emissão da FOPAG.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; conecta eventos que leem presenças do LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Adicionar controle de competência e assinatura digital no relatório final.
 */
function inicializarFopagRelatorioPresenca() {
  fopagRender();
  [
    'fopag-filter-start',
    'fopag-filter-end',
    'fopag-filter-policial',
    'fopag-filter-id',
    'fopag-filter-posto',
    'fopag-filter-unidade',
    'fopag-filter-convenio',
    'fopag-filter-servico',
    'fopag-filter-horario',
    'fopag-filter-presenca'
  ].forEach((id) => {
    document.getElementById(id)?.addEventListener('input', fopagRender);
  });
  document.getElementById('clear-fopag-filters')?.addEventListener('click', () => {
    document.querySelectorAll('.fopag-filter-grid input').forEach((input) => {
      input.value = '';
    });
    fopagRender();
  });
  document.getElementById('export-fopag-csv')?.addEventListener('click', fopagExportCsv);
  document.getElementById('print-fopag-report')?.addEventListener('click', () => window.print());
}

/*
  DESCRIÇÃO DA FUNÇÃO: Inicializa o menu hamburger padronizado desta página, conectando
  o botão do cabeçalho ao bloco de navegação em linha.
  PARÂMETROS E RETORNO: Não recebe parâmetros e não retorna valores; atua sobre elementos
  DOM marcados com .module-header, .menu-toggle e .module-menu.
  ARMAZENAMENTO E PERSISTÊNCIA: Lê e grava apenas atributos/classes temporários no DOM
  (aria-expanded, aria-hidden e is-open); não utiliza LocalStorage, arrays persistentes ou APIs.
  TODO: Em produção, centralizar este comportamento em componente compartilhado e sincronizar
  o item ativo com o roteamento autenticado.
*/
function inicializarMenuHamburgerFopag() {
  const moduleHeader = document.querySelector('.module-header');
  const menuToggle = document.querySelector('.menu-toggle');
  const moduleMenu = document.querySelector('.module-menu');

  if (!moduleHeader || !menuToggle || !moduleMenu) {
    return;
  }

  function definirEstadoMenu(shouldOpen) {
    menuToggle.setAttribute('aria-expanded', String(shouldOpen));
    menuToggle.setAttribute('aria-label', shouldOpen ? 'Fechar menu de FOPAG' : 'Abrir menu de FOPAG');
    moduleMenu.setAttribute('aria-hidden', String(!shouldOpen));
    moduleHeader.classList.toggle('is-open', shouldOpen);
  }

  menuToggle.addEventListener('click', () => {
    definirEstadoMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
  });

  moduleMenu.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      definirEstadoMenu(false);
    }
  });

  document.addEventListener('click', (event) => {
    if (!moduleHeader.contains(event.target)) {
      definirEstadoMenu(false);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      definirEstadoMenu(false);
      menuToggle.focus();
    }
  });
}

inicializarMenuHamburgerFopag();
inicializarFopagRelatorioPresenca();
