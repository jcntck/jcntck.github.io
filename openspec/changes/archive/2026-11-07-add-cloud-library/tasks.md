# Tasks

## 1. Pré-condição e contrato de armazenamento

- [x] 1.1 Confirmar branch `dev` e versão alvo `0.2.2`; conferir a publicação `v0.1.0`, resultados de produção e homologação explícita de `add-modular-shell`; verificar as evidências antes de implementar a integração e registrar a referência da entrega usada como base.
- [x] 1.2 Atualizar `package.json` e os campos de versão do lockfile para `0.2.2` em `dev`, no PR da entrega; verificar coerência com a versão alvo e aprovação dos checks obrigatórios antes do merge.
- [x] 1.3 Criar contrato de carregar/salvar e envelope neutro versão 1 com revisão, diagnóstico e seções de módulos; verificar por testes formato válido, rejeição de versão incompatível e preservação de campos desconhecidos compatíveis, e documentar o contrato para a etapa 3.

## 2. Autorização e isolamento da sessão

- [x] 2.1 Integrar GIS com escopo `drive.file`, ação explícita e tokens apenas em memória; verificar por testes consentimento aceito, recusado, cancelado e escopo concedido, sem registrar ou persistir credenciais.
- [x] 2.2 Implementar identificação estável da conta, expiração, reconexão, desconexão e troca de conta; verificar por testes que operações pendentes só retornam para a mesma conta após releitura e que dados da conta A não aparecem nem são gravados na B.
- [x] 2.3 Documentar e configurar o cliente OAuth e as origens local e de produção; verificar consentimento real com contas de teste e confirmar que somente o client ID público entra na configuração do frontend.

## 3. Arquivo privado e verificação independente

- [x] 3.1 Implementar descoberta do documento por metadado, leitura, validação e criação somente na primeira gravação; verificar por testes documento ausente, existente, inválido, inacessível e ambíguo, sem substituir dados desconhecidos.
- [x] 3.2 Implementar gravação confirmada e repetição com identificação estável da operação; verificar por testes falha de rede e resposta perdida após sucesso remoto sem duplicar operação ou substituir seções alheias.
- [x] 3.3 Implementar conferência de revisão antes de gravar e recarregamento explícito em divergência; verificar por testes o bloqueio de sobrescrita de versão já alterada e documentar a limitação de gravações simultâneas e edição offline.
- [x] 3.4 Adicionar tela “Conexão” com estado da sessão e ações de gravar e reler amostra técnica; verificar por teste de interação a nova leitura remota do mesmo identificador sem dependência de mangás e documentar o procedimento de verificação.

- [x] 3.5 Disponibilizar componente reutilizável para abrir no Google Drive o arquivo confirmado, após criação ou leitura, removendo o link ao desconectar ou trocar de conta.

## 4. Segurança e homologação em produção

- [x] 4.1 Abrir o PR `dev` → `main`, fornecer instruções para teste local do usuário, aplicar cada fix relatado com incremento patch sincronizado e aguardar o merge realizado por ele; então acompanhar o workflow prod criar automaticamente a tag da versão final revisada (`v0.2.2` após fix; inicial `v0.2.0`) e publicar o commit validado; inspecionar pacote, URLs, logs e armazenamento persistente para verificar ausência de tokens ou segredos; conferir coerência entre versão alvo, pacote, lockfile, tag e site e ausência de dados privados no pacote, registrando URL, commit e execução em `docs/releases/0.2.2.md`.
- [x] 4.2 Executar no site real gravação e releitura entre dispositivos, recusa ou cancelamento, expiração ou revogação, desconexão, troca entre duas contas de teste e falha de rede; registrar resultados de persistência e privacidade sem expor credenciais, além do sucesso das verificações automatizadas.
- [x] 4.3 Apresentar evidências de segurança e persistência ao usuário e registrar sua homologação explícita; verificar que `add-manga-reading-tracker` permanece sem liberação enquanto a homologação desta etapa estiver pendente.

## Workflow follow-up

- Após arquivar, a próxima etapa planejada é `add-google-sign-in` (`0.3.0`), cuja implementação exige solicitação própria; mangás aguardam também a homologação dessa etapa.

## Andamento da implementação

- Pacote, lockfile e seleção de release em `0.2.2`; PR #2 integrado e Prod aprovado. Tag e site confirmam o mesmo commit; evidências em `docs/releases/0.2.2.md`.
- Configuração pública e guia OAuth entregues; usuário confirmou funcionamento real e homologou explicitamente a entrega.
- Homologação explícita recebida: “add-cloud-library homologada, pode arquivar”. Em seguida, o usuário confirmou: “Sincronizar e arquivar; concluí o roteiro 4.2”. O aceite dos testes manuais é informado pelo titular, separado dos testes automatizados executados pelo agente.
