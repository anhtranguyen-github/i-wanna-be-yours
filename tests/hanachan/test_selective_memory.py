import os
import sys
import json
import logging
from datetime import datetime

# Add backend/hanachan to path to import services
sys.path.append(os.path.join(os.getcwd(), 'backend', 'hanachan'))

from services.memory_evaluator import MemoryEvaluator

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger("TestSelectiveMemory")

def run_test():
    evaluator = MemoryEvaluator()
    
    test_cases = [
        {
            "name": "Noise (Greeting)",
            "user": "Hi there Hanachan, how are you today?",
            "agent": "Hello! I am doing great, thank you for asking. How can I help you with your Japanese studies today?"
        },
        {
            "name": "Permanent Fact (Job/Goal)",
            "user": "I am a neurosurgeon and I want to learn Japanese so I can work in Tokyo next year.",
            "agent": "That is an incredible goal! Working in Tokyo as a neurosurgeon will definitely require high-level professional Japanese."
        },
        {
            "name": "Session Roleplay (Temporary)",
            "user": "For this conversation, let's pretend we are in a busy ramen shop in Shinjuku and you are the grumpy chef.",
            "agent": "Fine. *grunts* SIT DOWN! What do you want? Don't take all day, I have people waiting!"
        },
        {
            "name": "Preference (Learning Style)",
            "user": "I really prefer learning with visual charts rather than just list of words.",
            "agent": "Understood! I will try to use more visual descriptions and table-based summaries for our sessions."
        },
        {
            "name": "Small Talk (No Data)",
            "user": "The weather is quite nice today, isn't it?",
            "agent": "Yes, it's a beautiful sunny day! Perfect for a walk."
        }
    ]

    print("\n" + "="*60)
    print("🚀 STARTING SELECTIVE MEMORY LOGIC TEST")
    print("="*60 + "\n")

    results = []
    for case in test_cases:
        print(f"🧪 Testing: {case['name']}")
        print(f"   User: {case['user']}")
        
        # We run the real evaluator logic here
        result = evaluator.evaluate_interaction(case['user'], case['agent'])
        
        is_memorable = result.get('is_memorable', False)
        scope = result.get('scope', 'none')
        category = result.get('category', 'generic')
        reason = result.get('reason', 'N/A')
        
        status_icon = "✅" if is_memorable else "⏭️"
        print(f"   Result: {status_icon} [Memorable: {is_memorable}] | [Scope: {scope}] | [Category: {category}]")
        print(f"   Reason: {reason}")
        print("-" * 40)
        
        results.append({
            "case": case['name'],
            "is_memorable": is_memorable,
            "scope": scope,
            "category": category
        })

    print("\n" + "="*60)
    print("📊 SUMMARY")
    print("="*60)
    for r in results:
        m_str = "STORE" if r['is_memorable'] else "SKIP"
        print(f"{m_str:<6} | {r['scope']:<10} | {r['case']}")
    print("="*60 + "\n")

if __name__ == "__main__":
    run_test()
