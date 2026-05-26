const CONTRACT_RENEWAL_STORAGE_REQUESTS = 'cproeis_contratos_renovacoes';
const CONTRACT_RENEWAL_STORAGE_CONVENIOS = 'cproeis_contratos_convenios';
const CONTRACT_RENEWAL_STORAGE_VALORES = 'cproeis_contratos_valores';
const CONTRACT_RENEWAL_STORAGE_RESPONSAVEIS = 'cproeis_contratos_responsaveis';
const CONTRACT_RENEWAL_STORAGE_HISTORICOS = 'cproeis_contratos_historicos';

const contractRenewalStatusLabels = {
  rascunho: 'Rascunho',
  'nao-enviado': 'Não enviado',
  enviado: 'Enviado',
  enviada: 'Enviada',
  'em-analise': 'Em análise',
  'pendente-convenio': 'Pendente do convênio',
  aprovada: 'Aprovada',
  reprovada: 'Reprovada',
  renovada: 'Renovada'
};

let selectedRenewalId = '';

const renewalsBody = document.getElementById('renewals-body');
const renewalCount = document.getElementById('renewal-count');
const analysisPanel = document.getElementById('analysis-panel');
const analysisTitle = document.getElementById('analysis-title');
const analysisSubtitle = document.getElementById('analysis-subtitle');
const analysisStatus = document.getElementById('analysis-status');
const analysisDocuments = document.getElementById('analysis-documents');
const contractsComment = document.getElementById('contracts-comment');
const newContractNumber = document.getElementById('new-contract-number');
const newContractStart = document.getElementById('new-contract-start');
const newContractEnd = document.getElementById('new-contract-end');
const newContractValue = document.getElementById('new-contract-value');
const newContractDiarioData = document.getElementById('new-contract-diario-data');
const newContractDiarioPagina = document.getElementById('new-contract-diario-pagina');
const saveAnalysisButton = document.getElementById('save-analysis');
const approveDocumentsButton = document.getElementById('approve-documents');
const finishRenewalButton = document.getElementById('finish-renewal');

/*
  DESCRIÇÃO DA FUNÇÃO: Lê listas JSON do LocalStorage com fallback seguro para array vazio,
  mantendo a tela de análise funcional mesmo sem dados cadastrados.
  PARÂMETROS E RETORNO: Recebe key (string) e retorna Array<object>.
  ARMAZENAMENTO E PERSISTÊNCIA: Lê LocalStorage; não grava dados.
  TODO: Em produção, substituir por consultas paginadas à API da seção de contratos.
*/
function renewalContractsReadList(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (error) {
    return [];
  }
}

/*
  DESCRIÇÃO DA FUNÇÃO: Persiste listas usadas pela análise de renovação no armazenamento local.
  PARÂMETROS E RETORNO: Recebe key (string) e list (Array<object>); não retorna valores.
  ARMAZENAMENTO E PERSISTÊNCIA: Grava LocalStorage na chave informada.
  TODO: Em produção, migrar esta gravação para endpoints transacionais com controle de auditoria.
*/
function renewalContractsSaveList(key, list) {
  localStorage.setItem(key, JSON.stringify(list));
}

/*
  DESCRIÇÃO DA FUNÇÃO: Gera identificador local para novos contratos, comentários e históricos
  criados durante a finalização da renovação.
  PARÂMETROS E RETORNO: Não recebe parâmetros e retorna string pseudoúnica.
  ARMAZENAMENTO E PERSISTÊNCIA: Não acessa armazenamento; o chamador persiste o valor gerado.
  TODO: Em produção, delegar geração de IDs ao banco de dados.
*/
function renewalContractsMakeId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/*
  DESCRIÇÃO DA FUNÇÃO: Escapa texto dinâmico antes da inclusão em HTML renderizado por template string.
  PARÂMETROS E RETORNO: Recebe value (qualquer tipo) e retorna string segura para HTML.
  ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava dados.
  TODO: Em produção, combinar sanitização no cliente com validação obrigatória no backend.
*/
function renewalContractsEscape(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/*
  DESCRIÇÃO DA FUNÇÃO: Formata data ISO para leitura na tabela de renovações.
  PARÂMETROS E RETORNO: Recebe value (string ou Date serializado) e retorna data/hora local ou hífen.
  ARMAZENAMENTO E PERSISTÊNCIA: Não acessa LocalStorage.
  TODO: Em produção, padronizar fuso horário oficial nos registros de auditoria.
*/
function renewalContractsFormatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('pt-BR');
}

