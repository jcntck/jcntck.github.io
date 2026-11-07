# Design

## Context

Ver `proposal.md`. O código atual usa React, HashRouter e um catálogo `HubModule` com ID, rótulo, caminho e elemento. O cabeçalho contém apenas a marca decorativa `mh.`. `ConnectionPage` instancia uma sessão de Drive, carrega GIS e chama o token client; não há sessão de login global. `CloudSession` já isola gerações, expiração, tentativas e dados por `permissionId` do Drive. A biblioteca ainda aguarda publicação e homologação em produção.

## Goals / Non-Goals

**Goals:** Ter identidade válida no navegador, política central de navegação e coordenação de contas, preservando o contrato de armazenamento e a arquitetura estática.

**Non-Goals:** Backend, cookie de servidor, proteção do pacote estático, cadastro próprio, login por senha, outros provedores, sessão durável, One Tap automático, mangás ou mudanças de schema dos documentos. Não restringir o projeto a um email específico.

## Decisions

### Dois estados de sessão e um coordenador compartilhado

Criar identidade compartilhada no nível do shell (`anonymous`, `signing-in`, `verifying`, `signed-in`, `error`) e manter estado do Drive independente. O carregador GIS e configuração pública existentes serão compartilhados; `google.accounts.id` cuida da identidade e `google.accounts.oauth2` continua cuidando da autorização Drive.

Mover a propriedade da instância de `CloudSession` para o coordenador/provedor comum, com injeção em `ConnectionPage`, evitando sessões isoladas por página. Consumidores futuros recebem o mesmo contrato. Logout/troca/expiração de identidade invalidam primeiro a geração de operações e limpam Drive e estado privado. Expiração somente do Drive preserva identidade válida e tentativa daquela conta na aba. Desconectar Drive também preserva login; sair do hub limpa ambos.

Alternativa descartada: tratar qualquer access token Drive como login. Isso exige permissão de armazenamento só para entrar e mistura os ciclos de expiração. Não iniciar Drive ao fazer login ou montar o shell.

### Entrada explícita e validação de identidade

Usar o botão oficial Sign in with Google, renderizado no cabeçalho/área de entrada com o client ID público existente, sem fluxo OAuth manual. A verificação deve validar criptograficamente o ID token, não apenas decodificar seu payload. Usar biblioteca JOSE compatível com navegador e Web Crypto, com versão fixa escolhida e inspecionada na implementação, obtendo chaves públicas do Google via HTTPS. Verificar algoritmo permitido, assinatura, `iss`, `aud`, `exp`, `iat` coerente e `nonce` aleatório vinculado à tentativa. Usar `sub` como identidade estável; nome é apenas apresentação. Não é necessário solicitar email para controle de acesso.

Guardar nonce e identidade somente em memória e invalidar tentativas anteriores. Se falhar a obtenção de chaves/verificação, permanecer sem login com erro recuperável. Não usar `tokeninfo` como caminho normal nem aceitar um token só por ter chegado ao callback. Guardar ID token, se necessário ao ciclo local, somente enquanto a sessão existir; nunca persistir. Incluir dependência apenas para verificação, sem criar servidor.

Esta validação no navegador serve à experiência desta SPA. Um usuário controla seu próprio JavaScript; o bundle continua público. Se no futuro surgirem APIs privadas próprias, o serviço terá de validar identidade e autorização de forma independente.

### Identidade do Drive precisa corresponder à identidade do login

O `permissionId` retornado por Drive `about` não é o `sub` OIDC; não compará-los entre si nem comparar nomes/emails. Na autorização Drive solicitar `openid` para identificar a conta, além de `drive.file` para arquivos. Conferir ambos os escopos concedidos e consultar o endpoint HTTPS UserInfo do Google com access token no cabeçalho. Comparar seu `sub` ao do login validado antes de chamar `about`, descobrir documentos ou aceitar operações. O parâmetro de sugestão de conta usa a identidade do login quando suportado, sem substituir a conferência efetiva.

Se a conta divergir, descartar a nova credencial, não tocar em documentos e oferecer reconectar a conta certa ou trocar login. A troca é ação explícita, com limpeza imediata de dados/tentativas. Só depois da correspondência prosseguir com a identidade estável do Drive e seu mecanismo de revisão. Todas as chamadas mantêm o transporte fetch nativo corrigido na etapa anterior.

### Política declarativa de navegação

