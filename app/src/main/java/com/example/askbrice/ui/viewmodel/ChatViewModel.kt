package com.example.askbrice.ui.viewmodel

import android.app.Application
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.util.Base64
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.askbrice.data.model.BriceMode
import com.example.askbrice.data.model.ChatMessage
import com.example.askbrice.data.model.ChatSession
import com.example.askbrice.data.network.GeminiApiClient
import com.example.askbrice.data.repository.ChatRepository
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.io.ByteArrayOutputStream
import java.io.InputStream
import kotlin.random.Random

data class ChatUiState(
    val chats: List<ChatSession> = emptyList(),
    val currentChat: ChatSession? = null,
    val searchQuery: String = "",
    val isThinking: Boolean = false,
    val thinkingMessage: String = "Processing your bullshit...",
    val placeholderText: String = "What's on your mind?",
    val selectedImageBase64: String? = null,
    val selectedImageUri: String? = null,
    val inputText: String = "",
    val briceMode: BriceMode = BriceMode.UNFILTERED,
    val hasApiKey: Boolean = false,
    val customApiKey: String = "",
    val isSpeechListening: Boolean = false,
    val errorMessage: String? = null
)

class ChatViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = ChatRepository(application.applicationContext)
    private val apiClient = GeminiApiClient { repository.getCustomApiKey() }

    private val _uiState = MutableStateFlow(ChatUiState())
    val uiState: StateFlow<ChatUiState> = _uiState.asStateFlow()

    private var thinkingJob: Job? = null

    private val placeholders = listOf(
        "What's on your mind?",
        "Hit me with it.",
        "What's your bullshit today?",
        "The Fuck you want?",
        "What did you fuck up now?",
        "What's broken now?"
    )

    private val thinkingMessages = listOf(
        "Rolling my eyes...",
        "Trying to care...",
        "Hold your horses...",
        "Processing your bullshit...",
        "Calculating how dumb this is..."
    )

    init {
        loadInitialData()
    }

    private fun loadInitialData() {
        val storedChats = repository.getChats().toMutableList()
        val activeChatId = repository.getActiveChatId()
        val mode = repository.getBriceMode()
        val customKey = repository.getCustomApiKey()

        var currentChat = storedChats.find { it.id == activeChatId }
        if (currentChat == null) {
            if (storedChats.isEmpty()) {
                val newChat = ChatSession()
                storedChats.add(0, newChat)
                repository.saveChats(storedChats)
                repository.setActiveChatId(newChat.id)
                currentChat = newChat
            } else {
                currentChat = storedChats.first()
                repository.setActiveChatId(currentChat.id)
            }
        }

        _uiState.update {
            it.copy(
                chats = storedChats,
                currentChat = currentChat,
                briceMode = mode,
                hasApiKey = apiClient.hasApiKey(),
                customApiKey = customKey,
                placeholderText = getRandomPlaceholder()
            )
        }
    }

    private fun getRandomPlaceholder(): String {
        return placeholders[Random.nextInt(placeholders.size)]
    }

    private fun getRandomThinkingMessage(): String {
        return thinkingMessages[Random.nextInt(thinkingMessages.size)]
    }

    fun updateInputText(text: String) {
        _uiState.update { it.copy(inputText = text) }
    }

    fun updateSearchQuery(query: String) {
        _uiState.update { it.copy(searchQuery = query) }
    }

    fun setSpeechListening(isListening: Boolean) {
        _uiState.update { it.copy(isSpeechListening = isListening) }
    }

    fun onSpeechRecognized(text: String) {
        val current = _uiState.value.inputText
        val newText = if (current.isBlank()) text else "$current $text"
        _uiState.update { it.copy(inputText = newText, isSpeechListening = false) }
    }

    fun selectChat(chatId: String) {
        val selected = _uiState.value.chats.find { it.id == chatId } ?: return
        repository.setActiveChatId(selected.id)
        _uiState.update {
            it.copy(
                currentChat = selected,
                inputText = "",
                selectedImageBase64 = null,
                selectedImageUri = null,
                errorMessage = null,
                placeholderText = getRandomPlaceholder()
            )
        }
    }

    fun createNewChat() {
        val newChat = ChatSession(
            title = "Conversation #${_uiState.value.chats.size + 1}"
        )
        val updated = listOf(newChat) + _uiState.value.chats
        repository.saveChats(updated)
        repository.setActiveChatId(newChat.id)
        _uiState.update {
            it.copy(
                chats = updated,
                currentChat = newChat,
                inputText = "",
                selectedImageBase64 = null,
                selectedImageUri = null,
                errorMessage = null,
                placeholderText = getRandomPlaceholder()
            )
        }
    }

    fun deleteChat(chatId: String) {
        val filtered = _uiState.value.chats.filter { it.id != chatId }
        val updated = if (filtered.isEmpty()) {
            val fresh = ChatSession()
            listOf(fresh)
        } else {
            filtered
        }
        val nextCurrent = if (_uiState.value.currentChat?.id == chatId) {
            updated.first()
        } else {
            _uiState.value.currentChat ?: updated.first()
        }

        repository.saveChats(updated)
        repository.setActiveChatId(nextCurrent.id)
        _uiState.update {
            it.copy(
                chats = updated,
                currentChat = nextCurrent
            )
        }
    }

    fun clearAllChats() {
        val fresh = ChatSession(title = "New Conversation")
        val updated = listOf(fresh)
        repository.saveChats(updated)
        repository.setActiveChatId(fresh.id)
        _uiState.update {
            it.copy(
                chats = updated,
                currentChat = fresh,
                inputText = "",
                selectedImageBase64 = null,
                selectedImageUri = null,
                errorMessage = null
            )
        }
    }

    fun setImageAttachment(context: Context, uri: Uri) {
        viewModelScope.launch {
            try {
                val base64 = encodeUriToBase64(context, uri)
                _uiState.update {
                    it.copy(
                        selectedImageUri = uri.toString(),
                        selectedImageBase64 = base64
                    )
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(errorMessage = "Failed to load image: ${e.localizedMessage}") }
            }
        }
    }

    fun clearAttachment() {
        _uiState.update {
            it.copy(
                selectedImageUri = null,
                selectedImageBase64 = null
            )
        }
    }

    fun setBriceMode(mode: BriceMode) {
        repository.setBriceMode(mode)
        _uiState.update { it.copy(briceMode = mode) }
    }

    fun saveCustomApiKey(key: String) {
        repository.setCustomApiKey(key)
        _uiState.update {
            it.copy(
                customApiKey = key,
                hasApiKey = apiClient.hasApiKey(),
                errorMessage = null
            )
        }
    }

    fun clearErrorMessage() {
        _uiState.update { it.copy(errorMessage = null) }
    }

    fun sendMessage(customPrompt: String? = null) {
        val prompt = customPrompt ?: _uiState.value.inputText.trim()
        val imageBase64 = _uiState.value.selectedImageBase64
        val imageUri = _uiState.value.selectedImageUri

        if (prompt.isBlank() && imageBase64 == null) return

        val current = _uiState.value.currentChat ?: return

        val userMessage = ChatMessage(
            sender = "user",
            text = prompt,
            imageBase64 = imageBase64,
            imageUri = imageUri
        )

        val updatedMessages = current.messages + userMessage
        val newTitle = if (current.messages.isEmpty() && prompt.isNotBlank()) {
            if (prompt.length > 22) prompt.take(20) + "..." else prompt
        } else {
            current.title
        }

        val updatedChat = current.copy(
            title = newTitle,
            messages = updatedMessages,
            updatedAt = System.currentTimeMillis()
        )

        val allChats = _uiState.value.chats.map {
            if (it.id == updatedChat.id) updatedChat else it
        }

        repository.saveChats(allChats)

        _uiState.update {
            it.copy(
                chats = allChats,
                currentChat = updatedChat,
                inputText = "",
                selectedImageBase64 = null,
                selectedImageUri = null,
                isThinking = true,
                thinkingMessage = getRandomThinkingMessage(),
                placeholderText = getRandomPlaceholder(),
                errorMessage = null
            )
        }

        // Cycle thinking messages
        thinkingJob?.cancel()
        thinkingJob = viewModelScope.launch {
            while (isActive) {
                delay(2400)
                _uiState.update { it.copy(thinkingMessage = getRandomThinkingMessage()) }
            }
        }

        // Call Gemini
        viewModelScope.launch {
            val result = apiClient.generateResponse(
                history = updatedMessages,
                newPrompt = prompt,
                newImageBase64 = imageBase64,
                mode = _uiState.value.briceMode
            )

            thinkingJob?.cancel()

            result.onSuccess { replyText ->
                val botMessage = ChatMessage(
                    sender = "assistant",
                    text = replyText
                )
                val finalMessages = updatedMessages + botMessage
                val finalChat = updatedChat.copy(
                    messages = finalMessages,
                    updatedAt = System.currentTimeMillis()
                )
                val finalChats = _uiState.value.chats.map {
                    if (it.id == finalChat.id) finalChat else it
                }
                repository.saveChats(finalChats)

                _uiState.update {
                    it.copy(
                        chats = finalChats,
                        currentChat = finalChat,
                        isThinking = false
                    )
                }
            }.onFailure { error ->
                val errorText = error.localizedMessage ?: "API Error. Brice refused to answer."
                val errorMsg = ChatMessage(
                    sender = "assistant",
                    text = "⚠️ $errorText",
                    isError = true
                )
                val finalMessages = updatedMessages + errorMsg
                val finalChat = updatedChat.copy(
                    messages = finalMessages,
                    updatedAt = System.currentTimeMillis()
                )
                val finalChats = _uiState.value.chats.map {
                    if (it.id == finalChat.id) finalChat else it
                }
                repository.saveChats(finalChats)

                _uiState.update {
                    it.copy(
                        chats = finalChats,
                        currentChat = finalChat,
                        isThinking = false,
                        errorMessage = errorText
                    )
                }
            }
        }
    }

    private fun encodeUriToBase64(context: Context, uri: Uri): String {
        var inputStream: InputStream? = null
        try {
            inputStream = context.contentResolver.openInputStream(uri)
            val originalBitmap = BitmapFactory.decodeStream(inputStream)
                ?: throw IllegalArgumentException("Could not decode image")

            // Scale bitmap down to max 1024x1024 for speed & under payload limits
            val maxDimension = 1024
            val width = originalBitmap.width
            val height = originalBitmap.height
            val scale = if (width > maxDimension || height > maxDimension) {
                val ratio = width.toFloat() / height.toFloat()
                if (ratio > 1) {
                    Pair(maxDimension, (maxDimension / ratio).toInt())
                } else {
                    Pair((maxDimension * ratio).toInt(), maxDimension)
                }
            } else {
                Pair(width, height)
            }

            val scaledBitmap = if (scale.first != width || scale.second != height) {
                Bitmap.createScaledBitmap(originalBitmap, scale.first, scale.second, true)
            } else {
                originalBitmap
            }

            val outputStream = ByteArrayOutputStream()
            scaledBitmap.compress(Bitmap.CompressFormat.JPEG, 85, outputStream)
            val bytes = outputStream.toByteArray()
            return Base64.encodeToString(bytes, Base64.NO_WRAP)
        } finally {
            inputStream?.close()
        }
    }
}
