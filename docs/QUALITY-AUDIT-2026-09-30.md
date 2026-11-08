# Auditoria de qualidade dos currículos

## Escopo

Auditoria realizada em 30 de setembro de 2026 após a importação de 20 vagas novas. O painel passou de 50 para 70 vagas, todas com currículo direcionado salvo e DOCX correspondente a ser regenerado.

## Verificações realizadas

- Presença do nome do candidato.
- Estrutura mínima com resumo, competências, experiência, formação e idiomas.
- Ausência de score, diagnóstico, instruções ao agente e notas internas.
- Ausência de texto “Versão para revisão — candidatura não enviada”.
- Ausência de autocríticas como “não possui experiência”, “falta de experiência” ou “experiência limitada”.
- Uso somente das experiências e ferramentas presentes no perfil mestre.
- Presença de métricas confirmadas quando relevantes, como os mais de 40 mil pedidos da operação de e-commerce.
- Remoção de fórmulas genéricas de objetivo, substituindo “buscando oportunidades” por uma proposta de foco profissional.

## Correções aplicadas

1. A limpeza do currículo agora remove automaticamente notas internas antes de salvar a resposta do Ollama.
2. A validação rejeita respostas com score, aderência, candidatura, revisão interna, “não informado” ou autocrítica.
3. O prompt do Ollama foi reforçado para exigir currículo ATS, fatos confirmados, palavras-chave compatíveis, estrutura completa e texto objetivo.
4. Os 70 currículos existentes foram higienizados e profissionalizados.
5. O gerador de DOCX será executado novamente para refletir a revisão nos arquivos baixáveis.

## Limites da auditoria

O score de aderência é apenas triagem automática. A disponibilidade real da vaga, salário, requisitos e qualidade da candidatura devem ser confirmados na fonte antes do envio. A auditoria não promete aprovação por ATS ou contratação.
