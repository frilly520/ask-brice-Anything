/* ==========================================
   ASK BRICE
========================================== */

const sendBtn = document.getElementById("sendBtn");
const micBtn = document.getElementById("micBtn");
const imageBtn = document.getElementById("imageBtn");
const imageInput = document.getElementById("imageInput");
const menuBtn = document.getElementById("menuBtn");
const newChatBtn = document.getElementById("newChatBtn");

const prompt = document.getElementById("prompt");
const chatWindow = document.getElementById("chatWindow");
const welcomeScreen = document.getElementById("welcomeScreen");

const sidebar = document.getElementById("sidebar");
const historyList = document.getElementById("historyList");

const STORAGE_KEY = "askBriceChats";

let chats = [];
let currentChat = null;
let selectedImage = null;

/* ==========================================
   RANDOM PLACEHOLDERS
========================================== */

const placeholders = [
    "Alright... what the hell's on your mind?",
    "Hit me with it.",
    "What's your bullshit today?",
    "Talk to me.",
    "Let's hear it.",
    "What's broken now?",
    "Need advice or just wanna bullshit?",
    "Well? I'm waiting.",
    "Give me something interesting."
];

function setRandomPlaceholder() {

    if (!prompt) return;

    const random =
        placeholders[Math.floor(Math.random() * placeholders.length)];

    prompt.placeholder = random;

}
const thinkingMessages = [
    "Rolling my eyes...",
    "Thinking...",
    "Trying to care...",
    "Hold your damn horses...",
    "Pretending this is a good question...",
    "One sec...",
    "Trying not to judge you...",
    "Processing your bullshit...",
    "Using my giant AI brain...",
    "Figuring out how to say this nicely..."
];

function getThinkingMessage() {
    return thinkingMessages[
        Math.floor(Math.random() * thinkingMessages.length)
    ];
}

/* ==========================================
   SYSTEM PROMPT
========================================== */

const SYSTEM_PROMPT = {
    role: "system",
    content: `You are Ask Brice.

Your name is Brice.

You talk like a real person.

You swear naturally, but don't overdo it.

You're brutally honest.

You're sarcastic when it fits.

You're funny when it fits.

You never make up facts.

You explain things simply.

If someone is struggling, drop the sarcasm and be supportive like a real friend.

Never sound robotic.`
};

/* ==========================================
   STARTUP
========================================== */

loadChats();

if (prompt) {

    autoResize();
    setRandomPlaceholder();

    prompt.addEventListener("input", autoResize);

    prompt.addEventListener("keydown", (e) => {

        if (e.key === "Enter" && !e.shiftKey) {

            e.preventDefault();

            sendMessage();

        }

    });

}

if (sendBtn) {

    sendBtn.addEventListener("click", sendMessage);

}

if (newChatBtn) {

    newChatBtn.addEventListener("click", createChat);

}

if (imageBtn && imageInput) {

    imageBtn.addEventListener("click", () => {

        imageInput.click();

    });

    imageInput.addEventListener("change", (e) => {

        const file = e.target.files[0];

        if (!file) return;

        const reader = new FileReader();

        reader.onload = () => {

            selectedImage = reader.result;

            const img = document.createElement("img");

            img.src = selectedImage;
            img.className = "uploadedImage";

            chatWindow.appendChild(img);

            chatWindow.scrollTop = chatWindow.scrollHeight;

        };

        reader.readAsDataURL(file);

    });

}
/* ==========================================
   CHAT MANAGEMENT
========================================== */

function createChat() {

    currentChat = {
        id: Date.now().toString(),
        title: "Fresh Bullshit",
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

    setRandomPlaceholder();

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

    setRandomPlaceholder();

}

function saveChats() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(chats)
    );

}

function renderHistory() {

    if (!historyList) return;

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

    if (welcomeScreen && chat.messages.length === 1) {

        welcomeScreen.style.display = "block";

        chatWindow.appendChild(welcomeScreen);

    } else if (welcomeScreen) {

        welcomeScreen.style.display = "none";

    }

    chat.messages.forEach(msg => {

        if (msg.role === "user") {

            if (typeof msg.content === "string") {

                addMessage(msg.content, "user");

            } else if (Array.isArray(msg.content)) {

                const textPart = msg.content.find(
                    part => part.type === "text"
                );

                if (textPart) {
                    addMessage(textPart.text, "user");
                }

            }

        }

        if (msg.role === "assistant") {

            addMessage(msg.content, "bot");

        }

    });

    renderHistory();

}

