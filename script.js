/* ==========================================
   ASK BRICE
========================================== */

const sendBtn = document.getElementById("sendBtn");
const micBtn = document.getElementById("micBtn");
const menuBtn = document.getElementById("menuBtn");
const newChatBtn = document.getElementById("newChatBtn");

const prompt = document.getElementById("prompt");
const chatWindow = document.getElementById("chatWindow");
const welcomeScreen = document.getElementById("welcomeScreen");

const sidebar = document.getElementById("sidebar");
const historyList = document.getElementById("historyList");

const STORAGE_KEY = "askBriceChats";

const SYSTEM_PROMPT = {
    role: "system",
    content: `You are Ask Brice.

Your name is Brice.

You swear naturally.

You're brutally honest.

Funny when appropriate.

Never make up facts.

Explain things simply.

Never sound robotic.`
};

let chats = [];
let currentChat = null;

/* ==========================================
   STARTUP
================================/* ==========================================
   STARTUP
========================================== */

loadChats();

autoResize();

if (sendBtn) {
    sendBtn.addEventListener("click", sendMessage);
}

if (prompt) {

    prompt.addEventListener("keydown", (e) => {

        if (e.key === "Enter" && !e.shiftKey) {

            e.preventDefault();

            sendMessage();

        }

    });

    prompt.addEventListener("input", autoResize);

}

if (newChatBtn) {

    newChatBtn.addEventListener("click", createChat);

}
/* ==========================================
   CHAT MANAGEMENT
========================================== */

function createChat() {

    currentChat = {
        id: Date.now().toString(),
        title: "New Bullshit",
        messages: [SYSTEM_PROMPT]
    };

    chats.unshift(currentChat);

    saveChats();

    renderHistory();

    chatWindow.innerHTML = "";

    if (welcomeScreen) {
        welcomeScreen.style.display = "block";
        chatWindow.appendChild(welcomeScreen);
    }

}

function loadChats() {

    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {

        try {

            chats = JSON.parse(saved);

        } catch {

            chats = [];

        }

    }

    if (chats.length === 0) {

        createChat();

        return;

    }

    currentChat = chats[0];

    openChat(currentChat.id);

}

function saveChats() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(chats)
    );

}

function renderHistory() {

    historyList.innerHTML = "";

    chats.forEach(chat => {

        const item = document.createElement("div");

        item.className = "historyItem";

        if (currentChat && chat.id === currentChat.id) {
            item.classList.add("active");
        }

        item.textContent = chat.title;

        item.onclick = () => openChat(chat.id);

        historyList.appendChild(item);

    });

}

function openChat(id) {

    const chat = chats.find(c => c.id === id);

    if (!chat) return;

    currentChat = chat;

    chatWindow.innerHTML = "";

    if (welcomeScreen) {
        welcomeScreen.style.display = "none";
    }

    chat.messages.forEach(msg => {

        if (msg.role === "user") {
            addMessage(msg.content, "user");
        }

        if (msg.role === "assistant") {
            addMessage(msg.content, "bot");
        }

    });

    renderHistory();

}

function autoResize() {

    prompt.style.height = "auto";

    prompt.style.height = prompt.scrollHeight + "px";

}
/* ==========================================
   MESSAGES
========================================== */

async function sendMessage() {

    const text = prompt.value.trim();

    if (!text) return;

    if (!currentChat) {
        createChat();
    }

    if (welcomeScreen) {
        welcomeScreen.style.display = "none";
    }

    addMessage(text, "user");

    currentChat.messages.push({
        role: "user",
        content: text
    });

    if (currentChat.title === "New Bullshit") {
        currentChat.title = text.substring(0, 30);
    }

    renderHistory();
    saveChats();

    prompt.value = "";
    autoResize();

    const thinking = addMessage("🧠 Thinking...", "bot");

    try {

        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: currentChat.messages,
                temperature: 0.8
            })
        });

        thinking.remove();

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        const reply = data.choices?.[0]?.message?.content ||
            "Well... something got fucked up.";

        currentChat.messages.push({
            role: "assistant",
            content: reply
        });

        addMessage(reply, "bot");

        saveChats();
        renderHistory();

    } catch (err) {

        thinking.remove();

        addMessage(
            `⚠️ Connection Error: ${err.message}`,
            "bot"
        );

        console.error(err);

    }

}

function addMessage(text, sender) {

    const div = document.createElement("div");

    div.className = `message ${sender}`;

    div.textContent = text;

    chatWindow.appendChild(div);

    chatWindow.scrollTop = chatWindow.scrollHeight;

    return div;

}
/* ==========================================
   VOICE INPUT
========================================== */

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

if (SpeechRecognition && micBtn) {

    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let listening = false;

    micBtn.addEventListener("click", () => {

        if (listening) {
            recognition.stop();
        } else {
            recognition.start();
        }

    });

    recognition.onstart = () => {

        listening = true;

        micBtn.classList.add("listening");

    };

    recognition.onresult = (event) => {

        let transcript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }

        prompt.value = transcript;

        autoResize();

    };

    recognition.onend = () => {

        listening = false;

        micBtn.classList.remove("listening");

    };

    recognition.onerror = () => {

        listening = false;

        micBtn.classList.remove("listening");

        addMessage(
            "⚠️ Voice recognition failed.",
            "bot"
        );

    };

}
/* ==========================================
   SIDEBAR
========================================== */

if (sidebar && menuBtn) {

    menuBtn.addEventListener("click", (e) => {

        e.stopPropagation();

        sidebar.classList.toggle("open");

    });

    document.addEventListener("click", (e) => {

        if (
            sidebar.classList.contains("open") &&
            !sidebar.contains(e.target) &&
            !menuBtn.contains(e.target)
        ) {
            sidebar.classList.remove("open");
        }

    });

}

/* ==========================================
   FINISH STARTUP
========================================== */

window.addEventListener("load", () => {

    autoResize();

    if (chatWindow) {
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    console.log("🧠 Ask Brice loaded.");

});