from typing import List, Optional, Dict, Any, Union, Literal, TypedDict
from langgraph.graph import StateGraph, END, START
from langgraph.prebuilt import ToolNode
from langchain_core.language_models import BaseChatModel
from langchain_core.messages import SystemMessage, ToolMessage, BaseMessage, HumanMessage, AIMessage
from langchain_core.tools import BaseTool
from langgraph.checkpoint.base import BaseCheckpointSaver
from langgraph.types import Command, Interrupt
from typing_extensions import Annotated
import operator
import logging

logger = logging.getLogger(__name__)

class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], operator.add]

class AgentBuilder:
    def __init__(
        self,
        tools: List[BaseTool],
        llm: BaseChatModel,
        prompt: str,
        checkpointer: Optional[BaseCheckpointSaver] = None,
        approve_all_tools: bool = False,
    ):
        if not llm:
            raise ValueError("Language model (llm) is required")
        self.tools = tools or []
        self.tool_node = ToolNode(tools or [])
        self.system_prompt = prompt
        self.model = llm
        self.checkpointer = checkpointer
        self.approve_all_tools = approve_all_tools

    def should_approve_tool(self, state: AgentState) -> Literal["tool_approval", END]:
        messages = state["messages"]
        if not messages:
            return END
        last_message = messages[-1]
        if (
            isinstance(last_message, AIMessage)
            and last_message.tool_calls
        ):
            return "tool_approval"
        return END

    def approve_tool_call(self, state: AgentState) -> Command:
        if self.approve_all_tools:
            return Command(goto="tools")
        
        messages = state["messages"]
        last_message = messages[-1]
        
        if (
            isinstance(last_message, AIMessage)
            and last_message.tool_calls
        ):
            tool_call = last_message.tool_calls[-1]
            
            from langgraph.types import interrupt as lg_interrupt
            
            review_result = lg_interrupt({
                "question": "Is this correct?",
                "toolCall": tool_call,
            })
            
            review_action = review_result.get("action")
            review_data = review_result.get("data")
            
            if review_action == "continue":
                return Command(goto="tools")
            elif review_action == "update":
                updated_message = AIMessage(
                    content=last_message.content,
                    tool_calls=[
                        {
                            "id": tool_call["id"],
                            "name": tool_call["name"],
                            "args": review_data,
                        }
                    ],
                    id=last_message.id,
                )
                return Command(
                    goto="tools",
                    update={"messages": [updated_message]}
                )
            elif review_action == "feedback":
                tool_message = ToolMessage(
                    name=tool_call["name"],
                    content=review_data,
                    tool_call_id=tool_call["id"],
                )
                return Command(
                    goto="agent",
                    update={"messages": [tool_message]}
                )
            
            logger.warning(f"Invalid review action: {review_action}")
            return Command(goto=END) # Fallback
            
        return Command(goto=END)

    async def call_model(self, state: AgentState):
        if not self.model:
            raise ValueError("Invalid or missing language model (llm)")
        
        # Ensure system prompt is first, but don't duplicate if already there?
        # Standard approach is to prepend.
        messages = [SystemMessage(content=self.system_prompt)] + state["messages"]
        
        # Bind tools if we have them
        if self.tools:
            model_invoker = self.model.bind_tools(self.tools)
        else:
            model_invoker = self.model
            
        response = await model_invoker.ainvoke(messages)
        return {"messages": [response]}

    def build(self):
        workflow = StateGraph(AgentState)
        
        workflow.add_node("agent", self.call_model)
        workflow.add_node("tools", self.tool_node)
        workflow.add_node("tool_approval", self.approve_tool_call)
        
        workflow.add_edge(START, "agent")
        
        workflow.add_conditional_edges(
            "agent",
            self.should_approve_tool,
            ["tool_approval", END]
        )
        
        workflow.add_edge("tools", "agent")
        
        return workflow.compile(checkpointer=self.checkpointer)
