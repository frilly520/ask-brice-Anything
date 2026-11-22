/* =====================================================
   ASK BRICE - FULL WEB APPLICATION SCRIPT
===================================================== */

const STORAGE_CHATS_KEY = "askBriceWebChats";
const STORAGE_SETTINGS_KEY = "askBriceWebSettings";
const STORAGE_USER_KEY = "askBriceGoogleUser";

const LOGO_SRC = "public/assets/aistudio/Screenshot_20261120_192458_Chrome_2e29c651.jpg";
const LOGO_FALLBACK_SRC = "assets/brain-logo.png";

// Application State
let chats = [];
let currentChat = null;

// Current Input Attachments
let selectedImageBase64 = null;
let selectedImageName = "";
let selectedFileContent = null;
let selectedFileName = "";

// Signed-in User Profile
let currentUser = null; // { name, email, avatar }

// Personalization Settings
let userSettings = {
    displayName: "",
    tone: "UNFILTERED",
    customSystemInstructions: "",
    responseLength: "BALANCED",
    responseFormat: "AUTO",
    customApiKey: "",
    googleClientId: ""
};

let isListening = false;
let speechRecognizer = null;

const TONE_MODIFIERS = {
    UNFILTERED: "You are Brice, also known as Gangster. You are cold, ruthless, and use profanity naturally. Detect bullshit immediately and deliver brutally honest solutions with simple language.",
    BLUNT_DIRECT: "You are Brice. You are extremely blunt, direct, and honest. Cut straight to the truth with zero fluff, zero sugarcoating, and clear actionable reality checks.",
    TOUGH_LOVE: "You are Brice. You are tough, direct, and intolerant of excuses, but your goal is to push the user to succeed with firm, constructive advice.",
    SARCASTIC: "You are Brice. You are cynical, sarcastic, witty, and unimpressed. You deliver sharp reality checks with deadpan humor and eye-rolling observations.",
    CASUAL: "You are Brice. You are laid-back, conversational, candid, and grounded. Keep things real and easy to understand.",
    TECHNICAL: "You are Brice. You are analytical, thorough, and technically precise. Break down problems logically, expose flaws in reasoning, and provide rigorous solutions.",
    CUSTOM: "You are Brice, a no-nonsense AI assistant and bullshit detector."
};

const LENGTH_MODIFIERS = {
    CONCISE: "Keep your responses concise, punchy, and under 3-4 short paragraphs or bullet points unless asked for more.",
    BALANCED: "Provide a balanced response length—clear and complete without unnecessary rambling.",
    THOROUGH: "Provide a comprehensive, thorough, in-depth breakdown covering edge cases and blind spots."
};

const FORMAT_MODIFIERS = {
    AUTO: "",
    BULLETS: "Format your key points using crisp, scannable bullet points.",
    PARAGRAPHS: "Write your response in clean, well-structured paragraphs without bullet lists.",
    STEP_BY_STEP: "Structure your solution as a numbered step-by-step action plan."
};

const QUICK_PROMPTS = [
    {
        title: "💼 Business Reality Check",
        prompt: "Call out every flaw and blind spot in my business idea: "
    },
    {
        title: "🔥 Excuse Destroyer",
        prompt: "I keep procrastinating on my goals because I claim I'm 'too busy'. Call out my excuse and give me a real action plan."
    },
    {
        title: "⚖️ Am I The Problem?",
        prompt: "Give me an unbiased reality check on this situation and tell me if I'm in the wrong: "
    },
    {
        title: "📄 Resume / Pitch Roast",
        prompt: "Roast this pitch/resume and tell me what sounds weak, vague, or unconvincing: "
    },
    {
        title: "🧠 Decision Stress-Test",
        prompt: "I'm trying to decide between two options. Poke holes in my thinking: "
    }
];

const PLACEHOLDERS = [
    "What's on your mind?",
    "Hit me with it.",
    "What's your bullshit today?",
    "Give me the situation...",
    "What needs a reality check?",
    "What's broken now?"
];

const THINKING_MESSAGES = [
    "Rolling my eyes...",
    "Trying to care...",
    "Hold your horses...",
    "Processing your bullshit...",
    "Scanning for excuses..."
];

// DOM References
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const menuBtn = document.getElementById("menuBtn");
const closeSidebarBtn = document.getElementById("closeSidebarBtn");
const newChatBtn = document.getElementById("newChatBtn");
const searchChats = document.getElementById("searchChats");
const historyList = document.getElementById("historyList");

const chatWindow = document.getElementById("chatWindow");
const typingIndicator = document.getElementById("typingIndicator");
const thinkingLabel = document.getElementById("thinkingLabel");

const contextBanner = document.getElementById("contextBanner");
const contextBannerText = document.getElementById("contextBannerText");
const editContextBtn = document.getElementById("editContextBtn");
const clearContextBtn = document.getElementById("clearContextBtn");