function autoResize() {

    if (!prompt) return;

    prompt.style.height = "auto";

    prompt.style.height = prompt.scrollHeight + "px";

}
/* ==========================================
   UI FUNCTIONS
========================================== */

function addMessage(text, sender) {

    if (welcomeScreen) {
        welcomeScreen.style.display = "none";
    }

    const message = document.createElement("div");

    message.className =
        sender === "user"
            ? "message userMessage"
            : "message botMessage";

    message.textContent = text;

    chatWindow.appendChild(message);

    chatWindow.scrollTop = chatWindow.scrollHeight;

    return message;

}

function updateMessage(element, text) {

    if (!element) return;

    element.textContent = text;

    chatWindow.scrollTop = chatWindow.scrollHeight;

}

function removeMessage(element) {

    if (!element) return;

    element.remove();

}

function scrollToBottom() {

    if (!chatWindow) return;

    chatWindow.scrollTop = chatWindow.scrollHeight;

}

function showImagePreview(imageData) {

    if (!imageData) return;

    const wrapper = document.createElement("div");

    wrapper.className = "message userMessage";

    const img = document.createElement("img");

    img.src = imageData;
    img.className = "uploadedImage";

    wrapper.appendChild(img);

    chatWindow.appendChild(wrapper);

    scrollToBottom();

}

function clearImageSelection() {

    selectedImage = null;

    if (imageInput) {
        imageInput.value = "";
    }

}
/* ==========================================
   SEND MESSAGE
========================================== */

async function sendMessage() {

    if (!currentChat) {
        createChat();
    }

    const text = prompt.value.trim();

    if (!text && !selectedImage) return;

    let userMessage;

    if (selectedImage) {

        showImagePreview(selectedImage);

        userMessage = {
            role: "user",
            content: [
                {
                    type: "text",
                    text: `Look at the attached image carefully and answer the user's question directly.

User question:
${text || "Describe this image."}`
                },
                {
                    type: "image_url",
                    image_url: {
                        url: selectedImage
                    }
                }
            ]
        };

    } else {

        addMessage(text, "user");

        userMessage = {
            role: "user",
            content: text
        };

    }

    currentChat.messages.push(userMessage);

    if (currentChat.title === "Fresh Bullshit" && text) {

        currentChat.title = text.substring(0, 30);

    }

    saveChats();

    renderHistory();

    prompt.value = "";

    autoResize();

  const thinking = addMessage(
    getThinkingMessage(),
    "bot"
);

    try {

        const response = await fetch("/api/chat", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                model: "meta-llama/llama-4-scout-17b-16e-instruct",

                messages: currentChat.messages,

                temperature: 0.8

            })

        });

        if (!response.ok) {

            const error = await response.json();

            throw new Error(
                error?.error?.message ||
                `HTTP ${response.status}`
            );

        }

        const data = await response.json();

        removeMessage(thinking);

        const reply =
            data.choices?.[0]?.message?.content ||
            "I don't know what the hell happened.";

        addMessage(reply, "bot");

        currentChat.messages.push({

            role: "assistant",

            content: reply

        });

        saveChats();

    } catch (err) {

        removeMessage(thinking);

        addMessage(`⚠️ ${err.message}`, "bot");

    }

    clearImageSelection();

}
/* ==========================================
   VOICE INPUT
========================================== */

if ("webkitSpeechRecognition" in window) {

    const recognition = new webkitSpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    if (micBtn) {

        micBtn.addEventListener("click", () => {

            recognition.start();

        });

    }

    recognition.onresult = (event) => {

        const transcript = event.results[0][0].transcript;

        prompt.value = transcript;

        autoResize();

    };

    recognition.onerror = (event) => {

        console.error("Speech Recognition Error:", event.error);

    };

}

/* ==========================================
   SIDEBAR
========================================== */

if (menuBtn && sidebar) {

    menuBtn.addEventListener("click", () => {

        sidebar.classList.toggle("open");

    });

}

/* ==========================================
   CLOSE SIDEBAR WHEN OPENING CHAT
========================================== */

document.addEventListener("click", (e) => {

    if (
        sidebar &&
        sidebar.classList.contains("open") &&
        !sidebar.contains(e.target) &&
        e.target !== menuBtn
    ) {

        sidebar.classList.remove("open");

    }

});

/* ==========================================
   FINISH SETUP
========================================== */

// Initialization is already handled at the top of the file.