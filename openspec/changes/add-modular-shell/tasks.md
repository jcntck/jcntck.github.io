# Tasks

## 1. Shell, branch e versão da entrega

- [x] 1.1 Confirmar branch `dev` e versão alvo `0.1.0` antes de implementar; verificar que a entrega será por PR de `dev` para `main`, sem alterações diretas na branch protegida.
- [x] 1.2 Inicializar React, TypeScript e Vite com npm, `package.json` e campos correspondentes do lockfile em `0.1.0`, scripts de lint, tipos, testes e build; verificar `npm ci`, `npm run lint`, `npm run typecheck`, `npm test` e `npm run build` numa instalação limpa.
- [x] 1.3 Criar página inicial, navegação extensível por hash, retorno de rota desconhecida e versão/commit derivados do build; verificar teclado, acesso direto, atualização e recursos na raiz `/` com testes e preview, e documentar extensão de módulos, versionamento e comandos no README.

## 2. Workflows dev e prod

- [x] 2.1 Configurar workflow dev para PR aberto, atualizado ou reaberto para `main`, validando origem `dev`, lint, tipos, testes, build e coerência da versão da entrega com pacote e lockfile; verificar execuções reais de sucesso e falha controlada, configurar checks obrigatórios e comprovar que PR não publica.
- [x] 2.2 Configurar workflow prod em `push` para `main` após merge, revalidando o commit final, criando o artefato, gerando a tag da versão do pacote e publicando no mesmo workflow; verificar dependência dos jobs, permissões mínimas, concorrência e ausência de commits automáticos de incremento, documentando o fluxo.
- [x] 2.3 Implementar validação de tag e reexecução segura, além de recuperação manual de release conhecida; verificar os casos de tag ausente, mesmo SHA e SHA divergente, garantindo que tags existentes não sejam movidas e que não seja necessário disparar outro workflow pela tag criada.

## 3. Publicação e homologação da versão 0.1.0

- [ ] 3.1 Verificar a configuração do Pages por Actions e do ambiente `github-pages`, abrir o PR de `dev` para `main` e acompanhar o merge aprovado; confirmar que o workflow prod cria `v0.1.0` para o commit integrado e publica em `https://jcntck.github.io/`, registrando tag, SHA, URL e execução em `docs/releases/0.1.0.md`.
- [ ] 3.2 Executar verificação pós-publicação em navegador no endereço real, incluindo recursos, rota direta, atualização e coerência entre versão alvo, pacote, lockfile, tag, versão e commit expostos; registrar resultados em celular e computador e confirmar sinalização de falha quando a versão real não corresponde à esperada.
- [ ] 3.3 Exercitar republicação do mesmo commit de `v0.1.0` sem nova tag ou incremento e conferir novamente a versão real; registrar o procedimento e que ainda não há versão anterior para rollback na primeira entrega.
- [ ] 3.4 Apresentar o site e as evidências ao usuário e registrar sua decisão explícita de homologação; verificar que a etapa não libera `add-cloud-library` enquanto essa decisão estiver pendente.

## Workflow follow-up

- Depois da entrega homologada, finalizar esta mudança no OpenSpec conforme solicitado e iniciar a aplicação de `add-cloud-library` em uma etapa própria.
