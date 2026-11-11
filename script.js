/* =====================================================
   ASK BRICE - WEB APPLICATION SCRIPT
===================================================== */

const STORAGE_KEY = "askBriceWebChats";
const SETTINGS_KEY = "askBriceWebSettings";

let chats = [];
let currentChat = null;
let selectedImageBase64 = null;
let briceMode = "UNFILTERED";
let customApiKey = "";
let isListening = false;
let speechRecognizer = null;

const systemModifiers = {
    UNFILTERED: "You are Brice, also known as Gangster. You are cold, ruthless, and use profanity naturally. Detect bullshit immediately and deliver brutally honest solutions with simple language.",
    TOUGH_LOVE: "You are Brice. You are tough, direct, and intolerant of excuses, but your goal is to push the user to do better with direct, blunt advice.",
    SARCASTIC: "You are Brice. You are extremely cynical, sarcastic, and unimpressed. You deliver sharp reality checks with deadpan humor and eye-rolling observations."
};

const placeholders = [
    "What's on your mind?", "Hit me with it.", "What's your bullshit today?", 
    "The Fuck you want?", "What did you fuck up now?", "What's broken now?"
];

const thinkingMessages = [
    "Rolling my eyes...", "Trying to care...", "Hold your horses...", 
    "Processing your bullshit...", "Calculating how dumb this is..."
];

// DOM Elements
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const menuBtn = document.getElementById("menuBtn");
const newChatBtn = document.getElementById("newChatBtn");
const searchChats = document.getElementById("searchChats");
const historyList = document.getElementById("historyList");
const chatWindow = document.getElementById("chatWindow");
const welcomeScreen = document.getElementById("welcomeScreen");
const typingIndicator = document.getElementById("typingIndicator");
const thinkingLabel = document.getElementById("thinkingLabel");
const promptInput = document.getElementById("prompt");
const sendBtn = document.getElementById("sendBtn");
const plusBtn = document.getElementById("plusBtn");
const imageInput = document.getElementById("imageInput");
const attachmentPreview = document.getElementById("attachmentPreview");
const previewImg = document.getElementById("previewImg");
const clearAttachment = document.getElementById("clearAttachment");
const micBtn = document.getElementById("micBtn");
const settingsBtn = document.getElementById("settingsBtn");
const settingsModal = document.getElementById("settingsModal");
const closeSettings = document.getElementById("closeSettings");
const apiKeyInput = document.getElementById("apiKeyInput");
const clearAllBtn = document.getElementById("clearAllBtn");

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
    loadSettings();
    initChatHistory();
    setupEventListeners();
    setRandomPlaceholder();
});

function loadSettings() {
    try {
        const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
        briceMode = settings.briceMode || "UNFILTERED";
        customApiKey = settings.customApiKey || "";
        if (apiKeyInput) apiKeyInput.value = customApiKey;

        const radio = document.querySelector(`input[name="briceMode"][value="${briceMode}"]`);
        if (radio) radio.checked = true;
    } catch (e) {
        briceMode = "UNFILTERED";
    }
}

function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ briceMode, customApiKey }));
}

function setRandomPlaceholder() {
    if (!promptInput) return;
    promptInput.placeholder = placeholders[Math.floor(Math.random() * placeholders.length)];
}

function getRandomThinking() {
    return thinkingMessages[Math.floor(Math.random() * thinkingMessages.length)];
}

/* ================= CHAT STORAGE ================= */
function initChatHistory() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        chats = stored ? JSON.parse(stored) : [];
    } catch (e) {
        chats = [];
    }

    if (chats.length === 0) {
        createNewChatThread();
    } else {
        loadChatThread(chats[0].id);
    }
    renderHistoryList();
}

function saveChats() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
}

function createNewChatThread() {
    const newChat = {
        id: "chat_" + Date.now(),
        title: "New Conversation",
        messages: [],
        createdAt: Date.now()
    };
    chats.unshift(newChat);
    saveChats();
    loadChatThread(newChat.id);
    renderHistoryList();
    if (window.innerWidth <= 768) toggleSidebar(false);
}

