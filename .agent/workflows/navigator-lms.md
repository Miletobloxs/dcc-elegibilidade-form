---
description: Como navegar no DreamShaper preservando a sessão do AVA
---

# Fluxo de Navegação LMS/AVA (DreamShaper)

Para evitar erros de autenticação e perda de contexto de turma, siga rigorosamente estes passos:

1. **Acesso via SSO**: Sempre utilize o link de redirecionamento oficial para garantir a sessão do AVA:
   - [Acessar DreamShaper via SSO](https://api.dreamshaper.com/gateway/lti/sso/redirect?lmsOrgId=saocamilo-mba-gestaoemsaude-251&jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJkcmVhbXNoYXBlci5jb20iLCJzdWIiOjE4ODM5OTYsImV4cCI6MTc4MDQ0NjI5OSwibmJmIjoxNzY0NzIxNDk5LCJpYXQiOjE3NjQ3MjE0OTksImp0aSI6InNzby8yNjAzMjc2IiwidXVpZCI6Ijc2ZTFkYWFlLWQ2N2QtNGZhYi04MzM5LTg3NmVhYjFiYzZkYSIsImVtYWlsIjoiMTQ3Ni5zYW9jYW1pbG8tbWJhLWdlc3Rhb2Vtc2F1ZGUtMjUxK3Nzb0BkcmVhbXNoYXBlci5jb20iLCJ1c2VyIjoiYWJjMzYwYTktNWM1YS00YTIyLTgxZmYtY2M0ZmQ4MDI3Zjc2XzE0NzYuc2FvY2FtaWxvLW1iYS1nZXN0YW9lbXNhdWRlLTI1MSIsImZpcnN0IjoiQ0FSTE9TIiwibGFzdCI6IkpPU0UgQ0FSTkVJUk8gSlVOSU9SIiwibG1zX3VzZXJfaWQiOiJhYmMzNjBhOS01YzVhLTRhMjItODFmZi1jYzRmZDgwMjdmNzZfMTQ3NiIsImxtc19vcmdfaWQiOiJzYW9jYW1pbG8tbWJhLWdlc3Rhb2Vtc2F1ZGUtMjUxIn0.gdYiigp7kahrAco8AjSmjOUPXbyqI7M6L-SpPi7I-hY&recover=ztSXHJzY2RTf7Hc0tpbXCnh77pFCKzs5PQGz0KoXgJlM7UsyTMTK4nkAWRy3Lxun)
2. **Seleção de Turma**: Após o redirecionamento, entre obrigatoriamente na turma: **SPGSA25DESIGN4**.
3. **Sempre use a página já aberta**: Priorize o uso da página ativa no navegador que já está no domínio `saocamilo-mba-gestaoemsaude-251.dreamshaper.com`.
4. **NUNCA use URLs genéricas**: Proibido navegar para `app.dreamshaper.com` ou `www.dreamshaper.com`. Essas URLs não possuem o token de autenticação do AVA.
5. **Navegação Relativa**: Use cliques nos elementos da sidebar ou mude apenas o hash da URL mantendo o subdomínio da instituição.
6. **Resgate de Sessão**: Se a página fechar, use o link de SSO do item 1 para reabrir e conecte via CDP. 
