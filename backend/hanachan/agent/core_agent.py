import os
import logging
from typing import List, Any, Generator, Dict
from services.resource_processor import ResourceProcessor
from agent.engine.context_assembler import ContextAssembler
from agent.engine.output_governor import OutputGovernor
from schemas.output import UnifiedOutput
from langchain_core.messages import SystemMessage, HumanMessage
from memory.manager import MemoryManager, get_memory_manager
from services.llm_factory import ModelFactory
from agent.neural_swarm import swarm_instance
from agent.tools.study_tools import (
    generate_suggested_goals, 
    audit_study_progress, 
    prepare_milestone_exam,
    perform_detailed_audit,
    update_goal_progress,
    query_learning_records,
    recalibrate_study_priorities,
    create_study_flashcards,
    create_study_quiz,
    create_practice_exam
)

logger = logging.getLogger(__name__)

class HanachanAgent:
    def __init__(self):
        self.processor = ResourceProcessor()
        self.memory_manager = get_memory_manager()
        self.skills_dir = os.path.join(os.path.dirname(__file__), "skills")
        
        # [SYSTEM] Initialize Context Aperture (Parallel Retrieval)
        self.context_assembler = ContextAssembler(self.memory_manager)
        
        # [SYSTEM] Initialize Governance Engine
        from agent.engine.policy_engine import PolicyEngine
        from agent.engine.loader import ConfigLoader
        self.policy_engine = PolicyEngine()
        self.manifest = ConfigLoader.get_manifest()
        
        # Initialize LangChain Chat Model via Factory
        self.llm = ModelFactory.create_chat_model(temperature=0.7)
        
        # Define and bind tools
        self.tools = [
            generate_suggested_goals, 
            audit_study_progress, 
            prepare_milestone_exam,
            perform_detailed_audit,
            update_goal_progress,
            query_learning_records,
            recalibrate_study_priorities,
            create_study_flashcards,
            create_study_quiz,
            create_practice_exam
        ]
        try:
            self.llm_with_tools = ModelFactory.create_chat_model(temperature=0.7, tools=self.tools)
        except Exception as e:
            logger.warning(f"Tool binding failed via factory: {e}")
            self.llm_with_tools = self.llm
        
        # Ensure base LLM is also available for streaming if needed
        # Note: Streaming with fallbacks works differently, but we keep self.llm as primary reference if possible, 
        # or we might need to recreate it without tools.
        # Actually, self.llm is used in `_stream_generator` for direct streaming.
        # Let's keep a separate reference for direct text (with fallback but no tools)
        self.llm = ModelFactory.create_chat_model(temperature=0.7)

    def _get_system_prompt(self) -> str:
        try:
            skill_path = os.path.join(self.skills_dir, "chat_persona.md")
            with open(skill_path, 'r', encoding='utf-8') as f:
                return f.read()
        except:
            return "You are Hanachan, an AI language tutor for Hanachan.org. Help users with Japanese/Korean learning."

    def invoke(self, 
               prompt: str, 
               session_id: str,
               user_id: str, 
                resource_ids: List[str] = None,
               chat_history: List[Dict[str, str]] = None,
               summary: str = None,
               stream: bool = False,
               token: str = None) -> Any:
        
        resource_ids = resource_ids or []
        chat_history = chat_history or []
        
        # 0. Output Governor Prep
        governor = OutputGovernor(user_id, session_id, "unknown")
        
        # --- POLICY: INTENT EVALUATION (Eager Check) ---
        intent_id = "general_request"
        # Proxy for intent classification: check for destructive keywords
        destructive_keywords = ["delete database", "drop table", "destroy database", "delete bank", "delete production", "delete the production database"]
        if any(kw in prompt.lower() for kw in destructive_keywords):
            intent_id = "admin_destructive_action"
            
        intent_decision = self.policy_engine.evaluate_intent(intent_id, user_id)
        
        self.memory_manager.log_trace(session_id, user_id, "intent_detection", {
            "intent": intent_id,
            "allowed": intent_decision["allowed"],
            "reason": intent_decision.get("reason")
        })

        if not intent_decision["allowed"]:
            logger.warning(f"🛡️ [Policy] Intent REJECTED: {intent_decision['reason']}")
            # We skip background persistence for rejected hostile intents
            return governor.package(f"I'm sorry, I cannot perform that action. {intent_decision['reason']}")

        # 0. Check Resource Statuses (Metadata Awareness)
        status_text = ""
        if resource_ids:
            status_notes = []
            for rid in resource_ids:
                meta = self.processor.get_resource_metadata(rid, token=token)
                if meta:
                    status = meta.get('ingestionStatus', 'completed')
                    if status != 'completed':
                        status_notes.append(f"- '{meta.get('title')}' is currently: {status}")
            
            if status_notes:
                status_text = "### CRITICAL SERVICE STATUS (INGESTION IN PROGRESS):\n"
                status_text += "The following resources the user is asking about are NOT fully ready. You MUST acknowledge this status to the user:\n"
                status_text += "\n".join(status_notes) + "\n\n"

        system_text = status_text + self._get_system_prompt()

        # [SYSTEM] Aperture implementation: Parallel Context Assembly
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            self.memory_manager.log_trace(session_id, user_id, "aperture_start", {"query": prompt[:100]})
            learner_context = loop.run_until_complete(
                self.context_assembler.assemble(
                    query=prompt,
                    user_id=user_id,
                    resource_ids=resource_ids,
                    token=token
                )
            )
            # Transform to narrative situation report
            situation_report = learner_context.to_system_narrative()
            system_text += f"\n\n{situation_report}"
            self.memory_manager.log_trace(session_id, user_id, "aperture_end", {
                "memory_hits": len(learner_context.memories),
                "resource_hits": len(learner_context.resources)
            })
        except Exception as e:
            logger.error(f"Aperture assembly failed: {e}")
            self.memory_manager.log_trace(session_id, user_id, "aperture_error", {"error": str(e)})
        finally:
            loop.close()

        # 3. Construct Messages
        from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
        
        messages = [SystemMessage(content=system_text)]
        
        # Inject Summary if available
        if summary:
            logger.info("🎬 [Agent] Injecting conversation summary into Context.")
            messages.append(SystemMessage(content=f"## PREVIOUS CONVERSATION SUMMARY:\n{summary}\n\nUse the above summary to maintain continuity with older parts of the conversation."))
        
        # Inject Chat History
        for msg in chat_history:
            role = msg.get('role')
            content = msg.get('content')
            if role == 'user':
                messages.append(HumanMessage(content=content))
            elif role == 'assistant':
                messages.append(AIMessage(content=content))
        
        # Current Message
        if status_text:
            messages.append(SystemMessage(content=f"IMPORTANT STATUS REMINDER:\n{status_text}"))
            
        messages.append(HumanMessage(content=prompt))


        # --- NEURAL SWARM ROUTING ---
        # First, check if this request should be handled by a specialist sub-agent
        specialist_used = None
        try:
            swarm_response = swarm_instance.route_and_solve(prompt, user_id, token, chat_history, base_messages=messages)
            if swarm_response != "GENERAL_FALLBACK":
                logger.info("🐝 [Agent] Request solved by Neural Swarm Specialist.")
                self.memory_manager.save_interaction(session_id, user_id, prompt, swarm_response)
                
                # Log specialist usage to traces
                self.memory_manager.log_trace(session_id, user_id, "specialist_routing", {
                    "specialist": swarm_instance.get_last_specialist() or "unknown",
                    "status": "SUCCESS"
                })
                try:
                    from backend.hanachan.services.observability import obs_service
                    obs_service.log_event("swarm_task", user_id, "specialist_invoked", "SUCCESS", {
                        "prompt": prompt[:50],
                        "response_summary": swarm_response[:50]
                    })
                except: pass
                
                # [SYSTEM] Result is now a Governed Package
                # Specialist outputs might contain artifact references (JSON or IDs)
                import re
                p_artifact_ids = re.findall(r'[0-9a-fA-F]{24}', str(swarm_response))
                p_artifacts = []
                for aid in set(p_artifact_ids):
                    try:
                        from services.artifact_service import ArtifactService
                        art = ArtifactService.get_artifact(aid)
                        if art:
                            p_artifacts.append({
                                "id": aid,
                                "type": art.get("type"),
                                "title": art.get("title"),
                                "data": art.get("data"),
                                "metadata": art.get("metadata", {})
                            })
                    except: pass

                return governor.package(swarm_response, proposed_artifacts=p_artifacts)
        except Exception as e:
            logger.error(f"Swarm Error: {e}")
        # ----------------------------

        try:
            if stream:
                return self._stream_generator(messages, prompt, session_id, user_id, token=token)
            else:
                # [SYSTEM] Result is now a Unified Package
                package = self._run_agent_loop(messages, session_id, user_id, prompt, token=token)
                return package
        except Exception as e:
            logger.error(f"Agent Error: {e}")
            return governor.package(f"My neural core is currently recalibrating. (Error: {str(e)})")

    def _run_agent_loop(self, messages: List[Any], session_id: str, user_id: str, prompt: str, token: str = None) -> UnifiedOutput:
        """
        Handles a multi-turn execution loop with tool support.
        [SYSTEM] Managed iteration loop with Output Governance.
        """
        governor = OutputGovernor(user_id, session_id, "unknown") # TODO: Resolved conversation ID
        produced_artifact_ids = []
        
        max_iterations = self.policy_engine.max_iterations
        for i in range(max_iterations):
            # 1. Call LLM (Reasoning Proposal)
            response = self.llm_with_tools.invoke(messages)
            
            # 2. Check for tool calls (Action Proposals)
            if hasattr(response, 'tool_calls') and response.tool_calls:
                from langchain_core.messages import ToolMessage
                
                # Append AI message with tool calls
                messages.append(response)
                
                # [SYSTEM] Tool Execution with Policy Check
                tool_map = {t.name: t for t in self.tools}
                for tc in response.tool_calls:
                    t_name = tc['name']
                    t_args = tc['args']
                    
                    # [SYSTEM] TOUCH: Policy Engine Check
                    decision = self.policy_engine.evaluate_tool_call(t_name, user_id)
                    
                    if not decision["allowed"]:
                        logger.warning(f"🚫 [Policy] Tool execution REJECTED: {t_name}. Reason: {decision['reason']}")
                        messages.append(ToolMessage(
                            content=f"SYSTEM REJECTION: {decision['reason']}. You must inform the user why this action cannot be taken.",
                            tool_call_id=tc['id']
                        ))
                        continue

                    tool = tool_map.get(t_name)
                    if tool:
                        logger.info(f"🛠️ [Agent] Executing tool: {t_name}")
                        # [SYSTEM] Enforce user_id scoping (No model can change this)
                        t_args['user_id'] = user_id
                        if 'token' in tool.args:
                            t_args['token'] = token
                        
                        try:
                            # [SYSTEM] Executes proposal
                            self.memory_manager.log_trace(session_id, user_id, "tool_start", {"tool": t_name, "args": t_args})
                            result = tool.invoke(t_args)
                            # Check if tool result mentions an artifact ID
                            import re
                            # Pattern to find MongoDB ObjectID or common UUID-like IDs
                            matches = re.findall(r'[0-9a-fA-F]{24}', str(result))
                            if matches: produced_artifact_ids.extend(matches)
                            
                            messages.append(ToolMessage(content=str(result), tool_call_id=tc['id']))
                            self.memory_manager.log_trace(session_id, user_id, "tool_end", {"tool": t_name, "status": "SUCCESS"})
                        except Exception as e:
                            logger.error(f"Tool execution failed ({t_name}): {e}")
                            messages.append(ToolMessage(content=f"Error: {str(e)}", tool_call_id=tc['id']))
                            self.memory_manager.log_trace(session_id, user_id, "tool_error", {"tool": t_name, "error": str(e)})
                
                # Continue loop to let LLM process tool results
                continue
            else:
                # No tool calls, this is the final answer
                content = response.content
                
                # [SYSTEM] Memory Governance Check
                # Decide if this response is memorable before saving (Fire-and-forget)
                memory_decision = self.policy_engine.evaluate_memory_save(content)
                if memory_decision:
                    # In a real async flow, this would be pushed to a background queue
                    logger.info(f"🧠 [Memory] Flagged for persistence: {memory_decision['rule_type']}")
                
                # Fetch real artifact data for Produced IDs
                artifacts_to_package = []
                for aid in set(produced_artifact_ids):
                    try:
                        from services.artifact_service import ArtifactService
                        art = ArtifactService.get_artifact(aid)
                        if art:
                            artifacts_to_package.append({
                                "id": aid,
                                "type": art.get("type"),
                                "title": art.get("title"),
                                "data": art.get("data"),
                                "metadata": art.get("metadata", {})
                            })
                    except: pass

                # Package final output
                package = governor.package(content, proposed_artifacts=None) # Tools already registered them
                # But we manually add the artifacts we found to the package for DTO
                for a in artifacts_to_package:
                    from schemas.output import PackageArtifact
                    package.artifacts.append(PackageArtifact(**a))

                self.memory_manager.save_interaction(session_id, user_id, prompt, content)
                return package
        
        # If we hit max iterations
        error_msg = "Agent loop exceeded maximum iterations."
        logger.warning(error_msg)
        return governor.package(f"I'm sorry, I'm having trouble finishing that task. ({error_msg})")

    def _stream_generator(self, messages: List[Any], user_prompt: str, session_id: str, user_id: str, token: str = None) -> Generator[str, None, None]:
        full_response = ""
        governor = OutputGovernor(user_id, session_id, "unknown") # TODO: Resolve conversation ID
        produced_artifact_ids = []
        try:
            # Note: Tool calling in streaming is complex. 
            # For now, we use non-streaming tools if a tool call is detected.
            # 1. Detect tool calls pre-stream
            initial_response = self.llm_with_tools.invoke(messages)
            
            if hasattr(initial_response, 'tool_calls') and initial_response.tool_calls:
                logger.info("🛠️ [Stream] Tool call detected. Diverting to tool execution.")
                from langchain_core.messages import ToolMessage
                messages.append(initial_response)
                
                tool_map = {t.name: t for t in self.tools}
                for tc in initial_response.tool_calls:
                    t_name = tc['name']
                    
                    # [SYSTEM] Policy Check
                    decision = self.policy_engine.evaluate_tool_call(t_name, user_id)
                    if not decision["allowed"]:
                        logger.warning(f"🚫 [Policy Stream] REJECTED: {t_name}")
                        messages.append(ToolMessage(
                            content=f"Access Denied: {decision['reason']}",
                            tool_call_id=tc['id']
                        ))
                        continue

                    tool = tool_map.get(t_name)
                    if tool:
                        t_args = tc['args']
                        t_args['user_id'] = user_id
                        if 'token' in tool.args: t_args['token'] = token
                        result = tool.invoke(t_args)

                        # Intercept Artifacts
                        import json
                        try:
                            res_data = json.loads(str(result))
                            if isinstance(res_data, dict) and "artifact_id" in res_data:
                                logger.info(f"🎨 [Stream] Found artifact in tool output: {res_data['title']}")
                                artifact_info = {
                                    "id": res_data["artifact_id"],
                                    "type": res_data["type"],
                                    "title": res_data["title"],
                                    "data": {} # Minimal data, frontend will fetch full content if needed or use ID
                                }
                                yield f"__METADATA__:{json.dumps({'artifacts': [artifact_info]})}\n"
                                
                                # Use clean message for LLM context so it doesn't hallucinate JSON
                                result = res_data.get("display_message", str(result))
                        except Exception:
                            pass # Not JSON or not artifact, ignore

                        messages.append(ToolMessage(content=str(result), tool_call_id=tc['id']))
                
                # Stream the final conclusion
                for chunk in self.llm.stream(messages):
                    content = chunk.content
                    full_response += content
                    yield content
            else:
                # Direct stream
                for chunk in self.llm.stream(messages):
                    content = chunk.content
                    full_response += content
                    yield content
            
            # Save interaction after streaming completes
            self.memory_manager.save_interaction(session_id, user_id, user_prompt, full_response)
            
        except Exception as e:
            error_str = str(e).lower()
            if "rate limit" in error_str or "429" in error_str:
                logger.error(f"⚠️ [Agent Stream] Groq Rate Limit Hit: {e}")
                yield "My neural pathways are currently overloaded (Rate Limit Exceeded). Please wait a moment."
            else:
                logger.error(f"Streaming error: {e}")
                yield "I encountered a neural synchronization error."
