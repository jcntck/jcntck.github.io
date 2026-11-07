# Spec Delta

## Purpose

Permitir que o leitor registre onde parou em cada mangá e consulte quanto tempo passou desde a leitura para decidir livremente quando retomar a obra.

## ADDED Requirements

### Requirement: Registrar o ponto de leitura
O sistema SHALL permitir cadastrar uma obra com título, último capítulo lido e data da leitura, atribuindo uma identificação estável ao registro.

#### Scenario: Cadastrar leitura anterior
- **WHEN** o leitor informa um título, capítulo “1130” e data passada válida e confirma o cadastro
- **THEN** o sistema solicita a gravação desse registro e o inclui na biblioteca após a confirmação do armazenamento
- **AND** preserva a data informada em vez de substituí-la pela data do cadastro

#### Scenario: Identificadores de capítulos especiais
- **WHEN** o leitor informa um capítulo como “12.5” ou “Extra 1”
- **THEN** o sistema aceita esse identificador como último capítulo lido

### Requirement: Validar os dados da leitura
O sistema MUST exigir título e capítulo não vazios e uma data de leitura válida que não esteja no futuro, considerando o dia local do leitor. Dados inválidos MUST NOT ser enviados ao armazenamento.

#### Scenario: Campos obrigatórios ausentes
- **WHEN** o leitor tenta salvar um registro com título ou capítulo vazio após remover espaços nas extremidades
- **THEN** o sistema aponta o campo inválido e mantém os outros valores preenchidos
- **AND** não solicita a gravação

#### Scenario: Data inválida ou futura
- **WHEN** o leitor tenta salvar uma data inexistente ou posterior ao dia local atual
- **THEN** o sistema informa o problema e impede a gravação

### Requirement: Corrigir uma leitura sem alterar sua data implicitamente
O sistema SHALL permitir corrigir título, capítulo e data de um registro existente. A data da leitura MUST mudar somente quando o leitor a alterar explicitamente.

#### Scenario: Corrigir título
- **WHEN** o leitor altera apenas o título de uma obra
- **THEN** o sistema preserva o capítulo e a data de leitura anteriores

#### Scenario: Registrar um capítulo recém-lido
- **WHEN** o leitor altera o capítulo e informa uma nova data de leitura
- **THEN** o sistema grava ambos os valores após confirmação e preserva a identificação da obra

### Requirement: Listar a biblioteca com estado vazio
O sistema SHALL mostrar as obras com título, último capítulo, data da leitura em formato brasileiro e tempo decorrido em português. Uma biblioteca sem obras SHALL apresentar uma indicação de vazio e uma ação de cadastro.

#### Scenario: Biblioteca carregada
- **WHEN** uma biblioteca com obras termina de carregar
- **THEN** cada obra apresenta título, último capítulo, data da leitura e mensagem de tempo decorrido

#### Scenario: Biblioteca vazia
- **WHEN** uma biblioteca válida sem obras termina de carregar
- **THEN** o sistema informa que ainda não há mangás cadastrados e oferece cadastrar o primeiro

### Requirement: Exibir o tempo desde a leitura
O sistema SHALL calcular o tempo decorrido a partir da data de leitura e do dia local atual, usando dias antes de completar um mês, meses completos antes de completar um ano e anos completos a partir de um ano. O texto SHALL respeitar singular e plural e ser recalculado ao reabrir a aplicação e ao mudar o dia enquanto ela estiver aberta.

#### Scenario: Leitura de hoje
- **WHEN** a data de leitura corresponde ao dia local atual
- **THEN** a mensagem é “Lido hoje”

#### Scenario: Dias de leitura
- **WHEN** hoje é 19/11/2026 e a leitura ocorreu em 01/11/2026
- **THEN** a mensagem é “Lido há 18 dias”

#### Scenario: Meses de leitura
- **WHEN** hoje é 06/11/2026 e a leitura ocorreu em 06/04/2026
- **THEN** a mensagem é “Lido há 7 meses”

#### Scenario: Anos de leitura
- **WHEN** hoje é 06/11/2026 e a leitura ocorreu em 06/11/2024
- **THEN** a mensagem é “Lido há 2 anos”

#### Scenario: Virada do dia
- **WHEN** a aplicação permanece aberta durante a mudança do dia local
- **THEN** a mensagem passa a refletir o novo dia sem alterar a data de leitura armazenada

### Requirement: Preservar a decisão de retomar com o leitor
O sistema MUST tratar seis meses ou um ano como referência global do leitor, sem intervalo individual por obra, data de retorno, vencimento ou classificação de leitura atrasada. A listagem MUST permitir decidir pela informação do tempo decorrido, sem afirmar a existência de novos capítulos.

#### Scenario: Obra sem leitura há mais de um ano
- **WHEN** uma obra foi lida há mais de um ano
- **THEN** o sistema mostra o tempo decorrido e a data da leitura
- **AND** não cria agendamento, cobrança de retorno ou indicação de quantidade de capítulos novos

### Requirement: Acessar o módulo pelo shell
O sistema SHALL disponibilizar uma entrada “Mangás” no shell existente e permitir abrir diretamente e atualizar a rota do módulo no endereço publicado, usando a sessão e o armazenamento compartilhados.

#### Scenario: Entrar no módulo publicado
- **WHEN** o leitor acessa a entrada “Mangás” ou abre diretamente a rota do módulo
- **THEN** encontra o módulo funcional sem erro de roteamento
- **AND** a sessão e os registros carregados correspondem à conta conectada

### Requirement: Usar o módulo em celular e computador
O sistema SHALL oferecer formulário e listagem legíveis em celular e computador, com campos identificados, operação por teclado e mensagens claras de validação, carregamento e resultado de gravação.

#### Scenario: Registrar leitura no celular
- **WHEN** o leitor abre o módulo numa tela de celular
- **THEN** consegue consultar as obras e preencher título, capítulo e data sem controles cortados ou rolagem horizontal obrigatória

#### Scenario: Corrigir leitura pelo teclado
- **WHEN** o leitor percorre o formulário pelo teclado e envia dados inválidos
- **THEN** consegue identificar os campos, alcançar as ações e compreender o erro associado ao preenchimento
