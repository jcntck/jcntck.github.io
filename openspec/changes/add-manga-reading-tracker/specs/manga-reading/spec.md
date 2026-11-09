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
O sistema SHALL calcular o tempo decorrido a partir da data de leitura e do dia local atual, apresentando conjuntamente anos, meses e dias completos de calendário, inclusive unidades zeradas. Meses completos totais usam o aniversário do dia original ajustado ao fim do mês; anos e meses são sua divisão por 12, e os dias são o restante civil desde esse aniversário. O texto SHALL respeitar singular e plural e ser recalculado ao reabrir a aplicação e ao mudar o dia enquanto ela estiver aberta.

#### Scenario: Leitura de hoje
- **WHEN** a data de leitura corresponde ao dia local atual
- **THEN** a mensagem é “Lido há 0 anos 0 meses 0 dias”

#### Scenario: Dias de leitura
- **WHEN** hoje é 19/11/2026 e a leitura ocorreu em 01/11/2026
- **THEN** a mensagem é “Lido há 0 anos 0 meses 18 dias”

#### Scenario: Meses de leitura
- **WHEN** hoje é 06/11/2026 e a leitura ocorreu em 06/04/2026
- **THEN** a mensagem é “Lido há 0 anos 7 meses 0 dias”

#### Scenario: Anos de leitura
- **WHEN** hoje é 06/11/2026 e a leitura ocorreu em 06/11/2024
- **THEN** a mensagem é “Lido há 2 anos 0 meses 0 dias”

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
- **THEN** encontra um alerta de desconexão com link para a página Conexão, sem painel OAuth ou popup no módulo
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
O módulo SHALL permitir incluir, alterar e remover um link opcional HTTP/HTTPS absoluto da scan e seu nome/label opcional, sem credenciais na URL. Registros anteriores sem link ou nome MUST permanecer compatíveis. O texto do link SHALL usar o nome informado ou o hostname como alternativa. Links válidos SHALL abrir em nova aba, sem enviar token Drive ou referenciador.

#### Scenario: Incluir e remover a scan
- **WHEN** o leitor prepara uma obra com um link válido e depois solicita Sincronizar
- **THEN** o link e seu nome são preservados junto à obra e o nome identifica o link na listagem
- **AND** esvaziar o endereço em nova edição remove o link e o nome associado sem alterar a data implicitamente

#### Scenario: URL inválida
- **WHEN** o leitor informa URL relativa, protocolo executável ou credenciais no link
- **THEN** o formulário aponta o erro e mantém os demais campos sem preparar ou enviar a alteração

### Requirement: Abrir a scan sem consultar disponibilidade
O módulo MUST apenas apresentar o link da scan e seu nome/hostname para abertura pelo leitor; essa regra não impede exibir a URL escolhida explicitamente no campo separado de capa como imagem. MUST NOT executar verificações HTTP, fetch, HEAD ou polling da scan ao abrir o módulo, salvar, buscar, ordenar ou interagir com a lista.

#### Scenario: Consultar a origem da leitura
- **WHEN** o leitor consulta a biblioteca com scan cadastrada
- **THEN** encontra um link identificado pelo nome da scan ou hostname e pode abri-lo em nova aba
- **AND** a aplicação não solicita o endereço da scan nem mostra controle ou estado de verificação

### Requirement: Buscar e ordenar a biblioteca localmente
O módulo SHALL buscar por título sem distinção de caixa/acentos e ordenar por título crescente/decrescente ou data de leitura mais antiga/recente, com desempate estável. O padrão SHALL ser título crescente. Essas ações MUST NOT fazer requisições ao Drive, modificar dados ou criar pendências.

#### Scenario: Buscar e ordenar obras
- **WHEN** o leitor busca um título e escolhe nome ou data
- **THEN** somente as obras correspondentes são apresentadas na ordem escolhida
- **AND** limpar a busca restaura os demais registros e a ordem persistida permanece intacta

#### Scenario: Busca sem resultado
- **WHEN** o título buscado não corresponde a nenhuma obra
- **THEN** a interface informa que não houve resultado e oferece limpar a busca, distinguindo esse estado de biblioteca vazia

### Requirement: Centralizar a conexão e indicar seu estado
O módulo SHALL observar a sessão Drive compartilhada, apresentar apenas estado e sincronização manual e encaminhar gestão/reconexão à página Conexão. Desconexão, expiração e erro SHALL alertar o leitor, preservar pendências e bloquear envio/edição até nova leitura válida.

