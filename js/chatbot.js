const chatbotHTML = `
<div class="chatbot-floating-btn shadow" onclick="toggleChatbot()" title="Chat with Kiki">
    🧁
    <div class="kiki-flag">Chat with Kiki! 🍰</div>
</div>

<div class="chatbot-panel" id="chatbotPanel">
    <div class="chatbot-header d-flex justify-content-between align-items-center p-3">
        <h5 class="m-0 fw-bold">Chat with Kiki 🍰</h5>
        <button type="button" class="btn-close btn-close-white" onclick="toggleChatbot()" aria-label="Close"></button>
    </div>
    <div class="chatbot-body p-3" id="chatbotBody">
        <div class="chat-bubble kiki-bubble">
            Hi! I'm Kiki 🍰 I know everything on Bakemalai's menu; ask me about any cake, what it tastes like, or how you can personalise it for your occasion!
        </div>
    </div>
    <div class="chatbot-footer p-2">
        <div class="input-group">
            <input type="text" id="chatInput" class="form-control border-0 shadow-none" placeholder="Type your message..." onkeypress="handleChatKeyPress(event)">
            <button class="btn btn-candy-pulse fw-bold rounded-end" onclick="sendMessage()">Send</button>
        </div>
    </div>
</div>
`;

document.addEventListener('DOMContentLoaded', () => {
    document.body.insertAdjacentHTML('beforeend', chatbotHTML);
});

function toggleChatbot() {
    const panel = document.getElementById('chatbotPanel');
    if (panel) {
        panel.classList.toggle('active');
    }
}

function handleChatKeyPress(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
}

function sendMessage() {
    const input = document.getElementById('chatInput');
    const msg = input.value.trim();
    if (!msg) return;

    const body = document.getElementById('chatbotBody');

    const userBubble = document.createElement('div');
    userBubble.className = 'chat-bubble user-bubble';
    userBubble.textContent = msg;
    body.appendChild(userBubble);

    input.value = '';
    body.scrollTop = body.scrollHeight;

    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'chat-bubble kiki-bubble text-muted';
    typingIndicator.innerHTML = '<em>Kiki is thinking... 🍩</em>';
    body.appendChild(typingIndicator);
    body.scrollTop = body.scrollHeight;

    fetch('/.netlify/functions/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
    })
        .then(response => response.json())
        .then(data => {
            if (typingIndicator.parentNode) {
                typingIndicator.parentNode.removeChild(typingIndicator);
            }

            const kikiBubble = document.createElement('div');
            kikiBubble.className = 'chat-bubble kiki-bubble';

            if (data.reply) {
                kikiBubble.textContent = data.reply;
            } else {
                kikiBubble.textContent = "Oops, Kiki is taking a cake break 🎂 Try again shortly!";
                kikiBubble.classList.add('text-danger');
                console.error(data);
            }
            body.appendChild(kikiBubble);
            body.scrollTop = body.scrollHeight;
        })
        .catch(err => {
            if (typingIndicator.parentNode) {
                typingIndicator.parentNode.removeChild(typingIndicator);
            }

            const errorBubble = document.createElement('div');
            errorBubble.className = 'chat-bubble kiki-bubble text-danger';
            errorBubble.textContent = "Oops, Kiki is taking a cake break 🎂 Try again shortly!";
            body.appendChild(errorBubble);

            console.error(err);
            body.scrollTop = body.scrollHeight;
        });
}

