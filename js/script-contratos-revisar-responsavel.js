const RESPONSAVEL_REVIEW_DRAFT = 'cproeis_contratos_revisao_responsavel';
const RESPONSAVEL_REVIEW_CONVENIOS = 'cproeis_contratos_convenios';
const RESPONSAVEL_REVIEW_RESPONSAVEIS = 'cproeis_contratos_responsaveis';
const RESPONSAVEL_REVIEW_SUCCESS = 'cproeis_contratos_operacao_concluida';
const RESPONSAVEL_REVIEW_JSON_API = window.CPROEISContratosJsonApi || null;

const responsavelReviewContent = document.getElementById('responsavel-review-content');
const responsavelReviewStatus = document.getElementById('responsavel-review-status');
const responsavelReviewEdit = document.getElementById('responsavel-review-edit');
const responsavelReviewConfirm = document.getElementById('responsavel-review-confirm');
const responsavelReviewPanel = document.querySelector('.review-panel');

function responsavelReviewLoadList(key) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Lê listas locais usadas para confirmar inclusão ou retirada de responsável.
   * PARÂMETROS E RETORNO: Recebe key como string e retorna array.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê LocalStorage na chave informada; não grava dados.
   * TODO: Em produção, trocar por consulta autenticada com tratamento de erro.
   */
  if (RESPONSAVEL_REVIEW_JSON_API?.readJsonList) return RESPONSAVEL_REVIEW_JSON_API.readJsonList(key);
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (error) {
    return [];
  }
}

function responsavelReviewSaveList(key, list) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Persiste listas atualizadas após confirmação da revisão.
   * PARÂMETROS E RETORNO: Recebe key como string e list como array; não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Grava LocalStorage na chave informada.
   * TODO: Em produção, substituir por transação de backend para evitar gravação parcial.
   */
  if (RESPONSAVEL_REVIEW_JSON_API?.writeJsonList) {
    RESPONSAVEL_REVIEW_JSON_API.writeJsonList(key, list);
    return;
  }
  localStorage.setItem(key, JSON.stringify(list));
}

function responsavelReviewEscape(value) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Escapa texto dinâmico antes de inserir HTML na página de revisão.
   * PARÂMETROS E RETORNO: Recebe value como string/valor simples e retorna HTML seguro.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava dados.
   * TODO: Em produção, usar camada de templates/componentes para evitar HTML manual.
   */
  const div = document.createElement('div');
  div.textContent = value ?? '';
  return div.innerHTML;
}

function responsavelReviewField(label, value) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Renderiza um campo textual da revisão de responsável.
   * PARÂMETROS E RETORNO: Recebe label e value como strings e retorna HTML.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não acessa armazenamento; apenas formata dados em memória.
   * TODO: Em produção, compartilhar este helper com as páginas de revisão/detalhes.
   */
  return `<div class="review-field"><span>${responsavelReviewEscape(label)}</span><strong>${responsavelReviewEscape(value || '-')}</strong></div>`;
}

function responsavelReviewSection(title, content) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Agrupa campos da revisão em seções consistentes com a revisão de convênio.
   * PARÂMETROS E RETORNO: Recebe title e content como strings e retorna HTML da seção.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não acessa dados; apenas organiza HTML.
   * TODO: Em produção, transformar em componente compartilhado.
   */
  return `<section class="review-section"><h3>${responsavelReviewEscape(title)}</h3>${content}</section>`;
}

function responsavelReviewGetDraft() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Recupera o rascunho da alteração de responsável salvo pela página anterior.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e retorna objeto ou null.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê `cproeis_contratos_revisao_responsavel` no sessionStorage.
   * TODO: Em produção, substituir rascunho local por estado de fluxo no backend.
   */
  if (RESPONSAVEL_REVIEW_JSON_API?.readSessionJson) {
    return RESPONSAVEL_REVIEW_JSON_API.readSessionJson(RESPONSAVEL_REVIEW_DRAFT);
  }
  try {
    return JSON.parse(sessionStorage.getItem(RESPONSAVEL_REVIEW_DRAFT));
  } catch (error) {
    return null;
  }
}

