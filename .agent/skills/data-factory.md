# Skill: Data Factory Automation

This skill governs the interaction with external data sources (Excel/Google Sheets).

## Mandates

- **Robustness**: Use `xlsx-official` for high-performance parsing of large local Excel files.
- **Syncing**: Use `googlesheets-automation` for any cloud-based synchronization requests.
- **Validation**: Every data import must trigger a schema validation step to ensure compatibility with `src/lib/data.ts`.

## Triggers

- "Sincronizar planilha"
- "Importar dados do Excel"
- "Automatizar relatório de dados"
