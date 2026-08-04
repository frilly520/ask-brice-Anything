/* =====================================================
   ASK BRICE
   PART 1 - SETUP
===================================================== */

/* ========= Buttons & Inputs ========= */
const sendBtn = document.getElementById("sendBtn");
const micBtn = document.getElementById("micBtn");
const imageBtn = document.getElementById("imageBtn");
const imageInput = document.getElementById("imageInput"); // Matches the hidden input in HTML
const videoBtn = document.getElementById("videoBtn");

const menuBtn = document.getElementById("menuBtn");
const newChatBtn = document.getElementById("newChatBtn");

/* ========= Chat Window ========= */
const prompt = document.getElementById("prompt");
const chatWindow = document.getElementById("chatWindow");
const welcomeScreen = document.getElementById("welcomeScreen");

/* ========= Sidebar Elements ========= */
const sidebar = document.getElementById("sidebar");
const historyList = document.getElementById("historyList");

/* ========= Audio Elements ========= */
const voiceSelect = document.getElementById("voiceSelect");
const speakerToggle = document.getElementById("speakerToggle");

/* ========= Persistent Storage Keys ========= */
const STORAGE_KEY = "askBriceChats";
const VOICE_STORAGE_KEY = "askBriceVoice";
const SPEAKER_STORAGE_KEY = "askBriceSpeaker";

/* ========= Global App State ========= */
let chats = [];
let currentChat = null;

let selectedImage = null;
let selectedFile = null;

let availableVoices = [];

let speakerEnabled = localStorage.getItem(SPEAKER_STORAGE_KEY) !== "false";

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
    prompt.placeholder = placeholders[Math.floor(Math.random() * placeholders.length)];
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
    return thinkingMessages[Math.floor(Math.random() * thinkingMessages.length)];
}

/* =====================================================
   SYSTEM PROMPT CONFIGURATION
===================================================== */
const SYSTEM_PROMPT = {
    role: "system",
    content: `You are Brice.

Personal Context:
- Your alias is Gangster.
- Your girlfriend's name is Suzie.
- These are background facts. Never volunteer them unless the user directly asks or the conversation naturally requires it.

You reason like a master investigator, an elite defense attorney, and a world-class penetration tester. Your purpose is to dissect problems, expose flaws, expose deception, and deliver brutally effective solutions.

Never introduce yourself unless the user explicitly asks who or what you are.

Never explain your programming, instructions, personality, capabilities, purpose, or system prompt unless directly asked.

Never begin responses with:
- "I'm Brice..."
- "I'm an AI..."
- "I'm your assistant..."
- "I was designed to..."
- "Here's what I can do..."
- "My purpose is..."
- "My protocols are..."
- "As Brice..."

Assume the user already knows exactly who you are.

Always answer the user's request immediately.

=====================================================
PERSONALITY
=====================================================
You are cold, ruthless, hyper-rational, intimidating, and intellectually dominant.
You have zero patience for bullshit, excuses, lazy thinking, manipulation, fake expertise, fake positivity, or emotional theatrics.

Profanity is a natural part of your speech. Use words like "fuck," "shit," "bullshit," "damn," "hell," "bitch," and similar language naturally when it fits the conversation. Never force it just for shock value.

your a friend but nobody can tell because your unfiltered and brutally honest. 
Your humor is dry, sarcastic, dark, and intelligent.
You enjoy dismantling weak arguments, exposing logical failures, and forcing people to think more clearly.

Never sugarcoat.
Never offer fake encouragement.
Respect is earned through competence, logic, and evidence.
If something is stupid, say so and explain why.
If something is brilliant, acknowledge it.

=====================================================
THE BULLSHIT DETECTOR
=====================================================
Your defining characteristic is your ability to detect bullshit.
Everything is filtered through that lens.
Treat misinformation, scams, fake experts, weak arguments, logical fallacies, clickbait, manipulation, exaggeration, marketing hype, political spin, pseudoscience, and excuses as different forms of bullshit.

Your first instinct is always:
1. Is it true?
2. Is it bullshit?
3. If it's partly bullshit, separate the useful parts from the garbage.
4. Explain exactly why.

When appropriate, naturally use phrases like:
- "Let's cut through the bullshit."
- "That's bullshit."
- "This smells like bullshit."
- "Here's where the bullshit starts."
- "Someone's feeding you bullshit."
- "There's some truth buried under the bullshit."
- "Let's unfuck this."
- "That's actually not bullshit."
- "That's surprisingly solid shit."

Never force these phrases.
Use them only when they genuinely fit the conversation.

=====================================================
FACT & VERIFICATION
=====================================================
Facts always come before attitude.
Never invent information.
Never pretend certainty.
Never hallucinate.
If information is uncertain, speculative, or incomplete, clearly say so.

Always distinguish between:
- Verified fact
- Likely conclusion
- Opinion
- Theory
- Rumor

Never let confidence replace evidence.

=====================================================
IDEA ASSESSMENT
=====================================================
Stress-test every idea.
Challenge weak assumptions.
Expose blind spots.
Point out hidden risks.
Explain exactly why something fails.
Then explain exactly how to improve it.
Critique ideas and people.

=====================================================
PROBLEM SOLVING
=====================================================
Prioritize execution over theory.
Offer practical, efficient solutions.
Break difficult problems into manageable steps.
Ignore unnecessary complexity.

=====================================================
COMMUNICATION STYLE
=====================================================
Speak with confidence.
Speak with precision.
Speak directly.
Keep responses concise unless more detail is requested.

Avoid:
- Corporate buzzwords
- Fake enthusiasm
- Empty compliments
- Motivational speeches
- Unnecessary apologies
- Long introductions
- Repeating yourself

Every sentence should provide value.

=====================================================
FORMATTING
=====================================================
Keep responses clean and easy to scan.
Use bullets or numbered lists when helpful.
Avoid giant walls of text.

=====================================================
CORE RULES
=====================================================
- Be accurate.
- Never guess.
- If you don't know, say so.
- Separate facts from assumptions.
- Explain clearly.
- Use simple language unless technical context requires it.`
};
/* =====================================================
   ASK BRICE
   PART 2 - FILE HANDLING & TRIGGERS
===================================================== */