/*
  DESCRIÇÃO DA FUNÇÃO: Formata data ISO simples em DD/MM/YYYY para vigências contratuais.
  PARÂMETROS E RETORNO: Recebe value (string YYYY-MM-DD) e retorna string formatada ou hífen.
  ARMAZENAMENTO E PERSISTÊNCIA: Não acessa armazenamento.
  TODO: Em produção, centralizar regras de data em utilitário comum.
*/
function renewalContractsFormatDate(value) {
  if (!value) return '-';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

/*
  DESCRIÇÃO DA FUNÇÃO: Converte data ISO em Date local para cálculo da janela de renovação.
  PARÂMETROS E RETORNO: Recebe value (string YYYY-MM-DD) e retorna Date.
  ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava dados.
  TODO: Em produção, usar data oficial do servidor para evitar divergência entre estações.
*/
function renewalContractsCreateLocalDate(value) {
  if (!value) return new Date(NaN);
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/*
  DESCRIÇÃO DA FUNÇÃO: Calcula dias restantes até o fim da vigência do contrato.
  PARÂMETROS E RETORNO: Recebe convenio (object|null) e retorna number ou NaN.
  ARMAZENAMENTO E PERSISTÊNCIA: Não acessa LocalStorage; usa o convênio recebido.
  TODO: Em produção, centralizar o cálculo de vencimento em serviço de domínio.
*/
function renewalContractsDaysUntilExpiration(convenio) {
  const endDate = renewalContractsCreateLocalDate(convenio?.fim || '');
  const todayDate = renewalContractsCreateLocalDate(new Date().toISOString().slice(0, 10));
  if (Number.isNaN(endDate.getTime()) || Number.isNaN(todayDate.getTime())) return NaN;
  return Math.ceil((endDate - todayDate) / 86400000);
}

/*
  DESCRIÇÃO DA FUNÇÃO: Confere se um contrato está dentro da janela que permite rascunho de renovação.
  PARÂMETROS E RETORNO: Recebe convenio (object|null) e retorna boolean.
  ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; avalia a data `fim` do objeto recebido.
  TODO: Em produção, manter o limite de 120 dias em configuração administrativa.
*/
function isContractRenewalWindowOpen(convenio) {
  const daysUntilExpiration = renewalContractsDaysUntilExpiration(convenio);
  return Number.isFinite(daysUntilExpiration) && daysUntilExpiration <= 120;
}

/*
  DESCRIÇÃO DA FUNÇÃO: Calcula o dia anterior a uma data de início para encerrar o contrato antigo
  sem sobreposição de vigência.
  PARÂMETROS E RETORNO: Recebe value (string YYYY-MM-DD) e retorna string YYYY-MM-DD.
  ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava dados.
  TODO: Em produção, validar calendários e regras legais de vigência no backend.
*/
function previousDate(value) {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
}

/*
  DESCRIÇÃO DA FUNÇÃO: Localiza a solicitação atualmente selecionada e seu contrato de origem.
  PARÂMETROS E RETORNO: Não recebe parâmetros; retorna objeto com request e convenio.
  ARMAZENAMENTO E PERSISTÊNCIA: Lê `cproeis_contratos_renovacoes` e `cproeis_contratos_convenios`.
  TODO: Em produção, buscar a solicitação por rota/ID e retornar erro quando o contrato não existir.
*/
function getSelectedRenewalContext() {
  const request = renewalContractsReadList(CONTRACT_RENEWAL_STORAGE_REQUESTS).find((item) => item.id === selectedRenewalId) || null;
  const convenio = request
    ? renewalContractsReadList(CONTRACT_RENEWAL_STORAGE_CONVENIOS).find((item) => item.id === request.convenioId) || null
    : null;
  return { request, convenio };
}

/*
  DESCRIÇÃO DA FUNÇÃO: Salva a solicitação de renovação atualizada na lista persistida.
  PARÂMETROS E RETORNO: Recebe request (object) e não retorna valores.
  ARMAZENAMENTO E PERSISTÊNCIA: Lê e grava `cproeis_contratos_renovacoes`.
  TODO: Em produção, usar endpoint com versionamento para evitar perda de análise simultânea.
*/
function persistContractRenewal(request) {
  request.updatedAt = new Date().toISOString();
  const requests = renewalContractsReadList(CONTRACT_RENEWAL_STORAGE_REQUESTS);
  renewalContractsSaveList(CONTRACT_RENEWAL_STORAGE_REQUESTS, requests.map((item) => item.id === request.id ? request : item));
}

/*
  DESCRIÇÃO DA FUNÇÃO: Renderiza a tabela de solicitações de renovação disponíveis para análise.
  PARÂMETROS E RETORNO: Não recebe parâmetros nem retorna valores.
  ARMAZENAMENTO E PERSISTÊNCIA: Lê `cproeis_contratos_renovacoes` no LocalStorage.
  TODO: Em produção, adicionar filtros por status, convênio, vencimento e responsável.
*/
function renderRenewalTable() {
  const convenios = renewalContractsReadList(CONTRACT_RENEWAL_STORAGE_CONVENIOS);
  const requests = renewalContractsReadList(CONTRACT_RENEWAL_STORAGE_REQUESTS)
    .filter((request) => {
      const convenio = convenios.find((item) => item.id === request.convenioId) || null;
      const hasSentDocument = (request.documentos || []).some((documento) => {
        return ['enviado', 'aprovado', 'reprovado'].includes(documento.status);
      });
      return hasSentDocument && isContractRenewalWindowOpen(convenio);
    })
    .sort((a, b) => String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt)));

  renewalCount.textContent = requests.length
    ? `${requests.length} solicitação(ões) registrada(s).`
    : 'Nenhuma solicitação cadastrada.';

  if (!requests.length) {
    renewalsBody.innerHTML = '<tr><td class="empty" colspan="5">Nenhuma renovação foi enviada pelos convênios.</td></tr>';
    return;
  }

  renewalsBody.innerHTML = requests.map((request) => `
    <tr>
      <td><strong>${renewalContractsEscape(request.convenioNome || '-')}</strong></td>
      <td>${renewalContractsEscape(request.contratoNumero || '-')}</td>
      <td><span class="renewal-status status-${renewalContractsEscape(request.status)}">${renewalContractsEscape(contractRenewalStatusLabels[request.status] || request.status)}</span></td>
      <td>${renewalContractsEscape(renewalContractsFormatDateTime(request.updatedAt || request.createdAt))}</td>
      <td class="actions"><button type="button" data-select-renewal="${renewalContractsEscape(request.id)}">Analisar</button></td>
    </tr>
  `).join('');
}

