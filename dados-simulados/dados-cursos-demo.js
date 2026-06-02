/**
 * DESCRIÇÃO DO BLOCO:
 * Configuração sintética para cursos de demonstração do GSI e dos convênios.
 * A massa separa tipos oficiais do GSI, tipos próprios dos convênios e vínculos já concluídos
 * por alguns policiais para testar filtros de vagas com requisito.
 *
 * PARÂMETROS E RETORNO:
 * Não recebe parâmetros e não retorna valores. Expõe `window.CPROEIS_CURSOS_SIMULADOS`
 * para consumo por `js/script-index-demo-data.js`.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados diretamente; os arrays ficam em memória até o usuário clicar no botão
 * "Criar cursos demo".
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em homologação online, substituir esta fixture por endpoints de GSI, convênios,
 * inscrições, publicações em BOL PM e habilitações validadas documentalmente.
 */
window.CPROEIS_CURSOS_SIMULADOS = {
  gsiTipos: [
    { id: 'gsi-patrulha-escolar', nome: 'Patrulha Escolar', status: 'Ativo' },
    { id: 'gsi-maria-penha', nome: 'Maria da Penha', status: 'Ativo' },
    { id: 'gsi-60-mais', nome: '60+', status: 'Ativo' },
    { id: 'gsi-fiscalizacao-tre', nome: 'Fiscalização do TRE', status: 'Ativo' }
  ],
  convenioTipos: [
    { id: 'tipo-conv-atendimento-passageiro', convenioId: 'conv-demo-6', nome: 'Atendimento ao passageiro', criterios: 'Apoio operacional em terminal/aeroporto', status: 'Ativo' },
    { id: 'tipo-conv-motopatrulhamento', convenioId: 'conv-demo-6', nome: 'Motopatrulhamento de apoio', criterios: 'Apto para operação com motocicleta', status: 'Ativo' },
    { id: 'tipo-conv-eventos-esportivos', convenioId: 'conv-demo-2', nome: 'Eventos esportivos', criterios: 'Controle de público e circulação', status: 'Ativo' }
  ],
  convenioCursos: [
    {
      id: 'curso-conv-atendimento-passageiro-demo',
      convenioId: 'conv-demo-6',
      tipoId: 'tipo-conv-atendimento-passageiro',
      titulo: 'Turma 01 - Atendimento operacional',
      targetMode: 'posto',
      targetPostos: ['3º Sargento', '2º Sargento', '1º Sargento', 'Subtenente', 'Cabo', 'Soldado'],
      targetLabel: 'Praças e graduados',
      cargaHoraria: 12,
      vagas: 30,
      local: 'Auditório do Aeroporto Executivo'
    },
    {
      id: 'curso-conv-motopatrulhamento-demo',
      convenioId: 'conv-demo-6',
      tipoId: 'tipo-conv-motopatrulhamento',
      titulo: 'Turma 01 - Apoio com motocicleta',
      targetMode: 'posto',
      targetPostos: ['3º Sargento', '2º Sargento', '1º Sargento', 'Cabo', 'Soldado'],
      targetLabel: 'Praças com habilitação de moto',
      cargaHoraria: 16,
      vagas: 20,
      local: 'Pátio operacional do Aeroporto Executivo'
    },
    {
      id: 'curso-conv-eventos-esportivos-demo',
      convenioId: 'conv-demo-2',
      tipoId: 'tipo-conv-eventos-esportivos',
      titulo: 'Turma 01 - Segurança em eventos',
      targetMode: 'todos',
      targetPostos: [],
      targetLabel: 'Todos os policiais',
      cargaHoraria: 8,
      vagas: 40,
      local: 'Sala de treinamento do Maracanã Eventos'
    }
  ],
  conclusoesConvenio: [
    { courseId: 'curso-conv-atendimento-passageiro-demo', policialId: 'pol-demo-14', status: 'Concluído' },
    { courseId: 'curso-conv-motopatrulhamento-demo', policialId: 'pol-demo-14', status: 'Concluído' },
    { courseId: 'curso-conv-eventos-esportivos-demo', policialId: 'pol-demo-6', status: 'Concluído' },
    { courseId: 'curso-conv-eventos-esportivos-demo', policialId: 'pol-demo-10', status: 'Inscrito' }
  ],
  publicacoesGsi: [
    { tipoId: 'gsi-patrulha-escolar', policialId: 'pol-demo-14', bolNumero: 'BOL PM 120/2026', pagina: '14', status: 'Validado' },
    { tipoId: 'gsi-maria-penha', policialId: 'pol-demo-14', bolNumero: 'BOL PM 121/2026', pagina: '8', status: 'Validado' },
    { tipoId: 'gsi-fiscalizacao-tre', policialId: 'pol-demo-7', bolNumero: 'BOL PM 122/2026', pagina: '22', status: 'Validado' }
  ],
  habilitacoes: [
    { policialId: 'pol-demo-14', numero: '01234567890', categoria: 'AB', vencimentoOffsetDias: 900, origem: 'Demo leitura IA', status: 'Validada' },
    { policialId: 'pol-demo-19', numero: '09876543210', categoria: 'A', vencimentoOffsetDias: 720, origem: 'Demo leitura IA', status: 'Validada' },
    { policialId: 'pol-demo-10', numero: '05678912345', categoria: 'B', vencimentoOffsetDias: 720, origem: 'Demo sem categoria A', status: 'Validada' }
  ]
};
