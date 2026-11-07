# modular-shell Specification

## Purpose

Disponibilizar uma base web pessoal extensível, navegável e versionada, com um processo verificável de testes e publicação estática antes da inclusão de serviços externos.

## Requirements

### Requirement: Abrir o shell sem serviços externos
O sistema SHALL apresentar uma página inicial identificada como “My Hub”, navegação acessível e mensagem de que os módulos serão adicionados gradualmente. A versão inicial MUST funcionar sem conexão Google, biblioteca ou módulo de mangás.

#### Scenario: Primeiro acesso à versão 0.1
- **WHEN** o usuário abre o site publicado
- **THEN** encontra a página inicial e sua navegação funcional sem precisar autenticar
- **AND** não encontra formulários de mangás ou solicitação de acesso ao Drive

### Requirement: Suportar navegação extensível e endereços estáticos
O sistema SHALL permitir acrescentar entradas de módulos sem substituir a navegação existente. Os endereços internos SHALL permitir abertura direta e atualização sob a raiz ou sob o caminho do repositório, sem depender de reescrita de rotas no servidor.

#### Scenario: Acesso direto à página inicial
- **WHEN** o usuário abre ou atualiza a rota inicial no caminho publicado do repositório
- **THEN** a aplicação e seus recursos carregam sem erro de página inexistente

#### Scenario: Navegação acessível
- **WHEN** o usuário percorre a navegação pelo teclado
- **THEN** consegue identificar o foco e acessar a página inicial

### Requirement: Identificar a versão publicada
O sistema SHALL expor a versão e o identificador do commit que originou o site, sem conter dados privados ou credenciais no pacote público.

#### Scenario: Identificar a primeira entrega
- **WHEN** o usuário consulta a identificação da versão 0.1 publicada
- **THEN** encontra `0.1.0` e um identificador que corresponde ao commit da entrega

### Requirement: Impedir publicação de alterações reprovadas
O processo de entrega MUST verificar instalação reproduzível, lint, tipos, testes relevantes, build e coerência da versão antes de publicar. Uma falha MUST impedir a publicação e ficar visível no resultado da execução.

#### Scenario: Verificação falha
- **WHEN** uma alteração provoca falha em uma das verificações obrigatórias
- **THEN** a execução é marcada como falha e a versão de produção permanece a anterior

#### Scenario: Pull request verificado
- **WHEN** uma alteração é proposta por pull request
- **THEN** as verificações executam sem publicar essa alteração em produção

### Requirement: Publicar uma versão rastreável sem infraestrutura contratada
O processo SHALL publicar arquivos estáticos no endereço padrão do GitHub Pages, sem exigir servidor, banco ou domínio pago. Cada entrega SHALL relacionar versão, commit, execução e URL, e verificar o site real após a publicação.

#### Scenario: Publicar v0.1.0
- **WHEN** o PR de `dev` para `main` da versão `0.1.0` é integrado e o commit final passa nas verificações
- **THEN** o processo cria a tag `v0.1.0` para esse commit e publica o site por HTTPS com a identificação esperada
- **AND** a execução registra o endereço e o resultado da verificação do site publicado

#### Scenario: Verificação de produção falha
- **WHEN** a publicação termina mas a página real não carrega a versão esperada ou seus recursos
- **THEN** a entrega é sinalizada como não validada e não é considerada homologada

### Requirement: Recuperar uma versão estática conhecida
O processo SHALL permitir republicar uma versão identificada já validada sem alterar seu conteúdo de origem. Se ainda não existir uma versão anterior, SHALL registrar essa limitação e permitir a republicação da primeira versão.

#### Scenario: Recuperação de entrega anterior
- **WHEN** o responsável solicita republicação de um commit de versão já validada
- **THEN** o processo aplica as verificações e entrega essa versão com identificação correspondente
- **AND** verifica novamente o site real

### Requirement: Validar cada atualização do PR antes do merge
O processo SHALL executar verificações ao abrir, atualizar ou reabrir PR para `main`, exigindo origem `dev`. Os checks MUST ser obrigatórios para merge e MUST NOT publicar a alteração durante a validação do PR.

#### Scenario: Atualizar um PR aberto
- **WHEN** novos commits entram no PR de `dev` para `main`
- **THEN** as verificações executam novamente e falhas impedem o merge

#### Scenario: Origem diferente de dev
- **WHEN** um PR para `main` usa outra branch de origem
- **THEN** a validação informa que o desenvolvimento deve ser entregue por `dev` e não aprova o merge

### Requirement: Usar a versão aprovada na entrega automática
O processo MUST usar a versão alvo aprovada da change entregue, coerente com `package.json` e lockfile, para criar a tag e identificar o site. O merge em `main` SHALL iniciar validação do commit final, criação da tag e deploy no mesmo workflow, sem commits de incremento em produção.

#### Scenario: Versão divergente
- **WHEN** a versão do pacote ou lockfile diverge da change incluída na entrega
- **THEN** a validação reprova a alteração antes da publicação

#### Scenario: Reexecutar entrega após falha
- **WHEN** a tag da versão já existe e aponta para o mesmo commit da execução
- **THEN** o processo permite repetir a publicação sem alterar versão ou tag

#### Scenario: Tag pertence a outro commit
- **WHEN** a tag da versão já aponta para um commit diferente do que seria publicado
- **THEN** o processo falha antes do deploy e preserva a tag existente