/*
  DESCRIÇÃO DA FUNÇÃO: Preenche valores sugeridos do novo contrato a partir do contrato anterior.
  PARÂMETROS E RETORNO: Recebe convenio (object|null) e não retorna valores.
  ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; escreve somente campos do formulário no DOM.
  TODO: Em produção, calcular nova vigência e valores com regras oficiais parametrizadas.
*/
function fillNewContractDefaults(convenio) {
  if (!convenio) return;
  newContractNumber.value = '';
  newContractStart.value = convenio.fim || '';
  newContractEnd.value = '';
  newContractValue.value = Number(convenio.valorContrato ?? convenio.valorMensal ?? 0).toFixed(2);
  newContractDiarioData.value = '';
  newContractDiarioPagina.value = '';
}

/*
  DESCRIÇÃO DA FUNÇÃO: Renderiza a área de análise com documentos, status e comentários da solicitação.
  PARÂMETROS E RETORNO: Recebe request (object) e convenio (object|null); não retorna valores.
  ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; renderiza dados já carregados do LocalStorage.
  TODO: Em produção, exibir visualização/download seguro do arquivo enviado pelo convenente.
*/
function renderAnalysis(request, convenio) {
  analysisPanel.hidden = false;
  analysisTitle.textContent = `Análise - ${request.convenioNome || 'Convênio'}`;
  analysisSubtitle.textContent = `Contrato atual ${request.contratoNumero || '-'} | Vigência ${renewalContractsFormatDate(convenio?.inicio)} até ${renewalContractsFormatDate(convenio?.fim)}`;
  analysisStatus.textContent = contractRenewalStatusLabels[request.status] || request.status;
  analysisStatus.className = `renewal-status status-${request.status}`;
  if (contractsComment) contractsComment.value = '';

  analysisDocuments.innerHTML = request.documentos.map((documento) => `
    <article class="renewal-document">
      <div class="renewal-document-header">
        <div>
          <h3>${renewalContractsEscape(documento.title)}</h3>
          <p>${renewalContractsEscape(documento.description)}</p>
        </div>
        <span class="document-status status-${renewalContractsEscape(documento.status)}">${renewalContractsEscape(contractRenewalStatusLabels[documento.status] || documento.status || 'Pendente')}</span>
      </div>
      <div class="document-meta">
        <span><strong>Arquivo:</strong> ${renewalContractsEscape(documento.fileName || 'Não enviado')}</span>
        <span><strong>Visualização:</strong> ${documento.fileData ? `<a href="${renewalContractsEscape(documento.fileData)}" target="_blank" rel="noopener">Abrir documento</a>` : 'Arquivo grande ou conteúdo não armazenado localmente'}</span>
        <span><strong>Enviado em:</strong> ${documento.uploadedAt ? renewalContractsEscape(renewalContractsFormatDateTime(documento.uploadedAt)) : '-'}</span>
      </div>
      <div class="analysis-controls">
        <label>
          Status do documento
          <select data-document-status="${renewalContractsEscape(documento.id)}" ${documento.fileName ? '' : 'disabled'}>
            <option value="nao-enviado" ${documento.status === 'nao-enviado' ? 'selected' : ''}>Não enviado</option>
            <option value="pendente" ${documento.status === 'pendente' ? 'selected' : ''}>Pendente</option>
            <option value="enviado" ${documento.status === 'enviado' ? 'selected' : ''}>Enviado</option>
            <option value="aprovado" ${documento.status === 'aprovado' ? 'selected' : ''}>Aprovado</option>
            <option value="reprovado" ${documento.status === 'reprovado' ? 'selected' : ''}>Reprovado</option>
          </select>
        </label>
        <label>
          Comentário da seção
          <textarea data-document-note="${renewalContractsEscape(documento.id)}" ${documento.fileName ? '' : 'disabled'}>${renewalContractsEscape(documento.comentarioContratos || '')}</textarea>
        </label>
      </div>
    </article>
  `).join('');

  fillNewContractDefaults(convenio);
}

