# Tasks

## 1. Base homologada e preparação da entrega

- [ ] 1.1 Confirmar `dev`, versão alvo `0.3.0`, publicação e homologação explícita da cloud library `0.2.2`; registrar em evidência o SHA, URL e execução da base e impedir início de implementação enquanto a pré-condição não estiver atendida.
- [ ] 1.2 Na implementação, alinhar pacote e lockfile a `0.3.0`, selecionar somente `add-google-sign-in` em `.release.json` e conferir por `npm run check:release`; atualizar as referências da sequência para shell → cloud library → login → mangás sem alterar a versão aprovada `1.0.0` de mangás.

## 2. Identidade e ciclo de sessão

- [ ] 2.1 Compartilhar carregador GIS/client ID e introduzir o adaptador Sign in with Google por ação explícita, sem chamar Drive; verificar testes de entrada válida, cancelamento local, indisponibilidade e callback tardio, e documentar as origens/configuração públicas necessárias.
- [ ] 2.2 Integrar verificação JOSE no navegador com dependência fixa e conferir assinatura/chaves Google, algoritmo permitido, emissor, destinatário, expiração, instante de emissão e nonce da tentativa; testar credenciais válidas, adulteradas, expiradas, audiência/emissor/nonce incorretos e falha de chaves, sem registrar tokens.
- [ ] 2.3 Criar estado de identidade em memória compartilhado pelo shell; implementar saída, expiração, nova entrada explícita e troca de conta com invalidação de gerações e limpeza do Drive; testar timer, ação após suspensão da aba, reload, troca A/B e resposta antiga, e documentar ausência de sessão persistida.

## 3. Navegação e experiência de entrada

- [ ] 3.1 Acrescentar política pública/pessoal ao catálogo de módulos e aplicar a mesma regra ao menu e à montagem de rotas no HashRouter, com Início público e Conexão pessoal; verificar acesso direto, atualização e módulo de teste pessoal, sem criar módulo de mangás.
- [ ] 3.2 Implementar entrada no cabeçalho/área pública e menu da conta com saída/troca; preservar foco, teclado e mensagens acessíveis; testar conta exibida, erro/cancelamento recuperável, ocultação de entradas pessoais e limpeza visual após saída/expiração em desktop e celular.
- [ ] 3.3 Implementar destino interno pendente em memória e retorno único após login; verificar testes de rota registrada, endereço externo, esquema, rota inexistente, destino malformado e cancelamento, mantendo o 404 atual para endereços desconhecidos; documentar o contrato para módulos futuros.

## 4. Conta do login e autorização Drive

- [ ] 4.1 Coordenar uma instância compartilhada de `CloudSession` com a identidade; solicitar `drive.file` e `openid` somente por ação de conectar, conferir os escopos e comparar o `sub` do UserInfo Google ao login antes de acessar o Drive; testar A/A, A/B recusado sem leitura, escopo ausente, UserInfo indisponível e invalidação de resposta antiga.
- [ ] 4.2 Preservar identidade válida quando somente Drive recusar, revogar ou expirar autorização; saída/troca/expiração do login limpa ambas as sessões, documento/link e tentativas; verificar testes de cada transição, operação pendente e nova leitura antes de retomada na mesma conta, mantendo o transporte fetch nativo corrigido.
- [ ] 4.3 Atualizar guia de configuração e testes reais com entrada sem Drive, conferência da mesma conta e comportamento de logout versus revogação; conferir no navegador os links de configuração e ausência de token em DOM, URLs, logs e armazenamento persistente.

## 5. Revisão, produção e homologação

- [ ] 5.1 Executar instalação pelo lockfile, lint, tipos, testes, build, validação de versão/OpenSpec e Chromium desktop/celular; incluir teste com fetch nativo e Google simulado que cubra login, acesso direto, autorização e saída, além de inspeção do pacote sem credenciais/dados privados; registrar os resultados.
- [ ] 5.2 Abrir PR exclusivo de implementação `dev` → `main`, fornecer comandos de teste local e aguardar revisão do usuário; aplicar cada fix relatado com incremento patch coerente em pacote, lockfile, proposta e evidências, verificar checks obrigatórios e aguardar merge feito exclusivamente pelo usuário.
- [ ] 5.3 Após merge, acompanhar Prod validar o commit final, criar automaticamente a tag da versão final e publicar o mesmo artefato; conferir versão pública, SHA, tag e execução e registrar os resultados em `docs/releases/0.3.0.md` ou arquivo da versão final revisada, sem segredos.
- [ ] 5.4 Homologar no site real entrada sem consentimento Drive, acesso direto/retorno, recusa/cancelamento, expiração/revogação independentes, troca A/B, saída e persistência com a mesma conta em outro dispositivo; registrar evidências sem dados privados e obter homologação explícita antes de liberar mangás.

## Workflow follow-up

- Após homologação, sincronizar/arquivar esta change quando solicitado; atualizar a pré-condição de `add-manga-reading-tracker` para exigir também a entrega de login homologada antes de implementar sua versão própria.
