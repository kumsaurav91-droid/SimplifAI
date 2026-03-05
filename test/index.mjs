import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';

// Initialize Bedrock Client (us-east-1 jahan Nova Lite authorized hai)
const client = new BedrockRuntimeClient({ region: "us-east-1" });
const MODEL_ID = "amazon.nova-lite-v1:0";

export const handler = async (event) => {
    try {
        const bodyObj = event.body ? JSON.parse(event.body) : {};
        const path = event.rawPath || event.path || "/";

        // Common headers for CORS
        const headers = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
        };

        // -------------------------------------------------------------
        // ROUTE: RUN CODE (/run) 
        // -------------------------------------------------------------
        if (path === '/run') {
            const { code, language, userInputs } = bodyObj;

            if (!code) {
                return { statusCode: 400, headers, body: JSON.stringify({ error: "Code missing for execution" }) };
            }

            let sortedInputs = [];
            if (userInputs && typeof userInputs === 'object') {
                const keys = Object.keys(userInputs);
                if (keys.length > 0) {
                    sortedInputs = keys.map(k => `${k} = ${userInputs[k]}`);
                }
            }

            const prompt = `You are an AI code execution engine. Simulate running the provided code and return EXACTLY what would be printed to stdout.

RULES:
1. ONLY return the final console/print output lines.
2. DO NOT wrap output in markdown, backticks, or explanation.
3. ACT mathematically correct (e.g. 5+3=8).
4. If the code produces NO output, return the exact string: "(no output)"

Language: ${language || 'auto'}
Code:
${code}

${sortedInputs.length > 0 ? "USER HAS PROVIDED THESE STDIN VALUES (Use them when code asks for input):\n" + sortedInputs.join('\n') : "NOTE: No input values provided. Treat inputs as empty."}`;

            const command = new ConverseCommand({
                modelId: MODEL_ID,
                messages: [{ role: "user", content: [{ text: prompt }] }],
                inferenceConfig: { maxTokens: 800, temperature: 0.0 }
            });

            const response = await client.send(command);
            const rawOutput = response.output.message.content[0].text;

            let filterOut = rawOutput.split('\n');
            if (filterOut.length > 0 && filterOut[0].startsWith('---')) filterOut.shift();
            if (filterOut.length > 0 && filterOut[filterOut.length - 1].startsWith('...')) filterOut.pop();

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ output: filterOut.join('\n').trim() })
            };
        }

        // -------------------------------------------------------------
        // ROUTE: EXPLAIN CODE (/)
        // -------------------------------------------------------------
        const { code, lang, level, analogy } = bodyObj;

        if (!code) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: "Code missing" }) };
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
            headers,
            body: JSON.stringify({ explanation: explText }),
        };

    } catch (error) {
        console.error("Lambda Error:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "Failed to connect to AWS Bedrock." }) };
    }
};
