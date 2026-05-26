const RENEWAL_STORAGE_CONVENIOS = 'cproeis_contratos_convenios';
const RENEWAL_STORAGE_REQUESTS = 'cproeis_contratos_renovacoes';
const RENEWAL_STORAGE_CURRENT_CONVENIO = 'cproeis_convenio_atual';
const RENEWAL_STORAGE_CURRENT_RESPONSAVEL = 'cproeis_convenio_responsavel_atual';

const renewalRequiredDocuments = [
  {
    id: 'oficio',
    title: 'Ofício de solicitação de renovação',
    description: 'Documento formal do convenente solicitando a renovação do contrato.'
  },
  {
    id: 'regularidade-cadastral',
    title: 'CNPJ e regularidade cadastral',
    description: 'Comprovante cadastral atualizado do convenente.'
  },
  {
    id: 'regularidade-fiscal',
    title: 'Certidões de regularidade fiscal',
    description: 'Certidões necessárias para comprovar aptidão para contratação.'
  },
  {
    id: 'justificativa',
    title: 'Justificativa operacional',
    description: 'Motivação para continuidade do serviço e interesse público envolvido.'
  },
  {
    id: 'plano-trabalho',
    title: 'Plano de trabalho atualizado',
    description: 'Previsão de demanda, locais de atuação e condições operacionais.'
  },
  {
    id: 'autorizacao',
    title: 'Autorização do representante legal',
    description: 'Despacho, autorização ou documento equivalente do responsável legal.'
  }
];

