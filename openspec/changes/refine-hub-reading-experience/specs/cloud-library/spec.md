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
- **AND** uma cópia remota mais recente ou empatada é adotada conforme a política existente, sem declarar enviada uma alteração local que foi superada

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
