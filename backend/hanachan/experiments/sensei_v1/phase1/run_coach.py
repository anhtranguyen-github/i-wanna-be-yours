import os
import json
from langchain_ollama import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

def run_coach():
    # Load Skill
    skill_path = "skills/coach_v1.md"
    with open(skill_path, "r") as f:
        skill_content = f.read()

    # Load Mock Data
    data_path = "data/mock_user_mood.json"
    with open(data_path, "r") as f:
        user_mood = json.load(f)

    # Initialize LLM
    llm = OllamaLLM(model="qwen3:1.7b", base_url="http://localhost:11434")

    # Prepare Prompt
    prompt_template = """
    {skill_content}

    Input Data (User Context):
    {input_data}

    Analyze the input data and provide the response in the specified JSON format.
    """
    
    prompt = ChatPromptTemplate.from_template(prompt_template)
    chain = prompt | llm | JsonOutputParser()

    # Execute
    print("Executing Coach Agent...")
    try:
        result = chain.invoke({
            "skill_content": skill_content,
            "input_data": json.dumps(user_mood, indent=2)
        })
        print(f"Result: {json.dumps(result, indent=2)}")
        
        # Validation
        if result.get("action") == "set_session_intensity" and "intensity" in result:
            print("SUCCESS: Valid tool call generated.")
        else:
            print("FAILURE: Invalid tool call format.")
            
    except Exception as e:
        print(f"ERROR: {str(e)}")

if __name__ == "__main__":
    run_coach()
