# google-sign-in Specification

## Purpose

Manter identidade Google entre visitas ao hub por prazo limitado, coordenando login, autorização Drive e sincronização sem misturar credenciais ou dados entre contas.

## Requirements

### Requirement: Entrar sem conceder acesso ao Drive
O sistema SHALL oferecer entrada explícita com Google, apresentar a conta após autenticação válida e permitir nova tentativa após cancelamento ou indisponibilidade. Entrar ou restaurar login MUST NOT solicitar acesso ao Drive nem criar, ler ou alterar arquivos.

#### Scenario: Login válido sem armazenamento
- **WHEN** o usuário conclui a entrada com Google
- **THEN** a sessão apresenta a conta e libera a navegação pessoal
- **AND** nenhuma permissão ou operação Drive é solicitada

#### Scenario: Entrada não concluída
- **WHEN** o usuário cancela ou não consegue concluir a entrada
- **THEN** permanece sem sessão autenticada e pode tentar novamente

### Requirement: Restaurar identidade válida após refresh
O sistema SHALL persistir a sessão de login pelo mecanismo gerenciado de autenticação e restaurá-la após refresh ou reabertura na mesma origem. A restauração MUST confirmar a validade da sessão antes de liberar rotas pessoais; um perfil ou indicador local isolado não comprova autenticação.

#### Scenario: Restaurar sessão existente
- **WHEN** o usuário reabre a aplicação com sessão persistida válida e dentro do prazo
- **THEN** a identidade é restaurada e a rota pessoal atual pode ser retomada sem nova entrada explícita
- **AND** o Drive permanece desconectado até autorização por ação do usuário

#### Scenario: Restauração com rede indisponível
- **WHEN** a aplicação não consegue verificar a sessão restaurada por falha transitória
- **THEN** apresenta estado de verificação ou erro recuperável sem expor conteúdo pessoal como autenticado
- **AND** permite repetir a verificação sem destruir imediatamente uma sessão potencialmente válida

#### Scenario: Credencial inválida ou revogada
- **WHEN** o serviço de autenticação rejeita a sessão restaurada
- **THEN** o sistema encerra o estado autenticado e oferece nova entrada

### Requirement: Limitar a sessão a trinta dias
O sistema SHALL encerrar a sessão local até 30 dias após a autenticação inicial, com verificação na abertura, retorno à aba e antes de ações pessoais. Refresh, uso ou renovação de credencial MUST NOT reiniciar o prazo. Logout e invalidação detectada MUST encerrar antes desse limite.

#### Scenario: Prazo ainda válido
- **WHEN** uma sessão válida é restaurada antes de completar 30 dias da entrada
- **THEN** conserva o prazo original sem somar outro período

#### Scenario: Limite alcançado
- **WHEN** a sessão completa 30 dias, inclusive durante suspensão ou fechamento da aba
- **THEN** a próxima verificação encerra login e Drive, limpa os dados privados e exige nova entrada

#### Scenario: Renovação de token do aplicativo
- **WHEN** o serviço renova uma credencial da sessão existente
- **THEN** o instante da autenticação original continua determinando o prazo máximo

### Requirement: Informar indisponibilidade de persistência
O sistema MUST informar quando o navegador não permite persistir a autenticação. Nesse caso, pode oferecer login temporário em memória, mas MUST NOT afirmar que a sessão sobreviverá ao refresh ou durará 30 dias.

#### Scenario: Armazenamento bloqueado
- **WHEN** a persistência necessária é bloqueada pelo navegador
- **THEN** o usuário recebe informação do modo temporário antes de depender da restauração

### Requirement: Separar sessão de login da autorização de armazenamento
O sistema SHALL obter autorização Drive somente por ação explícita de usuário logado, mantendo arquivos limitados a `drive.file`. Expiração, revogação, recusa, desconexão ou perda da credencial Drive no refresh MUST NOT encerrar um login válido. Tokens Drive MUST permanecer somente em memória.

