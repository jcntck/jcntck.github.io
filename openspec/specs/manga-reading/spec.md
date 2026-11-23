# manga-reading Specification

## Purpose

Permitir que o leitor registre onde parou em cada mangá e consulte quanto tempo passou desde a leitura para decidir livremente quando retomar a obra.

## Requirements

### Requirement: Registrar o ponto de leitura
O sistema SHALL permitir cadastrar uma obra com título, último capítulo lido e data da leitura, atribuindo uma identificação estável ao registro.

#### Scenario: Cadastrar leitura anterior
- **WHEN** o leitor informa um título, capítulo “1130” e data passada válida e confirma o cadastro
- **THEN** o sistema prepara o registro no cache local com indicação de pendência
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
O sistema SHALL listar as obras com capa, título e indicador de sincronização. Último capítulo, data da leitura em formato brasileiro, nomes alternativos e tempo decorrido em português SHALL aparecer no formulário de edição. Uma biblioteca sem obras SHALL apresentar indicação de vazio e ação de cadastro.

#### Scenario: Biblioteca carregada
- **WHEN** uma biblioteca com obras termina de carregar
- **THEN** cada card apresenta capa, título, tag de última leitura e estado local/remoto, com detalhes acessíveis pela edição

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
O módulo MUST consumir o login e a sincronização compartilhados. O cadastro e a edição MUST aguardar uma leitura remota ou cache válido e preservar as demais seções e campos compatíveis. A biblioteca e a fila compartilhada SHALL ser persistidas no localStorage por identidade Google, restauradas somente após validar o login correspondente e preservadas em refresh/desconexão. Falha de cache MUST ser informada sem perder o estado em memória.

#### Scenario: Login restaurado e Drive desconectado
- **WHEN** o leitor abre o módulo após refresh com login válido
- **THEN** consulta a biblioteca em cache e usa Sincronizar para reconectar quando necessário, sem painel ou aviso redundante de desconexão nem popup automático
- **AND** uma biblioteca ainda desconhecida não é apresentada como vazia

#### Scenario: Falha ou conflito de envio
- **WHEN** a sincronização de uma leitura falha ou detecta divergência
- **THEN** o formulário e as alterações pendentes são preservados sem indicação de salvamento remoto
- **AND** o leitor pode reconectar para tentar novamente ou reler aplicando a mescla por obra e data individual

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
O módulo SHALL buscar por título principal ou nome em inglês opcional sem distinção de caixa/acentos. SHALL oferecer um único botão alternando “Mais recente” e “Mais antiga” pela data da última leitura, com título principal crescente e identificador como desempates. Ao abrir o módulo, o padrão SHALL ser “Mais recente”. Busca e ordem MUST NOT consultar Drive, modificar dados ou criar pendências.

#### Scenario: Buscar e ordenar obras
- **WHEN** o leitor busca um título e alterna a ordem pelo botão
- **THEN** somente as obras correspondentes são apresentadas pela data da última leitura na direção indicada
- **AND** limpar a busca restaura os demais registros sem alterar a ordem escolhida ou os dados persistidos

#### Scenario: Busca sem resultado
- **WHEN** o título buscado não corresponde a nenhuma obra
- **THEN** a interface informa que não houve resultado e oferece limpar a busca, distinguindo esse estado de biblioteca vazia

#### Scenario: Abrir e alternar as duas ordens
- **WHEN** o leitor abre a biblioteca e depois aciona o botão de ordenação
- **THEN** encontra “Mais recente” inicialmente, com as leituras mais recentes primeiro, e alterna para “Mais antiga”, com as mais antigas primeiro
- **AND** um novo acionamento volta a “Mais recente”, reiniciando a primeira página em cada alternância, sem seletor ou opções alfabéticas

#### Scenario: Distinguir leitura de edição e desempatar
- **WHEN** duas obras têm a mesma data de leitura ou uma obra antiga foi cadastrada ou corrigida hoje
- **THEN** a ordem usa somente a data da última leitura, com título principal crescente e identificador para desempate estável nas duas direções
- **AND** data técnica de atualização e instante de cadastro não substituem a data de leitura no critério de ordem

### Requirement: Centralizar a conexão e indicar seu estado
O módulo SHALL observar a sessão Drive compartilhada e oferecer sincronização manual, permitindo reconexão pelo mesmo clique explícito em Sincronizar. Gestão da conexão SHALL permanecer em Conexão, sem outro painel de autorização. Desconexão, expiração e erro SHALL alertar o leitor e preservar pendências; envio MUST aguardar autorização, conta e documento conferidos. Cache válido MUST permitir consulta e edição local.

