from typing import List, Any, Dict, Optional
from pydantic import BaseModel, Field

class SkillCard(BaseModel):
    """
    A unified definition of a specialized capability for Hanachan.
    Inspired by 'Skill Cards' - modular, self-contained agent abilities.
    """
    name: str = Field(..., description="The name of the skill (e.g., 'Strategic Planning')")
    description: str = Field(..., description="What this skill does for the user")
    persona_extension: str = Field(..., description="Instructional prompt to add to Hanachan's behavior when using this skill")
    tools: List[str] = Field(default_factory=list, description="Names of the Python functions (tools) associated with this skill")
    
    def get_system_prompt(self) -> str:
        return f"### SKILL ACTIVE: {self.name} ###\n{self.description}\n\nBEHAVIORAL OVERLAY:\n{self.persona_extension}"

class SkillRegistry:
    """Central registry of Hanachan's Skill Cards."""
    def __init__(self):
        self.cards: Dict[str, SkillCard] = {}
        self._load_default_cards()

    def _load_default_cards(self):
        """Discovers and loads Skill Cards from the cards/ directory."""
        import os
        import json
        
        cards_dir = os.path.join(os.path.dirname(__file__), "cards")
        if not os.path.exists(cards_dir):
            return

        for filename in os.listdir(cards_dir):
            if filename.endswith(".json"):
                try:
                    path = os.path.join(cards_dir, filename)
                    with open(path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        card = SkillCard(**data)
                        self.register(card)
                        # We also register the name as a valid specialist
                except Exception as e:
                    print(f"Failed to load skill card {filename}: {e}")

    def register(self, card: SkillCard):
        self.cards[card.name.lower()] = card

    def get_card(self, name: str) -> Optional[SkillCard]:
        return self.cards.get(name.lower())

skill_registry = SkillRegistry()
