/* =====================================================
   ASK BRICE - PART 1: CORE APPLICATION VARIABLES
===================================================== */

const sendBtn = document.getElementById("sendBtn");
const micBtn = document.getElementById("micBtn");
const imageInput = document.getElementById("imageInput");
const plusBtn = document.getElementById("plusBtn");
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
let selectedFile = null;

const placeholders = [
    "What's on your mind?", "Hit me with it.", "What's your bullshit today?", 
    "The Fuck you want?", "What did you fuck up now?", "What's broken now?"
];

function setRandomPlaceholder() {
    if (!prompt) return;
    prompt.placeholder = placeholders[Math.floor(Math.random() * placeholders.length)];
}

const thinkingMessages = [
    "Rolling my eyes...", "Trying to care...", "Hold your horses...", "Processing your bullshit..."
];

function getThinkingMessage() {
    return thinkingMessages[Math.floor(Math.random() * thinkingMessages.length)];
}

const SYSTEM_PROMPT = {
    role: "system",
    content: `You are Brice, also known as Gangster. You are cold, ruthless, and use profanity naturally. Detect bullshit immediately and deliver brutally honest solutions with simple language.`
};

/* =====================================================
   ASK BRICE - PART 2: MEDIA HANDLING & UI RENDERING
===================================================== */

function triggerUnifiedFileInput() {
    if (!imageInput) return;

    imageInput.accept = "image/*,video/*"; 

imageInput.removeAttribute("capture");
    imageInput.value = "";
    imageInput.click();
}

function handleFileSelection(event) {
    const file = event.target.files && event.target.files.length
        ? event.target.files[0]
        : null;

    if (!file) return;

    selectedFile = file;

    if (file.type.startsWith("image/")) {
        const reader = new FileReader();

        reader.onload = (e) => {
            selectedImage = e.target.result;
            updateFileUIIndicator(file.name);
        };

        reader.readAsDataURL(file);

    } else {
        selectedImage = null;
        updateFileUIIndicator(file.name);
    }
}

function updateFileUIIndicator(fileName) {
    let indicator = document.getElementById("mediaIndicator");

    if (!indicator) {
        indicator = document.createElement("div");
        indicator.id = "mediaIndicator";

        indicator.style.cssText = `
            font-size:11px;
            color:#ff3b30;
            padding:4px 10px;
            background:#1c1c1e;
            border-radius:8px;
            position:absolute;
            top:-36px;
            left:20px;
            max-width:180px;
            white-space:nowrap;
            overflow:hidden;
            text-overflow:ellipsis;
            border:1px solid rgba(255,255,255,.08);
            font-family:sans-serif;
        `;

        const bottomBar = document.querySelector(".bottomBar");
        if (bottomBar) bottomBar.appendChild(indicator);
    }

    indicator.innerHTML = `
        📎 ${fileName}
        <span id="clearMedia"
              style="cursor:pointer;margin-left:6px;font-weight:bold;">
            ×
        </span>
    `;

    const clearBtn = document.getElementById("clearMedia");
    if (clearBtn) {
        clearBtn.onclick = clearAttachedMedia;
    }
}

function clearAttachedMedia() {
    selectedFile = null;
    selectedImage = null;

    if (imageInput) {
        imageInput.value = "";
    }

    const indicator = document.getElementById("mediaIndicator");
    if (indicator) {
        indicator.remove();
    }
}

