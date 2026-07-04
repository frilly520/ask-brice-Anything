export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: {
        message: "Method Not Allowed"
      }
    });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({
      error: {
        message: "GROQ_API_KEY is not configured."
      }
    });
  }

  try {

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(req.body)
      }
    );

    const data = await response.json();

    return res.status(response.status).json(data);

  } catch (error) {

    console.error("Groq API Error:", error);

    return res.status(500).json({
      error: {
        message: "Internal Server Error",
        details: error.message
      }
    });

  }

}
