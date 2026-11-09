# Spec Delta

## Purpose

Permitir que o leitor registre onde parou em cada mangá e consulte quanto tempo passou desde a leitura para decidir livremente quando retomar a obra.

## ADDED Requirements

### Requirement: Registrar o ponto de leitura
O sistema SHALL permitir cadastrar uma obra com título, último capítulo lido e data da leitura, atribuindo uma identificação estável ao registro.

#### Scenario: Cadastrar leitura anterior
- **WHEN** o leitor informa um título, capítulo “1130” e data passada válida e confirma o cadastro
- **THEN** o sistema prepara o registro em memória com indicação de pendência
- **AND** somente após Sincronizar e a confirmação do armazenamento o apresenta como salvo no Drive
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
- **THEN** o sistema prepara ambos os valores para sincronização, preserva a identificação da obra e só informa salvamento remoto após confirmação

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

### Requirement: Sincronizar pelo estado compartilhado
O módulo MUST consumir o login e a sincronização compartilhados. O cadastro e a edição MUST aguardar uma leitura remota válida e preservar as demais seções e campos compatíveis. Pendências SHALL existir somente na aba, sem outra fila ou persistência offline, com aviso de descarte ao atualizar ou sair.

#### Scenario: Login restaurado e Drive desconectado
- **WHEN** o leitor abre o módulo após refresh com login válido
- **THEN** encontra uma ação explícita de conexão Drive sem popup automático
- **AND** uma biblioteca ainda desconhecida não é apresentada como vazia

#### Scenario: Falha ou conflito de envio
- **WHEN** a sincronização de uma leitura falha ou detecta divergência
- **THEN** o formulário e as alterações pendentes são preservados sem indicação de salvamento remoto
- **AND** o leitor pode reconectar para tentar novamente ou reler com confirmação de descarte

#### Scenario: Envio manual solicitado ao fim das edições
- **WHEN** o leitor prepara uma leitura após carregar a biblioteca
- **THEN** cadastrar, corrigir, buscar e ordenar não enviam requisições ao Drive
- **AND** somente a ação explícita Sincronizar envia a seção consolidada, mesmo se o automático estiver ligado em Conexão
- **AND** a operação modifica somente `modules.mangas`, preservando diagnóstico, outros módulos e propriedades extras

### Requirement: Registrar o link da scan
O módulo SHALL permitir incluir, alterar e remover um link opcional HTTP/HTTPS absoluto da scan, sem credenciais na URL. Registros anteriores sem link MUST permanecer compatíveis. Links válidos SHALL abrir em nova aba, sem enviar token Drive ou referenciador.

#### Scenario: Incluir e remover a scan
- **WHEN** o leitor prepara uma obra com um link válido e depois solicita Sincronizar
- **THEN** o link é preservado junto à obra e pode ser aberto na listagem
- **AND** esvaziar o campo em nova edição remove o link sem alterar a data implicitamente

#### Scenario: URL inválida
- **WHEN** o leitor informa URL relativa, protocolo executável ou credenciais no link
- **THEN** o formulário aponta o erro e mantém os demais campos sem preparar ou enviar a alteração

### Requirement: Verificar o link sob solicitação
O módulo SHALL oferecer uma verificação HTTP manual do link por requisição HEAD com timeout de 8 segundos, sem cookies, credenciais, corpo de resposta ou polling. O resultado SHALL existir somente na aba e MUST NOT disparar sincronização. Resposta observável SHALL mostrar o código HTTP; falha inconclusiva MUST NOT ser apresentada como site fora do ar.

#### Scenario: Resposta observável
- **WHEN** o leitor solicita Verificar link e o navegador permite ler a resposta
- **THEN** a interface mostra o código HTTP e um sinal textual/visual de sucesso ou erro HTTP
- **AND** não realiza fallback automático quando HEAD é recusado

#### Scenario: Restrição do navegador ou rede
- **WHEN** CORS, rede, timeout, conteúdo misto ou resposta opaca impedem ler o resultado
- **THEN** a interface informa que não foi possível verificar e permite abrir o link para conferir
- **AND** não classifica a scan como indisponível nem reutiliza o resultado após mudar o link

### Requirement: Buscar e ordenar a biblioteca localmente
O módulo SHALL buscar por título sem distinção de caixa/acentos e ordenar por título crescente/decrescente ou data de leitura mais antiga/recente, com desempate estável. O padrão SHALL ser título crescente. Essas ações MUST NOT fazer requisições ao Drive, modificar dados ou criar pendências.

#### Scenario: Buscar e ordenar obras
- **WHEN** o leitor busca um título e escolhe nome ou data
- **THEN** somente as obras correspondentes são apresentadas na ordem escolhida
- **AND** limpar a busca restaura os demais registros e a ordem persistida permanece intacta

#### Scenario: Busca sem resultado
- **WHEN** o título buscado não corresponde a nenhuma obra
- **THEN** a interface informa que não houve resultado e oferece limpar a busca, distinguindo esse estado de biblioteca vazia
