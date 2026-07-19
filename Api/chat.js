export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: {
        message: "Method not allowed"
      }
    });
  }

  try {

    const { messages } = req.body;

    const contents = messages.map(msg => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: Array.isArray(msg.content)
        ? msg.content.map(part => {

            if (part.type === "text") {
              return {
                text: part.text
              };
            }

            if (part.type === "image_url") {

              return {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: part.image_url.url.split(",")[1]
                }
              };

            }

            return {
              text: ""
            };

        })
        : [{
            text: msg.content
        }]
    }));

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {

      return res.status(response.status).json({
        error: {
          message:
            data.error?.message || "Gemini API error"
        }
      });

    }

    return res.status(200).json({
      choices: [
        {
          message: {
            content:
              data.candidates?.[0]?.content?.parts?.[0]?.text ||
              "No response."
          }
        }
      ]
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
