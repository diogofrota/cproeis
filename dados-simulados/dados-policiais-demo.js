/**
 * DESCRIÇÃO DO BLOCO:
 * Base sintética exclusiva do cadastro de policiais usada pelos botões de teste da página inicial.
 * A separação deste arquivo permite carregar policiais sem depender da massa de contratos.
 *
 * PARÂMETROS E RETORNO:
 * Não recebe parâmetros e não retorna valores. Ele expõe `window.CPROEIS_POLICIAIS_SIMULADOS`
 * para consumo por `js/script-index-demo-data.js`.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados diretamente. Os arrays ficam em memória no navegador até que o usuário clique
 * em "Carregar policiais", quando o script principal persiste as informações em LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em homologação online, substituir este arquivo por integração segura com a base oficial
 * de efetivo e impedir o uso de dados simulados em produção.
 */
window.CPROEIS_POLICIAIS_SIMULADOS = {
  policiais: [
    ['118.452', '123450-1', 'Diogo Silva', 'Silva', 'Major', 'Oficial Superior', 'Oficial', '', '1º BPM'],
    ['119.083', '123451-9', 'Mariana Costa', 'Costa', 'Capitão', 'Oficial Intermediário', 'Oficial', '', '2º BPM'],
    ['120.114', '123452-7', 'Rafael Almeida', 'Almeida', '1º Tenente', 'Oficial Subalterno', 'Oficial', '', '3º BPM'],
    ['120.982', '123453-5', 'Fernanda Rocha', 'Rocha', '2º Tenente', 'Oficial Subalterno', 'Oficial', '', '4º BPM'],
    ['121.204', '123454-3', 'Carlos Mendes', 'Mendes', 'Subtenente', 'Praça Especial', '', 'Ótimo', 'DGP'],
    ['121.788', '123455-1', 'Patricia Nogueira', 'Nogueira', '1º Sargento', 'Praça', '', 'Bom', 'CFAP'],
    ['122.341', '123456-0', 'Bruno Ferreira', 'Ferreira', '2º Sargento', 'Praça', '', 'Bom', '1º BPM'],
    ['122.914', '123457-8', 'Juliana Martins', 'Martins', '3º Sargento', 'Praça', '', 'Ótimo', '2º BPM'],
    ['123.105', '123458-6', 'Andre Oliveira', 'Oliveira', 'Cabo', 'Praça', '', 'Bom', '3º BPM'],
    ['123.642', '123459-4', 'Camila Santos', 'Santos', 'Soldado', 'Praça', '', 'Bom', '4º BPM'],
    ['124.019', '123460-8', 'Leonardo Souza', 'Souza', 'Soldado', 'Praça', '', 'Bom', 'DGP'],
    ['124.667', '123461-6', 'Renata Barbosa', 'Barbosa', 'Cabo', 'Praça', '', 'Ótimo', 'CFAP'],
    ['125.032', '123462-4', 'Felipe Carvalho', 'Carvalho', '3º Sargento', 'Praça', '', 'Bom', '1º BPM'],
    ['125.489', '123463-2', 'Aline Ribeiro', 'Ribeiro', '2º Sargento', 'Praça', '', 'Bom', '2º BPM'],
    ['126.013', '123464-0', 'Eduardo Lima', 'Lima', '1º Sargento', 'Praça', '', 'Ótimo', '3º BPM'],
    ['126.548', '123465-9', 'Bianca Teixeira', 'Teixeira', 'Subtenente', 'Praça Especial', '', 'Bom', '4º BPM'],
    ['127.091', '123466-7', 'Thiago Araujo', 'Araujo', 'Capitão', 'Oficial Intermediário', 'Oficial', '', 'DGP'],
    ['127.636', '123467-5', 'Larissa Freitas', 'Freitas', 'Major', 'Oficial Superior', 'Oficial', '', 'CFAP'],
    ['128.074', '123468-3', 'Marcelo Pinto', 'Pinto', 'Cabo', 'Praça', '', 'Bom', '1º BPM'],
    ['128.519', '123469-1', 'Vanessa Duarte', 'Duarte', 'Soldado', 'Praça', '', 'Bom', '2º BPM']
  ]
};
