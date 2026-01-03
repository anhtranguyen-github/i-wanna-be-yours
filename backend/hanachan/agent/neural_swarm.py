import os
import logging
from typing import List, Dict, Any, Union
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, BaseMessage
from services.llm_factory import ModelFactory
from agent.skills.skill_card import skill_registry, SkillCard

logger = logging.getLogger("hanachan.neural_swarm")

class SpecialistAgent:
    """A specialized sub-agent powered by a Skill Card."""
    def __init__(self, card: SkillCard):
        self.card = card
        from agent.tools import study_tools
        
        # Resolve tool functions from strings in the card
        self.tools = []
        for tool_name in self.card.tools:
            tool_func = getattr(study_tools, tool_name, None)
            if tool_func:
                self.tools.append(tool_func)
        
        # self.llm = ModelFactory.create_chat_model(temperature=0.3)
        # self.llm_with_tools = self.llm.bind_tools(self.tools) if self.tools else self.llm
        self.llm_with_tools = ModelFactory.create_chat_model(temperature=0.3, tools=self.tools if self.tools else None)

    def invoke(self, messages: List[BaseMessage], user_id: str, token: str = None) -> str:
        """Invokes the sub-agent using its Skill Card prompt."""
        logger.info(f"🧠 [Skill Active: {self.card.name}] Processing request...")
        
        card_prompt = self.card.get_system_prompt()
        
        # Smart Context Injection: Merge with existing SystemMessage if present
        if messages and isinstance(messages[0], SystemMessage):
            # Create a new list to avoid modifying the original 'messages'
            all_messages = messages.copy()
            # Prepend the skill card logic to the existing context
            all_messages[0] = SystemMessage(content=f"{card_prompt}\n\nCORE CONTEXT:\n{messages[0].content}")
        else:
            system_msg = SystemMessage(content=card_prompt)
            all_messages = [system_msg] + messages
        
        # Handle tool calling loop
        for _ in range(3):
            response = self.llm_with_tools.invoke(all_messages)
            if hasattr(response, 'tool_calls') and response.tool_calls:
                from langchain_core.messages import ToolMessage
                all_messages.append(response)
                tool_map = {t.name: t for t in self.tools}
                for tc in response.tool_calls:
                    tool = tool_map.get(tc['name'])
                    if tool:
                        args = tc['args']
                        if 'user_id' in tool.args: args['user_id'] = user_id
                        if 'token' in tool.args: args['token'] = token
                        result = tool.invoke(args)
                        all_messages.append(ToolMessage(content=str(result), tool_call_id=tc['id']))
            else:
                return response.content
        return "Specialist iteration limit reached."

class HanachanNeuralSwarm:
    """Supervisor agent that coordinates sub-agents via their Skill Cards."""
    def __init__(self):
        # We wrap the cards into active specialists
        self.specialists = {
            name: SpecialistAgent(card) 
            for name, card in skill_registry.cards.items()
        }
        self.supervisor_llm = ModelFactory.create_chat_model(temperature=0)
        self._last_specialist = None

    def get_last_specialist(self) -> str:
        return self._last_specialist

    def route_and_solve(self, prompt: str, user_id: str, token: str = None, chat_history: List[Dict] = None, base_messages: List[BaseMessage] = None) -> str:
        """Routes to the correct 'Skill Card' based on the request."""
        chat_history = chat_history or []
        
        skills_desc = "\n".join([f"- '{name}': {card.description}" for name, card in skill_registry.cards.items()])
        
        routing_prompt = f"""Identify the best Skill Card for this user request: "{prompt}"
        Available Skills:
{skills_desc}
        - 'general': If no specific skill card is required.
        
        Respond ONLY with the choice (the name in single quotes)."""
        
        choice = self.supervisor_llm.invoke([HumanMessage(content=routing_prompt)]).content.lower().replace("'", "").strip()
        
        specialist = self.specialists.get(choice)
        if specialist:
            self._last_specialist = choice
            logger.info(f"🐝 [Swarm] Activating Specialist: {choice}")
            # Use provided base_messages (which contain memory RAG) if available
            if base_messages:
                return specialist.invoke(base_messages, user_id, token)
            
            # Fallback to constructing from chat_history
            messages = []
            for m in chat_history:
                if m['role'] == 'user': messages.append(HumanMessage(content=m['content']))
                else: messages.append(AIMessage(content=m['content']))
            messages.append(HumanMessage(content=prompt))
            return specialist.invoke(messages, user_id, token)
        
        self._last_specialist = None
        return "GENERAL_FALLBACK"

swarm_instance = HanachanNeuralSwarm()
