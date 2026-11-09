# Proposal

## Version

`0.4.5` — patch de revisão da entrega inicial `0.4.0`, conforme regra permanente; tag automática `v0.4.5`.

## Why

Com publicação, autenticação e persistência em nuvem já homologadas, podemos concentrar a entrega no valor para o leitor. O módulo precisa registrar onde e quando a leitura parou e apresentar o tempo decorrido para apoiar a decisão pessoal de retomar uma obra.

## What Changes

- Adicionar o módulo “Mangás” à navegação do shell existente.
- Permitir cadastrar e editar título, nome em inglês opcional, último capítulo lido e data da leitura, usando o armazenamento já validado. Nome em inglês aparece como informação secundária e participa da busca.
- Adicionar link opcional da scan, com nome/label opcional e abertura em nova aba. Nenhuma verificação de disponibilidade ou requisição para a scan.
- Apresentar a biblioteca em grade responsiva de cards verticais, com capa em destaque na proporção 3:4, título e dados abaixo, preservando a capa opcional HTTPS, carregamento preguiçoso e alternativa para ausência/falha.
- Apresentar a ação Editar no rodapé do card, na mesma linha do link da scan, também para obras sem scan.
- Buscar e ordenar localmente e paginar em 12 obras por página, atendendo bibliotecas de aproximadamente 126 obras sem chamadas Drive adicionais.
- Mostrar data absoluta e tempo completo, como “Lido há 2 anos 3 meses 15 dias”, com três níveis de destaque: menos de 6 meses, de 6 meses a menos de 1 ano e a partir de 1 ano.
- Preservar seis meses ou um ano como referência global do leitor, sem intervalos individuais, data de retorno ou cobrança por atraso.
- Definir e refinar a aparência do módulo nesta etapa, com formulários acessíveis e listagem legível em celular e computador.
- Fechar o formulário após salvar uma leitura válida na aba, com feedback animado, foco acessível e respeito a movimento reduzido.
- Consultar o estado Drive compartilhado e encaminhar reconexão à página Conexão, mantendo só a ação Sincronizar no módulo.
- Preparar alterações em memória e sincronizar pelo controle compartilhado somente manual, distinguindo pendência de gravação confirmada.
- Publicar pelo CI/CD existente e homologar o fluxo real de leitura, incluindo persistência entre dispositivos.

## Capabilities

### New Capabilities

- `manga-reading`: Cadastro e correção do ponto e da data de leitura, com listagem do tempo decorrido e experiência visual do módulo.

### Modified Capabilities

Nenhuma. O módulo consome os contratos existentes de navegação e armazenamento.

## Impact

- Implementar em `dev`, atualizando `package.json` e lockfile para `0.4.5` no PR para `main`. Após o merge, o workflow prod valida o commit, cria `v0.4.5` e publica sem commits automáticos de versão.
- Acrescentar `src/modules/mangas`, modelo de leitura e sua seção no documento compartilhado, preservando dados existentes.
- Reutilizar shell, sessão Google, tratamento de armazenamento e processo de entrega das etapas anteriores.
- Não reconstruir CI/CD, OAuth ou adaptador Drive; defeitos nesses contratos devem ser corrigidos e revalidados antes de continuar a homologação do módulo.
- Nome definitivo e preferências estéticas não estão fixados; serão trabalhados na etapa visual, sem ampliar os comportamentos funcionais.
- Catálogo externo, histórico por capítulo, notificações, calendário de retorno e edição offline continuam fora do MVP.

## Sequence and Acceptance

Etapa 3 de 3. Implementar somente após `add-modular-shell` (`0.1.0`) e `add-cloud-library` (`0.2.2`) e `add-google-sign-in` (`0.3.1`) publicados, testados em produção e homologados. A disponibilidade dos documentos no OpenSpec não implica liberação antecipada.

Concluir com cadastro de leitura retroativa, correção sem mudança implícita da data, mensagens de tempo corretas, reabertura em outro dispositivo e revisão visual no site publicado. Registrar versão, URL, commit, execução, resultados e homologação explícita do usuário.
