package com.example.askbrice.data.network

import android.util.Log
import com.example.BuildConfig
import com.example.askbrice.data.model.BriceMode
import com.example.askbrice.data.model.ChatMessage
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit

class GeminiApiClient(
    private val getCustomApiKey: () -> String
) {
    companion object {
        private const val TAG = "GeminiApiClient"
        private const val MODEL_NAME = "gemini-2.5-flash"
    }

    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()

    fun getActiveApiKey(): String {
        val customKey = getCustomApiKey().trim()
        if (customKey.isNotEmpty()) return customKey

        return try {
            val buildConfigKey = BuildConfig.GEMINI_API_KEY.trim()
            if (buildConfigKey.isNotEmpty() && !buildConfigKey.equals("null", ignoreCase = true)) {
                buildConfigKey
            } else {
                ""
            }
        } catch (e: Exception) {
            ""
        }
    }

    fun hasApiKey(): Boolean {
        return getActiveApiKey().isNotEmpty()
    }

    suspend fun generateResponse(
        history: List<ChatMessage>,
        newPrompt: String,
        newImageBase64: String?,
        mode: BriceMode
    ): Result<String> = withContext(Dispatchers.IO) {
        val apiKey = getActiveApiKey()
        if (apiKey.isEmpty()) {
            return@withContext Result.failure(
                IllegalStateException(
                    "Missing Gemini API Key. Please add your GEMINI_API_KEY in the AI Studio Secrets panel or tap the ⚙️ Settings icon to enter it."
                )
            )
        }

        try {
            val url = "https://generativelanguage.googleapis.com/v1beta/models/$MODEL_NAME:generateContent?key=$apiKey"

            val rootJson = JSONObject()

            // System instructions
            val systemInstruction = JSONObject()
            val systemParts = JSONArray()
            val systemTextPart = JSONObject()
            systemTextPart.put("text", mode.systemModifier)
            systemParts.put(systemTextPart)
            systemInstruction.put("parts", systemParts)
            rootJson.put("system_instruction", systemInstruction)

            // Contents array
            val contentsArray = JSONArray()

            // Map previous messages
            for (msg in history.takeLast(10)) {
                if (msg.isError) continue
                val contentObj = JSONObject()
                contentObj.put("role", if (msg.sender == "user") "user" else "model")

                val partsArray = JSONArray()
                if (msg.imageBase64 != null) {
                    val imagePart = JSONObject()
                    val inlineData = JSONObject()
                    inlineData.put("mime_type", "image/jpeg")
                    inlineData.put("data", msg.imageBase64)
                    imagePart.put("inline_data", inlineData)
                    partsArray.put(imagePart)
                }

                if (msg.text.isNotBlank()) {
                    val textPart = JSONObject()
                    textPart.put("text", msg.text)
                    partsArray.put(textPart)
                }

                if (partsArray.length() > 0) {
                    contentObj.put("parts", partsArray)
                    contentsArray.put(contentObj)
                }
            }

            // Current message
            val currentContent = JSONObject()
            currentContent.put("role", "user")
            val currentParts = JSONArray()

            if (newImageBase64 != null) {
                val imagePart = JSONObject()
                val inlineData = JSONObject()
                inlineData.put("mime_type", "image/jpeg")
                inlineData.put("data", newImageBase64)
                imagePart.put("inline_data", inlineData)
                currentParts.put(imagePart)
            }

            val currentTextPart = JSONObject()
            currentTextPart.put("text", newPrompt.ifBlank { "What do you think of this image?" })
            currentParts.put(currentTextPart)

            currentContent.put("parts", currentParts)
            contentsArray.put(currentContent)

            rootJson.put("contents", contentsArray)

            val mediaType = "application/json; charset=utf-8".toMediaType()
            val requestBody = rootJson.toString().toRequestBody(mediaType)

            val request = Request.Builder()
                .url(url)
                .post(requestBody)
                .build()

            client.newCall(request).execute().use { response ->
                val bodyString = response.body?.string().orEmpty()
                if (!response.isSuccessful) {
                    val errorMsg = try {
                        val errorJson = JSONObject(bodyString)
                        errorJson.optJSONObject("error")?.optString("message")
                            ?: "HTTP ${response.code}: ${response.message}"
                    } catch (e: Exception) {
                        "HTTP ${response.code}: ${response.message}"
                    }
                    Log.e(TAG, "Gemini API error: $errorMsg")
                    return@withContext Result.failure(Exception(errorMsg))
                }

                val responseJson = JSONObject(bodyString)
                val candidates = responseJson.optJSONArray("candidates")
                if (candidates != null && candidates.length() > 0) {
                    val firstCandidate = candidates.getJSONObject(0)
                    val content = firstCandidate.optJSONObject("content")
                    val parts = content?.optJSONArray("parts")
                    if (parts != null && parts.length() > 0) {
                        val reply = parts.getJSONObject(0).optString("text", "")
                        if (reply.isNotBlank()) {
                            return@withContext Result.success(reply)
                        }
                    }
                }
                Result.failure(Exception("Brice remained silent. Model returned an empty response."))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Request failed", e)
            Result.failure(e)
        }
    }
}