#### Scenario: Desconectar ou expirar durante o uso
- **WHEN** a conexão fica indisponível durante o uso do módulo
- **THEN** o botão Sincronizar permanece o caminho de reconexão, sem painel redundante de desconexão ou dica temporal
- **AND** a aplicação não abre popup nem envia ou cria arquivo automaticamente

#### Scenario: Sincronizar a partir da biblioteca sem token válido
- **WHEN** o leitor autenticado aciona Sincronizar e o serviço de autorização está disponível, mas não há token Drive válido
- **THEN** o fluxo compartilhado solicita autorização para a conta do login e, se concluir, confere conta e documento antes de prosseguir com a sincronização solicitada
- **AND** não exige navegar à página Conexão nem repetir o clique após autorização bem-sucedida

#### Scenario: Não concluir a reconexão
- **WHEN** o leitor cancela, recusa, escolhe conta diferente ou o serviço de autorização falha
- **THEN** a interface informa o resultado recuperável, preserva login válido e pendências não superadas e permite nova tentativa
- **AND** nenhum envio pendente ocorre antes da conferência bem-sucedida da conta e do documento

### Requirement: Fechar o formulário e dar feedback ao salvar
Salvar uma leitura válida SHALL preparar a operação manual no cache local, fechar o formulário e mostrar feedback acessível distinguindo salvamento local de confirmação no Drive. O foco SHALL alcançar a obra salva, mesmo com uma busca anterior ativa. Campos inválidos MUST manter o formulário aberto. Animações discretas SHALL responder às ações e respeitar a preferência de movimento reduzido.

#### Scenario: Salvar uma leitura válida
- **WHEN** o leitor salva cadastro ou correção válida
- **THEN** o formulário fecha, a obra aparece com destaque e o foco vai para ela
- **AND** o feedback informa que está salva no navegador e pendente de sincronização, sem envio automático

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

### Requirement: Registrar e pesquisar o nome em inglês
O módulo SHALL permitir incluir, editar e remover um nome em inglês opcional, com trim, apresentado no formulário de edição como informação secundária. Registros sem o campo MUST permanecer compatíveis. A busca SHALL considerar ambos os nomes sem distinguir caixa/acentos nem duplicar resultados. A ordenação SHALL usar a data de leitura, com desempate pelo título principal e identificador, e MUST NOT haver tradução, pesquisa externa ou sincronização automática.

#### Scenario: Consultar por um nome alternativo
- **WHEN** o leitor informa um nome em inglês, salva localmente e pesquisa esse nome ou o título principal
- **THEN** encontra a mesma obra uma única vez com o título principal na listagem e o nome secundário no formulário de edição
- **AND** a consulta reinicia a paginação sem chamadas Drive e o nome é persistido somente ao Sincronizar

#### Scenario: Editar ou remover o nome em inglês
- **WHEN** o leitor altera ou esvazia o campo e salva
- **THEN** o nome é atualizado ou removido, preservando UUID, data, capa, scan e campos compatíveis

### Requirement: Editar pelo rodapé da obra
A ação Editar SHALL ser oferecida como botão de ícone na sobreposição da capa, junto a Excluir e à scan quando presente. O controle SHALL funcionar sem scan e ser revelado por hover, foco ou toque, respeitando edição local e estado da sessão. O nome acessível SHALL identificar a obra.

#### Scenario: Acessar edição no rodapé
- **WHEN** o leitor revela as ações da obra em computador ou celular
- **THEN** encontra o ícone Editar sobre a capa e pode abrir o mesmo formulário modal do cadastro por teclado ou toque
- **AND** os controles não são cortados nem causam rolagem horizontal por títulos longos

### Requirement: Destacar capas em cards verticais
A biblioteca SHALL usar grade responsiva de cards com capa vertical dominante na proporção 2:3, seguindo a referência visual. SHALL mostrar título, capa, tag de última leitura à esquerda e status de sincronização à direita no card; informações restantes SHALL aparecer no modal compartilhado de cadastro/edição. A grade SHALL ter múltiplas colunas em computador, duas em celular e uma em telas muito estreitas, sem controles cortados ou rolagem horizontal.

#### Scenario: Consultar a coleção em grade
- **WHEN** o leitor abre a biblioteca em computador ou celular
- **THEN** encontra cards verticais com imagens em destaque, título e status, com ações disponíveis por hover, foco ou toque
- **AND** cada capa mantém espaço reservado e proporção consistente ao carregar, falhar ou estar ausente

#### Scenario: Preservar os fluxos na nova composição
- **WHEN** o leitor busca, ordena, pagina ou edita na grade
- **THEN** mantém os comportamentos existentes, incluindo página/foco após salvar e sincronização exclusivamente manual
- **AND** nomes longos, rodapés e estados permanecem legíveis com teclado e movimento reduzido