#### Scenario: Recusar ou expirar Drive
- **WHEN** a autorização Drive é recusada ou expira enquanto o login permanece válido
- **THEN** o usuário continua logado com sincronização indisponível até reconectar

#### Scenario: Refresh com Drive conectado
- **WHEN** o usuário recarrega a página
- **THEN** o login pode ser restaurado, mas a aplicação não reutiliza um token Drive persistido nem abre consentimento automaticamente

### Requirement: Vincular Drive à identidade do login
O sistema MUST conferir pelo identificador Google estável que a autorização Drive pertence à mesma conta do login antes de acessar documento ou habilitar escrita. Uma conta diferente MUST ser recusada sem expor dados, links ou tentativas de outra conta.

#### Scenario: Autorizar B com login A
- **WHEN** a sessão de login é de A e a autorização Drive corresponde a B
- **THEN** a nova credencial é descartada sem acesso aos documentos
- **AND** o usuário pode reconectar a conta correta ou trocar login explicitamente

### Requirement: Encerrar ou trocar conta sem resíduos
O sistema SHALL permitir saída e troca explícitas, removendo credenciais em memória, documentos, links, tentativas e agendamentos visíveis da conta anterior. O cache da biblioteca SHALL permanecer isolado por identidade Google e só retornar à UI após validar novo login dessa mesma identidade. A alteração de login MUST propagar-se às abas da origem. Respostas antigas MUST NOT restaurar estado encerrado nem usar credenciais de outra conta.

#### Scenario: Sair em uma aba
- **WHEN** o usuário escolhe sair numa aba
- **THEN** as outras abas retiram acesso pessoal e interrompem operações da sessão anterior
- **AND** o cache da biblioteca não é exibido sem login correspondente e a saída não revoga consentimento Google

#### Scenario: Trocar A por B durante operação
- **WHEN** uma operação de A termina após a troca para B
- **THEN** o resultado e cache de A não aparecem em B nem utilizam credenciais de B

### Requirement: Restringir a persistência de credenciais
O sistema MUST permitir somente a persistência de login gerenciada pelo SDK, sem cópias adicionais de credenciais pelo hub. Tokens Drive e client secret MUST NOT ser persistidos ou incluídos em logs, URLs e pacote publicado. Dados privados da biblioteca e operações SHALL poder ser persistidos em cache local por conta, sem tokens e sem entrar no artefato público. Formulário ainda não salvo SHALL permanecer volátil.

#### Scenario: Inspecionar armazenamento e publicação
- **WHEN** são inspecionados navegador e pacote publicado
- **THEN** pode existir login persistido pelo SDK e cache de biblioteca por identidade, sem tokens Drive ou segredos OAuth
- **AND** logs, URLs e artefato público não contêm credenciais nem conteúdo privado da biblioteca

#### Scenario: Recarregar com tentativa pendente
- **WHEN** a aba é recarregada com cache válido e uma alteração salva localmente ainda não sincronizada
- **THEN** a aplicação restaura essa tentativa somente após validar login da mesma conta, sem solicitar Drive automaticamente
- **AND** se a persistência local falhar, avisa que os dados continuam somente na aba
### Requirement: Reaproveitar foto Google no menu de conta
O sistema SHALL exibir a foto disponível no perfil Google autenticado dentro do menu de conta existente, preservando nome e ações. Se a foto estiver ausente ou não carregar, SHALL apresentar iniciais. Sair ou trocar de conta MUST remover a apresentação da conta anterior, sem persistência adicional da imagem pelo hub.

#### Scenario: Foto disponível
- **WHEN** a identidade validada contém uma foto de perfil
- **THEN** o menu apresenta a foto com o nome e as ações existentes, inclusive após restauração do login

#### Scenario: Foto indisponível
- **WHEN** não há foto ou seu carregamento falha
- **THEN** o menu usa iniciais e mantém as ações de conta acessíveis
