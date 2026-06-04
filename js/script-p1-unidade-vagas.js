const P1_LISTA_VAGAS_KEYS = {
  vagas: 'cproeis_ras_vagas'
};

/**
 * DESCRIÇÃO DA FUNÇÃO: Lê vagas RAS salvas no LocalStorage para a P/1 Unidade.
 * PARÂMETROS E RETORNO: Recebe `key` (string) e retorna Array<object>.
 * ARMAZENAMENTO E PERSISTÊNCIA: Lê cproeis_ras_vagas no LocalStorage.
 * TODO: Em produção, substituir por API com filtros oficiais de unidade, período e status GSI.
 */
function p1ListaVagasReadList(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (error) {
    return [];
  }
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Escapa conteúdo dinâmico da tabela de vagas.
 * PARÂMETROS E RETORNO: Recebe `value` (qualquer valor simples) e retorna string segura.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava dados; protege apenas a renderização HTML.
 * TODO: Em produção, manter sanitização no backend e política CSP.
 */
function p1ListaVagasEscapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Formata data ISO simples para exibição brasileira.
 * PARÂMETROS E RETORNO: Recebe `value` (string yyyy-mm-dd) e retorna dd/mm/aaaa ou hífen.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não acessa armazenamento.
 * TODO: Em produção, centralizar timezone e formatação de datas em utilitário comum.
 */
function p1ListaVagasFormatDate(value) {
  if (!value) return '-';
  const [year, month, day] = value.split('-');
  return day && month && year ? `${day}/${month}/${year}` : value;
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Renderiza as vagas RAS da unidade logada, incluindo status GSI inicial.
 * PARÂMETROS E RETORNO: Não recebe parâmetros nem retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: Lê sessão P/1 e cproeis_ras_vagas no LocalStorage.
 * TODO: Em produção, carregar status atualizado do workflow GSI e permitir ações conforme perfil.
 */
function p1ListaVagasRender() {
  const context = p1UnitResolveSession();
  const body = document.getElementById('p1-vagas-body');
  const count = document.getElementById('p1-vagas-count');
  if (!body || !count) return;

  if (!context) {
    count.textContent = 'Acesso P/1 não autorizado.';
    body.innerHTML = '<tr><td class="empty-row" colspan="7">Selecione um responsável P/1 ativo para listar vagas.</td></tr>';
    return;
  }

  const vagas = p1ListaVagasReadList(P1_LISTA_VAGAS_KEYS.vagas)
    .filter((vaga) => vaga.unidade === context.acesso.unidade && (vaga.origem === 'P1_RAS' || vaga.origem === 'RAS'))
    .sort((a, b) => String(b.dataServico || '').localeCompare(String(a.dataServico || '')));

  count.textContent = `${vagas.length} vagas encontradas para a unidade.`;

  if (!vagas.length) {
    body.innerHTML = '<tr><td class="empty-row" colspan="7">Nenhuma vaga criada para a unidade.</td></tr>';
    return;
  }

  body.innerHTML = vagas.map((vaga) => `
    <tr>
      <td>${p1ListaVagasEscapeHtml(p1ListaVagasFormatDate(vaga.dataServico))}</td>
      <td><strong>${p1ListaVagasEscapeHtml(vaga.nomeServico || '-')}</strong></td>
      <td>${p1ListaVagasEscapeHtml(vaga.classe || '-')}</td>
      <td>${p1ListaVagasEscapeHtml(vaga.cargaHoraria ? `${vaga.cargaHoraria}h` : '-')}</td>
      <td>${p1ListaVagasEscapeHtml(vaga.tipoEscala || '-')}</td>
      <td>${p1ListaVagasEscapeHtml(vaga.policialCompulsorioNome || '-')}</td>
      <td>${p1ListaVagasEscapeHtml(vaga.statusLabel || vaga.status || '-')}</td>
    </tr>
  `).join('');
}

document.addEventListener('DOMContentLoaded', p1ListaVagasRender);