#### Scenario: Desconectar ou expirar durante o uso
- **WHEN** a conexão fica indisponível durante o uso do módulo
- **THEN** um alerta apresenta o estado e um link para Conexão, sem outro painel de autorização
- **AND** a aplicação não abre popup nem envia ou cria arquivo automaticamente

### Requirement: Fechar o formulário e dar feedback ao salvar
Salvar uma leitura válida SHALL preparar a operação manual em memória, fechar o formulário e mostrar feedback acessível distinguindo salvamento na aba de confirmação no Drive. O foco SHALL alcançar a obra salva, mesmo com uma busca anterior ativa. Campos inválidos MUST manter o formulário aberto. Animações discretas SHALL responder às ações e respeitar a preferência de movimento reduzido.

#### Scenario: Salvar uma leitura válida
- **WHEN** o leitor salva cadastro ou correção válida
- **THEN** o formulário fecha, a obra aparece com destaque e o foco vai para ela
- **AND** o feedback informa que está salva nesta aba e pendente de sincronização, sem envio automático

#### Scenario: Campos inválidos e movimento reduzido
- **WHEN** o leitor tenta salvar dados inválidos com preferência por movimento reduzido
- **THEN** o formulário permanece aberto com erros associados aos campos e as animações/transições ficam desativadas

### Requirement: Apresentar capas por URL
O módulo SHALL permitir incluir, editar e remover capa opcional por URL HTTPS absoluta sem credenciais. Registros sem capa MUST permanecer compatíveis. A imagem SHALL ser exibida diretamente com carregamento preguiçoso, dimensões reservadas e alternativa visual acessível para ausência ou falha, sem exigir CORS para leitura de pixels, proxy, upload, cópia ou verificação HTTP. Somente o endereço SHALL ser persistido pelo envio manual existente.

#### Scenario: Capa válida e alteração do endereço
- **WHEN** o leitor salva uma capa HTTPS direta
- **THEN** a página da obra mostra a imagem sem fetch/HEAD ou canvas e sincroniza somente a URL quando solicitado
- **AND** trocar ou remover o endereço mantém identificação, data e demais propriedades

#### Scenario: Imagem bloqueada ou ausente
- **WHEN** a capa não existe, falha ou o servidor bloqueia hotlink
- **THEN** a biblioteca mantém os controles e o layout e mostra uma alternativa acessível, sem tentativas em loop

### Requirement: Paginar a biblioteca localmente
O módulo SHALL paginar os resultados já buscados/ordenados em 12 obras, com anterior/próxima/números, total e intervalo exibido. Paginação MUST NOT consultar Drive, alterar registros ou criar pendências. Busca e ordem SHALL reiniciar na primeira página. Salvar SHALL abrir a página da obra e focá-la; diminuir a lista SHALL limitar a página para um intervalo válido.

#### Scenario: Biblioteca com 126 obras
- **WHEN** o leitor carrega 126 obras
- **THEN** vê no máximo 12 registros por página, 11 páginas no total e 6 registros na última
- **AND** apenas as imagens da página exibida são montadas e navegar não faz chamadas Drive

#### Scenario: Filtrar ou salvar fora da primeira página
- **WHEN** o leitor busca/ordena ou salva uma obra em uma biblioteca paginada
- **THEN** a busca/ordenação abre a primeira página e salvar abre a página da obra, fecha o formulário e move o foco para ela
- **AND** os dados e a ordenação persistida permanecem intactos até edição explícita

### Requirement: Graduar o destaque do tempo de leitura
O tempo completo SHALL ter no máximo três faixas de destaque crescente: menos de 6 meses completos, de 6 meses a menos de 12 e a partir de 12 meses. O texto SHALL permanecer legível e mostrar anos/meses/dias em todas as faixas, sem depender apenas de cor nem indicar atraso.

#### Scenario: Tempo completo e cortes do destaque
- **WHEN** hoje é 09/11/2026 e a leitura foi em 25/07/2024
- **THEN** a mensagem é “Lido há 2 anos 3 meses 15 dias” com destaque forte
- **AND** uma leitura com menos de 6 meses usa destaque discreto e, ao completar 6 meses, passa ao intermediário sem alterar sua data
