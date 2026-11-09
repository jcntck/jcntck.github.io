# Tasks

## 1. Pré-condições e regras de leitura

- [x] 1.1 Confirmar branch `dev` e versão alvo `0.4.0`; conferir releases, resultados de produção e homologação explícita de `add-modular-shell`, `add-cloud-library` e `add-google-sign-in`; verificar as referências antes de iniciar o módulo e registrar os contratos existentes que serão reutilizados.
- [x] 1.2 Atualizar `package.json` e os campos de versão do lockfile para `0.4.0` em `dev`, no PR da entrega; verificar coerência com a versão alvo e aprovação dos checks obrigatórios antes do merge.
- [x] 1.3 Criar modelo e validação de leitura com UUID, capítulo textual e data civil, adicionando somente `modules.mangas` ao envelope existente; verificar por testes leituras retroativas, extras, campos inválidos, data futura e preservação do diagnóstico e demais seções, documentando o formato do domínio.
- [x] 1.4 Implementar cálculo e formatação de dias, meses e anos completos; verificar com relógio controlado os exemplos da spec, singular/plural, fim de mês, ano bissexto, fuso, virada do dia e correção que não altera implicitamente a data.

## 2. Experiência e aparência do módulo

- [ ] 2.1 Registrar a entrada e rota “Mangás” e preparar prévia navegável da hierarquia e aparência; verificar acesso direto no caminho real do Pages e revisar com o usuário a composição para celular e computador, mantendo os campos e fluxos definidos.
- [x] 2.2 Implementar cadastro e correção acessíveis com pendências em memória, sincronização compartilhada e confirmação de salvamento remoto; verificar por testes de interação validação, identidade preservada, data alterada somente por ação explícita e formulário preservado nos erros retornados pelo contrato de armazenamento.
- [x] 2.3 Implementar listagem, estado vazio, data absoluta e tempo decorrido; verificar recalculo ao abrir, recuperar foco e virar o dia, navegação por teclado e ausência de controles cortados em celular.
- [ ] 2.4 Documentar cadastro retroativo, correção e interpretação das mensagens e refinar a aparência com os retornos da prévia; verificar que interface e guia correspondem entre si e não introduzem vencimentos, agendamentos ou promessas de capítulos novos.

## 3. Entrega e homologação do negócio

- [ ] 3.1 Abrir o PR `dev` → `main` após lint, tipos, testes, build e versão aprovados, fornecer instruções para teste local do usuário e aplicar cada fix relatado com incremento patch sincronizado; aguardar o merge feito por ele e acompanhar o workflow prod criar a tag da versão final revisada (atual `v0.4.5`, base `0.4.0`) e publicar o commit validado; verificar coerência entre versão alvo, pacote, lockfile, tag, versão e rota em produção e registrar URL, commit, execução e resultados em `docs/releases/0.4.5.md`.
- [ ] 3.2 Executar no site real cadastro retroativo, correção, reabertura em outro dispositivo, preservação da amostra técnica e revisão visual em celular e computador; apresentar os resultados e registrar homologação explícita do usuário, corrigindo regressões dos contratos anteriores antes de concluir.

## Workflow follow-up

- Depois da entrega homologada, finalizar esta mudança no OpenSpec conforme solicitado, mantendo as evidências das três etapas.

## Entrega inicial para teste

PR #4 aberto com versão 0.4.0 e checks aprovados, conforme `docs/releases/0.4.5.md`. Prévia e documentação prontas; 2.1/2.4 permanecem pendentes somente pela avaliação/refinamento com o usuário. 3.1/3.2 aguardam merge, produção e homologação. Nenhuma tag criada antes do merge; cada alteração solicitada após esta liberação é patch fix no mesmo PR.

## 4. Patch de revisão 0.4.1

