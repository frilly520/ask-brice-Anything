package com.example.askbrice.data.repository

import android.content.Context
import android.content.SharedPreferences
import com.example.askbrice.data.model.BriceMode
import com.example.askbrice.data.model.ChatMessage
import com.example.askbrice.data.model.ChatSession
import org.json.JSONArray
import org.json.JSONObject

class ChatRepository(context: Context) {
    private val prefs: SharedPreferences =
        context.getSharedPreferences("ask_brice_prefs", Context.MODE_PRIVATE)

    companion object {
        private const val KEY_CHATS = "chats_json"
        private const val KEY_ACTIVE_CHAT_ID = "active_chat_id"
        private const val KEY_CUSTOM_API_KEY = "custom_gemini_api_key"
        private const val KEY_BRICE_MODE = "brice_mode"
    }

    fun getChats(): List<ChatSession> {
        val jsonStr = prefs.getString(KEY_CHATS, null) ?: return emptyList()
        return try {
            val jsonArray = JSONArray(jsonStr)
            val list = mutableListOf<ChatSession>()
            for (i in 0 until jsonArray.length()) {
                val obj = jsonArray.getJSONObject(i)
                val messagesArray = obj.optJSONArray("messages") ?: JSONArray()
                val messages = mutableListOf<ChatMessage>()
                for (j in 0 until messagesArray.length()) {
                    val mObj = messagesArray.getJSONObject(j)
                    messages.add(
                        ChatMessage(
                            id = mObj.optString("id", java.util.UUID.randomUUID().toString()),
                            sender = mObj.optString("sender", "user"),
                            text = mObj.optString("text", ""),
                            imageBase64 = if (mObj.has("imageBase64")) mObj.optString("imageBase64") else null,
                            imageUri = if (mObj.has("imageUri")) mObj.optString("imageUri") else null,
                            timestamp = mObj.optLong("timestamp", System.currentTimeMillis()),
                            isError = mObj.optBoolean("isError", false)
                        )
                    )
                }
                list.add(
                    ChatSession(
                        id = obj.optString("id", "chat_" + System.currentTimeMillis()),
                        title = obj.optString("title", "New Conversation"),
                        messages = messages,
                        createdAt = obj.optLong("createdAt", System.currentTimeMillis()),
                        updatedAt = obj.optLong("updatedAt", System.currentTimeMillis())
                    )
                )
            }
            list
        } catch (e: Exception) {
            emptyList()
        }
    }

    fun saveChats(chats: List<ChatSession>) {
        try {
            val jsonArray = JSONArray()
            for (chat in chats) {
                val obj = JSONObject()
                obj.put("id", chat.id)
                obj.put("title", chat.title)
                obj.put("createdAt", chat.createdAt)
                obj.put("updatedAt", chat.updatedAt)

                val messagesArray = JSONArray()
                for (msg in chat.messages) {
                    val mObj = JSONObject()
                    mObj.put("id", msg.id)
                    mObj.put("sender", msg.sender)
                    mObj.put("text", msg.text)
                    if (msg.imageBase64 != null) mObj.put("imageBase64", msg.imageBase64)
                    if (msg.imageUri != null) mObj.put("imageUri", msg.imageUri)
                    mObj.put("timestamp", msg.timestamp)
                    mObj.put("isError", msg.isError)
                    messagesArray.put(mObj)
                }
                obj.put("messages", messagesArray)
                jsonArray.put(obj)
            }
            prefs.edit().putString(KEY_CHATS, jsonArray.toString()).apply()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun getActiveChatId(): String? {
        return prefs.getString(KEY_ACTIVE_CHAT_ID, null)
    }

    fun setActiveChatId(id: String?) {
        prefs.edit().putString(KEY_ACTIVE_CHAT_ID, id).apply()
    }

    fun getCustomApiKey(): String {
        return prefs.getString(KEY_CUSTOM_API_KEY, "") ?: ""
    }

    fun setCustomApiKey(key: String) {
        prefs.edit().putString(KEY_CUSTOM_API_KEY, key.trim()).apply()
    }

    fun getBriceMode(): BriceMode {
        val name = prefs.getString(KEY_BRICE_MODE, BriceMode.UNFILTERED.name)
        return try {
            BriceMode.valueOf(name ?: BriceMode.UNFILTERED.name)
        } catch (e: Exception) {
            BriceMode.UNFILTERED
        }
    }

    fun setBriceMode(mode: BriceMode) {
        prefs.edit().putString(KEY_BRICE_MODE, mode.name).apply()
    }
}