Estender o registro de módulos com `access: public | signed-in` (pessoal por padrão para novas entradas). Início é público; Conexão torna-se pessoal. Reutilizar a mesma política para filtrar menu e proteger montagem da rota; esconder o link sozinho é insuficiente.

Usar o HashRouter atual. Sem sessão, uma rota pessoal registrada leva à entrada no Início, guardando em memória apenas um destino interno normalizado e registrado. Após login retornar uma vez a esse destino; caso contrário permanecer em Início. Nunca aceitar URL externa, esquema, host, redirecionamento livre ou rota inexistente como retorno. Rota desconhecida mantém o tratamento 404 atual. Preservar foco, navegação por teclado e mensagem acessível ao pedir login.

Não acrescentar rota fictícia de mangás: testar extensibilidade com módulo de teste, e o módulo real se registrará quando sua change for liberada.

### Expiração, atualização e saída

Login válido vence no `exp` da identidade, sem renovação silenciosa ou token persistido. Verificar validade no timer e antes de expor rota/autorizar ação, incluindo retorno à aba após suspensão. Ao vencer, limpar identidade e Drive, pedir login e guardar somente o destino interno permitido; tentativas privadas não sobrevivem. Reload começa sem login e pode capturar a rota atual para retorno após nova entrada explícita.

Ao sair, limpar primeiro estado local e impedir callbacks tardios; usar os controles GIS apropriados para evitar seleção automática indesejada, sem afirmar que isso desconecta a conta Google do navegador ou revoga consentimento. O link de gerenciamento de consentimento continua disponível em Conexão. Cancelamento/erro recuperável não deve deixar estado ocupado indefinidamente: oferecer cancelamento local de tentativa que invalida sua geração.

### Versão e entrega

Planejamento mantém pacote, lockfile e `.release.json` na entrega `0.2.2` de cloud library. Na implementação de login, após homologação da base, atualizar os três para `0.3.0`/seleção desta change no PR exclusivo `dev` → `main`. A versão alvo da proposta acompanha cada fix patch relatado após abertura do PR.

Reutilizar CI Dev sem publicação e seus checks obrigatórios. Fornecer comandos locais ao usuário após abrir PR e aguardar revisão/merge exclusivamente dele. Prod valida o commit final, cria `v<versão final>` e publica o mesmo artefato; não aumentar versão nem criar commits em `main`. Registrar URL, SHA, execução, testes reais e homologação em `docs/releases/0.3.0.md` (ou versão final revisada). Mangás permanecem bloqueados até essa homologação.

## Risks / Trade-offs

- [Confusão entre permissão Drive e login] → Estados e ações separados, com testes de expiração e recusa independentes.
- [Login A e Drive B] → Comparação de `sub` obtido do Google antes de acessar dados; não confiar somente na conta sugerida.
- [Credencial forjada ou resposta de tentativa antiga] → Verificação de assinatura/claims/nonce e controle de geração; falhar sem liberar rotas.
- [GIS, FedCM ou chaves indisponíveis] → Login explícito, erro recuperável, cancelamento local e teste real nas origens local/produção.
- [Reload encerra sessão] → Comportamento documentado, retorno interno após nova entrada; sem credencial persistida.
- [Rotas confundidas com autorização de servidor] → Documentar limite estático; privacidade dos documentos é aplicada pelo Drive.

## Migration Plan

1. Aguardar publicação e homologação de cloud library `0.2.2`; conferir evidências antes da implementação.
2. Introduzir estado compartilhado e política de rotas sem migrar arquivos Drive schema 1. Atualizar configuração de consentimento Google para identidade/`openid` e testar contas locais.
3. Validar login e consentimento separados em simulação e navegador real. Entregar PR `0.3.0` com instruções de teste, para merge pelo usuário.
4. Após Prod, homologar em desktop/celular e liberar mangás somente com aprovação explícita. Rollback republica o frontend anterior identificado e preserva todos os documentos do Drive.

## References

- [Autenticação e autorização são fluxos distintos](https://developers.google.com/identity/oauth2/web/guides/overview).
- [Sign in with Google](https://developers.google.com/identity/gsi/web/guides/overview).
- [OpenID Connect: identidade, validação e UserInfo](https://developers.google.com/identity/openid-connect/openid-connect).
- [Modelo GIS de token para acesso a APIs](https://developers.google.com/identity/oauth2/web/guides/use-token-model).