- [x] 4.1 Bloquear envio automático de alterações de mangás na fila compartilhada e apresentar somente sincronização manual no módulo; verificar que múltiplos cadastros/edições, busca e ordenação não fazem requisições Drive, inclusive com automático ligado em Conexão.
- [x] 4.2 Adicionar link opcional da scan com validação HTTP/HTTPS sem credenciais, compatibilidade com registros antigos, edição/remoção e abertura em nova aba; testar persistência e preservação dos demais dados.
- [x] 4.3 Registro histórico 0.4.1 (removido na tarefa 5.1 por solicitação do titular): oferecer verificação HEAD manual com timeout e sinal HTTP acessível, distinguindo falha inconclusiva de site fora do ar; verificar ausência de polling/credenciais, cancelamento, CORS e erros sem gravar resultados no Drive.
- [x] 4.4 Adicionar busca por título e ordenação por nome/data, com estado sem resultado e uso em celular/teclado; verificar localidade, desempate e ausência de mutação ou chamadas Drive.
- [x] 4.5 Alinhar pacote, lockfile e alvo em 0.4.1, atualizar guias/evidências e o mesmo PR #4 após lint, tipos, testes, build e checks aprovados; manter merge e homologação com o titular.

## 5. Patch de revisão 0.4.2

- [x] 5.1 Remover a verificação HTTP e acrescentar nome/label opcional da scan, com alternativa pelo hostname, compatibilidade, edição e remoção; verificar persistência sem consultas externas.
- [x] 5.2 Retirar o painel Drive do módulo e observar a sessão compartilhada com estado, alerta/link para Conexão quando indisponível e botão de sincronização manual; verificar reconexão, refresh, expiração e falhas sem OAuth no módulo.
- [x] 5.3 Fechar o formulário após salvar dados válidos na aba, preservar formulário inválido/pendências e fornecer feedback, destaque e foco na obra; adicionar animações discretas com movimento reduzido e verificar teclado/celular.
- [x] 5.4 Alinhar pacote, lockfile, alvo e documentação em 0.4.2, validar lint/tipos/testes/build/CI e atualizar o mesmo PR #4 com instruções de teste, aguardando revisão e merge do titular.

## 6. Patch de revisão 0.4.3

- [x] 6.1 Acrescentar capa opcional HTTPS por URL, validação e preservação/remoção no modelo, imagem lazy sem requisição CORS de pixels e alternativa para falha/ausência; testar edição, persistência e carregamento sem cabeçalho CORS.
- [x] 6.2 Paginar em 12 obras após busca/ordem, com controles acessíveis, clamping, reset e página/foco da obra salva; testar 126 registros sem chamadas Drive adicionais ou perda de pendências em desktop/celular.
- [x] 6.3 Apresentar anos, meses e dias juntos e três faixas de destaque (<6 meses, 6–11 meses, >=1 ano); testar cortes, singular/plural, calendário/fuso e preservação da data.
- [x] 6.4 Alinhar pacote, lockfile, alvo, guias e evidências em 0.4.3, validar lint/tipos/testes/build/CI e atualizar o mesmo PR #4 para revisão do titular, sem merge automático.

## 7. Patch de revisão 0.4.4

- [x] 7.1 Acrescentar nome em inglês opcional, secundário na listagem e incluído na busca local, com cadastro/edição/remoção, trim, compatibilidade e preservação de identidade/data/extras; verificar filtro e paginação sem chamadas Drive.
- [x] 7.2 Mover e renomear a ação para Editar no rodapé alinhado à scan, mantendo controle sem scan, acessibilidade, fechamento/foco/feedback e layout em desktop/celular inclusive com nomes longos.
- [x] 7.3 Alinhar pacote, lockfile, alvo, guias/evidências em 0.4.4, validar lint/tipos/testes/build/CI e atualizar o mesmo PR #4 para revisão do titular, sem merge automático.

## 8. Patch visual de revisão 0.4.5

- [x] 8.1 Apresentar grade responsiva de cards com capas 3:4 em destaque e dados abaixo, mantendo inglês secundário, tempo, rodapé scan/Editar e alternativas de capa; verificar colunas, proporção, nomes longos, foco/teclado, movimento reduzido e regressões de paginação/sincronização em desktop/celular.
- [x] 8.2 Alinhar pacote, lockfile, alvo, guias/evidências em 0.4.5, validar lint/tipos/testes/build/CI e abrir o PR de continuação dev → main para revisão visual do titular (PR #4 já integrado), sem merge automático.
