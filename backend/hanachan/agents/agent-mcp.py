from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_mcp_adapters.client import MultiServerMCPClient
from langgraph.prebuilt import create_react_agent
import asyncio

SYSTEM_PROMPT = """You are a Japanese grammar tutor assistant. 
You have access to a grammar database with explanations and examples.
Help users learn Japanese grammar patterns clearly and educationally."""

async def main():
    print("\n🎌 Zen Grammar Tutor (Ollama + LangChain + MCP)")
    print("=" * 60)
    
    # Initialize MCP client with your server
    client = MultiServerMCPClient({
        "grammar": {
            "command": "python",
            "args": ["mcp_server.py"],  # Update with full path if needed
            "transport": "stdio"
        }
    })
    
    print("🔄 Loading tools from MCP server...")
    
    # Get tools from MCP server
    tools = await client.get_tools()
    print(f"✅ Loaded {len(tools)} tools:")
    for tool in tools:
        print(f"   - {tool.name}: {tool.description}")
    
    # Initialize Ollama model
    llm = ChatOllama(
        model="qwen3:1.7b",
        temperature=0
    )
    
    # Create agent with tools
    agent = create_react_agent(llm, tools)
    
    print("\nAsk me about Japanese grammar!")
    print('Examples: "Explain ～ば～ほど" or "give me examples"')
    print('Type "exit" to quit\n')
    print("=" * 60 + "\n")
    
    # Chat loop
    while True:
        user_input = input("You: ").strip()
        
        if user_input.lower() in ['exit', 'quit', 'q']:
            print("👋 Goodbye!")
            break
        
        if not user_input:
            continue
        
        # Invoke agent
        try:
            response = await agent.ainvoke({
                "messages": [
                    SystemMessage(content=SYSTEM_PROMPT),
                    HumanMessage(content=user_input)
                ]
            })
            
            # Get the last message (agent's response)
            assistant_message = response["messages"][-1].content
            print(f"\n🤖 Assistant: {assistant_message}\n")
            
        except Exception as e:
            print(f"❌ Error: {e}\n")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n👋 Goodbye!")
    except Exception as e:
        print(f"❌ Fatal error: {e}")