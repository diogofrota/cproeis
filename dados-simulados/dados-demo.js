/**
 * DESCRIÇÃO DO BLOCO:
 * Base de dados sintética usada somente pelos botões de teste da página inicial.
 * A separação deste arquivo mantém a massa de exemplo fora da lógica que grava no LocalStorage.
 *
 * PARÂMETROS E RETORNO:
 * Não recebe parâmetros e não retorna valores. Ele apenas expõe `window.CPROEIS_DADOS_SIMULADOS`
 * para consumo por `js/script-index-demo-data.js`.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados diretamente. Os arrays ficam em memória no navegador até que o usuário clique
 * nos botões de carregamento, quando o script principal persiste as informações em LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em homologação online, substituir este arquivo estático por fixtures versionadas ou por
 * endpoint protegido, evitando que dados simulados sejam carregados no ambiente de produção.
 */
window.CPROEIS_DADOS_SIMULADOS = {
  convenios: [
    'Galeao',
    'Maracana Eventos',
    'Porto Seguro Rio',
    'Hospital Municipal Central',
    'Shopping Metropolitano',
    'Aeroporto Executivo',
    'Centro Administrativo RJ',
    'Terminal Rodoviario Novo Rio',
    'Complexo Esportivo Estadual',
    'Museu da Cidade'
  ],
  policiais: [
    ['118.452', '123450-1', 'Diogo Silva', 'Silva', 'Major', 'Oficial Superior', 'Oficial', '', '1º BPM'],
    ['119.083', '123451-9', 'Mariana Costa', 'Costa', 'Capitão', 'Oficial Intermediário', 'Oficial', '', '2º BPM'],
    ['120.114', '123452-7', 'Rafael Almeida', 'Almeida', '1º Tenente', 'Oficial Subalterno', 'Oficial', '', '3º BPM'],
    ['120.982', '123453-5', 'Fernanda Rocha', 'Rocha', '2º Tenente', 'Oficial Subalterno', 'Oficial', '', '4º BPM'],
    ['121.204', '123454-3', 'Carlos Mendes', 'Mendes', 'Subtenente', 'Praça Especial', '', 'Ótimo', '5º BPM'],
    ['121.788', '123455-1', 'Patricia Nogueira', 'Nogueira', '1º Sargento', 'Praça', '', 'Bom', '6º BPM'],
    ['122.341', '123456-0', 'Bruno Ferreira', 'Ferreira', '2º Sargento', 'Praça', '', 'Bom', '7º BPM'],
    ['122.914', '123457-8', 'Juliana Martins', 'Martins', '3º Sargento', 'Praça', '', 'Ótimo', '8º BPM'],
    ['123.105', '123458-6', 'Andre Oliveira', 'Oliveira', 'Cabo', 'Praça', '', 'Bom', '9º BPM'],
    ['123.642', '123459-4', 'Camila Santos', 'Santos', 'Soldado', 'Praça', '', 'Bom', '10º BPM'],
    ['124.019', '123460-8', 'Leonardo Souza', 'Souza', 'Soldado', 'Praça', '', 'Bom', '11º BPM'],
    ['124.667', '123461-6', 'Renata Barbosa', 'Barbosa', 'Cabo', 'Praça', '', 'Ótimo', '12º BPM'],
    ['125.032', '123462-4', 'Felipe Carvalho', 'Carvalho', '3º Sargento', 'Praça', '', 'Bom', '13º BPM'],
    ['125.489', '123463-2', 'Aline Ribeiro', 'Ribeiro', '2º Sargento', 'Praça', '', 'Bom', '14º BPM'],
    ['126.013', '123464-0', 'Eduardo Lima', 'Lima', '1º Sargento', 'Praça', '', 'Ótimo', '15º BPM'],
    ['126.548', '123465-9', 'Bianca Teixeira', 'Teixeira', 'Subtenente', 'Praça Especial', '', 'Bom', '16º BPM'],
    ['127.091', '123466-7', 'Thiago Araujo', 'Araujo', 'Capitão', 'Oficial Intermediário', 'Oficial', '', '17º BPM'],
    ['127.636', '123467-5', 'Larissa Freitas', 'Freitas', 'Major', 'Oficial Superior', 'Oficial', '', '18º BPM'],
    ['128.074', '123468-3', 'Marcelo Pinto', 'Pinto', 'Cabo', 'Praça', '', 'Bom', '19º BPM'],
    ['128.519', '123469-1', 'Vanessa Duarte', 'Duarte', 'Soldado', 'Praça', '', 'Bom', '20º BPM']
  ]
};