function responsavelReviewRender(draft) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Renderiza o esqueleto fixo da revisão, preenchendo quando houver rascunho.
   * PARÂMETROS E RETORNO: Recebe draft como objeto opcional e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê apenas o draft em memória; não grava dados.
   * TODO: Em produção, exibir comparação entre estado atual e estado proposto.
   */
  const convenio = draft?.convenio || {};
  const responsavel = draft?.responsavel || {};
  const tipo = draft?.tipo === 'retirar' ? 'Retirada de responsável' : 'Inclusão de responsável';

  if (responsavelReviewStatus) {
    responsavelReviewStatus.textContent = draft
      ? `${tipo}. Confirme para gravar a alteração.`
      : 'Modelo de conferência. Os dados da inclusão ou retirada aparecerão nestes campos.';
  }

  if (responsavelReviewConfirm) responsavelReviewConfirm.disabled = !draft;

  responsavelReviewContent.innerHTML = [
    responsavelReviewSection('Operação', `
      <div class="review-grid">
        ${responsavelReviewField('Tipo de alteração', draft ? tipo : '')}
        ${responsavelReviewField('Contrato', convenio.numero)}
        ${responsavelReviewField('Convênio', convenio.nome)}
        ${responsavelReviewField('CNPJ', convenio.cnpj)}
      </div>
    `),
    responsavelReviewSection('Responsável', `
      <div class="review-grid">
        ${responsavelReviewField('Nome', responsavel.nome)}
        ${responsavelReviewField('CPF', responsavel.cpf)}
        ${responsavelReviewField('Email', responsavel.email)}
        ${responsavelReviewField('Telefone', responsavel.telefone)}
      </div>
    `),
    responsavelReviewSection('Período de acesso', `
      <div class="review-grid">
        ${responsavelReviewField('Início de atuação', responsavel.inicio)}
        ${responsavelReviewField('Data final', responsavel.fim)}
      </div>
    `)
  ].join('');
}

function responsavelReviewConfirmar(draft) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Confirma a inclusão ou retirada revisada e grava o resultado localmente.
   * PARÂMETROS E RETORNO: Recebe draft como objeto de operação e retorna booleano de sucesso.
   * ARMAZENAMENTO E PERSISTÊNCIA: Grava `cproeis_contratos_convenios` e
   * `cproeis_contratos_responsaveis`; remove o rascunho do sessionStorage.
   * TODO: Em produção, enviar esta confirmação para API transacional com auditoria.
   */
  if (RESPONSAVEL_REVIEW_JSON_API) {
    /*
     * DESCRIÇÃO DO BLOCO: Encaminha a operação revisada para a API JSON local, separando
     * inclusão e retirada como comandos distintos.
     * PARÂMETROS E RETORNO: Usa draft como objeto com tipo, convenioId e responsavel; recebe
     * resposta JSON com ok/message/data.
     * ARMAZENAMENTO E PERSISTÊNCIA: A API local grava LocalStorage agora; futuramente será backend.
     * TODO: Em produção, trocar por POST/PATCH com tratamento de conflito e auditoria do operador.
     */
    const response = draft.tipo === 'retirar'
      ? RESPONSAVEL_REVIEW_JSON_API.retirarResponsavel(draft)
      : RESPONSAVEL_REVIEW_JSON_API.adicionarResponsavel(draft);

    if (!response.ok) {
      if (responsavelReviewStatus) responsavelReviewStatus.textContent = response.message || 'Não foi possível confirmar a alteração.';
      return false;
    }
    RESPONSAVEL_REVIEW_JSON_API.removeSessionJson(RESPONSAVEL_REVIEW_DRAFT);
    return true;
  }

  const convenios = responsavelReviewLoadList(RESPONSAVEL_REVIEW_CONVENIOS);
  const responsaveis = responsavelReviewLoadList(RESPONSAVEL_REVIEW_RESPONSAVEIS);
  const responsavel = draft.responsavel;

  if (draft.tipo === 'retirar') {
    const updateResponsavel = (item) => item.id === responsavel.id ? { ...item, fim: responsavel.fim } : item;
    responsavelReviewSaveList(RESPONSAVEL_REVIEW_CONVENIOS, convenios.map((convenio) => (
      convenio.id === draft.convenioId
        ? { ...convenio, responsaveis: (convenio.responsaveis || []).map(updateResponsavel) }
        : convenio
    )));
    responsavelReviewSaveList(RESPONSAVEL_REVIEW_RESPONSAVEIS, responsaveis.map(updateResponsavel));
  } else {
    responsavelReviewSaveList(RESPONSAVEL_REVIEW_CONVENIOS, convenios.map((convenio) => (
      convenio.id === draft.convenioId
        ? { ...convenio, responsaveis: [...(convenio.responsaveis || []), responsavel] }
        : convenio
    )));
    responsavelReviewSaveList(RESPONSAVEL_REVIEW_RESPONSAVEIS, [...responsaveis, responsavel]);
  }

  sessionStorage.removeItem(RESPONSAVEL_REVIEW_DRAFT);
  return true;
}

