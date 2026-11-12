// Adds free-AI support (Gemini / Groq / OpenRouter) to the Trader WorkStation assistant.
// Run once from the tws folder:  node apply-free-ai.js
// Every file is backed up as <name>.before-free-ai first. Safe to run twice (it skips what is done).
const fs = require('fs'), path = require('path');
const root = __dirname;
let failed = 0;

function patch(file, edits) {
  const p = path.join(root, file);
  if (!fs.existsSync(p)) { console.log('MISSING  ' + file); failed++; return; }
  let s = fs.readFileSync(p, 'utf8'), changed = false;
  for (const [label, from, to] of edits) {
    if (s.includes(to)) { console.log('  already done: ' + label); continue; }
    if (!s.includes(from)) { console.log('  NOT FOUND:    ' + label + '  (' + file + ' differs from what I expected)'); failed++; continue; }
    s = s.replace(from, () => to); changed = true; console.log('  patched:      ' + label);
  }
  if (changed) { fs.copyFileSync(p, p + '.before-free-ai'); fs.writeFileSync(p, s); }
}

console.log('assistant.js'); patch('assistant.js', [
  ['provider()',
   "const provider = () => process.env.ANTHROPIC_API_KEY ? 'anthropic' : process.env.OPENAI_API_KEY ? 'openai' : '';",
   "const provider = () => process.env.ASSISTANT_API_KEY ? (process.env.ASSISTANT_URL ? 'custom' : 'gemini') : process.env.ANTHROPIC_API_KEY ? 'anthropic' : process.env.OPENAI_API_KEY ? 'openai' : '';"],
  ['modelName()',
   "const modelName = () => process.env.ASSISTANT_MODEL || (provider() === 'openai' ? 'gpt-4o-mini' : 'claude-haiku-5-5');",
   "const modelName = () => process.env.ASSISTANT_MODEL || (provider() === 'openai' ? 'gpt-4o-mini' : provider() === 'gemini' || provider() === 'custom' ? 'gemini-flash-latest' : 'claude-haiku-5-5');"],
  ['free-AI call',
   "    dayCount++;\n    if (provider() === 'anthropic') {",
   "    dayCount++;\n    if (provider() === 'gemini' || provider() === 'custom') { // any OpenAI-style free service: Gemini (default), Groq, OpenRouter\n      const r = await fetch(process.env.ASSISTANT_URL || 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', { method: 'POST', signal: AbortSignal.timeout(25000),\n        headers: { Authorization: 'Bearer ' + process.env.ASSISTANT_API_KEY, 'content-type': 'application/json' },\n        body: JSON.stringify({ model: modelName(), max_tokens: 1024, messages: [{ role: 'system', content: system }, ...history, { role: 'user', content: message }] }) });\n      if (!r.ok) { const t = await r.text().catch(() => ''); throw new Error('model HTTP ' + r.status + ' ' + t.replace(/\\s+/g, ' ').slice(0, 200)); }\n      const d = await r.json(); return String(d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content || '').trim();\n    }\n    if (provider() === 'anthropic') {"],
]);

console.log('server.js'); patch('server.js', [
  ['startup message',
   "(process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY) ? 'AI answers on' : 'search mode (add ANTHROPIC_API_KEY for AI answers)'",
   "(process.env.ASSISTANT_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY) ? 'AI answers on' : 'search mode (add ASSISTANT_API_KEY for free AI answers)'"],
]);

console.log('public/admin.js'); patch('public/admin.js', [
  ['admin status text',
   "Add ANTHROPIC_API_KEY to .env and restart for full AI answers.",
   "Add ASSISTANT_API_KEY (a free Gemini key works) to .env and restart for full AI answers."],
]);

console.log('public/privacy.html'); patch('public/privacy.html', [
  ['privacy sentence',
   "to improve the answers. To ask us",
   "to improve the answers. Questions typed into the assistant are sent to an AI service provider (such as Google) so it can write the answer. To ask us"],
]);

console.log('.env.example'); patch('.env.example', [
  ['free AI settings',
   "# ANTHROPIC_API_KEY=sk-ant-your_key\n",
   "# FREE option (Gemini, key from aistudio.google.com). Takes priority over the keys below.\n# ASSISTANT_API_KEY=your_free_key\n# ASSISTANT_MODEL=gemini-flash-latest\n# ASSISTANT_URL=  (leave empty for Gemini; Groq: https://api.groq.com/openai/v1/chat/completions)\n# ANTHROPIC_API_KEY=sk-ant-your_key\n"],
]);

console.log(failed ? '\nDone with ' + failed + ' problem(s). Send me the lines marked NOT FOUND / MISSING.' : '\nAll done. Now add your key to .env and restart the server.');
process.exit(failed ? 1 : 0);
