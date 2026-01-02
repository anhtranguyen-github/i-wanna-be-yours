def estimate_tokens(text: str) -> int:
    """
    Heuristic to estimate token count.
    Roughly 4 characters per token for English.
    """
    if not text:
        return 0
    return len(text) // 4
