# Tasks

## 1. Base e preparação da entrega

- [x] 1.1 Confirmar `dev`, versão `0.3.1` e evidências da biblioteca homologada `0.2.2`, incluindo arquivo OpenSpec, tag, SHA e Prod; registrar a referência da base antes da implementação.
- [x] 1.2 Na implementação autorizada, alinhar pacote/lockfile a `0.3.1` e selecionar somente esta change na release; verificar `npm run check:release` e preservar a versão futura `1.0.0` de mangás.

## 2. Login persistente e configuração

- [x] 2.1 Integrar SDK modular Firebase Auth com versão fixa e provedor Google, somente no plano Spark sem cobrança, Firestore ou Functions; documentar com links oficiais configuração pública, domínios local/produção, vínculo com o projeto Google existente, cotas vigentes e acompanhamento de uso; verificar tratamento de limite atingido sem migração automática para plano pago; verificar login real sem permissão ou chamadas Drive.
- [x] 2.2 Configurar persistência local pelo SDK e restauração/verificação da sessão antes de liberar rotas; testar reload, reabertura, sessão inválida, rede indisponível e armazenamento bloqueado, incluindo aviso de login temporário sem promessa de persistência.
- [x] 2.3 Aplicar limite absoluto de 30 dias desde a autenticação fornecida pelo serviço, sem renovação por refresh/uso/renovação de token; verificar com relógio controlado limite exato, um instante antes/depois, retomada de aba, credencial renovada e rejeição de um prazo local adulterado como única fonte.
- [x] 2.4 Implementar saída/troca e observação entre abas com invalidação de gerações; testar limpeza de persistência pelo SDK, tokens Drive, documentos, links, rascunhos e agendamentos, sem efeitos de callbacks antigos; documentar logout local versus revogação Google.

## 3. Estado global e navegação

- [x] 3.1 Criar provedor React compartilhado e controladores injetáveis para identidade, conexão e sincronização, movendo a propriedade de `CloudSession` da página para o coordenador; testar duas telas/consumidores observando a mesma sessão sem tokens Drive no estado persistido.
- [x] 3.2 Estender política pública/pessoal do catálogo e aplicar a mesma regra ao menu e à montagem de rotas, com Início público e Conexão pessoal; testar endereço direto, reload durante restauração, ausência de flash de conta anterior e consumidor pessoal de teste, sem módulo de mangás.
- [x] 3.3 Implementar entrada/menu de conta, estados de verificação e retorno único a destino interno registrado; testar acessibilidade, celular/desktop, sessão restaurada mantendo rota, destino externo/malformado/inexistente e 404, documentando o contrato para módulos futuros.

## 4. Autorização Drive independente

- [x] 4.1 Manter GIS por clique com `drive.file` e `openid`; comparar `sub` do UserInfo com a identidade Google do provedor Firebase antes de chamar Drive, sem confundir UID Firebase ou permissionId; testar A/A, A/B recusado sem acesso, escopo ausente, erro UserInfo e resposta tardia.
- [x] 4.2 Preservar login quando Drive recusar, expirar, revogar ou desconectar; após refresh restaurar só login sem recuperar token Drive ou abrir popup; testar cada transição, reconexão da mesma conta com releitura e descarte das tentativas ao sair/trocar login.
- [x] 4.3 Atualizar guia de configuração/privacidade e testar integrações reais local/Pages; inspecionar separadamente persistência Firebase esperada e ausência de token Drive/client secret em storage, URLs, logs e pacote, sem copiar credenciais para evidências.

## 5. Contrato de sincronização

- [x] 5.1 Expor preparação de alteração de seção e ação manual `sync` com estados pendente/enviando/confirmado/erro/conflito, usando revisão e identidade estável da biblioteca; testar serialização, resposta perdida, edição durante envio, preservação de seções e nova tentativa sem duplicação; documentar o contrato para mangás.
- [x] 5.2 Adaptar a amostra técnica para preparar alteração e acionar “Sincronizar”, mantendo releitura e link do arquivo; testar ausência de gravação ao preparar, reconexão explícita quando necessária, confirmação remota, ação sem pendência sem criação e descarte explícito em conflito.
- [x] 5.3 Oferecer automação habilitada explicitamente na sessão, com debounce de alteração pendente somente em aba aberta e Drive válido, usando a mesma serialização; testar cancelamento no logout/troca, pausa em erro/expiração/conflito, ausência de popup automático e de polling/gravação ao restaurar login; documentar modo manual padrão e perda das tentativas no refresh.

## 6. Revisão e homologação

- [x] 6.1 Executar instalação pelo lockfile, lint, tipos, testes, build, versão/OpenSpec e Chromium desktop/celular; incluir fetch nativo, Auth/Drive simulados, reload, duas abas e prazo com relógio controlado, além de consentimento real e inspeção do pacote; registrar resultados sem afirmar espera real de 30 dias se foi simulada.
- [x] 6.2 Abrir PR de implementação `dev` → `main`, fornecer comandos de teste e aguardar revisão/merge exclusivos do usuário; aplicar cada fix relatado com incremento patch alinhado em pacote, lockfile, proposta e evidências e conferir checks obrigatórios.
- [x] 6.3 Acompanhar Prod validar commit final, criar tag da versão final e publicar o mesmo artefato; conferir SHA/versão/tag/URL e registrar execução, configuração Spark e resultados em `docs/releases/0.3.1.md` ou versão final revisada, sem segredos.
- [x] 6.4 Homologar no site real login persistente após refresh/reabertura, logout entre abas, Drive independente, contas A/B, sincronização manual e automática autorizada, erros e conflito; apresentar testes do prazo e limites documentados, obter homologação explícita antes de liberar implementação de mangás.

## Workflow follow-up

- Antes de implementar mangás `1.0.0`, reconciliar sua proposta/design/specs/tasks para exigir também login homologado e distinguir alteração local pendente de confirmação remota, usando botão “Sincronizar” e o contrato compartilhado; não reimplementar sync no módulo.
- A implementação de mangás continua em entrega própria; nenhuma fila offline durável ou tarefa em navegador fechado é prometida por esta revisão.
- Após homologação de login, sincronizar/arquivar esta change quando solicitado.

## Entrega inicial para avaliação

- Entrega final `0.3.1` revisada no PR #3, integrada pelo usuário e publicada no Prod 42417299801. Tag e site confirmam o commit `3f0e40687e6fa39090e194ef242332168e18d419`.
- Configuração pública recebida e entrega homologada globalmente pelo titular: “HOmologado, pode arquivar”. Os cenários privados são aceitos por essa declaração, sem afirmar execução pelo agente. Guia com links em `docs/firebase-setup.md`; evidências em `docs/releases/0.3.1.md`.
- PR #3 aberto imediatamente ao liberar para teste: https://github.com/jcntck/jcntck.github.io/pull/3. Qualquer mudança solicitada pelo usuário após essa entrega será patch fix no mesmo PR, com pacote, lockfile e alvo alinhados.

## 7. Fixes de revisão

- [x] 7.1 Reaproveitar a foto do perfil Google validado no menu existente, com iniciais quando ausente ou em falha; verificar mapeamento pelo SDK, foto após refresh e ações preservadas, alinhando pacote, lockfile, alvo e evidências em `0.3.1`.
