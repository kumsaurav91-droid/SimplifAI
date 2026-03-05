import dotenv from "dotenv";
dotenv.config();
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";

// ✅ Updated Model ID for Amazon Nova Lite
const MODEL_ID = "amazon.nova-lite-v1:0";

async function testBedrock() {
  console.log("🚀 Testing AWS Bedrock + Amazon Nova 2 Lite...\n");

  const client = new BedrockRuntimeClient({ region: "us-east-1" });

  try {
    console.log("📡 Calling Amazon Nova 2 Lite via Bedrock Converse API...");
    console.log(`📍 Model: ${MODEL_ID}`);
    console.log(`🌍 Region: us-east-1\n`);

    const command = new ConverseCommand({
      modelId: MODEL_ID,
      messages: [
        {
          role: "user",
          content: [{ text: "Namaste! Ek simple Python for loop ka example de do jo 1 se 5 tak numbers print kare." }]
        }
      ],
      inferenceConfig: { maxTokens: 500, temperature: 0.7 }
    });

    const response = await client.send(command);

    console.log("✅ SUCCESS! Amazon Nova 2 Lite is accessible!\n");
    console.log("📝 Response:");
    console.log("─".repeat(60));
    console.log(response.output.message.content[0].text);
    console.log("─".repeat(60));
    console.log("\n🎉 Bedrock setup complete! You can now use SimplifAI.");
  } catch (error) {
    console.error("❌ ERROR:", error.message);
    console.error("\n🔍 Troubleshooting:");

    if (error.message.includes("ValidationException") || error.message.includes("access")) {
      console.error("   → Go to AWS Bedrock console");
      console.error("   → Region: us-east-1, us-west-2, or ap-south-1 depending on model availability");
      console.error("   → Wait 2-5 minutes after enabling");
    } else if (error.message.includes("credentials")) {
      console.error("   → Check your AWS credentials in .env file");
      console.error("   → Verify AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY");
    } else {
      console.error("   → Full error:", error);
    }
  }
}

testBedrock();