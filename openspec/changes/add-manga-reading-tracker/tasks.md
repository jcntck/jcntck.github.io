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

- [ ] 3.1 Abrir o PR `dev` → `main` após lint, tipos, testes, build e versão aprovados, fornecer instruções para teste local do usuário e aplicar cada fix relatado com incremento patch sincronizado; aguardar o merge feito por ele e acompanhar o workflow prod criar a tag da versão final revisada (atual `v0.4.1`, base `0.4.0`) e publicar o commit validado; verificar coerência entre versão alvo, pacote, lockfile, tag, versão e rota em produção e registrar URL, commit, execução e resultados em `docs/releases/0.4.1.md`.
- [ ] 3.2 Executar no site real cadastro retroativo, correção, reabertura em outro dispositivo, preservação da amostra técnica e revisão visual em celular e computador; apresentar os resultados e registrar homologação explícita do usuário, corrigindo regressões dos contratos anteriores antes de concluir.

## Workflow follow-up

- Depois da entrega homologada, finalizar esta mudança no OpenSpec conforme solicitado, mantendo as evidências das três etapas.

## Entrega inicial para teste

PR #4 aberto com versão 0.4.0 e checks aprovados, conforme `docs/releases/0.4.1.md`. Prévia e documentação prontas; 2.1/2.4 permanecem pendentes somente pela avaliação/refinamento com o usuário. 3.1/3.2 aguardam merge, produção e homologação. Nenhuma tag criada antes do merge; cada alteração solicitada após esta liberação é patch fix no mesmo PR.

## 4. Patch de revisão 0.4.1

- [x] 4.1 Bloquear envio automático de alterações de mangás na fila compartilhada e apresentar somente sincronização manual no módulo; verificar que múltiplos cadastros/edições, busca e ordenação não fazem requisições Drive, inclusive com automático ligado em Conexão.
- [x] 4.2 Adicionar link opcional da scan com validação HTTP/HTTPS sem credenciais, compatibilidade com registros antigos, edição/remoção e abertura em nova aba; testar persistência e preservação dos demais dados.
- [x] 4.3 Oferecer verificação HEAD manual com timeout e sinal HTTP acessível, distinguindo falha inconclusiva de site fora do ar; verificar ausência de polling/credenciais, cancelamento, CORS e erros sem gravar resultados no Drive.
- [x] 4.4 Adicionar busca por título e ordenação por nome/data, com estado sem resultado e uso em celular/teclado; verificar localidade, desempate e ausência de mutação ou chamadas Drive.
- [ ] 4.5 Alinhar pacote, lockfile e alvo em 0.4.1, atualizar guias/evidências e o mesmo PR #4 após lint, tipos, testes, build e checks aprovados; manter merge e homologação com o titular.
