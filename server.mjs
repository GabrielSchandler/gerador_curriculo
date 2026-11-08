import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';

const root = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(root, 'public');
const dataDir = path.join(root, 'data');
const port = Number(process.env.PORT || 4173);
const applicationsFile = path.join(dataDir, 'applications.json');
const jobsFile = path.join(dataDir, 'jobs.json');
const ollamaUrl = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const ollamaModel = process.env.OLLAMA_MODEL || 'qwen2.5:7b-instruct';
let ollamaHealthy = null;

const json = (res, status, body) => {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
};

async function body(req) {
  let raw = ''; for await (const chunk of req) raw += chunk;
  return JSON.parse(raw || '{}');
}

async function applications() {
  try { return JSON.parse(await fs.readFile(applicationsFile, 'utf8')); }
  catch { return []; }
}
async function canUseOllama() {
  if (ollamaHealthy !== null) return ollamaHealthy;
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 800);
  try { const r = await fetch(`${ollamaUrl}/api/tags`, { signal:controller.signal }); ollamaHealthy = r.ok; }
  catch { ollamaHealthy = false; }
  finally { clearTimeout(timer); }
  return ollamaHealthy;
}
async function jobs() {
  try { return JSON.parse(await fs.readFile(jobsFile, 'utf8')); }
  catch { return []; }
}

function runExport(payload) {
  return new Promise((resolve, reject) => {
    const python = process.env.PYTHON || 'C:\\Users\\Gabriel\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe';
    const child = spawn(python, [path.join(root, 'export.py')], { cwd: root, windowsHide: true });
    let out = ''; let err = '';
    child.stdout.on('data', (d) => out += d); child.stderr.on('data', (d) => err += d);
    child.stdin.end(JSON.stringify(payload));
    child.on('error', reject); child.on('close', (code) => code === 0 ? resolve(JSON.parse(out)) : reject(new Error(err || `Exportação falhou (${code})`)));
  });
}

function analyze(profile, vacancy) {
  const text = `${vacancy.title || ''} ${vacancy.company || ''} ${vacancy.description || ''}`.toLowerCase();
  const terms = [...new Set(profile.skills.flatMap((s) => s.toLowerCase().split(/[^a-záàâãéêíóôõúç0-9]+/i)).filter((term) => term.length >= 5))];
  const matched = terms.filter((term) => text.includes(term));
  const remoteText = `${text} ${vacancy.remote || ''} ${vacancy.location || ''}`.toLowerCase();
  const remote = /remot|home office|teletrabalho/.test(remoteText);
  const englishRequired = /ingl[eê]s.*(avanç|fluente|intermedi)|english.*(advanced|fluent|professional)/.test(text);
  const gaps = [];
  if (!remote) gaps.push('Modalidade remota não foi confirmada na descrição.');
  if (englishRequired && profile.english === 'Básico') gaps.push('A vaga parece exigir inglês acima do nível informado.');
  if (!matched.length) gaps.push('Nenhuma competência principal foi identificada automaticamente; revisar manualmente.');
  const score = Math.max(0, Math.min(100, 35 + matched.length * 8 + (remote ? 15 : 0) - (englishRequired ? 25 : 0)));
  return { score, matched, gaps, remote, englishRequired, recommendation: score >= 70 ? 'Priorizar para revisão' : score >= 50 ? 'Avaliar com atenção' : 'Baixa aderência neste momento' };
}

async function localReview(profile, vacancy, analysis) {
  if (!(await canUseOllama())) return { status:'fallback', reason:'Ollama indisponível' };
  const prompt = `Analise esta vaga contra este perfil. Responda somente JSON com "strengths" (array de strings), "gaps" (array de strings) e "summary" (string curta). Não invente fatos. VAGA: ${String(vacancy.description || '').slice(0, 7000)} PERFIL: ${profile.summary} Competências: ${profile.skills.join(', ')} Análise inicial: ${JSON.stringify(analysis)}`;
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(`${ollamaUrl}/api/generate`, { method:'POST', headers:{'content-type':'application/json'}, signal:controller.signal, body:JSON.stringify({ model:ollamaModel, prompt, stream:false, options:{temperature:0.1, num_ctx:4096} }) });
    if (!response.ok) return { status:'indisponível', reason:`Ollama HTTP ${response.status}` };
    const data = await response.json(); const raw = data.response || ''; const parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || raw);
    return { status:'local', ...parsed };
  } catch (e) { return { status:'fallback', reason:e.name === 'AbortError' ? 'Tempo limite local excedido' : 'Ollama indisponível' }; }
  finally { clearTimeout(timer); }
}