function responsavelReviewSetSavingState(message) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Mostra estado de gravação na tela de revisão de responsável,
   * impedindo duplo clique enquanto os dados são confirmados.
   * PARÂMETROS E RETORNO: Recebe message como string e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; altera apenas texto, classes e botões do DOM.
   * TODO: Em produção, vincular este estado ao ciclo da requisição HTTP real.
   */
  if (responsavelReviewStatus) responsavelReviewStatus.textContent = message;
  if (responsavelReviewConfirm) {
    responsavelReviewConfirm.disabled = true;
    responsavelReviewConfirm.textContent = 'Gravando...';
  }
  if (responsavelReviewEdit) responsavelReviewEdit.disabled = true;
  responsavelReviewPanel?.classList.add('is-saving');

  if (responsavelReviewPanel && !responsavelReviewPanel.querySelector('.review-saving-message')) {
    const saving = document.createElement('div');
    saving.className = 'review-saving-message';
    saving.textContent = message;
    responsavelReviewPanel.querySelector('.review-actions')?.before(saving);
  }
}

function responsavelReviewSaveSuccessMessage(draft) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Salva a mensagem final da inclusão ou retirada de responsável para
   * a página padrão de operação concluída.
   * PARÂMETROS E RETORNO: Recebe draft da operação e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Grava sessionStorage em `cproeis_contratos_operacao_concluida`.
   * TODO: Em produção, usar a mensagem/protocolo oficial retornado pela API.
   */
  const isRetirada = draft.tipo === 'retirar';
  const title = isRetirada ? 'Responsável retirado' : 'Responsável adicionado';
  const message = isRetirada
    ? `${draft.responsavel?.nome || 'O responsável'} teve a data final registrada no convênio ${draft.convenio?.nome || ''}.`
    : `${draft.responsavel?.nome || 'O responsável'} foi vinculado ao convênio ${draft.convenio?.nome || ''}.`;
  const payload = {
    tipo: isRetirada ? 'responsavel_retirado' : 'responsavel_adicionado',
    title,
    message,
    primaryHref: `detalhes-convenio.html?id=${encodeURIComponent(draft.convenioId || '')}`,
    primaryText: 'Ver detalhes do convênio'
  };

  if (RESPONSAVEL_REVIEW_JSON_API?.writeSessionJson) {
    RESPONSAVEL_REVIEW_JSON_API.writeSessionJson(RESPONSAVEL_REVIEW_SUCCESS, payload);
    return;
  }
  sessionStorage.setItem(RESPONSAVEL_REVIEW_SUCCESS, JSON.stringify(payload));
}

function responsavelReviewInit() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Inicializa a revisão de responsável com esqueleto fixo e eventos de ação.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê sessionStorage e pode gravar LocalStorage ao confirmar.
   * TODO: Em produção, tratar expiração do rascunho e conflito de atualização concorrente.
   */
  const draft = responsavelReviewGetDraft();
  responsavelReviewRender(draft);

  responsavelReviewEdit?.addEventListener('click', () => {
    if (!draft) {
      window.location.href = 'tabela-convenios.html';
      return;
    }
    const url = draft.tipo === 'retirar'
      ? `retirar-responsavel.html?id=${encodeURIComponent(draft.convenioId)}&responsavelId=${encodeURIComponent(draft.responsavel.id || '')}&draft=1`
      : `incluir-responsavel.html?id=${encodeURIComponent(draft.convenioId)}&draft=1`;
    window.location.href = url;
  });

  responsavelReviewConfirm?.addEventListener('click', () => {
    if (!draft) return;
    responsavelReviewSetSavingState('Gravando a alteração do responsável. Aguarde a confirmação antes de sair da página.');
    window.setTimeout(() => {
      if (responsavelReviewConfirmar(draft)) {
        responsavelReviewSaveSuccessMessage(draft);
        const tipo = draft.tipo === 'retirar' ? 'responsavel_retirado' : 'responsavel_adicionado';
        window.location.href = `operacao-concluida.html?tipo=${tipo}&id=${encodeURIComponent(draft.convenioId || '')}`;
      } else if (responsavelReviewConfirm) {
        responsavelReviewConfirm.disabled = false;
        responsavelReviewConfirm.textContent = 'Confirmar e enviar';
        if (responsavelReviewEdit) responsavelReviewEdit.disabled = false;
      }
    }, 500);
  });
}

responsavelReviewInit();
