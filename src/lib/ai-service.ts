import { Provider, SYSTEM_PROMPT } from "./ai-config";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export async function streamChatService(
  messages: Message[],
  provider: Provider,
  blueprintText: string,
  onChunk: (content: string) => void
) {
  let url = "";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  let body: unknown = {};

  // Prepare request based on provider type
  if (provider.name === 'OpenAI' || provider.name === 'OpenRouter') {
    url = `${provider.baseUrl}/chat/completions`;
    headers["Authorization"] = `Bearer ${provider.apiKey}`;
    if (provider.name === 'OpenRouter') {
      headers["HTTP-Referer"] = window.location.origin;
      headers["X-Title"] = "Blueprint AI Studio";
    }
    
    body = {
      model: provider.model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.map(m => ({ role: m.role, content: m.content })),
        ...(blueprintText ? [{ role: "user", content: `Current Blueprint Context:\n\`\`\`\n${blueprintText}\n\`\`\`` }] : [])
      ],
      stream: true
    };
  } else if (provider.name === 'Anthropic') {
    url = `${provider.baseUrl}/messages`;
    headers["x-api-key"] = provider.apiKey;
    headers["anthropic-version"] = "2023-06-01";
    headers["anthropic-dangerous-direct-browser-access"] = "true";

    body = {
      model: provider.model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      system: SYSTEM_PROMPT + (blueprintText ? `\n\nCurrent Blueprint Context:\n${blueprintText}` : ""),
      max_tokens: 4096,
      stream: true
    };
  } else if (provider.name === 'Google') {
    url = `${provider.baseUrl}/models/${provider.model}:streamGenerateContent?key=${provider.apiKey}`;
    
    const contents = messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));
    
    if (blueprintText) {
      contents.push({
        role: 'user',
        parts: [{ text: `Current Blueprint Context:\n${blueprintText}` }]
      });
    }

    body = {
      contents: contents,
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }]
      }
    };
  }

  const resp = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`API Error: ${resp.status} ${resp.statusText} - ${errText}`);
  }

  if (!resp.body) throw new Error("No response body");

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      if (buffer.trim()) {
        // Try to process remaining buffer
        if (provider.name === 'Google') {
             // Last ditch effort for Google
             try {
                 const parsed = JSON.parse(buffer);
                 const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                 if (text) onChunk(text);
             } catch(e) {}
        } else {
             processChunk(buffer, provider.name, onChunk);
        }
      }
      break;
    }
    
    buffer += decoder.decode(value, { stream: true });
    
    if (provider.name === 'Google') {
        // Google JSON Stream Parsing
        let braceCount = 0;
        let startIndex = -1;
        let lastProcessedIndex = -1;
        
        for (let i = 0; i < buffer.length; i++) {
            if (buffer[i] === '{') {
                if (braceCount === 0) startIndex = i;
                braceCount++;
            } else if (buffer[i] === '}') {
                braceCount--;
                if (braceCount === 0 && startIndex !== -1) {
                    // Found a potential object
                    const jsonStr = buffer.substring(startIndex, i + 1);
                    try {
                        const parsed = JSON.parse(jsonStr);
                        const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (text) onChunk(text);
                        lastProcessedIndex = i;
                        startIndex = -1;
                    } catch (e) {
                        // Not a valid JSON object yet
                    }
                }
            }
        }
        
        if (lastProcessedIndex !== -1) {
            buffer = buffer.substring(lastProcessedIndex + 1);
        }
    } else {
        // Line-based SSE (OpenAI, Anthropic)
        const lines = buffer.split('\n');
        buffer = lines.pop() || ""; 

        for (const line of lines) {
            processChunk(line, provider.name, onChunk);
        }
    }
  }
}

function processChunk(line: string, providerName: string, onChunk: (content: string) => void) {
    if (line.trim() === '') return;

    if (providerName === 'OpenAI' || providerName === 'OpenRouter') {
        if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;
            try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) onChunk(content);
            } catch (e) {
                // ignore
            }
        }
    } else if (providerName === 'Anthropic') {
        if (line.startsWith('data: ')) {
            const data = line.slice(6);
            try {
                const parsed = JSON.parse(data);
                if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                    onChunk(parsed.delta.text);
                }
            } catch (e) {
                // ignore
            }
        }
    }
}
