import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const MODEL_ID = "amazon.nova-lite-v1:0";
const client = new BedrockRuntimeClient({ region: "us-east-1" });

app.post('/api/explain', async (req, res) => {
    try {
        const { code, lang, level, analogy } = req.body;

        if (!code) {
            return res.status(400).json({ error: "Code snippet is required" });
        }

        const prompt = `You are an expert AI programming mentor specifically built for Indian students named "SimplifAI". 
        You explain code using the "Hinglish" language (Hindi mixed with English) and use highly relatable Indian analogies.
        
        Analyze the following code snippet.
        Language selected: ${lang}
        Target Audience Level: ${level} (If Beginner: keep it very simple without jargon. If Advanced: include deep technical insights).
        Preferred Analogy Theme: ${analogy} (e.g. cricket, bollywood, food, school)
        
        Code:
        ${code}
        
        Provide a structured explanation. IMPORTANT: Use expressive emojis for ALL headings, bullet points, and paragraphs to make the explanation fun, structured, and visually engaging to read!`;

        const command = new ConverseCommand({
            modelId: MODEL_ID,
            messages: [
                {
                    role: "user",
                    content: [{ text: prompt }]
                }
            ],
            inferenceConfig: { maxTokens: 1000, temperature: 0.7 }
        });

        const response = await client.send(command);
        const explText = response.output.message.content[0].text;

        res.json({ explanation: explText });

    } catch (error) {
        console.error("Bedrock API Error:", error);
        res.status(500).json({ error: "Failed to fetch explanation from AI model." });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 SimplifAI Backend running on http://localhost:${PORT}`);
    console.log(`📡 Linked to AWS Bedrock: ${MODEL_ID}`);
});
