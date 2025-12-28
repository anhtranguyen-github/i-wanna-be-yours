
# Simple heuristic token counter
# Fallback when tiktoken is not available

def estimate_tokens(text: str) -> int:
    """
    Estimate the number of tokens in a text string.
    Uses a simple heuristic: 1 token ~= 4 characters.
    """
    if not text:
        return 0
    return len(text) // 4
