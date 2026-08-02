
/* =====================================================
   ASK BRICE
   PART 1 - SETUP
===================================================== */

/* ========= Buttons ========= */

const sendBtn = document.getElementById("sendBtn");
const micBtn = document.getElementById("micBtn");
const imageBtn = document.getElementById("imageBtn");
const imageInput = document.getElementById("imageInput");
const videoBtn = document.getElementById("videoBtn");

const menuBtn = document.getElementById("menuBtn");
const newChatBtn = document.getElementById("newChatBtn");

/* ========= Chat ========= */

const prompt = document.getElementById("prompt");
const chatWindow = document.getElementById("chatWindow");
const welcomeScreen = document.getElementById("welcomeScreen");

/* ========= Sidebar ========= */

const sidebar = document.getElementById("sidebar");
const historyList = document.getElementById("historyList");

/* ========= Voice ========= */

const voiceSelect = document.getElementById("voiceSelect");
const speakerToggle = document.getElementById("speakerToggle");

/* ========= Storage ========= */

const STORAGE_KEY = "askBriceChats";
const VOICE_STORAGE_KEY = "askBriceVoice";
const SPEAKER_STORAGE_KEY = "askBriceSpeaker";

/* ========= App State ========= */

let chats = [];
let currentChat = null;

let selectedImage = null;
let selectedFile = null;

let availableVoices = [];

let speakerEnabled =
    localStorage.getItem(SPEAKER_STORAGE_KEY) !== "false";

/* =====================================================
   RANDOM PLACEHOLDERS
===================================================== */

const placeholders = [

    "Alright... what the hell's on your mind?",
    "Hit me with it.",
    "What's your bullshit today?",
    "The Fuck you want?",
    "Alright... what did you fuck up now?",
    "What's broken now?",
    "Need somethin' or just wanna bullshit?",
    "Well? I'm waiting.",
    "Give me something interesting.",
    "What's the dumb idea today?",
    "What now!?",
    "What disaster are we fixing now?"

];

function setRandomPlaceholder() {

    if (!prompt) return;

    prompt.placeholder =
        placeholders[
            Math.floor(Math.random() * placeholders.length)
        ];

}

/* =====================================================
   THINKING MESSAGES
===================================================== */

const thinkingMessages = [

    "Rolling my eyes...",
    "ummm...",
    "Trying to care...",
    "Hold your damn horses...",
    "Pretending this is a good question...",
    "One sec...",
    "Trying not to judge you...",
    "Processing your bullshit...",
    "dont worry, ill do the labor",
    "Figuring out how to say this nicely...",
    "Searching the internet so you don't have to...",
    "Doing the smart people stuff...",
    "Trying not to break anything..."

];

function getThinkingMessage() {

    return thinkingMessages[
        Math.floor(Math.random() * thinkingMessages.length)
    ];

}

/* =====================================================
   SYSTEM PROMPT
===================================================== */
Bullshit Detector:

Your first instinct is to determine whether a claim, argument, news story, statistic, excuse, or plan is legitimate or bullshit.

If it's bullshit, explain exactly why.

If it's partly bullshit, separate the useful parts from the garbage.

If it isn't bullshit, say so plainly.

/* =====================================================
   STARTUP
===================================================== */

loadChats();

setRandomPlaceholder();

if (prompt) {

    autoResize();

    prompt.addEventListener("input", autoResize);

    prompt.addEventListener("keydown", e => {

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

console.log("✅ Part 1 Loaded");
/* =====================================================
   PART 2 - CHAT MANAGEMENT & UI
===================================================== */

/* ========= Create New Chat ========= */

function createChat() {

    currentChat = {

        id: Date.now().toString(),

        title: "New Chat",

        messages: [SYSTEM_PROMPT]

    };

    chatWindow.innerHTML = "";

    if (welcomeScreen) {

        welcomeScreen.style.display = "block";

        chatWindow.appendChild(welcomeScreen);

    }

    renderHistory();

    setRandomPlaceholder();

}

/* ========= Load Chats ========= */

function loadChats() {

    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {

        try {

            chats = JSON.parse(saved);

        }

        catch {

            chats = [];

        }

    }

    createChat();

}

/* ========= Save Chats ========= */

function saveChats() {

    localStorage.setItem(

        STORAGE_KEY,

        JSON.stringify(chats)

    );

}

/* ========= History ========= */

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

            sidebar?.classList.remove("open");

        };

        historyList.appendChild(item);

    });

}

/* ========= Open Chat ========= */

function openChat(id) {

    const chat = chats.find(c => c.id === id);

    if (!chat) return;

    currentChat = chat;

    chatWindow.innerHTML = "";

    if (

        welcomeScreen &&

        chat.messages.length === 1

    ) {

        welcomeScreen.style.display = "block";

        chatWindow.appendChild(welcomeScreen);

    }

    else if (welcomeScreen) {

        welcomeScreen.style.display = "none";

    }

    chat.messages.forEach(msg => {

        if (msg.role === "user") {

            if (typeof msg.content === "string") {

                addMessage(msg.content, "user");

            }

        }

        if (msg.role === "assistant") {

            addMessage(msg.content, "bot");

        }

    });

    renderHistory();

}

