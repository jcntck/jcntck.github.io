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
O sistema SHALL permitir acrescentar entradas de módulos sem substituir a navegação existente. Os endereços internos SHALL permitir abertura direta e atualização sob a raiz ou sob o caminho do repositório, sem depender de reescrita de rotas no servidor. Cada entrada SHALL declarar acesso público ou dependente de login; entradas pessoais MUST ser ocultadas e suas rotas verificadas sem sessão, mantendo Início público.

#### Scenario: Acesso direto à página inicial
- **WHEN** o usuário abre ou atualiza a rota inicial no caminho publicado do repositório
- **THEN** a aplicação e seus recursos carregam sem erro de página inexistente

#### Scenario: Navegação acessível
- **WHEN** o usuário percorre a navegação pelo teclado
- **THEN** consegue identificar o foco e acessar a página inicial

#### Scenario: Navegação pessoal sem login
- **WHEN** o usuário está sem sessão de identidade válida
- **THEN** vê Início e a ação de entrada, sem entrada Conexão ou módulos declarados pessoais

#### Scenario: Acesso direto a endereço pessoal
- **WHEN** o usuário sem login abre ou atualiza o endereço interno de uma rota pessoal registrada
- **THEN** é encaminhado à entrada pública, sem renderizar o conteúdo pessoal
- **AND** o destino interno é preservado em memória para retorno após login válido

#### Scenario: Verificar sessão ao atualizar rota pessoal
- **WHEN** o usuário atualiza uma rota pessoal e a restauração do login ainda está em andamento
- **THEN** vê um estado de verificação sem conteúdo pessoal nem redirecionamento prematuro
- **AND** uma sessão válida dentro do prazo mantém a rota; ausência ou expiração leva à entrada

#### Scenario: Retorno após entrada
- **WHEN** o login termina com um destino pessoal registrado pendente
- **THEN** o sistema abre esse destino uma única vez
- **AND** destinos externos, inexistentes ou malformados são descartados em favor do Início

#### Scenario: Extensão por novo módulo
- **WHEN** um módulo futuro é registrado como pessoal
- **THEN** recebe a mesma verificação de menu e endereço direto sem recriar o mecanismo de login
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

### Requirement: Apresentar a identidade visual do hub
O sistema SHALL apresentar Início, Mangás e Conexão com identidade visual coerente com o modelo fornecido, usando paleta OKLCH, fontes Fraunces/Geist, ícones Lucide, hierarquia, espaçamentos e estados reais. SHALL preservar navegação estática, identificação dinâmica da versão e proteção de conteúdo pessoal, com teclado, foco visível e movimento reduzido.

#### Scenario: Consultar as páginas em computador e celular
- **WHEN** o usuário abre as páginas em computador ou celular
- **THEN** encontra uma composição responsiva coerente entre elas, sem controles cortados ou rolagem horizontal da página
- **AND** nome, foto, dados, mensagens de conexão e versão refletem o estado real da aplicação

#### Scenario: Abrir o hub sem login
- **WHEN** o visitante abre o Início ou um endereço pessoal sem sessão válida
- **THEN** o Início permanece público e o conteúdo e a navegação pessoais seguem protegidos
- **AND** o redesign não introduz autorização Drive nem dados fictícios para simular uma conta conectada

### Requirement: Recolher a navegação sem perder acesso às páginas
O sistema SHALL permitir recolher e expandir o menu lateral em computador e abrir/fechar a navegação em celular. Os controles SHALL informar seu estado e destino por nomes acessíveis. A navegação SHALL indicar a página atual e preservar operação por teclado e acesso ao menu de conta.

#### Scenario: Navegar com o menu recolhido
- **WHEN** o usuário recolhe o menu no computador
- **THEN** consegue identificar e abrir cada destino autorizado por teclado ou ponteiro
- **AND** expandir novamente mantém a página atual e o estado da biblioteca

#### Scenario: Abrir o menu em celular
- **WHEN** o usuário abre a navegação em uma tela de celular
- **THEN** alcança os destinos e o fechamento por teclado, sem conteúdo interativo oculto capturando foco
- **AND** se o menu usar sobreposição, Escape o fecha e devolve o foco ao acionador; escolher um destino fecha a navegação

### Requirement: Alternar tema claro e escuro
O sistema SHALL oferecer temas claro e escuro em todas as páginas. Na ausência de escolha salva, SHALL seguir a preferência de cor do sistema. A escolha explícita SHALL persistir no navegador quando disponível, sem dados de conta ou tokens. Bloqueio de armazenamento MUST manter a alternância na sessão, sem impedir o uso do hub.

#### Scenario: Primeira visita e escolha explícita
- **WHEN** não há preferência salva e o usuário abre o hub
- **THEN** o tema inicial acompanha a preferência do sistema
- **AND** alternar tema atualiza páginas, formulários e estados de leitura sem alterar registros ou acessar o Drive

#### Scenario: Reabrir com tema escolhido
- **WHEN** o usuário recarrega com uma preferência de tema válida salva
- **THEN** o tema escolhido é aplicado desde a apresentação inicial e prevalece sobre o padrão do sistema

#### Scenario: Persistência indisponível
- **WHEN** o navegador bloqueia o salvamento da preferência ou contém um valor inválido
- **THEN** a aplicação usa um padrão válido e permite alternar tema enquanto aberta, sem falhar ou afetar login e cache da biblioteca

### Requirement: Identificar a guia com favicon próprio
O sistema SHALL fornecer um favicon no formato ICO com identidade do My Hub e referenciá-lo no documento da aplicação. O ícone SHALL estar disponível na raiz publicada e em aberturas diretas das rotas, sem login ou serviços externos, com aparência reconhecível em tamanho de guia.

#### Scenario: Abrir o site publicado
- **WHEN** o usuário abre o Início ou atualiza uma rota interna no site publicado
- **THEN** a guia apresenta o ícone do My Hub e o recurso ICO carrega com sucesso
- **AND** o ícone não identifica o gerador do layout nem depende de uma conta conectada
