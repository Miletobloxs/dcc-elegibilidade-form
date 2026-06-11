---
description: Bot 3 - Exportação de PDF Original
---

Este workflow descreve o processo automatizado de exportação do PDF consolidado do projeto a partir da plataforma.

### Passos de Execução
1. **Navegação**: Acessar a Capa (Overview) do projeto alvo (`/projects/TARGET_ID/overview`).
2. **Configuração CDP**:
   - Ativar `Page.setDownloadBehavior` via sessão CDP.
   - Definir o caminho de download para a pasta específica do projeto em `reports/modular_extraction_v10/`.
3. **Acionamento**:
   - Clicar no botão "Exportar projeto" (Aria-label ou Classe `.export-button`).
   - Selecionar a opção "PDF" no menu de formatos.
4. **Confirmação**: Clicar no botão final "Exportar" para disparar o download.
5. **Monitoramento**:
   - O robô deve monitorar a pasta do sistema de arquivos até que o arquivo `.pdf` apareça e o download (`.crdownload`) seja finalizado.
   - Definir timeout de segurança (ex: 30 segundos).
6. **Mapeamento**:
   - Registrar o caminho absoluto do PDF em `partial_activities.json`.

// turbo
7. **Comando de Execução**:
`node bot_3_activities.js`