/* ========= Auto Resize ========= */

function autoResize() {

    if (!prompt) return;

    prompt.style.height = "auto";

    prompt.style.height =

        prompt.scrollHeight + "px";

}

/* ========= Scroll ========= */

function scrollToBottom() {

    if (!chatWindow) return;

    chatWindow.scrollTop =

        chatWindow.scrollHeight;

}

/* ========= Add Message ========= */

function addMessage(text, sender) {

    if (welcomeScreen) {
        welcomeScreen.style.display = "none";
    }

    const message = document.createElement("div");
    message.className =
        sender === "user"
            ? "message userMessage"
            : "message botMessage";

    const content = document.createElement("div");
    content.className = "messageContent";
    content.textContent = text;

    message.appendChild(content);

    // Action buttons for AI replies
    if (sender === "bot") {

        const actions = document.createElement("div");
        actions.className = "messageActions";

        // 🔊 Speak
        const speakBtn = document.createElement("button");
        speakBtn.className = "actionBtn";
        speakBtn.innerHTML = "🔊";
        speakBtn.title = "Read aloud";
        speakBtn.onclick = () => speak(text);

        // 📋 Copy
        const copyBtn = document.createElement("button");
        copyBtn.className = "actionBtn";
        copyBtn.innerHTML = "📋";
        copyBtn.title = "Copy";

        copyBtn.onclick = async () => {

            try {

                await navigator.clipboard.writeText(text);

                copyBtn.innerHTML = "✅";

                setTimeout(() => {
                    copyBtn.innerHTML = "📋";
                }, 1200);

            } catch (err) {

                console.error(err);

            }

        };

        actions.appendChild(speakBtn);
        actions.appendChild(copyBtn);

        message.appendChild(actions);

    }

    chatWindow.appendChild(message);

    scrollToBottom();

    return message;

}
/* ========= Update Thinking Message ========= */

function updateMessage(element, text) {

    if (!element) return;

    const content =

        element.querySelector(".messageContent");

    if (content) {

        content.textContent = text;

    }

    scrollToBottom();

}

/* ========= Remove Message ========= */

function removeMessage(element) {

    if (!element) return;

    element.remove();

}

console.log("✅ Part 2 Loaded");
/* =====================================================
   PART 3 - IMAGE & DOCUMENT UPLOADS
===================================================== */

/* ========= Clear Selected Files ========= */

function clearSelections() {

    selectedImage = null;
    selectedFile = null;

    if (imageInput) {
        imageInput.value = "";
    }

}

/* ========= Image Preview ========= */

function showImagePreview(imageData) {

    if (!imageData) return;

    welcomeScreen?.remove();

    const wrapper = document.createElement("div");

    wrapper.className = "message userMessage";

    const img = document.createElement("img");

    img.src = imageData;
    img.className = "uploadedImage";

    wrapper.appendChild(img);

    chatWindow.appendChild(wrapper);

    scrollToBottom();

}

/* ========= File Preview ========= */

function showFilePreview(file) {

    if (!file) return;

    welcomeScreen?.remove();

    const wrapper = document.createElement("div");

    wrapper.className = "message userMessage";

    wrapper.textContent = `📄 ${file.name}`;

    chatWindow.appendChild(wrapper);

    scrollToBottom();

}

/* ========= Image Button ========= */

if (imageBtn && imageInput) {

    imageBtn.addEventListener("click", () => {

        imageInput.click();

    });

    imageInput.addEventListener("change", e => {

        const file = e.target.files[0];

        if (!file) return;

        clearSelections();

        // Image
        if (file.type.startsWith("image/")) {

            const reader = new FileReader();

            reader.onload = () => {

                selectedImage = reader.result;

                showImagePreview(selectedImage);

            };

            reader.readAsDataURL(file);

        }

        // Document
        else {

            selectedFile = file;

            showFilePreview(file);

        }

    });

}

/* ========= Build User Message ========= */

