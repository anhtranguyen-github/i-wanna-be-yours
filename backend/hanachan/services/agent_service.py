from datetime import datetime
from typing import List, Dict, Any
from schemas.chat import AgentRequest, AgentResponse, ResponseItemDTO, ArtifactContent, ChatMessageDTO
from services.conversation_service import ConversationService
from services.artifact_service import ArtifactService
from models.message import ChatMessage
from models.artifact import MessageArtifact
from models.action import ProposedTask, Suggestion
from models.content.flashcard import FlashcardSet, Flashcard
from models.content.mindmap import Mindmap, MindmapNode
from models.content.audio import AudioContent
from models.content.vocabulary import VocabularySet, VocabularyItem
from models.content.quiz import QuizSet, QuizQuestion, QuizOption
from database.database import db

class AgentService:
    def __init__(self):
        self.conv_service = ConversationService()

    def invoke_agent(self, request_data: AgentRequest) -> AgentResponse:
        # 1. Validation Logic checks (Pydantic handled this at route)
        
        # 2. Persist User Request
        # Map AgentRequest (Pydantic) -> ChatMessage (DB)
        # We need to find the conversation_id. 
        # For MVP, assume we look up by sessionId or create.
        from models.conversation import Conversation
        conv = Conversation.query.filter_by(session_id=request_data.session_id).first()
        if not conv:
            # Create new if missing
            conv_service = ConversationService()
            conv_dict = conv_service.create_conversation(request_data.user_id, "New Session")
            conv = Conversation.query.get(conv_dict['id'])
            # Update session_id to match request if needed, or query assumption
            conv.session_id = request_data.session_id
            db.session.commit()

        # Save User Message with Configuration
        user_msg = ChatMessage(
            conversation_id=conv.id,
            role="user",
            content=request_data.prompt,
            context_configuration=request_data.context_config.dict() if request_data.context_config else None
        )
        if request_data.context_config and request_data.context_config.resource_ids:
            # We skip linking old Postgres 'Resource' objects (attachments)
            # Instead we rely on context_configuration storing the IDs
            pass
            
        db.session.add(user_msg)
        db.session.commit()

        # 3. Generate Logic (Mocking the complex response structure)
        # Verify persistence and get attachments
        # saved_user_msg = ChatMessage.query.get(user_msg.id) # No longer needed for attachments
        
        # Use MockAgent from agent folder
        from agent.mock_agent import MockAgent
        agent = MockAgent()
        
        resource_ids = request_data.context_config.resource_ids if request_data.context_config else []

        debug_response = agent.generate_debug_response(
            prompt=request_data.prompt,
            session_id=request_data.session_id,
            user_id=request_data.user_id,
            context_config=request_data.context_config.dict() if request_data.context_config else {},
            message_id=user_msg.id,
            resource_ids=resource_ids
        )
        
        # Extract fields
        content_text = debug_response.get("content", "")
        tasks_data = debug_response.get("tasks", [])
        suggestions_data = debug_response.get("suggestions", [])
        artifacts_data = debug_response.get("artifacts", [])

        # create assistant message container
        asst_msg = ChatMessage(
            conversation_id=conv.id,
            role="assistant",
            content=content_text
        )
        db.session.add(asst_msg)
        db.session.commit()
        
        response_items = [
            ResponseItemDTO(
                responseId=str(asst_msg.id),
                type="text",
                content=content_text
            )
        ]

        # Process Artifacts
        for art in artifacts_data:
            a_type = art.get("type")
            a_title = art.get("title")
            a_data = art.get("data")
            
            new_artifact = MessageArtifact(
                message_id=asst_msg.id,
                type=a_type,
                title=a_title,
                metadata_=art.get("sidebar", {})
            )

            # Sync to Mongo for Sidebar API
            mongo_artifact = ArtifactService.create_artifact(
                user_id=request_data.user_id,
                artifact_type=a_type,
                title=a_title,
                data=a_data,
                metadata=art.get("sidebar", {}),
                conversation_id=str(conv.id),
                message_id=str(asst_msg.id),
                save_to_library=False
            )
            
            # Update SQL artifact with Mongo ID link
            new_artifact.artifact_external_id = mongo_artifact["_id"]
            
            content_dto = ArtifactContent(title=a_title)
            
            if a_type == "flashcard":
                fc_set = FlashcardSet(title=a_title)
                db.session.add(fc_set)
                db.session.flush()
                
                cards_list = []
                for c in a_data.get("cards", []):
                    card = Flashcard(set_id=fc_set.id, front=c['front'], back=c['back'])
                    db.session.add(card)
                    cards_list.append(c)
                
                new_artifact.flashcard_set_id = fc_set.id
                content_dto.flashcards = {"id": fc_set.id, "title": a_title, "cards": cards_list}

            elif a_type == "mindmap":
                mm = Mindmap(title=a_title)
                db.session.add(mm)
                db.session.flush()
                
                root_data = a_data.get("root", {})
                root_node = MindmapNode(mindmap_id=mm.id, label=root_data.get("label", "Root"))
                db.session.add(root_node)
                db.session.flush()
                
                nodes_list = a_data.get("nodes", [])
                children_dtos = []
                for n in nodes_list:
                    child = MindmapNode(mindmap_id=mm.id, label=n['label'], parent_node_id=root_node.id)
                    db.session.add(child)
                    children_dtos.append({'id': -1, 'label': n['label'], 'parentId': root_node.id, 'children': []})
                
                new_artifact.mindmap_id = mm.id
                content_dto.mindmap = {
                    "id": mm.id, 
                    "title": a_title, 
                    "nodes": [{
                        "id": root_node.id, 
                        "label": root_node.label, 
                        "parentId": None,
                        "children": children_dtos
                    }]
                }

            elif a_type == "task":
                from models.action import ProposedTask
                t_data = a_data.get("task", {})
                new_task = ProposedTask(
                    message_id=asst_msg.id,
                    title=t_data.get("title"),
                    prompt=t_data.get("description"),
                    task_external_id=f"task-{asst_msg.id}"
                )
                db.session.add(new_task)
                db.session.flush()
                
                new_artifact.task_id = new_task.id
                content_dto.task = new_task.to_dict()

            elif a_type == "vocabulary":
                vs = VocabularySet(title=a_title)
                db.session.add(vs)
                db.session.flush()
                
                items_list = []
                for i in a_data.get("items", []):
                    item = VocabularyItem(set_id=vs.id, word=i['word'], definition=i['definition'], example=i.get('example'))
                    db.session.add(item)
                    items_list.append(i)

                new_artifact.vocabulary_set_id = vs.id
                content_dto.vocabulary = {"id": vs.id, "title": a_title, "items": items_list}

            elif a_type == "quiz":
                # Create Quiz Set
                qs = QuizSet(
                    title=a_title,
                    description=a_data.get("description"),
                    creator_id=request_data.user_id,
                    quiz_type=a_data.get("quizType", "quiz"),
                    level=a_data.get("level"),
                    skill=a_data.get("skill"),
                    time_limit_minutes=a_data.get("timeLimitMinutes")
                )
                db.session.add(qs)
                db.session.flush()
                
                # Create questions
                questions_list = []
                for idx, q in enumerate(a_data.get("questions", [])):
                    question = QuizQuestion(
                        set_id=qs.id,
                        question_type=q.get("type", "multiple_choice"),
                        content=q.get("content", ""),
                        passage=q.get("passage"),
                        audio_url=q.get("audioUrl"),
                        correct_answer=q.get("correctAnswer", "a"),
                        explanation=q.get("explanation", ""),
                        skill=q.get("skill"),
                        difficulty=q.get("difficulty", 3),
                        order_index=idx
                    )
                    db.session.add(question)
                    db.session.flush()
                    
                    # Add options
                    for opt in q.get("options", []):
                        option = QuizOption(
                            question_id=question.id,
                            option_id=opt.get("id", "a"),
                            text=opt.get("text", ""),
                            order_index=0
                        )
                        db.session.add(option)
                    
                    questions_list.append(q)
                
                new_artifact.quiz_set_id = qs.id
                content_dto.quiz = {
                    "id": qs.id, 
                    "title": a_title, 
                    "quizType": a_data.get("quizType", "quiz"),
                    "level": a_data.get("level"),
                    "skill": a_data.get("skill"),
                    "timeLimitMinutes": a_data.get("timeLimitMinutes"),
                    "questionCount": len(questions_list),
                    "questions": questions_list
                }

            db.session.add(new_artifact)
            db.session.flush()
            
            resp_item = ResponseItemDTO(
                responseId=mongo_artifact["_id"],
                type=a_type,
                content=content_dto,
                sidebar=art.get("sidebar"),
                metadata=art.get("metadata")
            )
            response_items.append(resp_item)

        db.session.commit()

        # Return strict AgentResponse
        return AgentResponse(
            sessionId=request_data.session_id,
            userId=request_data.user_id,
            status="completed",
            responses=response_items, 
            proposedTasks=tasks_data,
            suggestions=suggestions_data
        )