function loadChatThread(id) {
    currentChat = chats.find(c => c.id === id) || chats[0];
    renderChatWindow();
    renderHistoryList();
}

function deleteChatThread(id, event) {
    event.stopPropagation();
    chats = chats.filter(c => c.id !== id);
    if (chats.length === 0) {
        createNewChatThread();
    } else if (currentChat && currentChat.id === id) {
        loadChatThread(chats[0].id);
    } else {
        saveChats();
        renderHistoryList();
    }
}

function clearAllConversations() {
    if (confirm("Are you sure you want to delete all chat conversations?")) {
        chats = [];
        createNewChatThread();
        closeSettingsModal();
    }
}

/* ================= RENDERING ================= */
function renderHistoryList() {
    if (!historyList) return;
    const query = (searchChats?.value || "").toLowerCase();
    const filtered = chats.filter(c => c.title.toLowerCase().includes(query));

    historyList.innerHTML = "";
    if (filtered.length === 0) {
        historyList.innerHTML = `<div style="padding:12px;font-size:13px;color:var(--text-secondary);font-style:italic;">No conversations found.</div>`;
        return;
    }

    filtered.forEach(chat => {
        const item = document.createElement("div");
        item.className = `historyItem ${currentChat && currentChat.id === chat.id ? "active" : ""}`;
        item.innerHTML = `
            <span>${escapeHtml(chat.title)}</span>
            <button class="deleteChatBtn" title="Delete">×</button>
        `;
        item.addEventListener("click", () => {
            loadChatThread(chat.id);
            if (window.innerWidth <= 768) toggleSidebar(false);
        });
        item.querySelector(".deleteChatBtn").addEventListener("click", (e) => deleteChatThread(chat.id, e));
        historyList.appendChild(item);
    });
}

function renderChatWindow() {
    if (!chatWindow) return;

    if (!currentChat || currentChat.messages.length === 0) {
        chatWindow.innerHTML = `
            <div id="welcomeScreen" class="welcomeScreen">
                <div class="welcomeBullLogo">🐂</div>
                <h1>HOW CAN I HELP YOU?</h1>
                <p class="welcomeSubtitle">Bullshit detector and brutally honest AI assistant.</p>
                <div class="starterPrompts">
                    <div class="starterCard" data-prompt="Call out every flaw in this business idea: A subscription box for used socks.">
                        <span class="starterIcon">💼</span>
                        <div class="starterTitle">Business Reality Check</div>
                        <div class="starterDesc">Roast a startup or idea...</div>
                    </div>
                    <div class="starterCard" data-prompt="I keep procrastinating on going to the gym because I'm 'too busy'. Roast me and tell me what to do.">
                        <span class="starterIcon">🔥</span>
                        <div class="starterTitle">Excuse Destroyer</div>
                        <div class="starterDesc">Call out your laziness...</div>
                    </div>
                    <div class="starterCard" data-prompt="My coworker took credit for my presentation and I didn't say anything to keep peace. Did I handle this like a coward?">
                        <span class="starterIcon">⚖️</span>
                        <div class="starterTitle">Am I The Problem?</div>
                        <div class="starterDesc">Brutal interpersonal truth...</div>
                    </div>
                    <div class="starterCard" data-prompt="Give me brutal feedback: What are the biggest red flags on a resume that scream unemployable?">
                        <span class="starterIcon">📄</span>
                        <div class="starterTitle">Resume Roast</div>
                        <div class="starterDesc">Unvarnished career critique...</div>
                    </div>
                </div>
            </div>
        `;
        bindStarterCards();
        return;
    }

    chatWindow.innerHTML = "";
    currentChat.messages.forEach(msg => {
        appendMessageDOM(msg.sender, msg.text, msg.imageBase64, msg.timestamp, msg.isError);
    });
    scrollToBottom();
}

