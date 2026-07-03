# CHECKPOINT — INSCRIÇÃO E UPLOAD OK

Data: 01/07/2026

Status:
- Erro "Body exceeded 1 MB limit" corrigido.
- next.config.ts configurado com:
  experimental.serverActions.bodySizeLimit = "100mb"
- Formulário de inscrição validando arquivos antes do envio.
- Logo do time permitida até 5 MB.
- Documento de cada atleta permitido até 3 MB.
- Total da inscrição limitado a 95 MB.

Observação:
- Solução atual funciona para continuar o projeto.
- Melhor solução futura: upload direto para Supabase Storage com compressão automática das imagens.
