# Spec Delta

## Purpose

Estabelecer identidade Google para a experiência pessoal do hub, mantendo o login separado da autorização para ler e gravar documentos privados no Drive.

## ADDED Requirements

### Requirement: Entrar sem conceder acesso ao Drive
O sistema SHALL oferecer entrada explícita com Google na área pública, apresentar a conta após identificação válida e permitir nova tentativa após recusa, cancelamento ou indisponibilidade. Entrar MUST NOT solicitar acesso ao Drive nem criar, ler ou alterar arquivos.

#### Scenario: Login válido
- **WHEN** o usuário conclui a entrada com identidade Google válida
- **THEN** a sessão apresenta a conta e libera a navegação pessoal
- **AND** nenhuma operação ou solicitação de permissão do Drive ocorre

#### Scenario: Entrada não concluída
- **WHEN** o usuário cancela, recusa ou não consegue concluir a entrada
- **THEN** permanece sem sessão autenticada, com possibilidade de tentar novamente e sem acesso às rotas pessoais

### Requirement: Aceitar somente identidade válida
O sistema MUST aceitar identidade somente após verificar autenticidade, destinatário, emissor, validade temporal e vínculo com a tentativa de entrada. O identificador estável da conta MUST ser usado para associar sessão e dados; nome ou email exibidos não determinam identidade.

#### Scenario: Credencial inválida ou expirada
- **WHEN** a credencial tem assinatura, destinatário, emissor, validade ou vínculo de tentativa inválidos
- **THEN** o sistema recusa o login e não libera conteúdo pessoal

#### Scenario: Verificação indisponível
- **WHEN** não é possível concluir a verificação da credencial
- **THEN** o sistema permanece sem sessão autenticada e permite nova tentativa explícita

### Requirement: Separar sessão de login da autorização de armazenamento
O sistema SHALL solicitar autorização do Drive somente por ação explícita de usuário logado, mantendo o escopo de arquivos limitado a `drive.file`. Recusa, revogação ou expiração exclusiva dessa autorização MUST bloquear operações de armazenamento sem encerrar uma identidade ainda válida.

#### Scenario: Negar Drive após login
- **WHEN** um usuário logado recusa a conexão com o Drive
- **THEN** permanece logado, com ações de armazenamento bloqueadas e opção de reconectar

#### Scenario: Expirar somente a autorização Drive
- **WHEN** o acesso ao Drive expira enquanto a identidade permanece válida
- **THEN** o sistema solicita reconexão do armazenamento e preserva a sessão de login

### Requirement: Vincular autorização Drive à conta do login
O sistema MUST conferir pelo identificador estável que o acesso ao Drive pertence à mesma conta do login antes de ler documento ou habilitar escrita. Uma conta diferente MUST ser recusada sem expor documento, amostra, link ou tentativa da outra conta.

#### Scenario: Autorizar B enquanto login é A
- **WHEN** a sessão de login é de A e a autorização Drive retorna B
- **THEN** a credencial Drive de B é descartada e nenhum documento é acessado
- **AND** o usuário recebe orientação para conectar a mesma conta ou trocar o login explicitamente

### Requirement: Encerrar ou trocar identidade sem resíduos
O sistema SHALL permitir saída e troca de conta explícitas. Saída, troca e expiração do login MUST limpar credenciais, documentos, links e tentativas anteriores, cancelar seus efeitos locais tardios e retirar acesso às rotas pessoais. Respostas antigas MUST NOT restabelecer uma sessão encerrada.

#### Scenario: Sair em rota pessoal
- **WHEN** o usuário escolhe sair
- **THEN** retorna ao Início público, sem dados nem ações da conta anterior
- **AND** a saída local não é apresentada como revogação do consentimento Google

#### Scenario: Expirar identidade
- **WHEN** a validade do login termina
- **THEN** o sistema encerra a sessão pessoal e solicita nova entrada para retomá-la

#### Scenario: Trocar A por B durante operação
- **WHEN** uma operação de A termina após a troca explícita para B
- **THEN** seu resultado não aparece em B nem utiliza credenciais de B

### Requirement: Manter credenciais somente em memória
O sistema MUST manter credenciais de login e Drive somente em memória, sem incluí-las em URLs, logs, armazenamento persistente ou artefatos publicados. Atualizar ou fechar a página MUST descartar a sessão local; nova entrada exige ação explícita.

#### Scenario: Reabrir ou inspecionar o hub
- **WHEN** o usuário atualiza a página ou inspeciona a publicação e o armazenamento do navegador
- **THEN** não há credenciais persistidas e o conteúdo pessoal exige nova entrada
