# Spec Delta

## MODIFIED Requirements

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

#### Scenario: Retorno após entrada
- **WHEN** o login termina com um destino pessoal registrado pendente
- **THEN** o sistema abre esse destino uma única vez
- **AND** destinos externos, inexistentes ou malformados são descartados em favor do Início

#### Scenario: Extensão por novo módulo
- **WHEN** um módulo futuro é registrado como pessoal
- **THEN** recebe a mesma verificação de menu e endereço direto sem recriar o mecanismo de login