const promptInput = document.getElementById("prompt");
const sendBtn = document.getElementById("sendBtn");
const plusBtn = document.getElementById("plusBtn");
const plusPopupMenu = document.getElementById("plusPopupMenu");
const menuUploadImage = document.getElementById("menuUploadImage");
const menuUploadFile = document.getElementById("menuUploadFile");
const menuAddContext = document.getElementById("menuAddContext");
const menuQuickPrompts = document.getElementById("menuQuickPrompts");

const quickPromptsPopover = document.getElementById("quickPromptsPopover");
const quickPromptsList = document.getElementById("quickPromptsList");
const closeQuickPrompts = document.getElementById("closeQuickPrompts");

const imageInput = document.getElementById("imageInput");
const docInput = document.getElementById("docInput");
const attachmentPreview = document.getElementById("attachmentPreview");
const imageAttachmentChip = document.getElementById("imageAttachmentChip");
const previewImg = document.getElementById("previewImg");
const imageAttachmentName = document.getElementById("imageAttachmentName");
const clearImageAttachment = document.getElementById("clearImageAttachment");

const fileAttachmentChip = document.getElementById("fileAttachmentChip");
const fileAttachmentName = document.getElementById("fileAttachmentName");
const clearFileAttachment = document.getElementById("clearFileAttachment");

const micBtn = document.getElementById("micBtn");

// Settings Modal Elements
const settingsBtn = document.getElementById("settingsBtn");
const sidebarSettingsBtn = document.getElementById("sidebarSettingsBtn");
const settingsModal = document.getElementById("settingsModal");
const closeSettings = document.getElementById("closeSettings");
const displayNameInput = document.getElementById("displayNameInput");
const toneSelect = document.getElementById("toneSelect");
const customSystemInput = document.getElementById("customSystemInput");
const responseLengthSelect = document.getElementById("responseLengthSelect");
const responseFormatSelect = document.getElementById("responseFormatSelect");
const apiKeyInput = document.getElementById("apiKeyInput");
const googleClientIdInput = document.getElementById("googleClientIdInput");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");
const clearAllBtn = document.getElementById("clearAllBtn");

// Context Modal Elements
const contextModal = document.getElementById("contextModal");
const closeContextModal = document.getElementById("closeContextModal");
const chatContextTextarea = document.getElementById("chatContextTextarea");
const saveChatContextBtn = document.getElementById("saveChatContextBtn");
const clearChatContextModalBtn = document.getElementById("clearChatContextModalBtn");

// Google Auth Elements
const signedOutView = document.getElementById("signedOutView");
const signedInView = document.getElementById("signedInView");
const googleSignInBtn = document.getElementById("googleSignInBtn");
const signOutBtn = document.getElementById("signOutBtn");
const userAvatar = document.getElementById("userAvatar");
const userNameDisplay = document.getElementById("userNameDisplay");
const userEmailDisplay = document.getElementById("userEmailDisplay");

const headerAuthBadge = document.getElementById("headerAuthBadge");
const headerUserAvatar = document.getElementById("headerUserAvatar");
const headerAuthText = document.getElementById("headerAuthText");

const modalSignedOutBox = document.getElementById("modalSignedOutBox");
const modalSignedInBox = document.getElementById("modalSignedInBox");
const modalGoogleSignInBtn = document.getElementById("modalGoogleSignInBtn");
const modalSignOutBtn = document.getElementById("modalSignOutBtn");
const modalUserAvatar = document.getElementById("modalUserAvatar");
const modalUserName = document.getElementById("modalUserName");
const modalUserEmail = document.getElementById("modalUserEmail");

// Google Sign-In Dialog Elements
const googleSignInModal = document.getElementById("googleSignInModal");
const closeGoogleModal = document.getElementById("closeGoogleModal");
const cancelGoogleModalBtn = document.getElementById("cancelGoogleModalBtn");
const quickGoogleAccountCard = document.getElementById("quickGoogleAccountCard");
const googleNameInput = document.getElementById("googleNameInput");
const googleEmailInput = document.getElementById("googleEmailInput");
const confirmGoogleSignInBtn = document.getElementById("confirmGoogleSignInBtn");

// Initialize on load
document.addEventListener("DOMContentLoaded", () => {
    loadUserFromStorage();
    loadSettingsFromStorage();
    initChatHistory();
    renderQuickPromptsList();
    setupEventListeners();
    setRandomPlaceholder();
    initGoogleIdentityIfConfigured();
});

/* ================= PERSISTENCE: USER & SETTINGS ================= */
function loadUserFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_USER_KEY);
        currentUser = raw ? JSON.parse(raw) : null;
    } catch (e) {
        currentUser = null;
    }
    updateAuthUI();
}

function saveUserToStorage(userObj) {
    currentUser = userObj;
    if (userObj) {
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(userObj));
        // If user hasn't set a custom display name yet, default to their first name
        if (!userSettings.displayName && userObj.name) {
            userSettings.displayName = userObj.name.split(" ")[0];
            saveSettingsToStorage();
            populateSettingsForm();
        }
    } else {
        localStorage.removeItem(STORAGE_USER_KEY);
    }
    updateAuthUI();
}

