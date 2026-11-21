# Spec Delta

## ADDED Requirements

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
Sincronizar uma exclusão SHALL usar a política existente de comparação de atualização local/remota e confirmar o resultado por releitura. MUST alterar somente a seção de mangás, sem excluir o documento Drive. Falhas SHALL preservar tentativas não superadas, incluindo sua identidade e data, e permitir repetição segura. A UI MUST distinguir remoção local de confirmação remota.

#### Scenario: Enviar a exclusão mais recente
- **WHEN** o leitor solicita Sincronizar e a remoção local é mais recente que a cópia remota
- **THEN** a releitura confirma a ausência da obra no Drive e atualiza o cache
- **AND** diagnóstico, outras seções, campos extras compatíveis e dados das obras restantes são preservados

#### Scenario: Perder a resposta do envio
- **WHEN** a resposta da sincronização da remoção é perdida ou há falha de rede
- **THEN** a UI não afirma confirmação remota e mantém a tentativa recuperável
- **AND** nova tentativa reconhece uma remoção já confirmada sem duplicar a operação

#### Scenario: Encontrar uma cópia remota mais recente ou empatada
- **WHEN** a releitura encontra atualização remota mais recente ou empatada com a exclusão local
- **THEN** a cópia remota prevalece sem escrita e a pendência superada é removida conforme a política existente
- **AND** a interface informa a adoção remota, sem afirmar que a exclusão local foi confirmada se a obra reaparecer

## MODIFIED Requirements

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
- **THEN** um alerta apresenta o estado e um link para Conexão, sem outro painel de autorização
- **AND** a aplicação não abre popup nem envia ou cria arquivo automaticamente

#### Scenario: Sincronizar a partir da biblioteca sem token válido
- **WHEN** o leitor autenticado aciona Sincronizar e o serviço de autorização está disponível, mas não há token Drive válido
- **THEN** o fluxo compartilhado solicita autorização para a conta do login e, se concluir, confere conta e documento antes de prosseguir com a sincronização solicitada
- **AND** não exige navegar à página Conexão nem repetir o clique após autorização bem-sucedida

#### Scenario: Não concluir a reconexão
- **WHEN** o leitor cancela, recusa, escolhe conta diferente ou o serviço de autorização falha
- **THEN** a interface informa o resultado recuperável, preserva login válido e pendências não superadas e permite nova tentativa
- **AND** nenhum envio pendente ocorre antes da conferência bem-sucedida da conta e do documento

### Requirement: Registrar e pesquisar o nome em inglês
O módulo SHALL permitir incluir, editar e remover um nome em inglês opcional, com trim, apresentado abaixo do título principal como informação secundária. Registros sem o campo MUST permanecer compatíveis. A busca SHALL considerar ambos os nomes sem distinguir caixa/acentos nem duplicar resultados. A ordenação SHALL usar a data de leitura, com desempate pelo título principal e identificador, e MUST NOT haver tradução, pesquisa externa ou sincronização automática.

#### Scenario: Consultar por um nome alternativo
- **WHEN** o leitor informa um nome em inglês, salva localmente e pesquisa esse nome ou o título principal
- **THEN** encontra a mesma obra uma única vez com o título principal e o nome secundário na listagem
- **AND** a consulta reinicia a paginação sem chamadas Drive e o nome é persistido somente ao Sincronizar

#### Scenario: Editar ou remover o nome em inglês
- **WHEN** o leitor altera ou esvazia o campo e salva
- **THEN** o nome é atualizado ou removido, preservando UUID, data, capa, scan e campos compatíveis

### Requirement: Destacar capas em cards verticais
A biblioteca SHALL usar grade responsiva de cards com capa vertical dominante na proporção 2:3, seguindo a referência visual. SHALL preservar título, nome em inglês, capítulo, data, tempo completo em três faixas e ações scan/Editar/Excluir. A grade SHALL ter múltiplas colunas em computador, duas em celular e uma em telas muito estreitas, sem controles cortados ou rolagem horizontal.

#### Scenario: Consultar a coleção em grade
- **WHEN** o leitor abre a biblioteca em computador ou celular
- **THEN** encontra cards verticais com imagens em destaque, seguidos dos dados e ações existentes
- **AND** cada capa mantém espaço reservado e proporção consistente ao carregar, falhar ou estar ausente

#### Scenario: Preservar os fluxos na nova composição
- **WHEN** o leitor busca, ordena, pagina ou edita na grade
- **THEN** mantém os comportamentos existentes, incluindo página/foco após salvar e sincronização exclusivamente manual
- **AND** nomes longos, rodapés e estados permanecem legíveis com teclado e movimento reduzido

#### Scenario: Exibir ações nos dois temas
- **WHEN** o leitor consulta uma obra com ou sem capa/scan nos temas claro e escuro
- **THEN** consegue identificar o tempo completo de leitura, o estado local/remoto e as ações Editar e Excluir
- **AND** as faixas de tempo mantêm texto legível sem depender apenas de cor nem indicar atraso
