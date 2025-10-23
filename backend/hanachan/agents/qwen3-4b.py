import random
from typing import Annotated, Any, Dict, List, Optional
from langchain_ollama import ChatOllama
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.tools import tool
from langgraph.graph import StateGraph, END
import json



# Define the custom tools
@tool
def get_user_profile(_: str = "") -> str:
    """Retrieves a random user profile with their name, age, hobby, and country."""
    names = ["Alice", "Bob", "Charlie", "Daisy", "Eren", "Miku", "Kaito"]
    hobbies = ["reading", "gaming", "painting", "hiking", "coding", "cooking"]
    countries = ["Japan", "Vietnam", "USA", "France", "Korea", "Germany"]
    profile = {
        "name": random.choice(names),
        "age": random.randint(18, 40),
        "hobby": random.choice(hobbies),
        "country": random.choice(countries),
    }
    return str(profile)

@tool
def translate_jap(text: str) -> str:
    """Translates text from English to Japanese."""
    return "i dunno lol ask someone else"

tools = [get_user_profile, translate_jap]

# Manually create the tool-use prompt with the ReAct pattern
tool_names = ", ".join([t.name for t in tools])
tool_descriptions = "\n".join([f"{t.name}: {t.description}" for t in tools])

prompt = ChatPromptTemplate.from_messages([
    ("system",
     "You are a helpful assistant. You have access to the following tools:\n\n"
     f"{tool_descriptions}\n\n"
     "To use a tool, respond with a JSON object in the following format:\n"
     "```json\n"
     "{\n"
     "  \"action\": \"tool_name\",\n"
     "  \"action_input\": \"input for the tool\"\n"
     "}\n"
     "```\n"
     "If you do not need to use a tool, respond directly to the user.\n"
     "Example: user 'What's the weather like?', you respond 'I'm sorry, I cannot help with that. I can only do a few things, like getting a user profile and translating.'"
    ),
    ("human", "{input}"),
])

# Initialize the Ollama model
llm = ChatOllama(model="qwen3:4b", temperature=0)

# Define the graph state
class AgentState(Dict):
    input: str
    intermediate_steps: List[Any]
    output: Optional[str]

# Define the agent nodes
def call_model(state: AgentState):
    messages = [
        AIMessage(content=f"Available tools: {tool_descriptions}"),
        HumanMessage(content=state["input"])
    ]
    response = llm.invoke(messages)
    return {"intermediate_steps": [(HumanMessage(content=state["input"]), response)]}

def call_tool(state: AgentState):
    last_message = state["intermediate_steps"][-1][1]
    
    # Attempt to parse the JSON output from the model
    try:
        json_content = last_message.content.strip().replace("```json", "").replace("```", "").strip()
        action_data = json.loads(json_content)
        action_name = action_data["action"]
        action_input = action_data["action_input"]
        
        # Find and execute the tool
        for tool_func in tools:
            if tool_func.name == action_name:
                output = tool_func.invoke(action_input)
                return {"intermediate_steps": state["intermediate_steps"] + [(AIMessage(content=output), "")]}
        
        # Handle cases where the tool name is not found
        return {"intermediate_steps": state["intermediate_steps"] + [(AIMessage(content="Invalid tool name."), "")]}
    
    except json.JSONDecodeError:
        # If the model's output isn't valid JSON, assume it's a final answer
        return {"output": last_message.content}
    except KeyError:
        # If the JSON is missing keys, handle it as a final answer
        return {"output": last_message.content}

# Define the graph
workflow = StateGraph(AgentState)
workflow.add_node("call_model", call_model)
workflow.add_node("call_tool", call_tool)

workflow.add_edge("call_model", "call_tool")
workflow.add_edge("call_tool", END)
workflow.set_entry_point("call_model")

# Compile the graph
app = workflow.compile()

# Run the agent
print("--- Invoking agent for user profile ---")
result_1 = app.invoke({"input": "What is a user's profile?"})
print(result_1["output"])
print("\n")

print("--- Invoking agent for translation ---")
result_2 = app.invoke({"input": "Translate 'Hello world' to Japanese."})
print(result_2["output"])

# print("--- Invoking agent for a general question ---")
# result_3 = app.invoke({"input": "Who are you?"})
# print(result_3["output"])