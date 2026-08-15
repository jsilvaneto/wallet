# Wallet - Especificação e Roadmap do App Android (Fase 2)

## 1. Objetivo
Desenvolver um aplicativo mobile complementar para a plataforma **Android**, permitindo que o usuário consulte seus lançamentos, registre despesas rápidas na rua (ex: combustível, almoço, compras) e sincronize os dados com o servidor local ou via Google Sheets.

---

## 2. Tecnologias Consideradas

| Abordagem | Tecnologias | Vantagens |
| :--- | :--- | :--- |
| **Opção A: Híbrida / PWA / Capacitor** | React + Capacitor / Ionic | Reutilização de 90%+ do código do frontend React existente, desenvolvimento rápido, mesmo visual e design system. |
| **Opção B: Multiplataforma Nativa** | React Native / Expo | Excelente performance e animações fluidas, componentes nativos com suporte offline fácil (WatermelonDB / SQLite local). |
| **Opção C: Nativo Android** | Kotlin + Jetpack Compose + Room | Máxima integração com o sistema operacional Android (widgets de tela inicial, notificações locais de contas vencendo, leitura de notificações bancárias/SMS). |

---

## 3. Funcionalidades Planejadas para o Mobile

1. **Lançamento Rápido (*Quick Entry*)**:
   - Widget na tela inicial para adicionar despesas com 2 toques (Valor + Categoria + Foto do Comprovante opcional).
2. **Notificações Locais de Vencimento**:
   - Alertas diários com as contas que vencem hoje ou estão atrasadas.
3. **Modo Offline-First**:
   - Armazenamento local (SQLite no aparelho) com sincronização em lote quando conectado à rede local ou internet.
4. **Biometria**:
   - Desbloqueio seguro por impressão digital / reconhecimento facial via Android BiometricPrompt.
5. **Leitura de Notificações / PIX / SMS (Opcional)**:
   - Captura de comprovantes e transações de bancos brasileiros para pré-preenchimento automático.
