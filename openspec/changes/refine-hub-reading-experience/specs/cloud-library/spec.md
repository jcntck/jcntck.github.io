# Spec Delta

## ADDED Requirements

### Requirement: Compartilhar a retomada explícita de autorização
O sistema SHALL oferecer o mesmo fluxo de autorização e sincronização aos consumidores do armazenamento. Conectar ou Reconectar isoladamente MUST apenas conferir a conta e carregar o documento, sem enviar pendências. Sincronizar SHALL obter autorização se necessário e continuar o envio solicitado somente após conferência remota bem-sucedida. O fluxo MUST serializar autorizações e envios.

#### Scenario: Conectar sem enviar alterações
- **WHEN** o usuário conecta ou reconecta o Drive em Conexão com alterações pendentes
- **THEN** a conta e o documento são conferidos e as pendências ainda aplicáveis permanecem aguardando sincronização
- **AND** a conexão isolada não faz gravação mesmo se havia automação habilitada

#### Scenario: Solicitar sincronização durante autorização ou envio
- **WHEN** o usuário repete Sincronizar ou outro consumidor solicita a ação enquanto já há autorização ou envio em andamento
- **THEN** a aplicação não abre popups nem inicia gravações concorrentes para a mesma sessão
- **AND** os consumidores exibem um estado compartilhado coerente de progresso e conclusão

#### Scenario: Carregar o serviço de autorização
- **WHEN** o usuário precisa autorizar, mas o serviço Google ainda está carregando ou falhou
- **THEN** a interface informa o estado e oferece uma ação explícita utilizável quando o serviço estiver pronto
- **AND** concluir o carregamento não abre um popup sem novo acionamento do usuário

### Requirement: Distinguir confirmações temporárias de atenção persistente
Confirmações de conexão, leitura e sincronização sem pendências ou problemas SHALL aparecer em verde por três segundos. Progresso SHALL usar estilo neutro. Pendências, cache indisponível, erros e conflitos SHALL permanecer visíveis enquanto aplicáveis. Nova confirmação SHALL reaparecer e reiniciar seu prazo; renderizações alheias MUST NOT prolongá-lo. Descartar o aviso MUST NOT alterar a fila ou a conexão.

#### Scenario: Concluir e dispensar uma confirmação
- **WHEN** uma operação termina com sucesso sem pendências ou problemas
- **THEN** a confirmação verde desaparece após três segundos e os controles permanecem disponíveis

#### Scenario: Exigir atenção após um sucesso
- **WHEN** uma pendência, falha ou conflito substitui a confirmação
- **THEN** o estado de atenção fica visível e o timer anterior não o remove

### Requirement: Mesclar biblioteca por obra
O sistema SHALL mesclar modules.mangas por UUID ou título normalizado, preservando obras exclusivas de ambos os lados mesmo quando a data global do remoto é maior. Para repetições SHALL usar o registro completo com updatedAt mais recente; empate SHALL favorecer Drive. Conexão, releitura e envio SHALL aplicar a mesma regra antes de substituir conteúdo local. Dados incompatíveis SHALL bloquear a mesclagem sem descartar pendências. Outros módulos SHALL ser preservados.

#### Scenario: Bibliotecas divergentes e documento remoto mais recente
- **WHEN** cache contém A e B e Drive contém uma versão mais recente de A e uma obra C, com documento remoto mais recente
- **THEN** a biblioteca mesclada contém A atualizada, B e C
- **AND** conectar mantém a mescla pendente sem gravar; sincronizar grava e confirma a união por releitura

#### Scenario: Título repetido com IDs diferentes
- **WHEN** duas obras possuem o mesmo título após normalizar maiúsculas e espaços, com UUIDs diferentes
- **THEN** apenas a versão com updatedAt mais recente é apresentada; em empate prevalece Drive

#### Scenario: Exclusão explícita e cópia antiga
- **WHEN** uma exclusão datada é mesclada com registro anterior da mesma obra
- **THEN** a obra permanece excluída e o marcador é preservado no cache e no Drive
- **AND** ausência em um arquivo sem marcador não apaga obras exclusivas da outra cópia

#### Scenario: Resposta perdida ou fila posterior
- **WHEN** uma gravação mesclada perde a resposta ou há edição posterior em fila
- **THEN** a releitura recupera o resultado confirmado e mantém edições posteriores sem descartar obras independentes ou duplicar títulos

## MODIFIED Requirements

### Requirement: Coordenar sincronização com estado compartilhado
O sistema SHALL compartilhar identidade, conexão Drive e sincronização entre shell e consumidores, distinguindo pendência de sucesso remoto. Sincronizar SHALL obter autorização quando necessária, conferir conta e documento e só confirmar sucesso após conclusão remota. Sem pendência, SHALL apenas reler, sem criar arquivo ou alteração. Falha de autorização ou leitura MUST impedir envio e preservar pendências não superadas pela política de atualização.

#### Scenario: Preparar e enviar amostra técnica
- **WHEN** o usuário prepara uma amostra e depois escolhe sincronizar
- **THEN** a alteração passa por pendente, envio e confirmação remota, sem confirmar gravação ao apenas preparar
- **AND** a releitura retorna o mesmo identificador, preservando as demais seções

#### Scenario: Sincronizar sem conexão
- **WHEN** o usuário logado solicita Sincronizar sem autorização Drive válida
- **THEN** esse clique inicia a reconexão compartilhada e, se concluída com a mesma conta e documento válido, prossegue com a sincronização solicitada
- **AND** mantém o login e não envia dados antes de conferir conta e documento

#### Scenario: Falha ou divergência
- **WHEN** a sincronização falha ou detecta revisão remota divergente
- **THEN** o estado informa erro ou conflito e mantém a tentativa não superada pela política de atualização até nova ação explícita
- **AND** obras são mescladas pela data individual, preservando títulos exclusivos; uma versão remota mais recente ou empatada da mesma obra é adotada sem declarar enviada uma alteração local superada

#### Scenario: Editar durante envio
- **WHEN** uma nova alteração é preparada enquanto a anterior está sendo enviada
- **THEN** a confirmação da anterior não descarta a nova alteração nem a apresenta como já salva

#### Scenario: Cancelar autorização ou falhar na leitura
- **WHEN** a autorização solicitada por Sincronizar é cancelada, recusada, retorna outra conta ou não permite carregar um documento válido
- **THEN** nenhuma escrita é feita e as pendências locais permanecem recuperáveis
- **AND** a interface distingue falha de autorização/leitura de sincronização confirmada e permite nova tentativa explícita

#### Scenario: Sincronizar sem alterações pendentes
- **WHEN** o usuário solicita Sincronizar sem pendências, inclusive após obter nova autorização
- **THEN** a aplicação apresenta o resultado da leitura remota sem criar documento vazio ou nova operação
- **AND** não anuncia gravação de uma alteração que não foi enviada