function deterministicResume(profile, vacancy, analysis) {
  const relevant = profile.experiences.filter((e) => `${e.company} ${e.role} ${e.details.join(' ')}`.toLowerCase().split(/\W+/).some((word) => word.length > 3 && (vacancy.description || '').toLowerCase().includes(word)));
  const experiences = (relevant.length ? relevant : profile.experiences.slice(0, 3)).map((e) => `### ${e.company} — ${e.role}\n${e.period}\n${e.details.map((d) => `- ${d}`).join('\n')}`).join('\n\n');
  const relevantSkills = profile.skills.filter((skill) => analysis.matched.some((term) => skill.toLowerCase().includes(term))).concat(profile.skills.filter((skill) => /excel|atendimento|suporte|crm|operações|automação/i.test(skill))).filter((skill, index, all) => all.indexOf(skill) === index);
  return `# ${profile.name}\n${profile.location} | ${profile.email} | ${profile.phone}\n${profile.linkedin}\n\n## Resumo profissional\n${profile.summary} Experiência com organização de processos, atendimento, suporte operacional e uso de sistemas, com capacidade de aprender ferramentas e traduzir necessidades em soluções práticas.\n\n## Competências relevantes\n${(relevantSkills.length ? relevantSkills : profile.skills).join(' · ')}\n\n## Experiência profissional\n${experiences}\n\n## Formação\n${profile.education}\n\n## Idiomas\nInglês: ${profile.english}`;
}

function cleanGeneratedResume(value) {
  return String(value || '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((line) => !/vers[aã]o para revis[aã]o|curr[ií]culo direcionado|candidatura n[aã]o enviada|nota interna|observa[cç][aã]o interna|[ií]ndice de ader[eê]ncia|score interno|rascunho para revis[aã]o/i.test(line))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function generateResume(profile, vacancy, analysis) {
  const fallback = deterministicResume(profile, vacancy, analysis);
  if (!(await canUseOllama())) return { resume:fallback, source:'fallback-ollama-indisponível' };
  const prompt = `Você é um especialista brasileiro em currículos ATS. Gere somente o currículo em Markdown, sem introdução, comentários ou explicações. Use exclusivamente fatos do PERFIL; não invente resultados, cargos, senioridade, ferramentas, salários, responsabilidades ou experiência com a empresa da VAGA. Adapte o resumo, a ordem das competências e a ênfase das experiências aos requisitos da VAGA. Use palavras-chave reais da vaga apenas quando forem compatíveis com fatos do PERFIL. Escreva um documento profissional, objetivo e legível, sem frases genéricas repetidas, sem autocrítica, sem dizer que faltam experiências e sem mencionar score, aderência, revisão, candidatura, rascunho ou instruções. Nunca inclua texto oculto. Estrutura obrigatória: nome, contato, Resumo profissional, Competências, Experiência profissional, Formação e Idiomas. PERFIL: ${JSON.stringify({ name:profile.name, summary:profile.summary, skills:profile.skills, experiences:profile.experiences, education:profile.education, english:profile.english })} VAGA: ${JSON.stringify(vacancy)} ANÁLISE: ${JSON.stringify(analysis)}`;
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 9000);
  try {
    const response = await fetch(`${ollamaUrl}/api/generate`, { method:'POST', headers:{'content-type':'application/json'}, signal:controller.signal, body:JSON.stringify({ model:ollamaModel, prompt, stream:false, options:{temperature:0.1, num_ctx:4096} }) });
    if (!response.ok) return { resume:fallback, source:'fallback-determinístico' };
    const data = await response.json(); const resume = cleanGeneratedResume(data.response || '');
    if (!resume || !resume.includes(profile.name) || resume.length < 400 || /não informado|não possui experiência|não tem experiência|falta de experiência|candidatura|revisão interna/i.test(resume)) return { resume:fallback, source:'fallback-validação' };
    return { resume, source:'ollama-local' };
  } catch { return { resume:fallback, source:'fallback-ollama-indisponível' }; }
  finally { clearTimeout(timer); }
}

