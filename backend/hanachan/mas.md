Agent Name,Role,Key Responsibility,Underlying Tech & Tools
Sensei,Orchestrator,"Manages the ""Student Model,"" decides strictly what the user needs (encouragement vs. correction), and routes tasks to other agents.",LLM (GPT-4/Claude) + System Prompts (State Management).
Pitch Accent Coach,Prosody Expert,"Analyzes audio for pitch patterns (Heiban, Atamadaka, etc.) to ensure the user doesn't sound robotic.","OJAD, Suzuki-kun, Python (Librosa)."
The Kanji Master,Script Expert,"Breaks down Kanji (radicals, strokes) and detects handwriting errors.","Kanji Alive API, KanjiVG, Tesseract OCR."
Grammar Police,Syntax Analyst,"Explains strict syntax rules (e.g., particles wa vs. ga) using logic rather than LLM probability.","MeCab, SudachiPy, GiNZA (Dependency Parsing)."
Keigo Consultant,Culture Expert,Context checker. Ensures appropriate politeness levels (Sonkeigo/Kenjougo) based on who the user is talking to.,Rule-based classifiers + LLM context.
Scenario Actor,Practice Partner,"The immersion partner. Stays in character (e.g., Ramen Chef) to provide realistic dialogue practice.","LLM with ""Persona"" prompts."


Strategic Insights on Your Stack
1. The "Pitch Accent Coach" Necessity Using standard LLMs for Japanese audio evaluation is often insufficient because they focus on semantics (meaning), not prosody (music of the language). By integrating Librosa and OJAD, you ensure the user actually sounds natural.

2. The "Grammar Police" Logic LLMs are great at generating text but can sometimes "hallucinate" incorrect grammar explanations. Using MeCab (a morphological analyzer) ensures that when a user asks why a particle is wrong, the answer is based on linguistic fact, not statistical probability.

3. The Loop The Sensei is the critical piece here. It stops the Scenario Actor from breaking character.

Flow: User makes a mistake -> Scenario Actor responds naturally (ignoring the mistake or reacting with confusion) -> Sensei flags the mistake -> Sensei calls Grammar Police or Pitch Coach -> Sensei presents the correction to the user after the interaction or in a side-note.


