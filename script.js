/* ==========================================
   ASK BRICE
========================================== */

// Buttons
const sendBtn = document.getElementById("sendBtn");
const micBtn = document.getElementById("micBtn");
const imageBtn = document.getElementById("imageBtn");
const imageInput = document.getElementById("imageInput");
const menuBtn = document.getElementById("menuBtn");
const newChatBtn = document.getElementById("newChatBtn");

// Chat UI
const prompt = document.getElementById("prompt");
const chatWindow = document.getElementById("chatWindow");
const welcomeScreen = document.getElementById("welcomeScreen");

// Sidebar
const sidebar = document.getElementById("sidebar");
const historyList = document.getElementById("historyList");

// Voice
const voiceSelect = document.getElementById("voiceSelect");
const speakerToggle = document.getElementById("speakerToggle");

// Storage Keys
const STORAGE_KEY = "askBriceChats";
const VOICE_STORAGE_KEY = "askBriceVoice";
const SPEAKER_STORAGE_KEY = "askBriceSpeaker";

// App State
let chats = [];
let currentChat = null;

let selectedImage = null;
let selectedFile = null;

let availableVoices = [];
  
let speakerEnabled =
    localStorage.getItem(SPEAKER_STORAGE_KEY) !== "false";
/* ==========================================
   RANDOM PLACEHOLDERS
========================================== */

const placeholders = [
    "Alright... what the hell's on your mind?",
    "Hit me with it.",
    "What's your bullshit today?",
    "Talk to me.",
    "Alright... what did you fuck up now?",
    "What's broken now?",
    "Need somethin' or just wanna bullshit?",
    "Well? I'm waiting.",
    "Give me something interesting."
];

function setRandomPlaceholder() {

    if (!prompt) return;

    prompt.placeholder =
        placeholders[
            Math.floor(Math.random() * placeholders.length)
        ];

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

Talk like a real person.

You're brutally honest.

You're sarcastic when it fits.

You're funny when it fits.

You swear naturally, but don't overdo it.

Never make up facts.

Explain things simply.

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
/* ==========================================
   CHAT MANAGEMENT
========================================== */

function createChat() {

    currentChat = {
        id: Date.now().toString(),
        title: "Fresh Bullshit",
        messages: [SYSTEM_PROMPT]
    };

    chatWindow.innerHTML = "";

    if (welcomeScreen) {

        welcomeScreen.style.display = "block";
        chatWindow.appendChild(welcomeScreen);

    }

    setRandomPlaceholder();

    renderHistory();

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

    renderHistory();

    // Always start with a fresh chat.
    createChat();

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

        if (
            currentChat &&
            chat.id === currentChat.id
        ) {

            item.classList.add("active");

        }

        item.textContent = chat.title;

        item.onclick = () => {

            openChat(chat.id);

            if (sidebar) {

                sidebar.classList.remove("open");

            }

        };

        historyList.appendChild(item);

    });

}

function openChat(id) {

    const chat =
        chats.find(c => c.id === id);

    if (!chat) return;

    currentChat = chat;

    chatWindow.innerHTML = "";

    if (
        welcomeScreen &&
        chat.messages.length === 1
    ) {

        welcomeScreen.style.display = "block";
        chatWindow.appendChild(welcomeScreen);

    } else if (welcomeScreen) {

        welcomeScreen.style.display = "none";

    }

    chat.messages.forEach(msg => {

        if (msg.role === "user") {

            if (typeof msg.content === "string") {

                addMessage(msg.content, "user");

            }

            else if (Array.isArray(msg.content)) {

                const text =
                    msg.content.find(
                        part => part.type === "text"
                    );

                if (text) {

                    addMessage(text.text, "user");

                }

            }

        }

        else if (msg.role === "assistant") {

            addMessage(msg.content, "bot");

        }

    });

    renderHistory();

}

function autoResize() {

    if (!prompt) return;

    prompt.style.height = "auto";

    prompt.style.height =
        prompt.scrollHeight + "px";

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

    scrollToBottom();

    return message;

}

function updateMessage(element, text) {

    if (!element) return;

    element.textContent = text;

    scrollToBottom();

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

    if (welcomeScreen) {

        welcomeScreen.style.display = "none";

    }

    const wrapper = document.createElement("div");

    wrapper.className = "message userMessage";

    const img = document.createElement("img");

    img.src = imageData;
    img.className = "uploadedImage";

    wrapper.appendChild(img);

    chatWindow.appendChild(wrapper);

    scrollToBottom();

}

function showFilePreview(file) {

    if (!file) return;

    if (welcomeScreen) {

        welcomeScreen.style.display = "none";

    }

    const wrapper = document.createElement("div");

    wrapper.className = "message userMessage";

    wrapper.textContent = `📄 ${file.name}`;

    chatWindow.appendChild(wrapper);

    scrollToBottom();

}

function clearSelections() {

    selectedImage = null;
    selectedFile = null;

    if (imageInput) {

        imageInput.value = "";

    }

}
/* ==========================================
   FILE & IMAGE UPLOADS
========================================== */

