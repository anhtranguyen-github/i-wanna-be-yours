import json
import operator
from typing import Annotated, Dict, List, TypedDict, Union

from langchain_ollama import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langgraph.graph import StateGraph, END

# ============================================
# State Definition
# ============================================

class SenseiState(TypedDict):
    user_id: str
    dashboard_snapshot: Dict
    analyst_result: Dict
    coach_result: Dict
    planner_result: Dict
    final_plan: str

# ============================================
# Node Implementations
# ============================================

llm = OllamaLLM(model="qwen3:1.7b", base_url="http://localhost:11434")
json_parser = JsonOutputParser()

def ingest_context(state: SenseiState) -> SenseiState:
    print("--- [NODE] INGEST CONTEXT ---")
    # Load all mock data as if coming from different services
    with open("data/mock_priority_matrix.json", "r") as f:
        priority = json.load(f)
    with open("data/mock_user_mood.json", "r") as f:
        mood = json.load(f)
    with open("data/mock_okr_progress.json", "r") as f:
        okr = json.load(f)
    
    state["dashboard_snapshot"] = {
        "priority": priority,
        "mood": mood,
        "okr": okr
    }
    return state

def run_analyst(state: SenseiState) -> SenseiState:
    print("--- [NODE] ANALYST ---")
    with open("skills/analyst_v1.md", "r") as f:
        skill = f.read()
    
    prompt = ChatPromptTemplate.from_template("""
        {skill_content}
        Input: {input_data}
    """)
    chain = prompt | llm | json_parser
    
    res = chain.invoke({
        "skill_content": skill,
        "input_data": json.dumps(state["dashboard_snapshot"]["priority"])
    })
    state["analyst_result"] = res
    return state

def run_coach(state: SenseiState) -> SenseiState:
    print("--- [NODE] COACH ---")
    with open("skills/coach_v1.md", "r") as f:
        skill = f.read()
    
    prompt = ChatPromptTemplate.from_template("""
        {skill_content}
        Input: {input_data}
    """)
    chain = prompt | llm | json_parser
    
    res = chain.invoke({
        "skill_content": skill,
        "input_data": json.dumps(state["dashboard_snapshot"]["mood"])
    })
    state["coach_result"] = res
    return state

def run_planner(state: SenseiState) -> SenseiState:
    print("--- [NODE] PLANNER ---")
    with open("skills/planner_v1.md", "r") as f:
        skill = f.read()
    
    # The planner also gets the Analyst and Coach results to synthesize
    context = {
        "okr": state["dashboard_snapshot"]["okr"],
        "analyst_findings": state["analyst_result"],
        "coach_mood": state["coach_result"]
    }
    
    prompt = ChatPromptTemplate.from_template("""
        {skill_content}
        Combined Context for Synthesis:
        {input_data}
    """)
    chain = prompt | llm | json_parser
    
    res = chain.invoke({
        "skill_content": skill,
        "input_data": json.dumps(context)
    })
    state["planner_result"] = res
    return state

def finalize_report(state: SenseiState) -> SenseiState:
    print("--- [NODE] FINALIZE REPORT ---")
    # Final human-readable summary
    summary = f"""
    ### SENSEI'S SESSION PLAN ###
    
    Status: {'CRITICAL' if state['planner_result'].get('is_urgent') else 'ON TRACK'}
    Focus: {state['analyst_result'].get('content_id')}
    Intensity: {state['coach_result'].get('intensity').upper()}
    
    Message: {state['coach_result'].get('message_for_user')}
    
    Strategic Proposal: {state['planner_result'].get('proposal')}
    """
    state["final_plan"] = summary
    return state

# ============================================
# Graph Construction
# ============================================

workflow = StateGraph(SenseiState)

workflow.add_node("ingest", ingest_context)
workflow.add_node("analyst", run_analyst)
workflow.add_node("coach", run_coach)
workflow.add_node("planner", run_planner)
workflow.add_node("finalize", finalize_report)

workflow.set_entry_point("ingest")
workflow.add_edge("ingest", "analyst")
workflow.add_edge("analyst", "coach")
workflow.add_edge("coach", "planner")
workflow.add_edge("planner", "finalize")
workflow.add_edge("finalize", END)

app = workflow.compile()

# ============================================
# Execution
# ============================================

if __name__ == "__main__":
    print("Starting AI Sensei Full Reasoning Loop...")
    inputs = {"user_id": "student_01"}
    final_state = app.invoke(inputs)
    
    print("\n" + "="*40)
    print(final_state["final_plan"])
    print("="*40)
    
    # Save results for review
    with open("full_loop_result.json", "w") as f:
        json.dump(final_state, f, indent=2)
    print("\nLoop completed successfully. Results saved to full_loop_result.json")
