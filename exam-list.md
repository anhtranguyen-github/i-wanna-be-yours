JLPT PRACTICE PLATFORM – LIST SCREEN WIREFRAME

==================================================
SCREEN: Practice / Exam List
==================================================

------------------------------------------
Top Title
------------------------------------------
JLPT Practice


------------------------------------------
Mode Selection Bar
------------------------------------------
[ All ]   [ Quiz ]   [ Single Exam ]   [ Full Exam ]

- This is a segmented control
- Only one mode can be active at a time
- Default selected: All
- Switching mode filters the list below
- No page reload when switching


------------------------------------------
Filter Bar
------------------------------------------
[ Filter ]   [ Level: All ]   [ Skill: All ]

- Filters apply to all modes
- Skill filter is disabled when Full Exam is selected
- Filters update the list instantly


------------------------------------------
List Area
------------------------------------------

--------------------------------------------------
| Quiz Card                                      |
--------------------------------------------------
| Icon: Quiz                                    |
| Title: N3 Mixed Practice                      |
| Tags: N3 · Grammar · Reading                  |
| Questions: 20                                 |
| Time: Unlimited / Custom                      |
| Description: Mixed JLPT practice              |
|                                   [ Start ]  |
--------------------------------------------------


--------------------------------------------------
| Quiz Card                                      |
--------------------------------------------------
| Icon: Quiz                                    |
| Title: Vocabulary Drill                       |
| Tags: N4 · Vocabulary                         |
| Questions: 30                                 |
| Time: Unlimited                               |
| Description: Kanji and vocabulary review      |
|                                   [ Start ]  |
--------------------------------------------------


--------------------------------------------------
| Single Exam Card                               |
--------------------------------------------------
| Icon: Single Exam                             |
| Title: N2 Grammar Exam                        |
| Skill: Grammar                                |
| Questions: JLPT format                        |
| Time: JLPT standard / Custom                  |
| Description: Skill-focused JLPT exam          |
|                                   [ Start ]  |
--------------------------------------------------


--------------------------------------------------
| Full Exam Card                                 |
--------------------------------------------------
| Icon: Full Exam                               |
| Title: JLPT N3 Full Exam                     |
| Sections: Language · Reading · Listening      |
| Time: JLPT standard / Custom                  |
| Description: Full JLPT exam                   |
|                                   [ Start ]  |
--------------------------------------------------


------------------------------------------
UX NOTES
------------------------------------------
- All cards share the same layout
- Only content changes based on mode
- Start button is the primary action
- No scores or progress shown on this screen
- The purpose of this screen is only to select a test


------------------------------------------
COMPONENT BREAKDOWN (FOR DEV)
------------------------------------------
- ModeSelector (All / Quiz / Single Exam / Full Exam)
- FilterBar (Level, Skill, optional extensions)
- TestList
- TestCard (reused for all test types)

==================================================
END OF WIREFRAME
==================================================
