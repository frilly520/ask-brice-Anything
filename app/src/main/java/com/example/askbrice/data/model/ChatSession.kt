package com.example.askbrice.data.model

data class ChatSession(
    val id: String = "chat_" + System.currentTimeMillis(),
    val title: String = "New Conversation",
    val messages: List<ChatMessage> = emptyList(),
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)
