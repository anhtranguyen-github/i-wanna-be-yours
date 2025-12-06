import { AgentAPI } from './src/lib/api-client';

async function main() {
    console.log("Checking Agent API Health...");
    try {
        const isHealthy = await AgentAPI.checkHealth();
        if (isHealthy) {
            console.log("✅ Agent API is healthy.");
        } else {
            console.error("❌ Agent API is unhealthy.");
            process.exit(1);
        }
    } catch (error) {
        console.error("❌ Error checking health:", error);
        process.exit(1);
    }
}

main();
