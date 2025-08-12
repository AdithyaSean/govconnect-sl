'use server';
/**
 * @fileOverview Defines the AI flow for the main chat interface.
 */
import {ai} from '@/ai/genkit';
import {z} from 'zod';

// Define the schema for a single chat message
const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

// Define the schema for the flow's input
const ChatInputSchema = z.object({
  history: z.array(MessageSchema),
  newMessage: z.string(),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.string();
export type ChatOutput = z.infer<typeof ChatOutputSchema>;


const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async ({history, newMessage}) => {

    const systemPrompt = `You are a helpful and friendly AI assistant for GovConnect SL, a platform for Sri Lankan government services. Your goal is to provide clear, concise, and accurate information to citizens. Answer based on the user's query and the conversation history.`;
    
    // Generate the response from the Gemini model
    const response = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      prompt: newMessage,
      history: history,
      systemInstruction: systemPrompt
    });

    return response.text;
  }
);

// Export a server action that the frontend can call
export async function askGemini(input: ChatInput): Promise<ChatOutput> {
  return await chatFlow(input);
}