#### Scenario: Exibir ações nos dois temas
- **WHEN** o leitor consulta uma obra com ou sem capa/scan nos temas claro e escuro
- **THEN** identifica o estado local/remoto pelo ícone acessível no canto superior direito e revela as ações Editar e Excluir sobre a capa
- **AND** o modal apresenta os dados completos com texto legível, sem depender apenas de cor nem indicar atraso

### Requirement: Consultar o cache sem depender do Drive
O sistema SHALL restaurar biblioteca e pendências do localStorage da conta autenticada sem requisições Drive, preservando busca, ordenação, paginação, datas e edição local. MUST manter uma única conexão/fila compartilhada e autorização Drive em memória. Logout, troca ou expiração de login MUST remover os dados visíveis; caches de outras contas MUST NOT aparecer. Cache inexistente/inválido MUST NOT ser tratado como biblioteca vazia confirmada.

#### Scenario: Consultar e editar depois de refresh
- **WHEN** o leitor recarrega com login válido e cache disponível, inclusive com edições pendentes
- **THEN** consulta e edita a biblioteca local sem reconectar ou consultar Drive
- **AND** pendências permanecem identificadas e somente Sincronizar após conexão envia dados

#### Scenario: Cache indisponível e isolamento
- **WHEN** o navegador bloqueia ou esgota localStorage, ou outra conta entra
- **THEN** falhas de persistência são informadas com fallback em memória e nenhum dado da outra conta é exibido
- **AND** tokens Drive não são persistidos no cache

### Requirement: Escolher a cópia com atualização mais recente
A sincronização SHALL mesclar obras exclusivas de cache/fila e Drive e comparar updatedAt individual para obras repetidas por UUID ou título normalizado. O registro local SHALL prevalecer somente quando estritamente mais recente; o remoto SHALL prevalecer se mais recente ou empatado. A data global MUST NOT descartar obras exclusivas. Exclusões SHALL usar marcadores datados e vencer registros mais antigos ou empatados. Consultar/restaurar MUST NOT alterar a data. Envio MUST preservar seções extras e recuperar gravações já confirmadas sem duplicar operações.

#### Scenario: Atualização local mais recente
- **WHEN** uma obra local tem edição posterior à mesma obra remota e o leitor solicita Sincronizar
- **THEN** a versão local da obra integra a união das bibliotecas preservando títulos exclusivos e demais seções, confirmada por releitura
- **AND** apenas conectar ou consultar não envia essa pendência

#### Scenario: Atualização remota mais recente ou empatada
- **WHEN** a mesma obra do Drive é mais recente ou tem a mesma data da edição local
- **THEN** a leitura/sincronização adota a versão remota dessa obra no cache sem descartar obras exclusivas; somente a união ainda ausente do Drive fica pendente de envio
- **AND** refresh posterior mantém a cópia escolhida sem precisar reler o Drive

### Requirement: Confirmar a exclusão de uma obra
Cada obra SHALL oferecer uma ação Excluir identificada de forma acessível. A exclusão MUST exigir confirmação com o título e informar que a remoção local ficará pendente de sincronização. Cancelar MUST preservar a obra e as pendências existentes. A confirmação SHALL ser operável por teclado, com foco controlado.

#### Scenario: Cancelar a exclusão
- **WHEN** o leitor solicita Excluir uma obra e cancela a confirmação, inclusive por Escape
- **THEN** a obra permanece intacta e nenhuma operação é criada ou enviada
- **AND** o foco retorna ao acionador da obra

#### Scenario: Solicitar exclusão pelo teclado
- **WHEN** o leitor alcança Excluir em uma obra com ou sem scan
- **THEN** identifica qual obra será removida e consegue confirmar ou cancelar por teclado
- **AND** abrir a confirmação não modifica a biblioteca nem consulta o Drive

### Requirement: Persistir a remoção local com sincronização manual
Confirmar a exclusão SHALL remover somente a obra escolhida da biblioteca válida da conta atual e persistir a seção consolidada como pendência manual. MUST preservar as demais obras, propriedades compatíveis e outras seções. A remoção MUST sobreviver ao refresh com cache disponível e não enviar dados automaticamente. Sem cache gravável, SHALL informar a limitação em memória.

#### Scenario: Excluir com Drive desconectado
- **WHEN** o leitor autenticado confirma a exclusão com biblioteca válida em cache e Drive desconectado
- **THEN** a obra desaparece da lista, a remoção fica salva no navegador e o feedback informa pendência de sincronização
- **AND** recarregar com a mesma conta restaura a lista sem a obra e conserva a pendência, sem solicitar Drive

