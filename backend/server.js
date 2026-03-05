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

app.post('/api/run', async (req, res) => {
    try {
        const { code, language, userInputs } = req.body;

        if (!code) {
            return res.status(400).json({ error: "Code is required" });
        }

        // Build ordered stdin list for AI
        let stdinSection = '';
        if (userInputs && Object.keys(userInputs).length > 0) {
            const vals = Object.values(userInputs);
            stdinSection = `\nSTDIN (in order, one per line):\n${vals.join('\n')}\n`;
        }

        const prompt = `You are a code execution simulator. Execute this code mentally and output EXACTLY what would appear on stdout.

Language: ${language || 'java'}
${stdinSection}
Code:
${code}

OUTPUT RULES — follow these EXACTLY:
1. Print ONLY lines that come from print/println/cout/printf/console.log statements.
2. NEVER print lines that are input-prompts (like "Enter a number:", "Enter name:") that appear immediately before a Scanner.nextLine/nextInt/cin>> read — those are prompts, not output.
3. NEVER add "...", "---", decorators, or commentary. Just raw output lines.
4. Do arithmetic correctly: 4+5=9, 4*5=20, etc.
5. Handle if/else, loops, and conditions correctly based on the given stdin values.
6. If there is truly no output at all, write exactly: (no output)

Your response must contain ONLY the stdout output lines and nothing else:`;

        const command = new ConverseCommand({
            modelId: MODEL_ID,
            messages: [{ role: "user", content: [{ text: prompt }] }],
            inferenceConfig: { maxTokens: 500, temperature: 0.0 }
        });

        const response = await client.send(command);
        let output = response.output.message.content[0].text.trim();

        // Server-side cleanup: remove artifact lines AI sometimes adds
        const lines = output.split('\n');
        const cleaned = lines.filter(line => {
            const t = line.trim();
            if (t === '...' || t === '---' || t === '___' || t === '') return false;
            // Remove lines that look like input prompts the AI accidentally included
            if (/^enter\s+(a\s+)?(number|name|value|input)/i.test(t)) return false;
            return true;
        });
        output = cleaned.length ? cleaned.join('\n') : '(no output)';

        res.json({ output });

    } catch (error) {
        console.error("Run API Error:", error);
        res.status(500).json({ error: "Code execution failed: " + error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 SimplifAI Backend running on http://localhost:${PORT}`);
    console.log(`📡 Linked to AWS Bedrock: ${MODEL_ID}`);
});
