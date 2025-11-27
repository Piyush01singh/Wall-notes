import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const getClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.error("API Key not found");
        return null;
    }
    return new GoogleGenAI({ apiKey });
};

export const summarizeNote = async (content: string): Promise<string> => {
    const client = getClient();
    if (!client) return "Error: API Key missing.";

    try {
        const response: GenerateContentResponse = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Summarize the following note into a concise paragraph, highlighting key action items or insights:\n\n${content}`,
            config: {
                systemInstruction: "You are a helpful personal knowledge assistant. Keep summaries professional, concise, and formatted in Markdown.",
            }
        });
        return response.text || "Could not generate summary.";
    } catch (error) {
        console.error("Gemini Error:", error);
        return "Failed to connect to AI service.";
    }
};

export const generateIdeas = async (title: string, content: string): Promise<string> => {
    const client = getClient();
    if (!client) return "Error: API Key missing.";

    try {
        const response: GenerateContentResponse = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Based on this note titled "${title}", suggest 3 related ideas or expansion points:\n\n${content}`,
            config: {
                 systemInstruction: "You are a creative partner. Provide brief, bulleted suggestions that are actionable.",
            }
        });
        return response.text || "No ideas generated.";
    } catch (error) {
        console.error("Gemini Error:", error);
        return "Failed to connect to AI service.";
    }
};

export const streamContinueWriting = async (currentContent: string): Promise<AsyncGenerator<string, void, unknown> | null> => {
    const client = getClient();
    if (!client) return null;

    try {
        const responseStream = await client.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: `Continue writing this note naturally. Do not repeat the last sentence, just flow from it:\n\n${currentContent.slice(-1000)}`, // Context window of last 1000 chars
        });
        
        async function* generator() {
            for await (const chunk of responseStream) {
                yield chunk.text || '';
            }
        }
        return generator();
    } catch (error) {
        console.error("Gemini Stream Error:", error);
        return null;
    }
};
