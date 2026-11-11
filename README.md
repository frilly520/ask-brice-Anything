# Ask Brice (Android)

**Ask Brice** is a cold, ruthless, and brutally honest AI assistant and "bullshit detector", completely rewritten for native Android using Kotlin and Jetpack Compose.

## Features

- **Brice AI Persona**: Direct, sarcastic, unfiltered truth teller that cuts through excuses and calls out nonsense immediately.
- **Multimodal Support**: Attach images from the camera or photo gallery for brutal visual critiques and analysis.
- **Voice Input**: Integrated speech-to-text with microphone support to dictate questions directly to Brice.
- **Persistent Chat History**: Full multi-conversation thread manager with search, new chat creation, individual thread deletion, and complete chat clearing.
- **Reality Check Starters**: Quick-action prompt chips for instant feedback on business ideas, excuses, conflict resolutions, and resume critiques.
- **Customizable Brutality Levels**:
  - *Unfiltered Gangster*: Raw, profanity-laced, ruthless truth.
  - *Tough Love*: Firm, direct, constructive feedback.
  - *Sarcastic & Witty*: Sharp dry humor, eye-rolling observations, and cynical realism.
- **Dynamic UX**: Animated typing indicators ("Rolling my eyes...", "Processing your bullshit..."), rotating input placeholders, haptic vibration feedback, and custom adaptive bull launcher icon.
- **Gemini API Integration**: Powered by Google's Gemini models with configurable API keys via the Secrets panel or in-app settings.

## Tech Stack

- **Platform**: Android (minSdk 26, targetSdk 36)
- **UI Framework**: Jetpack Compose (Material Design 3)
- **Language**: Kotlin 2.2
- **Networking**: OkHttp
- **Image Loading**: Coil Compose
- **Design**: Sleek dark mode palette (`#0D0D0D`, `#FF3B30`, `#D4AF37`) with custom adaptive launcher icon.
