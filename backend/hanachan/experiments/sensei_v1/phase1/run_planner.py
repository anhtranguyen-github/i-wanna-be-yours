import os
import json
from langchain_ollama import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

def run_planner():
    # Load Skill
    skill_path = "skills/planner_v1.md"
    with open(skill_path, "r") as f:
        skill_content = f.read()

    # Load Mock Data
    data_path = "data/mock_okr_progress.json"
    with open(data_path, "r") as f:
        okr_progress = json.load(f)

    # Initialize LLM
    llm = OllamaLLM(model="qwen3:1.7b", base_url="http://localhost:11434")

    # Prepare Prompt
    prompt_template = """
    {skill_content}

    Input Data (OKR Progress):
    {input_data}

    Analyze the input data and provide the response in the specified JSON format.
    """
    
    prompt = ChatPromptTemplate.from_template(prompt_template)
    chain = prompt | llm | JsonOutputParser()

    # Execute
    print("Executing Planner Agent...")
    try:
        result = chain.invoke({
            "skill_content": skill_content,
            "input_data": json.dumps(okr_progress, indent=2)
        })
        print(f"Result: {json.dumps(result, indent=2)}")
        
        # Validation
        if result.get("action") == "suggest_milestone_adjustment" and "proposal" in result:
            print("SUCCESS: Valid tool call generated.")
        else:
            print("FAILURE: Invalid tool call format.")
            
    except Exception as e:
        print(f"ERROR: {str(e)}")

if __name__ == "__main__":
    run_planner()