const renewalStatusLabels = {
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

const documentsList = document.getElementById('documents-list');
const renewalSummary = document.getElementById('renewal-summary');
const renewalStatus = document.getElementById('renewal-status');

/*
  DESCRIÇÃO DA FUNÇÃO: Lê uma lista JSON do LocalStorage de forma tolerante a dados ausentes
  ou corrompidos, permitindo que a tela carregue mesmo sem solicitações anteriores.
  PARÂMETROS E RETORNO: Recebe key (string) e retorna Array<object>.
  ARMAZENAMENTO E PERSISTÊNCIA: Lê LocalStorage na chave informada; não grava dados.
  TODO: Em produção, substituir por consulta autenticada à API com tratamento de erro visível.
*/
function renewalReadList(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (error) {
    return [];
  }
}

/*
  DESCRIÇÃO DA FUNÇÃO: Grava uma lista serializada no LocalStorage para manter o rascunho
  e as atualizações do fluxo de renovação no protótipo local.
  PARÂMETROS E RETORNO: Recebe key (string) e list (Array<object>); não retorna valores.
  ARMAZENAMENTO E PERSISTÊNCIA: Grava LocalStorage na chave informada.
  TODO: Em produção, trocar por requisição POST/PUT autenticada e validação transacional no backend.
*/
function renewalSaveList(key, list) {
  localStorage.setItem(key, JSON.stringify(list));
}

/*
  DESCRIÇÃO DA FUNÇÃO: Gera identificador simples para solicitações, documentos e comentários
  criados no navegador.
  PARÂMETROS E RETORNO: Não recebe parâmetros e retorna string pseudoúnica.
  ARMAZENAMENTO E PERSISTÊNCIA: Não acessa LocalStorage; o ID gerado é persistido por quem chama.
  TODO: Em produção, usar identificadores gerados pelo banco de dados.
*/
function renewalMakeId() {
  return `ren_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/*
  DESCRIÇÃO DA FUNÇÃO: Escapa texto antes de renderizar HTML dinâmico para evitar injeções
  acidentais no protótipo estático.
  PARÂMETROS E RETORNO: Recebe value (qualquer tipo) e retorna string segura para HTML.
  ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava dados; apenas transforma o valor recebido.
  TODO: Em produção, validar e sanitizar também no backend antes de persistir observações.
*/
function renewalEscape(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/*
  DESCRIÇÃO DA FUNÇÃO: Formata data ISO para exibição em padrão brasileiro.
  PARÂMETROS E RETORNO: Recebe value (string YYYY-MM-DD) e retorna DD/MM/YYYY ou hífen.
  ARMAZENAMENTO E PERSISTÊNCIA: Não acessa armazenamento; usa somente o valor recebido.
  TODO: Em produção, centralizar formatação em biblioteca de datas compartilhada.
*/
function renewalFormatDate(value) {
  if (!value) return '-';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

/*
  DESCRIÇÃO DA FUNÇÃO: Converte data ISO em Date local para calcular a janela de renovação sem
  deslocamento de fuso horário.
  PARÂMETROS E RETORNO: Recebe value (string YYYY-MM-DD) e retorna Date.
  ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava dados; apenas transforma valor recebido.
  TODO: Em produção, centralizar o cálculo de prazo no backend para usar data oficial do servidor.
*/
function renewalCreateLocalDate(value) {
  if (!value) return new Date(NaN);
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/*
  DESCRIÇÃO DA FUNÇÃO: Calcula quantos dias faltam para o fim da vigência do convênio.
  PARÂMETROS E RETORNO: Recebe convenio (object|null) e retorna number, podendo ser NaN se não houver data válida.
  ARMAZENAMENTO E PERSISTÊNCIA: Não acessa LocalStorage; usa somente o objeto já carregado da sessão.
  TODO: Em produção, aplicar calendário oficial e registrar a data de referência usada no cálculo.
*/
function getRenewalDaysUntilExpiration(convenio) {
  const endDate = renewalCreateLocalDate(convenio?.fim || '');
  const todayDate = renewalCreateLocalDate(new Date().toISOString().slice(0, 10));
  if (Number.isNaN(endDate.getTime()) || Number.isNaN(todayDate.getTime())) return NaN;
  return Math.ceil((endDate - todayDate) / 86400000);
}

/*
  DESCRIÇÃO DA FUNÇÃO: Define se a página de renovação pode criar ou editar solicitação para o responsável.
  PARÂMETROS E RETORNO: Recebe convenio (object|null) e retorna boolean verdadeiro quando faltam 120 dias ou menos.
  ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; avalia apenas a data `fim` carregada do contrato.
  TODO: Em produção, tornar a janela de 120 dias parametrizável pela administração do sistema.
*/
function isRenewalWindowOpen(convenio) {
  const daysUntilExpiration = getRenewalDaysUntilExpiration(convenio);
  return Number.isFinite(daysUntilExpiration) && daysUntilExpiration <= 120;
}

/*
  DESCRIÇÃO DA FUNÇÃO: Resolve convênio e responsável ativos para manter a renovação vinculada
  ao mesmo login operacional do responsável.
  PARÂMETROS E RETORNO: Não recebe parâmetros; retorna objeto com convenio e responsavel.
  ARMAZENAMENTO E PERSISTÊNCIA: Lê URL e LocalStorage (`cproeis_contratos_convenios`,
  `cproeis_convenio_atual`, `cproeis_convenio_responsavel_atual`) e grava a sessão quando a URL traz IDs.
  TODO: Em produção, substituir por sessão autenticada e autorização por responsável do convênio.
*/
function resolveRenewalSession() {
  const params = new URLSearchParams(window.location.search);
  const convenioId = params.get('id') || localStorage.getItem(RENEWAL_STORAGE_CURRENT_CONVENIO) || '';
  const responsavelId = params.get('responsavel') || localStorage.getItem(RENEWAL_STORAGE_CURRENT_RESPONSAVEL) || '';
  const convenio = renewalReadList(RENEWAL_STORAGE_CONVENIOS).find((item) => item.id === convenioId) || null;
  const responsavel = (convenio?.responsaveis || []).find((item) => {
    const refs = [item.id, item.cpf, item.nome].filter(Boolean).map(String);
    return refs.includes(responsavelId);
  }) || null;

  if (convenio) localStorage.setItem(RENEWAL_STORAGE_CURRENT_CONVENIO, convenio.id);
  if (responsavel) localStorage.setItem(RENEWAL_STORAGE_CURRENT_RESPONSAVEL, responsavel.id || responsavel.cpf || responsavel.nome || '');

  return { convenio, responsavel };
}

/*
  DESCRIÇÃO DA FUNÇÃO: Busca a solicitação de renovação aberta para o convênio ou cria um
  rascunho com a lista de documentos obrigatórios.
  PARÂMETROS E RETORNO: Recebe convenio (object) e responsavel (object|null); retorna object da solicitação.
  ARMAZENAMENTO E PERSISTÊNCIA: Lê e grava `cproeis_contratos_renovacoes` no LocalStorage quando
  ainda não existe rascunho para o contrato atual.
  TODO: Em produção, criar controle oficial de solicitação no backend e impedir duplicidade por vigência.
*/
function getOrCreateRenewal(convenio, responsavel) {
  const requests = renewalReadList(RENEWAL_STORAGE_REQUESTS);
  const existing = requests.find((item) => item.convenioId === convenio.id && item.status !== 'renovada');
  if (existing) return existing;

  const now = new Date().toISOString();
  const request = {
    id: renewalMakeId(),
    convenioId: convenio.id,
    convenioNome: convenio.nome || '',
    contratoNumero: convenio.numero || '',
    cnpj: convenio.cnpj || '',
    responsavelId: responsavel?.id || responsavel?.cpf || responsavel?.nome || '',
    responsavelNome: responsavel?.nome || '',
    status: 'rascunho',
    documentos: renewalRequiredDocuments.map((documento) => ({
      id: documento.id,
      title: documento.title,
      description: documento.description,
      status: 'nao-enviado',
      fileName: '',
      fileSize: 0,
      fileType: '',
      fileData: '',
      uploadedAt: '',
      comentarioContratos: ''
    })),
    createdAt: now,
    updatedAt: now,
    approvedAt: '',
    renewedAt: '',
    novoContratoId: ''
  };

  renewalSaveList(RENEWAL_STORAGE_REQUESTS, [...requests, request]);
  return request;
}

/*
  DESCRIÇÃO DA FUNÇÃO: Atualiza a solicitação corrente dentro da lista persistida.
  PARÂMETROS E RETORNO: Recebe request (object) e não retorna valores.
  ARMAZENAMENTO E PERSISTÊNCIA: Lê e grava `cproeis_contratos_renovacoes` no LocalStorage.
  TODO: Em produção, aplicar controle de concorrência para evitar sobrescrever análise simultânea.
*/
function persistRenewal(request) {
  request.updatedAt = new Date().toISOString();
  const requests = renewalReadList(RENEWAL_STORAGE_REQUESTS);
  renewalSaveList(RENEWAL_STORAGE_REQUESTS, requests.map((item) => item.id === request.id ? request : item));
}

/*
  DESCRIÇÃO DA FUNÇÃO: Remove rascunhos locais criados indevidamente quando o contrato ainda está
  fora da janela de 120 dias para renovação.
  PARÂMETROS E RETORNO: Recebe convenioId (string) e não retorna valores.
  ARMAZENAMENTO E PERSISTÊNCIA: Lê e grava `cproeis_contratos_renovacoes`, preservando pedidos
  enviados/analisados e removendo apenas rascunhos do contrato informado.
  TODO: Em produção, substituir esta limpeza local por regra de negócio no backend com auditoria.
*/
function removeBlockedRenewalDrafts(convenioId) {
  const requests = renewalReadList(RENEWAL_STORAGE_REQUESTS);
  renewalSaveList(RENEWAL_STORAGE_REQUESTS, requests.filter((item) => {
    return item.convenioId !== convenioId || item.status !== 'rascunho';
  }));
}

/*
  DESCRIÇÃO DA FUNÇÃO: Renderiza os cartões de documentos obrigatórios com upload individual
  pelo responsável do convênio.
  PARÂMETROS E RETORNO: Recebe request (object) e não retorna valores.
  ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados diretamente; eventos posteriores persistem alterações.
  TODO: Em produção, substituir metadados locais por upload real com visualização/download do arquivo.
*/
function renderDocuments(request) {
  documentsList.innerHTML = request.documentos.map((documento) => `
    <article class="renewal-document">
      <div class="renewal-document-header">
        <div>
          <h3>${renewalEscape(documento.title)}</h3>
          <p>${renewalEscape(documento.description)}</p>
        </div>
        <span class="document-status status-${renewalEscape(documento.status)}">${renewalEscape(renewalStatusLabels[documento.status] || documento.status || 'Pendente')}</span>
      </div>
      <label>
        Arquivo
        <input type="file" data-document-file="${renewalEscape(documento.id)}" ${documento.status === 'aprovado' ? 'disabled' : ''}>
      </label>
      <div class="document-meta">
        <span><strong>Arquivo enviado:</strong> ${renewalEscape(documento.fileName || 'Nenhum arquivo informado')}</span>
        <span><strong>Enviado em:</strong> ${documento.uploadedAt ? renewalEscape(new Date(documento.uploadedAt).toLocaleString('pt-BR')) : '-'}</span>
        <span><strong>Retorno da seção de contratos:</strong> ${renewalEscape(documento.comentarioContratos || '-')}</span>
      </div>
      <div class="form-actions compact-actions">
        <button type="button" data-send-document="${renewalEscape(documento.id)}" ${documento.status === 'aprovado' ? 'disabled' : ''}>Enviar documento</button>
      </div>
    </article>
  `).join('');
}

/*
  DESCRIÇÃO DA FUNÇÃO: Converte arquivo pequeno para data URL local, permitindo que a seção
  de contratos abra o anexo dentro do protótipo estático.
  PARÂMETROS E RETORNO: Recebe file (File) e retorna Promise<string> com data URL ou string vazia.
  ARMAZENAMENTO E PERSISTÊNCIA: Não grava diretamente; o retorno é salvo em `cproeis_contratos_renovacoes`
  pela função collectDocumentInputs.
  TODO: Em produção, remover base64 do LocalStorage e enviar o arquivo para storage seguro com antivírus.
*/
function readSmallFileAsDataUrl(file) {
  if (!file || file.size > 800 * 1024) return Promise.resolve('');

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

/*
  DESCRIÇÃO DA FUNÇÃO: Atualiza todos os elementos visuais da página conforme a solicitação atual.
  PARÂMETROS E RETORNO: Recebe convenio (object|null) e request (object|null); não retorna valores.
  ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; renderiza no DOM dados lidos de convênios e renovações.
  TODO: Em produção, atualizar esta tela por eventos do backend quando a seção de contratos analisar o pedido.
*/
function renderRenewalPage(convenio, request) {
  if (!convenio) {
    renewalSummary.textContent = 'Nenhum convênio válido foi encontrado para renovação.';
    documentsList.innerHTML = '<p class="hint">Retorne ao acesso do convênio e selecione um responsável autorizado.</p>';
    return;
  }

  if (!request) {
    const daysUntilExpiration = getRenewalDaysUntilExpiration(convenio);
    const daysText = Number.isFinite(daysUntilExpiration) ? `${daysUntilExpiration} dias` : 'prazo não identificado';
    renewalSummary.textContent = `${convenio.nome || '-'} | Contrato ${convenio.numero || '-'} | Vigência ${renewalFormatDate(convenio.inicio)} até ${renewalFormatDate(convenio.fim)}.`;
    renewalStatus.textContent = 'Fora do prazo';
    renewalStatus.className = 'renewal-status status-bloqueada';
    documentsList.className = 'renewal-unavailable';
    documentsList.innerHTML = `
      <h3>Renovação ainda não disponível</h3>
      <p>Esta tela só fica disponível quando faltarem 120 dias ou menos para o vencimento do contrato.</p>
      <p>Prazo atual para o fim da vigência: <strong>${renewalEscape(daysText)}</strong>.</p>
    `;
    return;
  }

  renewalSummary.textContent = `${convenio.nome || '-'} | Contrato ${convenio.numero || '-'} | Vigência ${renewalFormatDate(convenio.inicio)} até ${renewalFormatDate(convenio.fim)}.`;
  renewalStatus.textContent = renewalStatusLabels[request.status] || request.status;
  renewalStatus.className = `renewal-status status-${request.status}`;
  documentsList.className = 'renewal-grid';
  renderDocuments(request);
}

/*
  DESCRIÇÃO DA FUNÇÃO: Envia um documento individual da renovação para análise da seção de contratos.
  PARÂMETROS E RETORNO: Recebe request (object) e documentId (string); retorna Promise<boolean>
  indicando se o envio foi concluído.
  ARMAZENAMENTO E PERSISTÊNCIA: Lê o input de arquivo no DOM e atualiza o documento correspondente
  em `cproeis_contratos_renovacoes`.
  TODO: Em produção, enviar o arquivo por requisição assíncrona com validação de tipo, tamanho e antivírus.
*/
async function sendSingleDocument(request, documentId) {
  const fileInput = document.querySelector(`[data-document-file="${documentId}"]`);
  const file = fileInput?.files?.[0] || null;

  if (!file) {
    alert('Selecione um arquivo antes de enviar este documento.');
    return false;
  }

  request.documentos = request.documentos.map((documento) => {
    if (documento.id !== documentId) return documento;

    return {
      ...documento,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      fileData: '',
      uploadedAt: new Date().toISOString(),
      status: 'enviado',
      comentarioContratos: ''
    };
  });

  const target = request.documentos.find((documento) => documento.id === documentId);
  target.fileData = await readSmallFileAsDataUrl(file);
  request.status = 'em-analise';
  persistRenewal(request);
  return true;
}

const renewalSession = resolveRenewalSession();
let currentRenewal = null;

if (renewalSession.convenio && isRenewalWindowOpen(renewalSession.convenio)) {
  currentRenewal = getOrCreateRenewal(renewalSession.convenio, renewalSession.responsavel);
} else if (renewalSession.convenio) {
  removeBlockedRenewalDrafts(renewalSession.convenio.id);
}

renderRenewalPage(renewalSession.convenio, currentRenewal);

if (documentsList && currentRenewal) {
  documentsList.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-send-document]');
    if (!button) return;

    const sent = await sendSingleDocument(currentRenewal, button.dataset.sendDocument);
    if (!sent) return;

    renderRenewalPage(renewalSession.convenio, currentRenewal);
  });
}
