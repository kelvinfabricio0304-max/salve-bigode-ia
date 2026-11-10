export default async (request) => {
  if (request.method !== "POST") {
    return Response.json(
      { error: "Método não permitido." },
      { status: 405 }
    );
  }

  const API_KEY = process.env.AI_API_KEY;
  const BASE_URL =
    process.env.AI_BASE_URL || "https://api.openai.com/v1";
  const MODEL = process.env.AI_MODEL;

  if (!API_KEY || !MODEL) {
    return Response.json(
      { error: "A inteligência artificial ainda não foi configurada." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return Response.json(
        { error: "Envie uma mensagem válida." },
        { status: 400 }
      );
    }

    if (body.messages.length > 20) {
      return Response.json(
        { error: "Limite de mensagens excedido." },
        { status: 400 }
      );
    }

    const messages = body.messages
      .filter(m =>
        ["user", "assistant"].includes(m.role) &&
        typeof m.content === "string"
      )
      .map(m => ({
        role: m.role,
        content: m.content.slice(0, 8000)
      }));

    const response = await fetch(
      `${BASE_URL.replace(/\/+$/, "")}/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: MODEL,
          messages,
          temperature: 0.7,
          max_tokens: 1000
        })
      }
    );

    if (!response.ok) {
      return Response.json(
        { error: "O provedor de IA não conseguiu responder." },
        { status: 502 }
      );
    }

    const data = await response.json();

    return Response.json({
      reply: data.choices?.[0]?.message?.content ||
        "Não consegui gerar uma resposta."
    });

  } catch {
    return Response.json(
      { error: "Erro ao processar sua mensagem." },
      { status: 500 }
    );
  }
};