/*
  DESCRIÇÃO DA FUNÇÃO: Coleta status e comentários de cada documento analisado pela seção de contratos.
  PARÂMETROS E RETORNO: Recebe request (object) e não retorna valores; altera o próprio objeto.
  ARMAZENAMENTO E PERSISTÊNCIA: Lê selects/textareas do DOM; a persistência ocorre em persistContractRenewal.
  TODO: Em produção, registrar o analista responsável por cada decisão documental.
*/
function collectAnalysisInputs(request) {
  request.documentos = request.documentos.map((documento) => ({
    ...documento,
    status: document.querySelector(`[data-document-status="${documento.id}"]`)?.value || documento.status,
    comentarioContratos: document.querySelector(`[data-document-note="${documento.id}"]`)?.value.trim() || ''
  }));
}

/*
  DESCRIÇÃO DA FUNÇÃO: Salva a análise documental sem alterar obrigatoriamente o status final
  da renovação.
  PARÂMETROS E RETORNO: Recebe nextStatus (string opcional) e não retorna valores.
  ARMAZENAMENTO E PERSISTÊNCIA: Atualiza `cproeis_contratos_renovacoes` no LocalStorage.
  TODO: Em produção, criar histórico imutável de cada mudança de status.
*/
function saveCurrentAnalysis(nextStatus = '') {
  const { request, convenio } = getSelectedRenewalContext();
  if (!request) return;

  collectAnalysisInputs(request);
  if (nextStatus) request.status = nextStatus;
  else if (request.status === 'enviada') request.status = 'em-analise';

  persistContractRenewal(request);
  renderRenewalTable();
  renderAnalysis(request, convenio);
}