function appendMessageDOM(sender, text, imageBase64 = null, timestamp = Date.now(), isError = false) {
    const welcome = document.getElementById("welcomeScreen");
    if (welcome) welcome.remove();

    const row = document.createElement("div");
    row.className = `messageRow ${sender === "user" ? "user" : "assistant"}`;

    const timeFormatted = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let avatarHtml = sender === "assistant" ? `<div class="botAvatarSmall">🐂</div>` : "";
    let contentHtml = "";

    if (imageBase64) {
        contentHtml += `<img src="${imageBase64}" class="messageImage" alt="Uploaded image">`;
    }

    if (text) {
        contentHtml += `<div style="white-space: pre-wrap;">${escapeHtml(text)}</div>`;
    }

    row.innerHTML = `
        ${avatarHtml}
        <div class="messageBubble ${isError ? 'messageError' : ''}">
            ${contentHtml}
            <div class="messageFooter">
                <span>${timeFormatted}</span>
                ${sender === "assistant" && !isError ? `<button class="copyBtn">Copy</button>` : ""}
            </div>
        </div>
    `;

    if (sender === "assistant" && !isError) {
        row.querySelector(".copyBtn").addEventListener("click", () => {
            navigator.clipboard.writeText(text);
            alert("Copied to clipboard!");
        });
    }

    if (imageBase64) {
        row.querySelector(".messageImage").addEventListener("click", () => {
            const win = window.open("");
            win.document.write(`<img src="${imageBase64}" style="max-width:100%;"/>`);
        });
    }

    chatWindow.appendChild(row);
    scrollToBottom();
}

function scrollToBottom() {
    if (chatWindow) {
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }
}

function bindStarterCards() {
    document.querySelectorAll(".starterCard").forEach(card => {
        card.addEventListener("click", () => {
            const promptText = card.getAttribute("data-prompt");
            if (promptInput) {
                promptInput.value = promptText;
                handleSendMessage();
            }
        });
    });
}

/* ================= API CALLS & CHAT LOGIC ================= */
async function handleSendMessage() {
    const text = promptInput.value.trim();
    if (!text && !selectedImageBase64) return;

    if (!currentChat) createNewChatThread();

    if (currentChat.messages.length === 0 && text) {
        currentChat.title = text.length > 22 ? text.substring(0, 20) + "..." : text;
    }

    const userMsg = {
        sender: "user",
        text,
        imageBase64: selectedImageBase64,
        timestamp: Date.now()
    };

    currentChat.messages.push(userMsg);
    saveChats();
    renderHistoryList();

    appendMessageDOM("user", text, selectedImageBase64, userMsg.timestamp);

    promptInput.value = "";
    promptInput.style.height = "auto";
    clearAttachedMedia();
    setRandomPlaceholder();

    // Show thinking indicator
    if (thinkingLabel) thinkingLabel.textContent = getRandomThinking();
    if (typingIndicator) typingIndicator.classList.remove("hidden");
    scrollToBottom();

    // Build payload messages
    const apiMessages = currentChat.messages.map(m => {
        const parts = [];
        if (m.imageBase64) {
            parts.push({ type: "image_url", image_url: { url: m.imageBase64 } });
        }
        if (m.text) {
            parts.push({ type: "text", text: m.text });
        }
        return {
            role: m.sender === "user" ? "user" : "assistant",
            content: parts.length === 1 && parts[0].type === "text" ? parts[0].text : parts
        };
    });

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                messages: apiMessages,
                systemInstruction: systemModifiers[briceMode],
                customApiKey: customApiKey
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || "API request failed");

        const reply = data.choices.message.content;

        if (typingIndicator) typingIndicator.classList.add("hidden");

        const botMsg = {
            sender: "assistant",
            text: reply,
            timestamp: Date.now()
        };
        currentChat.messages.push(botMsg);
        saveChats();

        appendMessageDOM("assistant", reply, null, botMsg.timestamp);

    } catch (err) {
        if (typingIndicator) typingIndicator.classList.add("hidden");
        const errorText = `⚠️ Error: ${err.message}`;
        const errorMsg = {
            sender: "assistant",
            text: errorText,
            timestamp: Date.now(),
            isError: true
        };
        currentChat.messages.push(errorMsg);
        saveChats();
        appendMessageDOM("assistant", errorText, null, errorMsg.timestamp, true);
    }
}