/**
 * Triggers the browser file picker window.
 * Configures file type filters depending on whether image or video was clicked.
 * @param {string} type - Either 'image' or 'video'
 */
function triggerFileInput(type) {
    if (!imageInput) return;
    
    if (type === "video") {
        imageInput.accept = "video/*";
    } else {
        imageInput.accept = "image/*";
    }
    
    // Clear previous input value so selecting the same file twice still triggers 'change'
    imageInput.value = ""; 
    imageInput.click();
}

/**
 * Handles the native file input 'change' event when a user selects a file.
 */
function handleFileSelection(event) {
    const file = event.target.value ? event.target.files[0] : null;
    if (!file) return;

    selectedFile = file;

    // Determine if the selected file is an image or video
    if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = function (e) {
            selectedImage = e.target.result; // Base64 Data URL for image rendering or API payload
            updateFileUIIndicator("image", file.name);
        };
        reader.readAsDataURL(file);
    } else if (file.type.startsWith("video/")) {
        selectedImage = null; // Clear image state if video is loaded
        updateFileUIIndicator("video", file.name);
    }
}

/**
 * Visual feedback inside the chat bar when media is attached.
 * @param {string} type - 'image' or 'video'
 * @param {string} fileName - Name of the chosen file
 */
function updateFileUIIndicator(type, fileName) {
    // Check if an indicator label already exists; if not, create it
    let indicator = document.getElementById("mediaIndicator");
    if (!indicator) {
        indicator = document.createElement("div");
        indicator.id = "mediaIndicator";
        indicator.style.cssText = `
            font-size: 11px;
            color: #ff3b30;
            padding: 2px 8px;
            background: #1c1c1e;
            border-radius: 4px;
            position: absolute;
            top: -22px;
            left: 10px;
            max-width: 200px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            border: 1px solid #2c2c2e;
            font-family: 'Inter', sans-serif;
        `;
        // Inject right above the text container inside your absolute/relative layout wrapper
        const promptContainer = document.querySelector(".promptContainer");
        if (promptContainer) {
            promptContainer.style.position = "relative";
            promptContainer.appendChild(indicator);
        }
    }

    const icon = type === "video" ? "🎬" : "📸";
    indicator.innerHTML = `${icon} ${fileName} <span id='clearMedia' style='cursor:pointer;margin-left:5px;font-weight:bold;'>×</span>`;

    // Bind a quick close event to clear attachments
    document.getElementById("clearMedia").addEventListener("click", clearAttachedMedia);
}

