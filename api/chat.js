export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: {
        message: "Method not allowed"
      }
    });
  }

  try {
    const { messages, model = "gemini-2.5-flash", systemInstruction, customApiKey } = req.body;
    const apiKey = customApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(401).json({
        error: {
          message: "Missing Gemini API Key. Please provide your API key in settings or AI Studio Secrets."
        }
      });
    }

    const contents = messages.map(msg => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: Array.isArray(msg.content)
        ? msg.content.map(part => {
            if (part.type === "text") {
              return { text: part.text };
            }
            if (part.type === "image_url") {
              return {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: part.image_url.url.includes(",") 
                    ? part.image_url.url.split(",")[1] 
                    : part.image_url.url
                }
              };
            }
            return { text: "" };
          })
        : [{ text: msg.content }]
    }));

    const payload = { contents };
    if (systemInstruction) {
      payload.system_instruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: {
          message: data.error?.message || "Gemini API error"
        }
      });
    }

    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Brice remained silent.";

    return res.status(200).json({
      choices: {
        message: {
          content: replyText
        }
      }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: {
        message: err.message
      }
    });
  }
}