async function generateBundle(profile, vacancy, analysis) {
  const fallback = deterministicResume(profile, vacancy, analysis);
  const fallbackReview = { status:'fallback', reason:'Ollama indisponível', summary:'Análise inicial gerada localmente.', strengths:analysis.matched, gaps:analysis.gaps };
  if (!(await canUseOllama())) return { resume:fallback, review:fallbackReview, source:'fallback-ollama-indisponível' };
  const prompt = `Responda SOMENTE JSON válido com as chaves summary (string curta), strengths (array), gaps (array) e resume (string Markdown). O campo resume deve ser um currículo completo e profissional com esta estrutura obrigatória: # nome; contato; ## Resumo profissional; ## Competências relevantes; ## Experiência profissional; ## Formação; ## Idiomas. Use SOMENTE fatos do PERFIL. Não invente resultados, cargos, senioridade, ferramentas, salários ou responsabilidades. Use palavras-chave da VAGA somente quando compatíveis com o PERFIL. Não escreva autocríticas, não diga que o candidato não tem ou não possui experiência, não use “não informado”, não inclua score, aderência, diagnóstico, observações internas, instruções, candidatura ou revisão. Não inclua texto oculto. Adapte a ordem e o resumo à VAGA, elimine frases genéricas repetidas e priorize realizações e ferramentas comprovadas. VAGA: ${JSON.stringify(vacancy)} PERFIL: ${JSON.stringify({name:profile.name,location:profile.location,email:profile.email,phone:profile.phone,linkedin:profile.linkedin,summary:profile.summary,skills:profile.skills,experiences:profile.experiences,education:profile.education,english:profile.english})} ANÁLISE INICIAL: ${JSON.stringify(analysis)}`;
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 60000);
  try {
    const response = await fetch(`${ollamaUrl}/api/generate`, { method:'POST', headers:{'content-type':'application/json'}, signal:controller.signal, body:JSON.stringify({ model:ollamaModel, prompt, stream:false, format:'json', options:{temperature:0.1, num_ctx:4096} }) });
    if (!response.ok) return { resume:fallback, review:{...fallbackReview, reason:`Ollama HTTP ${response.status}`}, source:'fallback-ollama-http' };
    const data = await response.json(); const raw = data.response || ''; const parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || raw);
    const resumeText = cleanGeneratedResume(parsed.resume || '');
    const requiredSections = ['## Resumo profissional', '## Competências', '## Experiência', '## Formação', '## Idiomas'];
    if (!resumeText.includes(profile.name) || resumeText.length < 750 || requiredSections.some((section) => !resumeText.includes(section)) || /não informado|candidatura|revisão interna|score|aderência|não tenho experiência|não possui experiência|não tem experiência|falta de experiência/i.test(resumeText)) return { resume:fallback, review:{...fallbackReview, reason:'Resposta local não passou na validação de qualidade'}, source:'fallback-validação' };
    return { resume:resumeText, review:{status:'local', summary:String(parsed.summary || ''), strengths:Array.isArray(parsed.strengths)?parsed.strengths:[], gaps:Array.isArray(parsed.gaps)?parsed.gaps:[]}, source:'ollama-local' };
  } catch (e) { return { resume:fallback, review:{...fallbackReview, reason:e.name === 'AbortError' ? 'Tempo limite local excedido' : 'Falha na resposta local'}, source:'fallback-ollama-falha' }; }
  finally { clearTimeout(timer); }
}

