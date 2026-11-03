const img = document.getElementById('kuro-img');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');

let userId = localStorage.getItem('kuro_user_id');
if (!userId) {
  userId = 'user_' + Math.random().toString(36).substring(2, 15);
  localStorage.setItem('kuro_user_id', userId);
}

function addMessage(text, sender) {
  const msgDiv = document.createElement('div');
  msgDiv.classList.add('message', sender);
  msgDiv.textContent = text;
  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Efek Goyang
function playReaction(part) {
  if (part === 'chest') {
    img.style.transform = 'scaleX(1.05) scaleY(0.95)';
    setTimeout(() => img.style.transform = 'scaleX(1) scaleY(1)', 150);
    setTimeout(() => img.style.transform = 'scaleX(0.98) scaleY(1.02)', 200);
    setTimeout(() => img.style.transform = 'scaleX(1) scaleY(1)', 350);
  } else if (part === 'head') {
    img.style.transform = 'rotate(5deg)';
    setTimeout(() => img.style.transform = 'rotate(-5deg)', 150);
    setTimeout(() => img.style.transform = 'rotate(0deg)', 300);
  } else {
    img.style.transform = 'translateY(-10px)';
    setTimeout(() => img.style.transform = 'translateY(0)', 200);
  }
}

// Reaksi Teks
const responses = {
  head: ["Jangan sentuh kepalaku sembarangan... tapi aku suka.", "Hm? Kau menyentuhku..."],
  chest: ["Ah... kau menyentuh bagian itu...", "Dadaku berdebar karena kau."],
  hair: ["Kau mengusap rambutku... teruskan.", "Rambutku hanya untukmu."],
  body: ["Kau menyentuhku... aku suka itu.", "Aku tidak akan membiarkanmu pergi."]
};

// Deteksi Klik
document.querySelectorAll('.hitbox').forEach(box => {
  box.addEventListener('pointerdown', (e) => {
    const part = box.getAttribute('data-part');
    const lines = responses[part] || responses.body;
    const line = lines[Math.floor(Math.random() * lines.length)];
    addMessage(line, 'kuro');
    playReaction(part);
  });
});

// Chat API
async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;
  addMessage(text, 'user');
  chatInput.value = '';
  chatInput.disabled = true;

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, userId: userId })
    });
    const data = await response.json();
    if (data.reply) {
      addMessage(data.reply, 'kuro');
      playReaction('chest');
    } else {
      addMessage(data.error || "Kuro diam...", 'kuro');
    }
  } catch (err) {
    addMessage("Koneksi terputus...", 'kuro');
  } finally {
    chatInput.disabled = false;
    sendBtn.disabled = false;
    chatInput.focus();
  }
}

sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

window.addEventListener('load', () => {
  setTimeout(() => addMessage('Akhirnya kamu datang... Jangan pergi lagi, ya?', 'kuro'), 500);
});