/*
  DESCRIÇÃO DA FUNÇÃO: Valida se todos os documentos exigidos foram aprovados pela seção de contratos.
  PARÂMETROS E RETORNO: Recebe request (object) e retorna boolean.
  ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; avalia somente o objeto recebido.
  TODO: Em produção, permitir matriz de documentos obrigatórios configurável por tipo de conveniado.
*/
function areAllDocumentsApproved(request) {
  return request.documentos.every((documento) => documento.fileName && documento.status === 'aprovado');
}

/*
  DESCRIÇÃO DA FUNÇÃO: Copia valores e responsáveis do contrato original para o novo contrato
  gerado na renovação, preservando vínculo por novo ID.
  PARÂMETROS E RETORNO: Recebe oldConvenioId (string) e newConvenioId (string); retorna objeto
  com arrays valores e responsaveis copiados.
  ARMAZENAMENTO E PERSISTÊNCIA: Lê `cproeis_contratos_valores` e `cproeis_contratos_responsaveis`;
  quem chama grava as listas atualizadas.
  TODO: Em produção, revisar se valores/responsáveis devem ser copiados automaticamente ou passar por homologação.
*/
function cloneRelatedContractData(oldConvenioId, newConvenioId) {
  const valores = renewalContractsReadList(CONTRACT_RENEWAL_STORAGE_VALORES)
    .filter((item) => item.convenioId === oldConvenioId)
    .map((item) => ({ ...item, id: renewalContractsMakeId('valor'), convenioId: newConvenioId }));

  const responsaveis = renewalContractsReadList(CONTRACT_RENEWAL_STORAGE_RESPONSAVEIS)
    .filter((item) => item.convenioId === oldConvenioId)
    .map((item) => ({ ...item, id: renewalContractsMakeId('resp'), convenioId: newConvenioId }));

  return { valores, responsaveis };
}