/* ================= MEDIA & VOICE ================= */
function triggerFileInput() {
    if (imageInput) imageInput.click();
}

function handleFileSelection(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        selectedImageBase64 = event.target.result;
        if (previewImg) previewImg.src = selectedImageBase64;
        if (attachmentPreview) attachmentPreview.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
}

function clearAttachedMedia() {
    selectedImageBase64 = null;
    if (imageInput) imageInput.value = "";
    if (attachmentPreview) attachmentPreview.classList.add("hidden");
}

function toggleSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Speech recognition is not supported in this browser.");
        return;
    }

    if (isListening) {
        if (speechRecognizer) speechRecognizer.stop();
        return;
    }

    speechRecognizer = new SpeechRecognition();
    speechRecognizer.continuous = false;
    speechRecognizer.interimResults = false;

    speechRecognizer.onstart = () => {
        isListening = true;
        if (micBtn) micBtn.classList.add("listening");
    };

    speechRecognizer.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (promptInput) {
            promptInput.value = promptInput.value ? promptInput.value + " " + transcript : transcript;
            promptInput.style.height = promptInput.scrollHeight + "px";
        }
    };

    speechRecognizer.onerror = () => {
        isListening = false;
        if (micBtn) micBtn.classList.remove("listening");
    };

    speechRecognizer.onend = () => {
        isListening = false;
        if (micBtn) micBtn.classList.remove("listening");
    };

    speechRecognizer.start();
}

/* ================= UTILS & EVENTS ================= */
function toggleSidebar(forceState) {
    const isOpen = forceState !== undefined ? forceState : !sidebar.classList.contains("open");
    if (isOpen) {
        sidebar.classList.add("open");
        sidebarOverlay.classList.add("open");
    } else {
        sidebar.classList.remove("open");
        sidebarOverlay.classList.remove("open");
    }
}

function openSettingsModal() {
    if (settingsModal) settingsModal.classList.remove("hidden");
}

function closeSettingsModal() {
    if (settingsModal) settingsModal.classList.add("hidden");
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

function setupEventListeners() {
    if (menuBtn) menuBtn.addEventListener("click", () => toggleSidebar());
    if (sidebarOverlay) sidebarOverlay.addEventListener("click", () => toggleSidebar(false));
    if (newChatBtn) newChatBtn.addEventListener("click", createNewChatThread);
    if (searchChats) searchChats.addEventListener("input", renderHistoryList);

    if (sendBtn) sendBtn.addEventListener("click", handleSendMessage);
    if (plusBtn) plusBtn.addEventListener("click", triggerFileInput);
    if (imageInput) imageInput.addEventListener("change", handleFileSelection);
    if (clearAttachment) clearAttachment.addEventListener("click", clearAttachedMedia);
    if (micBtn) micBtn.addEventListener("click", toggleSpeechRecognition);

    if (settingsBtn) settingsBtn.addEventListener("click", openSettingsModal);
    if (closeSettings) closeSettings.addEventListener("click", closeSettingsModal);
    if (settingsModal) settingsModal.addEventListener("click", (e) => {
        if (e.target === settingsModal) closeSettingsModal();
    });

    if (clearAllBtn) clearAllBtn.addEventListener("click", clearAllConversations);

    if (apiKeyInput) {
        apiKeyInput.addEventListener("input", () => {
            customApiKey = apiKeyInput.value.trim();
            saveSettings();
        });
    }

    document.querySelectorAll('input[name="briceMode"]').forEach(radio => {
        radio.addEventListener("change", (e) => {
            briceMode = e.target.value;
            saveSettings();
        });
    });

    if (promptInput) {
        promptInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        });
        promptInput.addEventListener("input", function() {
            this.style.height = "auto";
            this.style.height = Math.min(this.scrollHeight, 120) + "px";
        });
    }

    bindStarterCards();
}