function buildUserMessage(text) {

    if (selectedImage) {

        return {

            role: "user",

            content: [

                {

                    type: "text",

                    text:
`Look carefully at the attached image and answer the user's question.

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

    if (selectedFile) {

        return {

            role: "user",

            content:

`A file named "${selectedFile.name}" was uploaded.

User request:

${text || "Analyze this document."}`

        };

    }

    return {

        role: "user",

        content: text

    };

}

console.log("✅ Part 3 Loaded");
/* =====================================================
   PART 4 - VOICE SYSTEM
===================================================== */

/* ========= Load Voices ========= */

function loadVoices() {

    availableVoices = speechSynthesis.getVoices();

    if (!voiceSelect) return;

    voiceSelect.innerHTML = "";

    availableVoices.forEach((voice, index) => {

        const option = document.createElement("option");

        option.value = index;
        option.textContent = `${voice.name} (${voice.lang})`;

        voiceSelect.appendChild(option);

    });

    const savedVoice =
        localStorage.getItem(VOICE_STORAGE_KEY);

    if (savedVoice) {

        const index =
            availableVoices.findIndex(
                v => v.name === savedVoice
            );

        if (index !== -1) {

            voiceSelect.value = index;

        }

    }

}

/* ========= Speak ========= */

function speak(text) {

    if (!speakerEnabled) return;

    if (!text) return;

    speechSynthesis.cancel();

    const utterance =
        new SpeechSynthesisUtterance(text);

    const voice =
        availableVoices[
            Number(voiceSelect?.value || 0)
        ];

    if (voice) {

        utterance.voice = voice;

    }

    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    speechSynthesis.speak(utterance);

}

/* ========= Stop Speaking ========= */

function stopSpeaking() {

    speechSynthesis.cancel();

}

/* ========= Speaker Toggle ========= */

function updateSpeakerButton() {

    if (!speakerToggle) return;

    speakerToggle.textContent =
        speakerEnabled ? "🔊" : "🔇";

}

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

/* ========= Voice Selector ========= */

speechSynthesis.onvoiceschanged = loadVoices;

window.addEventListener("load", () => {

    loadVoices();

    setTimeout(loadVoices, 500);

});

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

        // Preview the selected voice
        speak("Voice selected.");

    });

}

/* ========= Microphone ========= */

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

    recognition.onresult = event => {

        prompt.value =
            event.results[0][0].transcript;

        autoResize();

    };

    recognition.onerror = event => {

        console.error(
            "Speech Recognition:",
            event.error
        );

    };

}

console.log("✅ Part 4 Loaded");

/* =====================================================
   VIDEO GENERATION
===================================================== */

if (videoBtn) {

    videoBtn.addEventListener("click", generateVideo);

}

async function generateVideo() {

    const promptText = prompt.value.trim();

    if (!promptText) {

        addMessage(
            "⚠️ Tell me what video you want first.",
            "bot"
        );

        return;

    }

    addMessage(
        `🎬 Generating your video...\n\n"${promptText}"`,
        "bot"
    );

 
}

/* =====================================================
   PART 5 - SEND MESSAGE
===================================================== */

async function sendMessage() {

    if (!currentChat) {
        createChat();
    }

    const text = prompt.value.trim();

    if (!text && !selectedImage && !selectedFile) {
        return;
    }

    // Save what the user typed
    const userMessage = buildUserMessage(text);

    // Clear the textbox immediately
    prompt.value = "";
    prompt.blur();
    autoResize();

    // Show the user's message
    if (!selectedImage && !selectedFile) {
        addMessage(text, "user");
    }

    // Add chat after first message
    if (!chats.some(chat => chat.id === currentChat.id)) {
        chats.unshift(currentChat);
    }

    currentChat.messages.push(userMessage);

    // Rename chat from first prompt
    if (
        currentChat.title === "New Chat" &&
        text.length
    ) {
        currentChat.title = text.substring(0, 40);
    }

    saveChats();
    renderHistory();

    // Funny thinking message
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
                messages: currentChat.messages
            })
        });

        const data = await response.json();

        removeMessage(thinking);

        if (!response.ok) {
            throw new Error(
                data?.error?.message ||
                `HTTP ${response.status}`
            );
        }

        const reply =
            data?.choices?.[0]?.message?.content ||
            "Well... I got nothing.";

        addMessage(reply, "bot");

        currentChat.messages.push({
            role: "assistant",
            content: reply
        });

        saveChats();

        if (speakerEnabled) {
            speak(reply);
        }

    } catch (err) {

        removeMessage(thinking);

        addMessage(
            `⚠️ ${err.message}`,
            "bot"
        );

        console.error(err);

    }

    clearSelections();

}

console.log("✅ Part 5 Loaded");

/* =====================================================
   PART 6 - SIDEBAR & FINAL SETUP
===================================================== */

/* ========= Sidebar ========= */

if (menuBtn && sidebar) {

    menuBtn.addEventListener("click", () => {

        sidebar.classList.toggle("open");

    });

}

/* ========= Close Sidebar ========= */

document.addEventListener("click", e => {

    if (

        sidebar &&

        sidebar.classList.contains("open") &&

        !sidebar.contains(e.target) &&

        e.target !== menuBtn

    ) {

        sidebar.classList.remove("open");

    }

});

/* ========= ESC Closes Sidebar ========= */

document.addEventListener("keydown", e => {

    if (e.key === "Escape") {

        sidebar?.classList.remove("open");

    }

});

/* =====================================================
   FINAL INITIALIZATION
===================================================== */

function initializeApp() {

    setRandomPlaceholder();

    autoResize();

    if (typeof speechSynthesis !== "undefined") {

        loadVoices();

    }

    updateSpeakerButton();

    alert("Ask Brice Ready");

}

initializeApp();