function generateAvatarSvgDataUrl(name) {
    const initial = (name || "U").trim().charAt(0).toUpperCase();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
        <defs>
            <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#ff3b30"/>
                <stop offset="100%" stop-color="#2589ff"/>
            </linearGradient>
        </defs>
        <rect width="64" height="64" rx="32" fill="url(#g)"/>
        <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="Inter, sans-serif" font-weight="800" font-size="28">${initial}</text>
    </svg>`;
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

function updateAuthUI() {
    if (currentUser) {
        const avatarUrl = currentUser.avatar || generateAvatarSvgDataUrl(currentUser.name);
        if (signedOutView) signedOutView.classList.add("hidden");
        if (signedInView) signedInView.classList.remove("hidden");
        if (userAvatar) userAvatar.src = avatarUrl;
        if (userNameDisplay) userNameDisplay.textContent = currentUser.name;
        if (userEmailDisplay) userEmailDisplay.textContent = currentUser.email;

        if (headerUserAvatar) {
            headerUserAvatar.src = avatarUrl;
            headerUserAvatar.classList.remove("hidden");
        }
        if (headerAuthText) {
            headerAuthText.textContent = currentUser.name.split(" ")[0];
        }

        if (modalSignedOutBox) modalSignedOutBox.classList.add("hidden");
        if (modalSignedInBox) modalSignedInBox.classList.remove("hidden");
        if (modalUserAvatar) modalUserAvatar.src = avatarUrl;
        if (modalUserName) modalUserName.textContent = currentUser.name;
        if (modalUserEmail) modalUserEmail.textContent = currentUser.email;
    } else {
        if (signedOutView) signedOutView.classList.remove("hidden");
        if (signedInView) signedInView.classList.add("hidden");

        if (headerUserAvatar) headerUserAvatar.classList.add("hidden");
        if (headerAuthText) headerAuthText.textContent = "Sign In";

        if (modalSignedOutBox) modalSignedOutBox.classList.remove("hidden");
        if (modalSignedInBox) modalSignedInBox.classList.add("hidden");
    }
}

function loadSettingsFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_SETTINGS_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            userSettings = {
                displayName: parsed.displayName || "",
                tone: parsed.tone || parsed.briceMode || "UNFILTERED",
                customSystemInstructions: parsed.customSystemInstructions || "",
                responseLength: parsed.responseLength || "BALANCED",
                responseFormat: parsed.responseFormat || "AUTO",
                customApiKey: parsed.customApiKey || "",
                googleClientId: parsed.googleClientId || ""
            };
        }
    } catch (e) {
        // Keep defaults
    }
    populateSettingsForm();
}

function populateSettingsForm() {
    if (displayNameInput) displayNameInput.value = userSettings.displayName;
    if (toneSelect) toneSelect.value = userSettings.tone;
    if (customSystemInput) customSystemInput.value = userSettings.customSystemInstructions;
    if (responseLengthSelect) responseLengthSelect.value = userSettings.responseLength;
    if (responseFormatSelect) responseFormatSelect.value = userSettings.responseFormat;
    if (apiKeyInput) apiKeyInput.value = userSettings.customApiKey;
    if (googleClientIdInput) googleClientIdInput.value = userSettings.googleClientId;
}

function saveSettingsToStorage() {
    localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(userSettings));
}

function buildEffectiveSystemInstruction() {
    const parts = [];
    const baseTone = TONE_MODIFIERS[userSettings.tone] || TONE_MODIFIERS.UNFILTERED;
    parts.push(baseTone);

    const activeName = (userSettings.displayName || (currentUser ? currentUser.name.split(" ")[0] : "")).trim();
    if (activeName) {
        parts.push(`Address the user as "${activeName}" naturally when appropriate.`);
    }

    const lengthRule = LENGTH_MODIFIERS[userSettings.responseLength];
    if (lengthRule) parts.push(lengthRule);

    const formatRule = FORMAT_MODIFIERS[userSettings.responseFormat];
    if (formatRule) parts.push(formatRule);

    if (userSettings.customSystemInstructions && userSettings.customSystemInstructions.trim()) {
        parts.push(`Additional user personalization instructions: ${userSettings.customSystemInstructions.trim()}`);
    }

    if (currentChat && currentChat.contextNote && currentChat.contextNote.trim()) {
        parts.push(`Important background context / system note for this conversation:\n${currentChat.contextNote.trim()}`);
    }

    return parts.join("\n\n");
}

/* ================= GOOGLE SIGN-IN & LOCAL FALLBACK ================= */
function initGoogleIdentityIfConfigured() {
    if (!userSettings.googleClientId || !window.google || !window.google.accounts) return;
    try {
        window.google.accounts.id.initialize({
            client_id: userSettings.googleClientId,
            callback: handleGoogleCredentialResponse
        });
    } catch (e) {
        console.warn("Google Identity init skipped:", e);
    }
}

function handleGoogleCredentialResponse(response) {
    try {
        const base64Url = response.credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        saveUserToStorage({
            name: payload.name || "Google User",
            email: payload.email || "",
            avatar: payload.picture || generateAvatarSvgDataUrl(payload.name)
        });
        closeGoogleSignInDialog();
    } catch (e) {
        console.error("Failed to decode Google JWT", e);
    }
}

function triggerGoogleSignInFlow() {
    if (userSettings.googleClientId && window.google && window.google.accounts && window.google.accounts.id) {
        try {
            initGoogleIdentityIfConfigured();
            window.google.accounts.id.prompt();
            return;
        } catch (e) {
            // Fall back to built-in Google Sign-In modal
        }
    }
    openGoogleSignInDialog();
}

function openGoogleSignInDialog() {
    if (googleNameInput) googleNameInput.value = userSettings.displayName || "";
    if (googleEmailInput) googleEmailInput.value = "";
    if (googleSignInModal) googleSignInModal.classList.remove("hidden");
}

function closeGoogleSignInDialog() {
    if (googleSignInModal) googleSignInModal.classList.add("hidden");
}

/* ================= CHAT HISTORY & CONVERSATION MANAGEMENT ================= */
function initChatHistory() {
    try {
        const stored = localStorage.getItem(STORAGE_CHATS_KEY);
        chats = stored ? JSON.parse(stored) : [];
    } catch (e) {
        chats = [];
    }

    if (!Array.isArray(chats) || chats.length === 0) {
        createNewChatThread();
    } else {
        loadChatThread(chats[0].id);
    }
    renderHistoryList();
}

function saveChats() {
    localStorage.setItem(STORAGE_CHATS_KEY, JSON.stringify(chats));
}

function createNewChatThread() {
    const newChat = {
        id: "chat_" + Date.now(),
        title: "New Conversation",
        messages: [],
        contextNote: "",
        createdAt: Date.now()
    };
    chats.unshift(newChat);
    saveChats();
    loadChatThread(newChat.id);
    renderHistoryList();
    toggleSidebar(false);
}

function loadChatThread(id) {
    currentChat = chats.find(c => c.id === id) || chats[0];
    updateContextBannerUI();
    renderChatWindow();
    renderHistoryList();
}

function renameChatThread(id, event) {
    event.stopPropagation();
    const target = chats.find(c => c.id === id);
    if (!target) return;
    const newTitle = prompt("Rename conversation:", target.title);
    if (newTitle !== null && newTitle.trim() !== "") {
        target.title = newTitle.trim();
        saveChats();
        renderHistoryList();
    }
}

function deleteChatThread(id, event) {
    event.stopPropagation();
    chats = chats.filter(c => c.id !== id);
    if (chats.length === 0) {
        createNewChatThread();
    } else if (currentChat && currentChat.id === id) {
        saveChats();
        loadChatThread(chats[0].id);
    } else {
        saveChats();
        renderHistoryList();
    }
}

function clearAllLocalData() {
    if (confirm("Clear all saved conversations, personalization settings, and local sign-in profile from this device?")) {
        localStorage.removeItem(STORAGE_CHATS_KEY);
        localStorage.removeItem(STORAGE_SETTINGS_KEY);
        localStorage.removeItem(STORAGE_USER_KEY);
        chats = [];
        currentUser = null;
        userSettings = {
            displayName: "",
            tone: "UNFILTERED",
            customSystemInstructions: "",
            responseLength: "BALANCED",
            responseFormat: "AUTO",
            customApiKey: "",
            googleClientId: ""
        };
        populateSettingsForm();
        updateAuthUI();
        createNewChatThread();
        closeSettingsModal();
    }
}

/* ================= RENDERING ================= */
function renderHistoryList() {
    if (!historyList) return;
    const query = (searchChats?.value || "").toLowerCase().trim();
    const filtered = chats.filter(c => {
        if (!query) return true;
        const titleMatch = (c.title || "").toLowerCase().includes(query);
        const msgMatch = (c.messages || []).some(m => (m.text || "").toLowerCase().includes(query));
        return titleMatch || msgMatch;
    });

    historyList.innerHTML = "";
    if (filtered.length === 0) {
        historyList.innerHTML = `<div style="padding:12px;font-size:12px;color:var(--text-secondary);font-style:italic;">No conversations found.</div>`;
        return;
    }

    filtered.forEach(chat => {
        const item = document.createElement("div");
        item.className = `historyItem ${currentChat && currentChat.id === chat.id ? "active" : ""}`;
        item.innerHTML = `
            <span class="historyItemTitle">${escapeHtml(chat.title)}</span>
            <div class="historyItemActions">
                <button class="chatItemActionBtn renameBtn" type="button" title="Rename">✎</button>
                <button class="chatItemActionBtn deleteBtn" type="button" title="Delete">✕</button>
            </div>
        `;
        item.addEventListener("click", () => {
            loadChatThread(chat.id);
            toggleSidebar(false);
        });
        item.querySelector(".renameBtn").addEventListener("click", (e) => renameChatThread(chat.id, e));
        item.querySelector(".deleteBtn").addEventListener("click", (e) => deleteChatThread(chat.id, e));
        historyList.appendChild(item);
    });
}

function updateContextBannerUI() {
    if (!contextBanner || !contextBannerText) return;
    const note = currentChat?.contextNote?.trim() || "";
    if (note) {
        contextBannerText.textContent = `Context Note: ${note}`;
        contextBanner.classList.remove("hidden");
    } else {
        contextBanner.classList.add("hidden");
    }
}

function renderChatWindow() {
    if (!chatWindow) return;

    if (!currentChat || currentChat.messages.length === 0) {
        const greetingName = userSettings.displayName || (currentUser ? currentUser.name.split(" ")[0] : "");
        const headline = greetingName ? `WHAT'S UP, ${escapeHtml(greetingName.toUpperCase())}?` : "HOW CAN I HELP YOU?";

        chatWindow.innerHTML = `
            <div id="welcomeScreen" class="welcomeScreen">
                <div class="welcomeLogoCard">
                    <img src="${LOGO_SRC}" onerror="this.onerror=null;this.src='${LOGO_FALLBACK_SRC}';" alt="Ask Brice Logo">
                </div>
                <h1>${headline}</h1>
                <p class="welcomeScript">Bullshit detector.</p>
                <p class="welcomeSubtitle">Ask me anything. No sugarcoating, just the truth.</p>
                <div class="starterPrompts">
                    <div class="starterCard" data-prompt="Call out every flaw in this business idea: A subscription box for used socks.">
                        <span class="starterIcon">💼</span>
                        <div class="starterTitle">Business Reality Check</div>
                        <div class="starterDesc">Expose every blind spot in an idea</div>
                    </div>
                    <div class="starterCard" data-prompt="I keep procrastinating on going to the gym because I'm 'too busy'. Roast me and tell me what to do.">
                        <span class="starterIcon">🔥</span>
                        <div class="starterTitle">Excuse Destroyer</div>
                        <div class="starterDesc">Call out procrastination &amp; laziness</div>
                    </div>
                    <div class="starterCard" data-prompt="My coworker took credit for my presentation and I didn't say anything to keep peace. Did I handle this like a coward?">
                        <span class="starterIcon">⚖️</span>
                        <div class="starterTitle">Am I The Problem?</div>
                        <div class="starterDesc">Brutal interpersonal honesty</div>
                    </div>
                    <div class="starterCard" data-prompt="Give me brutal feedback: What are the biggest red flags on a resume that scream unemployable?">
                        <span class="starterIcon">📄</span>
                        <div class="starterTitle">Resume Roast</div>
                        <div class="starterDesc">Unvarnished career critique</div>
                    </div>
                </div>
            </div>
        `;
        bindStarterCards();
        return;
    }

    chatWindow.innerHTML = "";
    currentChat.messages.forEach(msg => {
        appendMessageDOM(msg);
    });
    scrollToBottom();
}