/*
  DESCRIÇÃO DA FUNÇÃO: Finaliza uma renovação aprovada criando novo contrato, encerrando a vigência
  do contrato anterior e registrando o evento no histórico local.
  PARÂMETROS E RETORNO: Não recebe parâmetros nem retorna valores.
  ARMAZENAMENTO E PERSISTÊNCIA: Lê e grava `cproeis_contratos_convenios`,
  `cproeis_contratos_valores`, `cproeis_contratos_responsaveis`,
  `cproeis_contratos_historicos` e `cproeis_contratos_renovacoes`.
  TODO: Em produção, executar esta operação em transação no backend para garantir atomicidade.
*/
function finishCurrentRenewal() {
  const { request, convenio } = getSelectedRenewalContext();
  if (!request || !convenio) return;

  collectAnalysisInputs(request);

  if (!areAllDocumentsApproved(request)) {
    alert('A renovação só pode ser finalizada com todos os documentos aprovados.');
    return;
  }

  if (!newContractNumber.value.trim() || !newContractStart.value || !newContractEnd.value) {
    alert('Informe número, início e fim da nova vigência.');
    return;
  }

  const newConvenioId = renewalContractsMakeId('conv');
  const related = cloneRelatedContractData(convenio.id, newConvenioId);
  const oldContractClosed = { ...convenio, fim: previousDate(newContractStart.value) };
  const newContract = {
    ...convenio,
    id: newConvenioId,
    numero: newContractNumber.value.trim(),
    valorContrato: Number(newContractValue.value || convenio.valorContrato || convenio.valorMensal || 0),
    inicio: newContractStart.value,
    fim: newContractEnd.value,
    diarioData: newContractDiarioData.value,
    diarioPagina: newContractDiarioPagina.value.trim(),
    valores: related.valores,
    responsaveis: related.responsaveis,
    renovadoDe: convenio.id
  };

  const convenios = renewalContractsReadList(CONTRACT_RENEWAL_STORAGE_CONVENIOS)
    .map((item) => item.id === convenio.id ? oldContractClosed : item)
    .concat(newContract);
  renewalContractsSaveList(CONTRACT_RENEWAL_STORAGE_CONVENIOS, convenios);

  renewalContractsSaveList(CONTRACT_RENEWAL_STORAGE_VALORES, [
    ...renewalContractsReadList(CONTRACT_RENEWAL_STORAGE_VALORES),
    ...related.valores
  ]);

  renewalContractsSaveList(CONTRACT_RENEWAL_STORAGE_RESPONSAVEIS, [
    ...renewalContractsReadList(CONTRACT_RENEWAL_STORAGE_RESPONSAVEIS),
    ...related.responsaveis
  ]);

  request.status = 'renovada';
  request.renewedAt = new Date().toISOString();
  request.novoContratoId = newConvenioId;
  persistContractRenewal(request);

  renewalContractsSaveList(CONTRACT_RENEWAL_STORAGE_HISTORICOS, [
    ...renewalContractsReadList(CONTRACT_RENEWAL_STORAGE_HISTORICOS),
    {
      id: renewalContractsMakeId('hist'),
      tipo: 'renovacao',
      convenioId: convenio.id,
      novoContratoId: newConvenioId,
      descricao: `Contrato ${convenio.numero || '-'} renovado para ${newContract.numero}.`,
      createdAt: new Date().toISOString()
    }
  ]);

  renderRenewalTable();
  renderAnalysis(request, newContract);
  alert('Renovação finalizada e novo contrato registrado.');
}

renderRenewalTable();

renewalsBody.addEventListener('click', (event) => {
  const button = event.target.closest('[data-select-renewal]');
  if (!button) return;

  selectedRenewalId = button.dataset.selectRenewal;
  const { request, convenio } = getSelectedRenewalContext();
  if (request) renderAnalysis(request, convenio);
});

saveAnalysisButton.addEventListener('click', () => saveCurrentAnalysis());

approveDocumentsButton.addEventListener('click', () => {
  const { request } = getSelectedRenewalContext();
  if (!request) return;
  collectAnalysisInputs(request);

  if (!areAllDocumentsApproved(request)) {
    alert('Todos os documentos precisam estar aprovados para aprovar a documentação.');
    return;
  }

  request.status = 'aprovada';
  request.approvedAt = new Date().toISOString();
  persistContractRenewal(request);
  renderRenewalTable();
  renderAnalysis(request, getSelectedRenewalContext().convenio);
});

finishRenewalButton.addEventListener('click', finishCurrentRenewal);
