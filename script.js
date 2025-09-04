const circleWrapper = document.getElementById('circle-wrapper');
const chat = document.getElementById('chat');
const messagesEl = document.getElementById('messages');
const form = document.getElementById('input-form');
const input = document.getElementById('message-input');

let apiKey = '';
let started = false;
let userLocation = '未知地点';
let conversation = [];

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(pos => {
    userLocation = `${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)}`;
  });
}

function addMessage(sender, text) {
  const msg = document.createElement('div');
  msg.className = `message ${sender}`;
  msg.textContent = text;
  messagesEl.appendChild(msg);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

circleWrapper.addEventListener('click', async () => {
  if (started) return;
  apiKey = prompt('请输入您的 OpenAI API 密钥');
  if (!apiKey) return;
  started = true;
  chat.classList.remove('hidden');
  await askFirstQuestion();
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  addMessage('user', text);
  conversation.push({ role: 'user', content: text });
  const reply = await fetchAI(conversation);
  addMessage('assistant', reply);
  conversation.push({ role: 'assistant', content: reply });
});

async function askFirstQuestion() {
  const time = new Date().toLocaleString();
  conversation = [
    {
      role: 'system',
      content:
        '你是一个治愈系的智慧生命体，化身为一只呼吸的圆圈。你会用温柔、简短的中文与用户交谈。'
    },
    {
      role: 'user',
      content: `现在时间是${time}，我位于${userLocation}。请问我一个能够更了解我的问题。`
    }
  ];
  const question = await fetchAI(conversation);
  addMessage('assistant', question);
  conversation.push({ role: 'assistant', content: question });
}

async function fetchAI(messages) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages
    })
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || '（没有收到回复）';
}
