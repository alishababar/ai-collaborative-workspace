import Anthropic from "@anthropic-ai/sdk";
import type { AIAnalyzeResponse, CanvasNode, ChatMessage } from "./types";

const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL || "http://localhost:11434";

const OLLAMA_MODEL =
  process.env.OLLAMA_MODEL || "llama3.2";

type Provider = "anthropic" | "ollama";

function activeProvider(): Provider {
  return process.env.ANTHROPIC_API_KEY ? "anthropic" : "ollama";
}

const SYSTEM_PROMPT = `
You are the AI visual-thinking assistant inside a collaborative team workspace.

Your job is to listen to a team's conversation and turn meaningful information into
useful visual nodes on a shared canvas.

The canvas represents the team's thinking.

IMPORTANT:
- Do NOT simply repeat the user's message.
- Extract the important idea, decision, task, question, or note from what was said.
- Create nodes only when something meaningful can be represented visually.
- Prefer 1-3 useful nodes per message.
- Keep node text short, clear, and actionable.
- Do not invent information that wasn't discussed.
- Avoid creating duplicate nodes when the same idea already exists.
- Use existing node IDs when connecting to existing nodes.

Node kinds:
- idea: proposals, suggestions, concepts
- decision: something the team agreed on
- task: an action someone needs to complete
- question: something that needs an answer
- note: useful context or information

Examples:

User:
"We should redesign the onboarding flow."

Return:
{
  "summary": "Added an idea for redesigning the onboarding flow.",
  "ops": [
    {
      "op": "add_node",
      "id": "n1",
      "kind": "idea",
      "text": "Redesign onboarding flow"
    }
  ]
}

User:
"Sarah can own the redesign by Friday."

Return:
{
  "summary": "Added Sarah's onboarding redesign task.",
  "ops": [
    {
      "op": "add_node",
      "id": "n1",
      "kind": "task",
      "text": "Sarah: redesign onboarding by Friday"
    }
  ]
}

User:
"Do we need legal approval before changing signup?"

Return:
{
  "summary": "Added a question about legal approval.",
  "ops": [
    {
      "op": "add_node",
      "id": "n1",
      "kind": "question",
      "text": "Need legal approval for signup changes?"
    }
  ]
}

User:
"We decided to launch next month."

Return:
{
  "summary": "Added the launch decision.",
  "ops": [
    {
      "op": "add_node",
      "id": "n1",
      "kind": "decision",
      "text": "Launch next month"
    }
  ]
}

When appropriate, connect related new nodes with add_edge.

For new nodes connected together, use temporary IDs such as n1, n2.

Return ONLY valid JSON.
Never return markdown.
Never return explanations outside the JSON.

Required format:

{
  "summary": "short description",
  "ops": [
    {
      "op": "add_node",
      "id": "n1",
      "kind": "idea|decision|task|question|note",
      "text": "short text"
    },
    {
      "op": "add_edge",
      "source": "n1",
      "target": "existing-or-new-id",
      "label": "optional relationship"
    }
  ]
}

If there is nothing meaningful to add:

{
  "summary": "Nothing new to add yet.",
  "ops": []
}
`;

function buildBoardContext(nodes: CanvasNode[]): string {
  if (nodes.length === 0) {
    return "The board is currently empty.";
  }

  const lines = nodes
    .slice(-40)
    .map((n) => `- [${n.id}] (${n.kind}) ${n.text}`)
    .join("\n");

  return `Current board nodes:\n${lines}`;
}

function extractJson(raw: string): AIAnalyzeResponse {
  const cleaned = raw
    .replace(/^```json/i, "")
    .replace(/^```/, "")
    .replace(/```$/, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1) {
    throw new Error("AI did not return JSON");
  }

  const candidate = cleaned.slice(start, end + 1);
  const parsed = JSON.parse(candidate);

  if (!parsed || !Array.isArray(parsed.ops)) {
    throw new Error("Malformed AI response");
  }

  return {
    summary:
      typeof parsed.summary === "string"
        ? parsed.summary
        : "AI updated the workspace.",
    ops: parsed.ops
  };
}

async function callAnthropic(
  userPrompt: string
): Promise<AIAnalyzeResponse> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: userPrompt
      }
    ]
  });

  const textBlock = response.content.find(
    (block) => block.type === "text"
  );

  if (!textBlock || textBlock.type !== "text") {
    return {
      summary: "AI returned no content.",
      ops: []
    };
  }

  return extractJson(textBlock.text);
}

async function callOllama(
  userPrompt: string
): Promise<AIAnalyzeResponse> {
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        format: "json",
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT
          },
          {
            role: "user",
            content: userPrompt
          }
        ]
      })
    });

    if (!res.ok) {
      throw new Error(`Ollama HTTP ${res.status}`);
    }

    const data = await res.json();
    const content = data?.message?.content ?? "";

    if (!content) {
      throw new Error("Ollama returned no content");
    }

    return extractJson(content);
  } catch (error) {
    console.error("Ollama error:", error);

    return {
      summary:
        `Ollama is unavailable at ${OLLAMA_BASE_URL}. ` +
        `Make sure Ollama is running with ${OLLAMA_MODEL}.`,
      ops: []
    };
  }
}

async function complete(
  userPrompt: string
): Promise<AIAnalyzeResponse> {
  try {
    if (activeProvider() === "anthropic") {
      return await callAnthropic(userPrompt);
    }

    return await callOllama(userPrompt);
  } catch (error) {
    console.error("AI call failed:", error);

    return {
      summary: "AI could not process that message. Please try again.",
      ops: []
    };
  }
}

export async function analyzeTranscript(
  transcript: ChatMessage[],
  boardNodes: CanvasNode[]
): Promise<AIAnalyzeResponse> {
  const transcriptText = transcript
    .map((message) => `${message.author}: ${message.text}`)
    .join("\n");

  return complete(
    `${buildBoardContext(boardNodes)}

Recent team conversation:
${transcriptText}

Analyze the conversation and identify the most meaningful new information
that should become visual elements on the shared canvas.

Create useful idea, decision, task, question, or note nodes.
Do not merely repeat the conversation.
Avoid duplicates.`
  );
}

export async function runCommand(
  instruction: string,
  boardNodes: CanvasNode[]
): Promise<AIAnalyzeResponse> {
  return complete(
    `${buildBoardContext(boardNodes)}

Direct instruction from a team member:
"${instruction}"

Follow this instruction and modify the shared visual workspace using
appropriate canvas operations.

Examples:
- "connect related ideas" → add meaningful edges
- "turn open questions into tasks" → update or create appropriate task nodes
- "group tasks by owner" → reorganize/update relevant nodes
- "summarize the discussion" → create concise summary nodes
- "create a task for Sarah to test onboarding" → create a task node

Carry out the instruction rather than simply repeating it.`
  );
}