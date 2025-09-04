const circleWrapper = document.getElementById('circle-wrapper');
const circle = document.getElementById('breathing-circle');
const chat = document.getElementById('chat');
const messagesEl = document.getElementById('messages');
const form = document.getElementById('input-form');
const input = document.getElementById('message-input');

const settingsBtn = document.getElementById('settings-button');
const settingsModal = document.getElementById('settings-modal');
const modelSelect = document.getElementById('model-select');
const openaiKeyInput = document.getElementById('openai-key');
const deepseekKeyInput = document.getElementById('deepseek-key');
const saveSettingsBtn = document.getElementById('save-settings');
const closeSettingsBtn = document.getElementById('close-settings');
const clearConversationBtn = document.getElementById('clear-conversation');

let userLocation = '未知地点';

let settings = JSON.parse(localStorage.getItem('settings') || '{}');
settings = Object.assign({ provider: 'openai', openaiKey: '', deepseekKey: '' }, settings);

modelSelect.value = settings.provider;
openaiKeyInput.value = settings.openaiKey;
deepseekKeyInput.value = settings.deepseekKey;

let conversation = JSON.parse(localStorage.getItem('conversation') || '[]');

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(pos => {
    userLocation = `${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)}`;
  });
}

function saveConversation() {
  localStorage.setItem('conversation', JSON.stringify(conversation));
}

function saveSettings() {
  localStorage.setItem('settings', JSON.stringify(settings));
}

function addMessage(sender, text) {
  const msg = document.createElement('div');
  msg.className = `message ${sender}`;
  msg.textContent = text;
  messagesEl.appendChild(msg);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

conversation.filter(m => m.role !== 'system').forEach(m => {
  addMessage(m.role === 'user' ? 'user' : 'assistant', m.content);
});
if (conversation.length > 0) {
  chat.classList.remove('hidden');
  circle.classList.add('breathing');
}

function openSettings() {
  settingsModal.classList.remove('hidden');
}

function closeSettings() {
  settingsModal.classList.add('hidden');
}

settingsBtn.addEventListener('click', openSettings);
closeSettingsBtn.addEventListener('click', closeSettings);

saveSettingsBtn.addEventListener('click', () => {
  settings.provider = modelSelect.value;
  settings.openaiKey = openaiKeyInput.value.trim();
  settings.deepseekKey = deepseekKeyInput.value.trim();
  saveSettings();
  closeSettings();
});

clearConversationBtn.addEventListener('click', () => {
  localStorage.removeItem('conversation');
  conversation = [];
  messagesEl.innerHTML = '';
  chat.classList.add('hidden');
  circle.classList.remove('breathing');
});

function getApiKey() {
  return settings.provider === 'openai' ? settings.openaiKey : settings.deepseekKey;
}

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
  saveConversation();
});

let clickTimer;
circleWrapper.addEventListener('click', () => {
  clearTimeout(clickTimer);
  clickTimer = setTimeout(() => {
    handleSingleClick();
  }, 250);
});

circleWrapper.addEventListener('dblclick', () => {
  clearTimeout(clickTimer);
  handleDoubleClick();
});

async function handleSingleClick() {
  circle.classList.add('shake');
  setTimeout(() => circle.classList.remove('shake'), 500);
  if (!getApiKey()) {
    openSettings();
    return;
  }
  if (conversation.length === 0) {
    const time = new Date().toLocaleString();
    conversation.push({
      role: 'system',
      content: '你是一个治愈系的智慧生命体，化身为一只呼吸的圆圈。你会用温柔、简短的中文与用户交谈。'
    });
    conversation.push({ role: 'user', content: `现在时间是${time}，我位于${userLocation}。` });
  }
  conversation.push({ role: 'user', content: '请预测我接下来可能会做什么。' });
  const prediction = await fetchAI(conversation);
  addMessage('assistant', prediction);
  conversation.push({ role: 'assistant', content: prediction });
  saveConversation();
  chat.classList.remove('hidden');
}

async function handleDoubleClick() {
  circle.classList.add('breathing');
  if (!getApiKey()) {
    openSettings();
    return;
  }
  chat.classList.remove('hidden');
  if (conversation.length === 0) {
    await askFirstQuestion();
  } else {
    conversation.push({ role: 'user', content: '请再问我一个能够更了解我的问题。' });
    const question = await fetchAI(conversation);
    addMessage('assistant', question);
    conversation.push({ role: 'assistant', content: question });
    saveConversation();
  }
}

async function askFirstQuestion() {
  const time = new Date().toLocaleString();
  conversation = [
    {
      role: 'system',
      content: '你是一个治愈系的智慧生命体，化身为一只呼吸的圆圈。你会用温柔、简短的中文与用户交谈。'
    },
    {
      role: 'user',
      content: `现在时间是${time}，我位于${userLocation}。请问我一个能够更了解我的问题。`
    }
  ];
  const question = await fetchAI(conversation);
  addMessage('assistant', question);
  conversation.push({ role: 'assistant', content: question });
  saveConversation();
}

async function fetchAI(messages) {
  const key = getApiKey();
  const provider = settings.provider;
  const url = provider === 'deepseek'
    ? 'https://api.deepseek.com/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions';
  const model = provider === 'deepseek' ? 'deepseek-chat' : 'gpt-3.5-turbo';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`
    },
    body: JSON.stringify({
      model,
      messages
    })
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || '（没有收到回复）';
}