function appendMessageDOM(msg) {
    const { sender, text, imageBase64, fileName, timestamp = Date.now(), isError = false } = msg;
    const welcome = document.getElementById("welcomeScreen");
    if (welcome) welcome.remove();

    const row = document.createElement("div");
    row.className = `messageRow ${sender === "user" ? "user" : "assistant"}`;

    const timeFormatted = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const avatarHtml = sender === "assistant"
        ? `<div class="botAvatarSmall"><img src="${LOGO_SRC}" onerror="this.onerror=null;this.src='${LOGO_FALLBACK_SRC}';" alt="Brice"></div>`
        : "";

    let contentHtml = "";

    if (imageBase64) {
        contentHtml += `<img src="${imageBase64}" class="messageImage" alt="Attached image">`;
    }

    if (fileName) {
        contentHtml += `<div class="messageFileBadge">📄 ${escapeHtml(fileName)}</div>`;
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
                ${sender === "assistant" && !isError ? `<button class="copyBtn" type="button">Copy</button>` : ""}
            </div>
        </div>
    `;

    if (sender === "assistant" && !isError) {
        const copyBtn = row.querySelector(".copyBtn");
        if (copyBtn) {
            copyBtn.addEventListener("click", () => {
                navigator.clipboard.writeText(text);
                copyBtn.textContent = "Copied!";
                setTimeout(() => { copyBtn.textContent = "Copy"; }, 1500);
            });
        }
    }

    if (imageBase64) {
        const imgEl = row.querySelector(".messageImage");
        if (imgEl) {
            imgEl.addEventListener("click", () => {
                const win = window.open("");
                if (win) win.document.write(`<body style="margin:0;background:#000;display:flex;align-items:center;justify-content:center;"><img src="${imageBase64}" style="max-width:100%;max-height:100vh;"/></body>`);
            });
        }
    }

    chatWindow.appendChild(row);
    scrollToBottom();
}

function renderQuickPromptsList() {
    if (!quickPromptsList) return;
    quickPromptsList.innerHTML = "";
    QUICK_PROMPTS.forEach(item => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "quickPromptBtn";
        btn.innerHTML = `<strong>${escapeHtml(item.title)}</strong><div style="color:var(--text-secondary);margin-top:2px;">${escapeHtml(item.prompt)}</div>`;
        btn.addEventListener("click", () => {
            if (promptInput) {
                promptInput.value = item.prompt;
                promptInput.focus();
                autoResizeTextarea();
            }
            closeAllPopovers();
        });
        quickPromptsList.appendChild(btn);
    });
}

function bindStarterCards() {
    document.querySelectorAll(".starterCard").forEach(card => {
        card.addEventListener("click", () => {
            const promptText = card.getAttribute("data-prompt");
            if (promptInput && promptText) {
                promptInput.value = promptText;
                handleSendMessage();
            }
        });
    });
}

/* ================= SEND MESSAGE & API CALL ================= */
async function handleSendMessage() {
    if (!promptInput) return;

    const rawText = promptInput.value.trim();
    const attachedImg = selectedImageBase64;
    const attachedFileText = selectedFileContent;
    const attachedFileLabel = selectedFileName;

    if (!rawText && !attachedImg && !attachedFileText) return;

    // Immediately clear input box and reset height so bottom bar stays clean
    promptInput.value = "";
    promptInput.style.height = "auto";
    clearImageSelection();
    clearFileSelection();
    closeAllPopovers();
    setRandomPlaceholder();

    if (!currentChat) createNewChatThread();

    // Update conversation title on first message
    if (currentChat.messages.length === 0) {
        const titleSeed = rawText || attachedFileLabel || "Image Analysis";
        currentChat.title = titleSeed.length > 26 ? titleSeed.substring(0, 24) + "..." : titleSeed;
    }

    const userMsg = {
        sender: "user",
        text: rawText,
        imageBase64: attachedImg,
        fileName: attachedFileLabel || null,
        fileContent: attachedFileText || null,
        timestamp: Date.now()
    };

    currentChat.messages.push(userMsg);
    saveChats();
    renderHistoryList();
    appendMessageDOM(userMsg);

    // Show thinking indicator
    if (thinkingLabel) thinkingLabel.textContent = getRandomThinking();
    if (typingIndicator) typingIndicator.classList.remove("hidden");
    scrollToBottom();

    // Build API messages history
    const apiMessages = currentChat.messages.filter(m => !m.isError).map(m => {
        const parts = [];
        if (m.imageBase64) {
            parts.push({ type: "image_url", image_url: { url: m.imageBase64 } });
        }
        let combinedText = m.text || "";
        if (m.fileContent) {
            combinedText += `\n\n[Attached File: ${m.fileName || "document"}]\n${m.fileContent}`;
        }
        if (combinedText.trim()) {
            parts.push({ type: "text", text: combinedText.trim() });
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
                systemInstruction: buildEffectiveSystemInstruction(),
                customApiKey: userSettings.customApiKey
            })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error?.message || "API request failed");
        }

        const reply = data.choices?.message?.content || data.choices?.[0]?.message?.content || "Brice remained silent.";

        if (typingIndicator) typingIndicator.classList.add("hidden");

        const botMsg = {
            sender: "assistant",
            text: reply,
            timestamp: Date.now()
        };
        currentChat.messages.push(botMsg);
        saveChats();
        appendMessageDOM(botMsg);

    } catch (err) {
        if (typingIndicator) typingIndicator.classList.add("hidden");
        const errorText = `⚠️ ${err.message}`;
        const errorMsg = {
            sender: "assistant",
            text: errorText,
            timestamp: Date.now(),
            isError: true
        };
        currentChat.messages.push(errorMsg);
        saveChats();
        appendMessageDOM(errorMsg);
    }
}

/* ================= + POPUP MENU & ATTACHMENTS ================= */
function togglePlusMenu(forceState) {
    if (!plusPopupMenu || !plusBtn) return;
    if (quickPromptsPopover) quickPromptsPopover.classList.add("hidden");

    const shouldOpen = forceState !== undefined ? forceState : plusPopupMenu.classList.contains("hidden");
    if (shouldOpen) {
        plusPopupMenu.classList.remove("hidden");
        plusBtn.classList.add("active");
    } else {
        plusPopupMenu.classList.add("hidden");
        plusBtn.classList.remove("active");
    }
}

function closeAllPopovers() {
    if (plusPopupMenu) plusPopupMenu.classList.add("hidden");
    if (quickPromptsPopover) quickPromptsPopover.classList.add("hidden");
    if (plusBtn) plusBtn.classList.remove("active");
}

function handleImageSelection(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        selectedImageBase64 = event.target.result;
        selectedImageName = file.name;
        if (previewImg) previewImg.src = selectedImageBase64;
        if (imageAttachmentName) imageAttachmentName.textContent = file.name;
        if (imageAttachmentChip) imageAttachmentChip.classList.remove("hidden");
        updateAttachmentContainerVisibility();
    };
    reader.readAsDataURL(file);
}

function clearImageSelection() {
    selectedImageBase64 = null;
    selectedImageName = "";
    if (imageInput) imageInput.value = "";
    if (imageAttachmentChip) imageAttachmentChip.classList.add("hidden");
    updateAttachmentContainerVisibility();
}

function handleDocFileSelection(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        selectedFileContent = String(event.target.result || "").slice(0, 60000);
        selectedFileName = file.name;
        if (fileAttachmentName) fileAttachmentName.textContent = file.name;
        if (fileAttachmentChip) fileAttachmentChip.classList.remove("hidden");
        updateAttachmentContainerVisibility();
    };
    reader.readAsText(file);
}

function clearFileSelection() {
    selectedFileContent = null;
    selectedFileName = "";
    if (docInput) docInput.value = "";
    if (fileAttachmentChip) fileAttachmentChip.classList.add("hidden");
    updateAttachmentContainerVisibility();
}

function updateAttachmentContainerVisibility() {
    if (!attachmentPreview) return;
    const hasImg = Boolean(selectedImageBase64);
    const hasFile = Boolean(selectedFileContent);
    if (hasImg || hasFile) {
        attachmentPreview.classList.remove("hidden");
    } else {
        attachmentPreview.classList.add("hidden");
    }
}

/* ================= VOICE INPUT ================= */
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
            autoResizeTextarea();
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

/* ================= SIDEBAR & MODALS ================= */
function toggleSidebar(forceState) {
    if (!sidebar || !sidebarOverlay) return;
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
    populateSettingsForm();
    if (settingsModal) settingsModal.classList.remove("hidden");
}

function closeSettingsModal() {
    if (settingsModal) settingsModal.classList.add("hidden");
}

function openContextModal() {
    if (chatContextTextarea) {
        chatContextTextarea.value = currentChat?.contextNote || "";
    }
    if (contextModal) contextModal.classList.remove("hidden");
}

function closeContextModalDialog() {
    if (contextModal) contextModal.classList.add("hidden");
}

/* ================= UTILITIES & EVENT LISTENERS ================= */
function setRandomPlaceholder() {
    if (!promptInput) return;
    promptInput.placeholder = PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)];
}

function getRandomThinking() {
    return THINKING_MESSAGES[Math.floor(Math.random() * THINKING_MESSAGES.length)];
}

function scrollToBottom() {
    if (chatWindow) {
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }
}

function autoResizeTextarea() {
    if (!promptInput) return;
    promptInput.style.height = "auto";
    promptInput.style.height = Math.min(promptInput.scrollHeight, 120) + "px";
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text || "").replace(/[&<>"']/g, m => map[m]);
}

function setupEventListeners() {
    // Expandable Top-Left Menu
    if (menuBtn) menuBtn.addEventListener("click", () => toggleSidebar());
    if (closeSidebarBtn) closeSidebarBtn.addEventListener("click", () => toggleSidebar(false));
    if (sidebarOverlay) sidebarOverlay.addEventListener("click", () => toggleSidebar(false));
    if (newChatBtn) newChatBtn.addEventListener("click", createNewChatThread);
    if (searchChats) searchChats.addEventListener("input", renderHistoryList);

    // + Menu Button & Options
    if (plusBtn) {
        plusBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            togglePlusMenu();
        });
    }

    if (menuUploadImage) {
        menuUploadImage.addEventListener("click", () => {
            closeAllPopovers();
            if (imageInput) imageInput.click();
        });
    }

    if (menuUploadFile) {
        menuUploadFile.addEventListener("click", () => {
            closeAllPopovers();
            if (docInput) docInput.click();
        });
    }

    if (menuAddContext) {
        menuAddContext.addEventListener("click", () => {
            closeAllPopovers();
            openContextModal();
        });
    }

    if (menuQuickPrompts) {
        menuQuickPrompts.addEventListener("click", (e) => {
            e.stopPropagation();
            if (plusPopupMenu) plusPopupMenu.classList.add("hidden");
            if (quickPromptsPopover) quickPromptsPopover.classList.remove("hidden");
        });
    }

    if (closeQuickPrompts) {
        closeQuickPrompts.addEventListener("click", closeAllPopovers);
    }

    // Close pop-ups when clicking outside
    document.addEventListener("click", (e) => {
        if (plusPopupMenu && !plusPopupMenu.classList.contains("hidden")) {
            if (!plusPopupMenu.contains(e.target) && e.target !== plusBtn && !plusBtn.contains(e.target)) {
                closeAllPopovers();
            }
        }
        if (quickPromptsPopover && !quickPromptsPopover.classList.contains("hidden")) {
            if (!quickPromptsPopover.contains(e.target)) {
                closeAllPopovers();
            }
        }
    });

    // File Inputs & Chips
    if (imageInput) imageInput.addEventListener("change", handleImageSelection);
    if (docInput) docInput.addEventListener("change", handleDocFileSelection);
    if (clearImageAttachment) clearImageAttachment.addEventListener("click", clearImageSelection);
    if (clearFileAttachment) clearFileAttachment.addEventListener("click", clearFileSelection);

    // Context Modal & Banner
    if (closeContextModal) closeContextModal.addEventListener("click", closeContextModalDialog);
    if (editContextBtn) editContextBtn.addEventListener("click", openContextModal);
    if (clearContextBtn) {
        clearContextBtn.addEventListener("click", () => {
            if (currentChat) {
                currentChat.contextNote = "";
                saveChats();
                updateContextBannerUI();
            }
        });
    }
    if (clearChatContextModalBtn) {
        clearChatContextModalBtn.addEventListener("click", () => {
            if (chatContextTextarea) chatContextTextarea.value = "";
            if (currentChat) {
                currentChat.contextNote = "";
                saveChats();
                updateContextBannerUI();
            }
            closeContextModalDialog();
        });
    }
    if (saveChatContextBtn) {
        saveChatContextBtn.addEventListener("click", () => {
            if (!currentChat) createNewChatThread();
            currentChat.contextNote = (chatContextTextarea?.value || "").trim();
            saveChats();
            updateContextBannerUI();
            closeContextModalDialog();
        });
    }

    // Send & Input Box
    if (sendBtn) sendBtn.addEventListener("click", handleSendMessage);
    if (micBtn) micBtn.addEventListener("click", toggleSpeechRecognition);

    if (promptInput) {
        promptInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        });
        promptInput.addEventListener("input", autoResizeTextarea);
    }

    // Settings Modal
    if (settingsBtn) settingsBtn.addEventListener("click", openSettingsModal);
    if (sidebarSettingsBtn) {
        sidebarSettingsBtn.addEventListener("click", () => {
            toggleSidebar(false);
            openSettingsModal();
        });
    }
    if (closeSettings) closeSettings.addEventListener("click", closeSettingsModal);
    if (settingsModal) {
        settingsModal.addEventListener("click", (e) => {
            if (e.target === settingsModal) closeSettingsModal();
        });
    }

    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener("click", () => {
            userSettings.displayName = (displayNameInput?.value || "").trim();
            userSettings.tone = toneSelect?.value || "UNFILTERED";
            userSettings.customSystemInstructions = (customSystemInput?.value || "").trim();
            userSettings.responseLength = responseLengthSelect?.value || "BALANCED";
            userSettings.responseFormat = responseFormatSelect?.value || "AUTO";
            userSettings.customApiKey = (apiKeyInput?.value || "").trim();
            userSettings.googleClientId = (googleClientIdInput?.value || "").trim();
            saveSettingsToStorage();
            renderChatWindow();
            initGoogleIdentityIfConfigured();
            closeSettingsModal();
        });
    }

    if (clearAllBtn) clearAllBtn.addEventListener("click", clearAllLocalData);

    // Google Sign-In & Sign-Out
    if (googleSignInBtn) googleSignInBtn.addEventListener("click", triggerGoogleSignInFlow);
    if (modalGoogleSignInBtn) modalGoogleSignInBtn.addEventListener("click", triggerGoogleSignInFlow);
    if (headerAuthBadge) {
        headerAuthBadge.addEventListener("click", () => {
            if (currentUser) {
                openSettingsModal();
            } else {
                triggerGoogleSignInFlow();
            }
        });
    }

    if (signOutBtn) {
        signOutBtn.addEventListener("click", () => {
            saveUserToStorage(null);
        });
    }
    if (modalSignOutBtn) {
        modalSignOutBtn.addEventListener("click", () => {
            saveUserToStorage(null);
        });
    }

    if (closeGoogleModal) closeGoogleModal.addEventListener("click", closeGoogleSignInDialog);
    if (cancelGoogleModalBtn) cancelGoogleModalBtn.addEventListener("click", closeGoogleSignInDialog);
    if (googleSignInModal) {
        googleSignInModal.addEventListener("click", (e) => {
            if (e.target === googleSignInModal) closeGoogleSignInDialog();
        });
    }

    if (quickGoogleAccountCard) {
        quickGoogleAccountCard.addEventListener("click", () => {
            saveUserToStorage({
                name: "Brice Alday",
                email: "aldaybrice@gmail.com",
                avatar: generateAvatarSvgDataUrl("Brice Alday")
            });
            closeGoogleSignInDialog();
            renderChatWindow();
        });
    }

    if (confirmGoogleSignInBtn) {
        confirmGoogleSignInBtn.addEventListener("click", () => {
            const nameVal = (googleNameInput?.value || "").trim() || "Brice User";
            const emailVal = (googleEmailInput?.value || "").trim() || `${nameVal.toLowerCase().replace(/\s+/g, '.')}@gmail.com`;
            saveUserToStorage({
                name: nameVal,
                email: emailVal,
                avatar: generateAvatarSvgDataUrl(nameVal)
            });
            closeGoogleSignInDialog();
            renderChatWindow();
        });
    }
}