async function route(req, res) {
  if (req.url === '/api/profile' && req.method === 'GET') return json(res, 200, await fs.readFile(path.join(dataDir, 'profile.json'), 'utf8').then(JSON.parse));
  if (req.url === '/api/analyze' && req.method === 'POST') {
    const input = await body(req); const profile = JSON.parse(await fs.readFile(path.join(dataDir, 'profile.json'), 'utf8'));
    const analysis = analyze(profile, input); const generated = await generateBundle(profile, input, analysis);
    return json(res, 200, { analysis, local:generated.review, generation: generated.source, resume: generated.resume });
  }
  if (req.url === '/api/applications' && req.method === 'GET') return json(res, 200, await applications());
  if (req.url === '/api/applications' && req.method === 'POST') {
    const input = await body(req); const items = await applications();
    const item = { id: randomUUID(), ...input, status: input.status || 'Pronta para revisão', createdAt: new Date().toISOString() };
    await fs.writeFile(applicationsFile, JSON.stringify([item, ...items], null, 2)); return json(res, 201, item);
  }
  if (req.url === '/api/jobs' && req.method === 'GET') return json(res, 200, await jobs());
  const jobMatch = req.url.match(/^\/api\/jobs\/([^/]+)$/);
  if (jobMatch && req.method === 'PATCH') {
    const id = decodeURIComponent(jobMatch[1]); const input = await body(req); const items = await jobs(); const index = items.findIndex((item) => item.id === id);
    if (index < 0) return json(res, 404, { error:'Vaga não encontrada' });
    const current = items[index]; const updated = { ...current, ...input, updatedAt:new Date().toISOString() };
    if (input.status && input.status !== current.status) updated.history = [...(current.history || []), { from:current.status, to:input.status, at:updated.updatedAt, note:input.statusNote || '' }];
    items[index] = updated; await fs.writeFile(jobsFile, JSON.stringify(items, null, 2)); return json(res, 200, updated);
  }
  if (req.url === '/api/jobs/import' && req.method === 'POST') {
    const input = await body(req); const profile = JSON.parse(await fs.readFile(path.join(dataDir, 'profile.json'), 'utf8'));
    const existing = await jobs(); const added = [];
    for (const vacancy of (input.jobs || []).slice(0, 10)) {
      const key = vacancy.url || `${vacancy.company || ''}|${vacancy.title || ''}`;
      if (existing.some((j) => (j.url || `${j.company || ''}|${j.title || ''}`) === key)) continue;
      const analysis = analyze(profile, vacancy);
      const generated = await generateBundle(profile, vacancy, analysis);
      added.push({ id: randomUUID(), ...vacancy, analysis, resume: generated.resume, review:generated.review, generation: generated.source, status:'Encontrada', salary:vacancy.salary || '', applicationUrl:vacancy.applicationUrl || vacancy.url || '', notes:'', nextAction:'Revisar aderência e currículo', history:[], collectedAt:new Date().toISOString(), source:'Importada por agente autorizado' });
    }
    await fs.writeFile(jobsFile, JSON.stringify([...added, ...existing], null, 2));
    return json(res, 201, { added: added.length, skipped: Math.max(0, (input.jobs || []).slice(0, 10).length - added.length), jobs: added });
  }
  if (req.url === '/api/export' && req.method === 'POST') {
    try { return json(res, 200, await runExport(await body(req))); }
    catch (e) { return json(res, 500, { error: e.message }); }
  }
  if (req.url === '/api/health') return json(res, 200, { ok: true, mode: 'local-first' });
  const safe = req.url === '/' ? '/index.html' : req.url;
  const file = path.resolve(publicDir, `.${safe}`);
  if (!file.startsWith(path.resolve(publicDir))) return json(res, 403, { error: 'Acesso negado' });
  try { const content = await fs.readFile(file); const type = file.endsWith('.html') ? 'text/html' : file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : file.endsWith('.docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/octet-stream'; res.writeHead(200, { 'content-type': `${type}${type === 'application/octet-stream' || type.includes('wordprocessing') ? '' : '; charset=utf-8'}` }); res.end(content); }
  catch { json(res, 404, { error: 'Não encontrado' }); }
}

http.createServer((req, res) => route(req, res).catch((e) => json(res, 500, { error: e.message }))).listen(port, () => console.log(`Currículo Vagas em http://localhost:${port}`));
