def content_to_text(content) -> str:
    """Convert LLM message content (str or list of blocks) into plain text."""
    if content is None:
        return ""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for block in content:
            if isinstance(block, str):
                parts.append(block)
            elif isinstance(block, dict) and block.get("type") == "text":
                parts.append(block.get("text", ""))
        return "".join(parts)
    return str(content)

def extract_text(content)->str:
    """Normalize llm output to a plain string."""
    if isinstance(content,str):
        return content
    if isinstance(content,list):
        return "".join(
            block.get("text","")
            for block in content
            if isinstance(block,dict) and block.get("type")== "text"
        )
    return str(content)