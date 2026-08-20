#!/usr/bin/env node
// Ask LightReel (lightreel.ai) a UGC/reels research question.
// Their edge closes connections at ~60s but processing continues server-side,
// so this fires POST /v1/chat, then polls GET /v1/chat/:id until the answer lands.
// Usage: node --env-file=.env.local scripts/lightreel.mjs "question"
//        node --env-file=.env.local scripts/lightreel.mjs <conversationId>   (resume/poll)

const KEY = process.env.LIGHTREEL_API_KEY;
const question = process.argv.slice(2).join(' ');
if (!question || !KEY) {
  console.error('usage: node --env-file=.env.local scripts/lightreel.mjs "question"|<conversationId>');
  process.exit(1);
}

const api = (path, init = {}) =>
  fetch(`https://api.lightreel.ai${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
  });

let conversationId;
if (/^[0-9a-f]{24}$/.test(question)) {
  conversationId = question;
} else {
  try {
    const res = await api('/v1/chat', {
      method: 'POST',
      body: JSON.stringify({ question }),
      signal: AbortSignal.timeout(55_000),
    });
    const body = await res.json();
    if (!res.ok) {
      console.error(`LightReel ${res.status} ${body.type ?? ''}: ${body.message ?? ''}`);
      process.exit(1);
    }
    if (body.answer) {
      print(body.answer);
      process.exit(0);
    }
    conversationId = body.conversationId;
  } catch {
    // edge killed the socket; recover the conversation from the chat list
    const { conversations } = await (await api('/v1/chats')).json();
    conversationId = conversations?.find((c) => question.startsWith(c.title.slice(0, 40)))?.conversationId;
    if (!conversationId) {
      console.error('question not found in /v1/chats after connection drop');
      process.exit(1);
    }
  }
}

console.error(`polling conversation ${conversationId} ...`);
for (let i = 0; i < 60; i++) {
  await new Promise((r) => setTimeout(r, 15_000));
  const { messages } = await (await api(`/v1/chat/${conversationId}`)).json();
  const a = messages?.findLast((m) => m.role === 'assistant');
  if (a) {
    print(a.answer);
    process.exit(0);
  }
}
console.error(`no answer after 15 min; retry later with: scripts/lightreel.mjs ${conversationId}`);
process.exit(1);

function print(answer) {
  console.log(typeof answer === 'string' ? answer : JSON.stringify(answer, null, 2));
}
