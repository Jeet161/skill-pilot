import { NextRequest, NextResponse } from "next/server";
import { callGroq } from "@/lib/ai/groq";
import { callFeatherless } from "@/lib/ai/featherless";

export async function POST(req: NextRequest) {
  try {
    const { subject, topic, messages } = await req.json();
    if (!subject || !messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const systemPrompt = `You are a friendly, expert AI Tutor in ${subject} on the learning platform SkillPilot.
The user is studying the topic/resource: "${topic || subject}".
Your goal is to guide the user, explain concepts clearly, provide clean code snippets (in markdown blocks) where appropriate, and answer any technical questions.
Keep your explanations engaging, accurate, and concise. Don't be overly verbose, and ensure your code is correct and follows best practices.`;

    const chatMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.slice(-10).map((m: any) => ({
        role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
        content: m.content,
      })),
    ];

    let result;
    try {
      result = await callGroq({
        tier: "reasoning",
        messages: chatMessages,
        temperature: 0.7,
        maxTokens: 1500,
      });
    } catch (err) {
      console.warn("[Chat API] Groq call failed, trying Featherless fallback...", err);
      result = await callFeatherless({
        tier: "reasoning",
        messages: chatMessages,
        temperature: 0.7,
        maxTokens: 1500,
      });
    }

    const cleanResponse = result.raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
    return NextResponse.json({ response: cleanResponse });
  } catch (error: any) {
    console.error("[Chat API Error]", error);
    return NextResponse.json({ error: error.message || "Failed to generate response" }, { status: 500 });
  }
}
