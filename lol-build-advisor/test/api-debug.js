const API_KEY = 'REPLACE_WITH_YOUR_KEY';

async function debug() {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'hi' }]
    })
  });
  console.log('Status:', res.status);
  const body = await res.text();
  console.log('Response:', body);
}

debug().catch(e => console.log('Error:', e.message));