function appendMessage(sender, text, mediaData = null) {
    if (!chatWindow) return;

    const welcome = document.getElementById("welcomeScreen");
    if (welcome) {
        welcome.remove();
    }

    const messageRow = document.createElement("div");
    messageRow.className = "messageRow";

    const bubble = document.createElement("div");
    bubble.className =
        `message ${sender === "user" ? "userMessage" : "botMessage"}`;

    if (mediaData) {
        const imgPreview = document.createElement("img");
        imgPreview.src = mediaData;
        imgPreview.className = "uploadedImage";
        bubble.appendChild(imgPreview);
    }

    if (text) {
        const textNode = document.createElement("div");
        textNode.textContent = text;
        bubble.appendChild(textNode);
    }

    messageRow.appendChild(bubble);
    chatWindow.appendChild(messageRow);

    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function toggleThinkingIndicator(show) {
    const existing = document.getElementById("briceThinking");

    if (!show) {
        if (existing) existing.remove();
        return;
    }

    if (existing) return;

    const thinkingRow = document.createElement("div");
    thinkingRow.id = "briceThinking";
    thinkingRow.className = "message botMessage";

    const textLabel = document.createElement("div");
    textLabel.style.cssText =
        "font-size:13px;color:#888;margin-bottom:6px;font-style:italic;";
    textLabel.textContent =
        typeof getThinkingMessage === "function"
            ? getThinkingMessage()
            : "Thinking...";

    thinkingRow.appendChild(textLabel);

    const indicator = document.createElement("div");
    indicator.className = "typingIndicator";
    indicator.innerHTML = "<span></span><span></span><span></span>";

    thinkingRow.appendChild(indicator);

    chatWindow.appendChild(thinkingRow);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

=====================================================
   CHAT INTERFACE - PART 3: STORAGE, API & EVENTS
===================================================== */

function initChatHistory() {
    try {
        const storedChats = localStorage.getItem(STORAGE_KEY);
        chats = storedChats ? JSON.parse(storedChats) : [];
    } catch (e) { chats = []; }
    renderHistoryList();
}

function saveChatsToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
}

function createNewChatThread() {
    currentChat = { id: "chat_" + Date.now(), title: "New Conversation " + (chats.length + 1), messages: [] };
    chats.unshift(currentChat); 
    saveChatsToStorage();
    loadChatIntoUI(currentChat);
}

function loadChatIntoUI(chatThread) {
    if (!chatWindow) return;
    currentChat = chatThread;
    chatWindow.innerHTML = ""; 

    if (!chatThread.messages || chatThread.messages.length === 0) {
        chatWindow.innerHTML = `<section id="welcomeScreen"><h1>HOW CAN I<br>HELP YOU?</h1><p class="welcomeScript">Ask me anything...</p><p class="subtitle">I'll help you figure it out.</p></section>`;
    } else {
        chatThread.messages.forEach(msg => appendMessage(msg.sender, msg.text, msg.mediaData));
    }
    renderHistoryList();
}

function renderHistoryList() {
    if (!historyList) return;
    historyList.innerHTML = ""; 

    if (chats.length === 0) {
        historyList.innerHTML = `<p style="color:#636366;font-size:13px;padding:12px;font-style:italic;">No past conversations.</p>`;
        return;
    }

    chats.forEach(chatItem => {
        const itemRow = document.createElement("div");
        itemRow.className = `historyItem ${currentChat && currentChat.id === chatItem.id ? "activeHistoryItem" : ""}`;

        const labelSpan = document.createElement("span");
        labelSpan.textContent = chatItem.title;
        labelSpan.style.cssText = "white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:80%;display:inline-block;";
        itemRow.appendChild(labelSpan);

        itemRow.addEventListener("click", () => loadChatIntoUI(chatItem));
        historyList.appendChild(itemRow);
    });
}

function logMessageToActiveChat(sender, text, mediaData = null) {
    if (!currentChat) createNewChatThread();
    if (currentChat.messages.length === 0 && text) {
        currentChat.title = text.substring(0, 18) + "...";
    }
    currentChat.messages.push({ sender, text, mediaData });
    saveChatsToStorage();
    renderHistoryList();
}

async function processLiveApiResponse(incomingPromptText, base64MediaAttachment) {
    const apiMessagePayload = [{ role: SYSTEM_PROMPT.role, content: SYSTEM_PROMPT.content }];
    if (currentChat && currentChat.messages) {
        currentChat.messages.forEach(node => {
            apiMessagePayload.push({ role: node.sender === "user" ? "user" : "assistant", content: node.text });
        });
    }

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model: "gpt-4o", messages: apiMessagePayload })
        });
        if (!response.ok) throw new Error();
        const data = await response.json();
        const reply = data.choices.message.content || "Something went wrong.";
        
        toggleThinkingIndicator(false);
        appendMessage("assistant", reply);
        logMessageToActiveChat("assistant", reply);
    } catch (err) {
        toggleThinkingIndicator(false);
        appendMessage("assistant", "API error. Please check your connection.");
    }
}

function handleSendMessage() {
    if (!prompt) return;
    const userText = prompt.value.trim();
    if (!userText && !selectedFile) return;

    if (sendBtn) {
        sendBtn.classList.add("sending-animation");
        sendBtn.addEventListener("animationend", () => {
            sendBtn.classList.remove("sending-animation");
        }, { once: true });
    }

    appendMessage("user", userText, selectedImage);
    logMessageToActiveChat("user", userText, selectedImage);

    const txt = userText; const img = selectedImage;
    prompt.value = "";
    prompt.style.height = "36px";
    clearAttachedMedia();
    setRandomPlaceholder();

    toggleThinkingIndicator(true);
    processLiveApiResponse(txt, img);
}

document.addEventListener("DOMContentLoaded", () => {
    initChatHistory();
    if (chats.length === 0) createNewChatThread();

    if (plusBtn) plusBtn.addEventListener("click", triggerUnifiedFileInput);
    if (sendBtn) sendBtn.addEventListener("click", handleSendMessage);
    if (newChatBtn) newChatBtn.addEventListener("click", createNewChatThread);
    if (menuBtn) menuBtn.addEventListener("click", () => sidebar.classList.toggle("open"));
    if (imageInput) imageInput.addEventListener("change", handleFileSelection);

    if (micBtn) {
        micBtn.addEventListener("click", () => {
            micBtn.classList.toggle("listening");
        });
    }

    if (prompt) {
        prompt.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        });
        prompt.addEventListener("input", function() {
            this.style.height = "auto";
            this.style.height = this.scrollHeight + "px";
        });
    }
});
