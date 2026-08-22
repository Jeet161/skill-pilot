import { NextRequest, NextResponse } from "next/server";
import { callGroq } from "@/lib/ai/groq";
import { callFeatherless } from "@/lib/ai/featherless";

export async function POST(req: NextRequest) {
  try {
    const { subject, topic } = await req.json();
    if (!subject || !topic) {
      return NextResponse.json({ error: "Missing subject or topic" }, { status: 400 });
    }

    const systemPrompt = `You are a curriculum designer and senior engineer.
Generate a structured study guide for the topic/resource: "${topic}" under the subject "${subject}".
Include:
1. An overview of what this topic/resource covers (2-3 sentences).
2. Key learning objectives / core concepts (bullet points, explain each briefly).
3. A short, high-quality, practical code/configuration example or conceptual demonstration of a fundamental concept from this topic (complete with explanation).
4. Recommended study roadmap/next steps for mastering this topic.

Keep the tone highly professional, clean, and educational. Format with beautiful Markdown headings and code blocks.`;

    let result;
    try {
      result = await callGroq({
        tier: "reasoning",
        messages: [
          { role: "system" as const, content: systemPrompt },
          { role: "user" as const, content: `Generate a study guide for ${topic} (${subject}).` }
        ],
        temperature: 0.5,
        maxTokens: 1800,
      });
    } catch (err) {
      console.warn("[Guide API] Groq call failed, trying Featherless fallback...", err);
      result = await callFeatherless({
        tier: "reasoning",
        messages: [
          { role: "system" as const, content: systemPrompt },
          { role: "user" as const, content: `Generate a study guide for ${topic} (${subject}).` }
        ],
        temperature: 0.5,
        maxTokens: 1800,
      });
    }

    const cleanGuide = result.raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
    return NextResponse.json({ guide: cleanGuide });
  } catch (error: any) {
    console.error("[Guide API Error]", error);
    return NextResponse.json({ error: error.message || "Failed to generate study guide" }, { status: 500 });
  }
}
