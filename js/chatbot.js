const chatbotHTML = `
<!-- Chatbot Floating Button -->
<div class="chatbot-floating-btn shadow" onclick="toggleChatbot()" title="Chat with Kiki">
    🧁
</div>

<!-- Chatbot Panel -->
<div class="chatbot-panel" id="chatbotPanel">
    <div class="chatbot-header d-flex justify-content-between align-items-center p-3">
        <h5 class="m-0 fw-bold">Chat with Kiki 🍰</h5>
        <button type="button" class="btn-close btn-close-white" onclick="toggleChatbot()" aria-label="Close"></button>
    </div>
    <div class="chatbot-body p-3" id="chatbotBody">
        <div class="chat-bubble kiki-bubble">
            Hi! I'm Kiki 🍰 Ask me anything about cake designs, flavors, or custom orders!
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

// Inject Chatbot UI on page load
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
    
    // Add user message to UI
    body.innerHTML += `
        <div class="chat-bubble user-bubble">
            ${msg}
        </div>
    `;
    input.value = '';
    
    // Scroll to bottom
    body.scrollTop = body.scrollHeight;
    
    // Call Netlify Function
    fetch('/.netlify/functions/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
    })
    .then(response => response.json())
    .then(data => {
        if (data.reply) {
            body.innerHTML += `
                <div class="chat-bubble kiki-bubble">
                    ${data.reply}
                </div>
            `;
            body.scrollTop = body.scrollHeight;
        } else {
            body.innerHTML += `
                <div class="chat-bubble kiki-bubble text-danger">
                    Oops! Something went wrong on my end. 😔
                </div>
            `;
            console.error("Chatbot error", data);
            body.scrollTop = body.scrollHeight;
        }
    })
    .catch(err => {
        body.innerHTML += `
            <div class="chat-bubble kiki-bubble text-danger">
                Oops! Something went wrong. Make sure you're connected to the internet. 🔌
            </div>
        `;
        console.error("Fetch error", err);
        body.scrollTop = body.scrollHeight;
    });
}

