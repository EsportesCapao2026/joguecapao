# CHECKPOINT — LOGIN ADMIN / MASTER OK

Data: 02/07/2026

Status:
- Tela de login agora pede apenas uma senha.
- Se digitar a senha admin, entra como admin.
- Se digitar a senha master, entra como master.
- O cookie principal voltou ao formato antigo para manter compatibilidade:
  joguecapao_admin_session = SESSION_SECRET
- Um segundo cookie indica o tipo de acesso:
  joguecapao_admin_role = admin ou master

Arquivos ajustados:
- src/lib/adminAuth.ts
- src/app/admin/actions.ts
- src/app/admin/page.tsx

Próximo passo:
- Ajustar a página de Configurações para mostrar troca de senha apenas quando o login for master.
- Admin comum não deve ver nem conseguir trocar senha.