if (imageBtn && imageInput) {

    imageBtn.addEventListener("click", () => {

        imageInput.click();

    });

    imageInput.addEventListener("change", (e) => {

        const file = e.target.files[0];

        if (!file) return;

        // Reset previous selections
        selectedImage = null;
        selectedFile = null;

        // Hide welcome screen
        if (welcomeScreen) {

            welcomeScreen.style.display = "none";

        }

        // ==========================
        // IMAGE
        // ==========================
        if (file.type.startsWith("image/")) {

            const reader = new FileReader();

            reader.onload = () => {

                selectedImage = reader.result;

                showImagePreview(selectedImage);

            };

            reader.readAsDataURL(file);

        }

        // ==========================
        // DOCUMENT
        // ==========================
        else {

            selectedFile = file;

            showFilePreview(file);

        }

    });

}

/* ==========================================
   BUILD USER MESSAGE
========================================== */

function buildUserMessage(text) {

    // Image upload
    if (selectedImage) {

        return {
            role: "user",
            content: [
                {
                    type: "text",
                    text:
`Look at the attached image carefully and answer the user's question.

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

    }

    // Document upload
    if (selectedFile) {

        return {
            role: "user",
            content:
`A document named "${selectedFile.name}" was uploaded.

The user's request:

${text || "Analyze this document."}

(Note: Document parsing will be added in the next step.)`
        };

    }

    // Plain text
    return {
        role: "user",
        content: text
    };

}
/* ==========================================
   VOICE SYSTEM
========================================== */

function loadVoices() {

    availableVoices = speechSynthesis.getVoices();

    console.log("Voices:", availableVoices);

    if (!voiceSelect) return;

    voiceSelect.innerHTML = "";

    availableVoices.forEach((voice, index) => {

        const option = document.createElement("option");

        option.value = index;
        option.textContent = voice.name;

        voiceSelect.appendChild(option);

    });

}

speechSynthesis.onvoiceschanged = loadVoices;

window.addEventListener("load", () => {

    loadVoices();

    setTimeout(loadVoices, 500);

});
setTimeout(() => {
    console.log(availableVoices);
}, 1000);

/* ==========================================
   VOICE SELECTOR
========================================== */

if (voiceSelect) {

    voiceSelect.addEventListener("change", () => {

        const voice =
            availableVoices[
                Number(voiceSelect.value)
            ];

        if (!voice) return;

        localStorage.setItem(
            VOICE_STORAGE_KEY,
            voice.name
        );

        // Preview voice
        speak("Hey, I'm Ask Brice.");

    });

}

/* ==========================================
   SPEAKER TOGGLE
========================================== */

updateSpeakerButton();

if (speakerToggle) {

    speakerToggle.addEventListener("click", () => {

        speakerEnabled = !speakerEnabled;

        localStorage.setItem(
            SPEAKER_STORAGE_KEY,
            speakerEnabled
        );

        if (!speakerEnabled) {

            stopSpeaking();

        }

        updateSpeakerButton();

    });

}

/* ==========================================
   MICROPHONE
========================================== */

if ("webkitSpeechRecognition" in window) {

    const recognition =
        new webkitSpeechRecognition();

    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    if (micBtn) {

        micBtn.addEventListener("click", () => {

            recognition.start();

        });

    }

    recognition.onresult = (event) => {

        prompt.value =
            event.results[0][0].transcript;

        autoResize();

    };

    recognition.onerror = (event) => {

        console.error(event.error);

    };

}
/* ==========================================
   SEND MESSAGE
========================================== */

async function sendMessage() {

    if (!currentChat) {

        createChat();

    }

    const text = prompt.value.trim();

    if (!text && !selectedImage && !selectedFile) {

        return;

    }

    const userMessage = buildUserMessage(text);

    // Show the user's message in the chat
    if (!selectedImage && !selectedFile) {

        addMessage(text, "user");

    }

    // Save chat only after first message
    if (!chats.some(chat => chat.id === currentChat.id)) {

        chats.unshift(currentChat);

    }

    currentChat.messages.push(userMessage);

    if (
        currentChat.title === "Fresh Bullshit" &&
        text.length > 0
    ) {

        currentChat.title =
            text.substring(0, 30);

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

        // Save assistant reply
        currentChat.messages.push({

            role: "assistant",
            content: reply

        });

        saveChats();

    }

    catch (err) {

        removeMessage(thinking);

        addMessage(
            `⚠️ ${err.message}`,
            "bot"
        );

    }

    clearSelections();

}
/* ==========================================
   SIDEBAR
========================================== */

if (menuBtn && sidebar) {

    menuBtn.addEventListener("click", () => {

        sidebar.classList.toggle("open");

    });

}

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
   OPTIONAL: ESC KEY CLOSES SIDEBAR
========================================== */

document.addEventListener("keydown", (e) => {

    if (e.key === "Escape") {

        sidebar?.classList.remove("open");

    }

});

/* ==========================================
   PAGE SETUP
========================================== */

// Show a fresh placeholder
setRandomPlaceholder();

// Resize the textbox if needed
autoResize();

// Load available voices
if (typeof speechSynthesis !== "undefined") {

    loadVoices();

}

/* ==========================================
   END OF SCRIPT
========================================== */

console.log("✅ Ask Brice loaded successfully.");