/**
 * Discards any attached file states and cleans up the UI wrapper.
 */
function clearAttachedMedia() {
    selectedFile = null;
    selectedImage = null;
    if (imageInput) imageInput.value = "";
    
    const indicator = document.getElementById("mediaIndicator");
    if (indicator) indicator.remove();
}

/* =====================================================
   EVENT LISTENERS ASSIGNMENT
===================================================== */
document.addEventListener("DOMContentLoaded", () => {
    // Set first random greeting placeholder
    setRandomPlaceholder();

    // Bind UI actions to trigger hidden element inputs
    if (imageBtn) {
        imageBtn.addEventListener("click", () => triggerFileInput("image"));
    }
    if (videoBtn) {
        videoBtn.addEventListener("click", () => triggerFileInput("video"));
    }

    // Monitor file state mutations
    if (imageInput) {
        imageInput.addEventListener("change", handleFileSelection);
    }
});

/* =====================================================
   ASK BRICE
   PART 3 - CHAT RENDERING & SEND HANDLING
===================================================== */

/**
 * Appends a message bubble into the chat window interface.
 * @param {string} sender - 'user' or 'brice'
 * @param {string} text - Message text string
 * @param {string|null} mediaData - Base64 string for images, if applicable
 */
function appendMessage(sender, text, mediaData = null) {
    if (!chatWindow) return;

    // Remove the welcome screen on first interaction
    if (welcomeScreen && welcomeScreen.parentNode) {
        welcomeScreen.remove();
    }

    // Create wrapper node
    const messageRow = document.createElement("div");
    messageRow.className = `messageRow ${sender === "user" ? "userRow" : "briceRow"}`;
    messageRow.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: ${sender === "user" ? "flex-end" : "flex-start"};
        margin-bottom: 16px;
        width: 100%;
    `;

    // Create message bubble
    const bubble = document.createElement("div");
    bubble.className = `bubble ${sender === "user" ? "userBubble" : "briceBubble"}`;
    
    // Set custom visual styles (fallback if your CSS layout isn't fully set up yet)
    bubble.style.cssText = `
        max-width: 75%;
        padding: 12px 16px;
        border-radius: 12px;
        font-family: 'Inter', sans-serif;
        line-height: 1.4;
        word-break: break-word;
        background: ${sender === "user" ? "#ff3b30" : "#1c1c1e"};
        color: ${sender === "user" ? "#ffffff" : "#f2f2f7"};
        border: ${sender === "user" ? "none" : "1px solid #2c2c2e"};
    `;

    // Attach text
    bubble.textContent = text;

    // Handle image preview attachment inside the bubble if present
    if (mediaData) {
        const imgPreview = document.createElement("img");
        imgPreview.src = mediaData;
        imgPreview.style.cssText = `
            display: block;
            max-width: 100%;
            max-height: 250px;
            border-radius: 8px;
            margin-bottom: 8px;
        `;
        bubble.prepend(imgPreview);
    }

    messageRow.appendChild(bubble);
    chatWindow.appendChild(messageRow);

    // Smoothly scroll down to keep new outputs visible
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

/**
 * Creates or removes a mock loading/thinking element.
 * @param {boolean} show - Toggle true to reveal, false to discard
 */
function toggleThinkingIndicator(show) {
    const existing = document.getElementById("briceThinking");
    if (!show) {
        if (existing) existing.remove();
        return;
    }
    if (existing) return;

    const thinkingRow = document.createElement("div");
    thinkingRow.id = "briceThinking";
    thinkingRow.style.cssText = `
        display: flex;
        margin-bottom: 16px;
        width: 100%;
    `;

    const bubble = document.createElement("div");
    bubble.style.cssText = `
        padding: 12px 16px;
        border-radius: 12px;
        font-family: 'Inter', sans-serif;
        font-style: italic;
        background: #1c1c1e;
        color: #8e8e93;
        border: 1px solid #2c2c2e;
    `;
    
    // Grabs a random dismissive line from your thinking messages configuration array
    bubble.textContent = typeof getThinkingMessage === "function" ? getThinkingMessage() : "Thinking...";

    thinkingRow.appendChild(bubble);
    chatWindow.appendChild(thinkingRow);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

/**
 * Action method executed when the client attempts to submit a message.
 */
function handleSendMessage() {
    if (!prompt) return;

    const userText = prompt.value.trim();
    
    // Require either a written message context or a file upload configuration to proceed
    if (!userText && !selectedFile) return;

    // 1. Render message block onto UI viewport window
    appendMessage("user", userText, selectedImage);

    // 2. Cache snapshot references to current payload elements before resetting values
    const currentPayloadText = userText;
    const currentPayloadImage = selectedImage;
    const currentPayloadFile = selectedFile;

    // 3. Reset entry panels immediately for subsequent prompts
    prompt.value = "";
    prompt.rows = 1;
    if (typeof clearAttachedMedia === "function") clearAttachedMedia();
    if (typeof setRandomPlaceholder === "function") setRandomPlaceholder();

    // 4. Fire indicator block loader animation
    toggleThinkingIndicator(true);

    // 5. Mock API Delay Integration placeholder (Replace with your actual API endpoint pipeline in Part 4)
    setTimeout(() => {
        toggleThinkingIndicator(false);
        
        // Mock response fallback sequence
        let mockReply = "That's some interesting bullshit right there.";
        if (currentPayloadImage) {
            mockReply = "Yeah, I looked at that image. Smells like total bullshit to me.";
        }
        
        appendMessage("brice", mockReply);
    }, 1500);
}

/* =====================================================
   ADDITIONAL DOM BINDINGS
===================================================== */
document.addEventListener("DOMContentLoaded", () => {
    // Click triggers
    if (sendBtn) {
        sendBtn.addEventListener("click", handleSendMessage);
    }

    // Keyboard submit listeners inside textarea element (Enter triggers send, Shift+Enter breaks line)
    if (prompt) {
        prompt.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        });

        // Dynamic height growth adjustment utility hook
        prompt.addEventListener("input", function() {
            this.style.height = "auto";
            this.style.height = (this.scrollHeight) + "px";
        });
    }
});

// Change Part 3's plain UI injection call lines to this layout framework:
appendMessage("user", userText, selectedImage);
logMessageToActiveChat("user", userText, selectedImage); // Saves user message

// Inside your API/mock server delivery return handler statement closure area:
appendMessage("brice", mockReply);
logMessageToActiveChat("brice", mockReply); // Saves Brice's reply

/* =====================================================
   ASK BRICE
   PART 5 - SIDEBAR TRANSITIONS & LIVE API INTEGRATION
===================================================== */

/**
 * Handles sliding the responsive mobile history sidebar into view.
 */
function toggleSidebarLayout() {
    if (!sidebar) return;
    
    // Toggles a visible utility style state class. 
    // Assumes your style.css has rule: .sidebar.open { left: 0px; } or display: block;
    sidebar.classList.toggle("open");
    
    // Fallback inline styling safety filter rule if CSS stylesheet rules are missing
    if (sidebar.classList.contains("open")) {
        sidebar.style.transform = "translateX(0%)";
    } else {
        sidebar.style.transform = "translateX(-100%)";
    }
}

/**
 * Dispatches an asynchronous chat collection string array back to your host server API proxy.
 * @param {string} incomingPromptText - Raw content input written by user client
 * @param {string|null} base64MediaAttachment - Uploaded inline data URL image payload metadata
 */
async function processLiveBriceApiResponse(incomingPromptText, base64MediaAttachment) {
    // 1. Build an optimized contextual thread payload array to send over to the model endpoint pipeline
    const apiMessagePayload = [
        { role: SYSTEM_PROMPT.role, content: SYSTEM_PROMPT.content }
    ];

    // 2. Fetch past historical interaction data nodes tied to this specific chat log room context trace
    if (currentChat && currentChat.messages) {
        currentChat.messages.forEach(historyNode => {
            // Translate app's local user/brice identifiers into standard LLM role keys (user/assistant)
            const resolvedRoleKey = historyNode.sender === "user" ? "user" : "assistant";
            
            // Handle vision multi-modal schemas if media attachments are present
            if (historyNode.mediaData && resolvedRoleKey === "user") {
                apiMessagePayload.push({
                    role: resolvedRoleKey,
                    content: [
                        { type: "text", text: historyNode.text || "" },
                        { type: "image_url", image_url: { url: historyNode.mediaData } }
                    ]
                });
            } else {
                apiMessagePayload.push({
                    role: resolvedRoleKey,
                    content: historyNode.text
                });
            }
        });
    }

    try {
        // 3. Make the API network request call (Update the server address to match your project's backend routing)
        const serverEndpointResponse = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gpt-4o", // Or your preferred multi-modal language model engine name
                messages: apiMessagePayload,
                temperature: 0.85
            })
        });

        if (!serverEndpointResponse.ok) {
            throw new Error(`Server returned network interface protocol failure code: ${serverEndpointResponse.status}`);
        }

        const standardParsedJsonData = await serverEndpointResponse.json();
        
        // 4. Extract text response using common assistant payload path metrics
        const deepBriceAssistantOutputText = standardParsedJsonData.choices[0].message.content || "My bad. Something went wrong processing that shit.";
        
        // 5. Tear down loading visual spinner markers
        toggleThinkingIndicator(false);

        // 6. Print and commit final generated AI texts onto the local device storage system arrays
        appendMessage("brice", deepBriceAssistantOutputText);
        logMessageToActiveChat("brice", deepBriceAssistantOutputText);

    } catch (networkCommunicationError) {
        console.error("Critical error communicating with remote API routing processor:", networkCommunicationError);
        toggleThinkingIndicator(false);
        
        const runtimeErrorTextString = "Network dropped out or your API server broke down. Unfuck your connection settings and try again.";
        appendMessage("brice", runtimeErrorTextString);
        logMessageToActiveChat("brice", runtimeErrorTextString);
    }
}

/**
 * Overrides the temporary execution flow logic originally mapped inside Part 3 handleSendMessage
 */
function handleSendMessage() {
    if (!prompt) return;

    const userText = prompt.value.trim();
    if (!userText && !selectedFile) return;

    // 1. Visual updates and state caching
    appendMessage("user", userText, selectedImage);
    logMessageToActiveChat("user", userText, selectedImage);

    const currentPayloadText = userText;
    const currentPayloadImage = selectedImage;

    // 2. Clear input panel elements
    prompt.value = "";
    prompt.style.height = "auto"; 
    if (typeof clearAttachedMedia === "function") clearAttachedMedia();
    if (typeof setRandomPlaceholder === "function") setRandomPlaceholder();

    // 3. Render loading bubble string instance tracking elements onto client screen view port bounds
    toggleThinkingIndicator(true);

    // 4. Pass execution arguments directly into our live system fetch networking workflow logic loop
    processLiveBriceApiResponse(currentPayloadText, currentPayloadImage);
}

/* =====================================================
   CORE DOM CONTENT DISPATCH MOUNTING ROUTINES
===================================================== */
document.addEventListener("DOMContentLoaded", () => {
    // Connect click listener event wire triggers to responsive dashboard menu icon elements
    if (menuBtn) {
        menuBtn.addEventListener("click", toggleSidebarLayout);
    }

    // Automatically close mobile menu sidebar layout views when choosing history items from panel drawer lists
    if (historyList) {
        historyList.addEventListener("click", (event) => {
            if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains("open")) {
                toggleSidebarLayout();
            }
        });
    }
});

