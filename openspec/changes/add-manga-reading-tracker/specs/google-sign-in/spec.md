# Spec Delta

## MODIFIED Requirements

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
