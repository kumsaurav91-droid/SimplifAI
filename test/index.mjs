import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';

// Initialize Bedrock Client (us-east-1 jahan Nova Lite authorized hai)
const client = new BedrockRuntimeClient({ region: "us-east-1" });
const MODEL_ID = "amazon.nova-lite-v1:0";

export const handler = async (event) => {
    try {
        const body = JSON.parse(event.body);
        const { code, lang, level, analogy } = body;

        if (!code) {
            return { statusCode: 400, body: JSON.stringify({ error: "Code missing" }) };
        }

        const prompt = `You are an expert AI programming mentor specifically built for Indian students named "SimplifAI". 
        You explain code using "Hinglish" language and use relatable Indian analogies.
        
        Language: ${lang}
        Target Audience Level: ${level} 
        Preferred Analogy Theme: ${analogy}
        
        Code:
        ${code}
        
        Explain this structuredly. IMPORTANT: Use expressive emojis for ALL headings, bullet points, and paragraphs!`;

        const command = new ConverseCommand({
            modelId: MODEL_ID,
            messages: [{ role: "user", content: [{ text: prompt }] }],
            inferenceConfig: { maxTokens: 1000, temperature: 0.7 }
        });

        const response = await client.send(command);
        const explText = response.output.message.content[0].text;

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type"
            },
            body: JSON.stringify({ explanation: explText }),
        };

    } catch (error) {
        console.error("Lambda Error:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "Failed to connect to AWS Bedrock." }) };
    }
};
