# Spec Delta

## ADDED Requirements

### Requirement: Apresentar a identidade visual do hub
O sistema SHALL apresentar Início, Mangás e Conexão com identidade visual coerente com o modelo fornecido, incluindo tipografia, cores, hierarquia, espaçamentos e estados reais. SHALL preservar navegação estática, identificação dinâmica da versão e proteção de conteúdo pessoal, com teclado, foco visível e movimento reduzido.

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
