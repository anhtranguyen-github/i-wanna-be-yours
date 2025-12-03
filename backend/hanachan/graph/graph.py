import logging
from typing import TypedDict, List, Dict, Any
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, BaseMessage
from agents.factory import AgentFactory
from .logger import log_agent_action

logger = logging.getLogger(__name__)

# Define the State
class AgentState(TypedDict):
    messages: List[BaseMessage]
    user_input: str
    kaiwa_response: str
    specialist_response: str
    next_step: str
    conversation_id: str

class MasGraph:
    def __init__(self, agent_factory: AgentFactory):
        self.agent_factory = agent_factory
        self.app = self._create_graph()

    def _create_graph(self):
        workflow = StateGraph(AgentState)
        
        # Nodes
        workflow.add_node("kaiwa", self.kaiwa_node)
        workflow.add_node("kyoumu", self.kyoumu_node)
        workflow.add_node("bunpo", self.bunpo_node)
        workflow.add_node("kana", self.kana_node)
        workflow.add_node("aggregator", self.aggregator_node)

        # Edges
        workflow.set_entry_point("kaiwa")
        workflow.add_edge("kaiwa", "kyoumu")

        # Conditional Edges from Kyoumu
        workflow.add_conditional_edges(
            "kyoumu",
            self.kyoumu_router,
            {
                "bunpo": "bunpo",
                "kana": "kana",
                "aggregator": "aggregator"
            }
        )

        workflow.add_edge("bunpo", "aggregator")
        workflow.add_edge("kana", "aggregator")
        workflow.add_edge("aggregator", END)

        return workflow.compile()

    async def kaiwa_node(self, state: AgentState):
        logger.info("--- Kaiwa Coach ---")
        user_input = state["user_input"]
        messages = state["messages"]
        conversation_id = state.get("conversation_id", "unknown")
        
        llm_with_tools, _, system_prompt = await self.agent_factory.create_agent("kaiwa_coach")
        
        prompt_messages = [SystemMessage(content=system_prompt)] + messages + [HumanMessage(content=user_input)]
        response = await llm_with_tools.ainvoke(prompt_messages)
        
        log_agent_action(conversation_id, "Kaiwa Coach", str(prompt_messages), response.content)
        return {"kaiwa_response": response.content}

    async def kyoumu_node(self, state: AgentState):
        logger.info("--- Kyoumu Analysis ---")
        user_input = state["user_input"]
        conversation_id = state.get("conversation_id", "unknown")
        
        llm_with_tools, _, system_prompt = await self.agent_factory.create_agent("kyoumu")
        
        analysis_prompt = f"""
        Analyze the following user input for Japanese mistakes:
        "{user_input}"
        
        Output "DECISION: BUNPO" for grammar mistakes.
        Output "DECISION: KANA" for kanji/vocab mistakes.
        Output "DECISION: OK" if natural.
        """
        
        messages = [SystemMessage(content=system_prompt), HumanMessage(content=analysis_prompt)]
        response = await llm_with_tools.ainvoke(messages)
        content = response.content
        
        log_agent_action(conversation_id, "Kyoumu", str(messages), content)
        
        if "DECISION: BUNPO" in content:
            logger.info("Kyoumu decided: BUNPO")
            return {"next_step": "bunpo"}
        elif "DECISION: KANA" in content:
            logger.info("Kyoumu decided: KANA")
            return {"next_step": "kana"}
        else:
            logger.info("Kyoumu decided: OK")
            return {"next_step": "ok"}

    async def bunpo_node(self, state: AgentState):
        logger.info("--- Bunpo Navigator ---")
        user_input = state["user_input"]
        conversation_id = state.get("conversation_id", "unknown")
        
        llm, _, prompt = await self.agent_factory.create_agent("bunpo_navigator")
        
        messages = [SystemMessage(content=prompt), HumanMessage(content=user_input)]
        response = await llm.ainvoke(messages)
        
        log_agent_action(conversation_id, "Bunpo Navigator", str(messages), response.content)
        return {"specialist_response": f"🏗️ Bunpo Navigator: {response.content}"}

    async def kana_node(self, state: AgentState):
        logger.info("--- Kana & Kanji Sensei ---")
        user_input = state["user_input"]
        conversation_id = state.get("conversation_id", "unknown")
        
        llm, _, prompt = await self.agent_factory.create_agent("kana_kanji_sensei")
        
        messages = [SystemMessage(content=prompt), HumanMessage(content=user_input)]
        response = await llm.ainvoke(messages)
        
        log_agent_action(conversation_id, "Kana Sensei", str(messages), response.content)
        return {"specialist_response": f"📝 Kana Sensei: {response.content}"}

    async def aggregator_node(self, state: AgentState):
        logger.info("--- Aggregator ---")
        kaiwa_response = state["kaiwa_response"]
        specialist_response = state.get("specialist_response", "")
        
        final_output = f"{kaiwa_response}"
        if specialist_response:
            final_output += f"\n\n---\n{specialist_response}"
                
        new_messages = state["messages"] + [
            HumanMessage(content=state["user_input"]),
            AIMessage(content=final_output)
        ]
        return {"messages": new_messages}

    def kyoumu_router(self, state: AgentState):
        if state["next_step"] == "bunpo":
            return "bunpo"
        elif state["next_step"] == "kana":
            return "kana"
        else:
            return "aggregator"