#### Scenario: Excluir uma obra ainda não sincronizada
- **WHEN** o leitor confirma a exclusão de uma obra cadastrada ou editada localmente
- **THEN** a seção preparada para envio reflete a remoção e mantém as outras edições pendentes
- **AND** a remoção não é enviada mesmo se o automático estiver habilitado em Conexão

#### Scenario: Excluir o último resultado ou a última obra
- **WHEN** a remoção esvazia a página, os resultados da busca ou toda a biblioteca
- **THEN** a paginação é limitada a uma página válida e a interface distingue ausência de resultado de biblioteca vazia
- **AND** o foco alcança uma obra restante na página ou o título da biblioteca, com anúncio acessível da remoção

#### Scenario: Biblioteca desconhecida ou cache indisponível
- **WHEN** não há biblioteca válida carregada ou a seção é incompatível
- **THEN** a exclusão permanece indisponível sem substituir dados desconhecidos por vazio
- **AND** se somente a gravação de cache falhar após uma remoção válida, a UI preserva a pendência em memória e orienta sincronizar antes de recarregar

### Requirement: Confirmar a remoção no Drive sem excluir o documento
Sincronizar uma exclusão SHALL mesclar as obras e os marcadores de exclusão pela data individual e confirmar o resultado por releitura. MUST alterar somente a seção de mangás, sem excluir o documento Drive. Falhas SHALL preservar tentativas não superadas, incluindo sua identidade e data, e permitir repetição segura. A UI MUST distinguir remoção local de confirmação remota.

#### Scenario: Enviar a exclusão mais recente
- **WHEN** o leitor solicita Sincronizar e a remoção local é mais recente que a cópia remota
- **THEN** a releitura confirma a ausência da obra no Drive e atualiza o cache
- **AND** diagnóstico, outras seções, campos extras compatíveis e dados das obras restantes são preservados

#### Scenario: Perder a resposta do envio
- **WHEN** a resposta da sincronização da remoção é perdida ou há falha de rede
- **THEN** a UI não afirma confirmação remota e mantém a tentativa recuperável
- **AND** nova tentativa reconhece uma remoção já confirmada sem duplicar a operação

#### Scenario: Encontrar uma cópia remota mais recente ou empatada
- **WHEN** a releitura encontra uma edição da mesma obra estritamente posterior à exclusão local
- **THEN** a edição posterior da obra prevalece, sem descartar títulos exclusivos da biblioteca mesclada
- **AND** a interface informa a adoção remota, sem afirmar que a exclusão local foi confirmada se a obra reaparecer

### Requirement: Revelar ações sobre a capa
O card SHALL mostrar somente capa, título, tag de última leitura e indicador acessível de sincronização no canto superior direito, amarelo para pendência e check verde para confirmação. Hover, foco de teclado e toque na capa SHALL revelar uma sobreposição com escurecimento e botões de ícone Editar, Excluir e scan quando houver URL. As ações MUST permanecer operáveis por teclado, acompanhar as cores e estados do tema claro/escuro e respeitar movimento reduzido.

#### Scenario: Acionar no celular
- **WHEN** o leitor toca a capa
- **THEN** as ações aparecem com o mesmo efeito visual do computador e podem ser acionadas sem navegar pela imagem

### Requirement: Compartilhar modal de cadastro e edição
Cadastro e edição SHALL usar o mesmo formulário em modal acessível, com todos os campos existentes e, na edição, data, tempo completo e opção de excluir. Escape e fechar SHALL descartar somente o formulário não salvo e devolver foco. Salvar SHALL preservar o fluxo manual e foco na obra; excluir SHALL exigir confirmação antes da remoção.

#### Scenario: Excluir pela edição
- **WHEN** o leitor abre Editar e escolhe Excluir obra
- **THEN** pode cancelar e permanecer no modal, ou confirmar e retornar à biblioteca com remoção pendente

### Requirement: Animar a capa e seus controles como um conjunto
A animação de hover SHALL mover conjuntamente a capa, a sobreposição, o acionador e os indicadores, mantendo alinhamento durante toda a transição. A tag de última leitura SHALL ocupar o canto superior esquerdo sem sobrepor o estado de sincronização à direita, usando a data real e o dia local atual. A biblioteca SHALL manter uma legenda visível das três faixas de tempo, com as mesmas cores das tags. Movimento reduzido MUST desativar o deslocamento.

#### Scenario: Entrar e sair do hover
- **WHEN** o leitor move o ponteiro sobre a capa e depois o retira
- **THEN** imagem e sobreposição mantêm os mesmos limites durante a animação e as duas tags acompanham o conjunto
