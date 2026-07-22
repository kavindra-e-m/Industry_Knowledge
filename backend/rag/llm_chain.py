"""
LLM chain — Gemini 1.5 Flash via LangChain + Redis caching.
Owner: Member 1 — Backend & RAG Lead
"""
import hashlib
import json
from loguru import logger

import google.generativeai as genai
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import HumanMessage, SystemMessage

from backend.config.settings import settings


def _get_redis():
    """Lazy-load Redis for response caching."""
    try:
        import redis
        r = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            db=0,
            decode_responses=True,
            socket_timeout=2,
        )
        r.ping()
        return r
    except Exception:
        return None


_redis_client = None


def _get_cached_redis():
    global _redis_client
    if _redis_client is None:
        _redis_client = _get_redis()
    return _redis_client


def get_llm():
    """Instantiate configured LLM (Groq or Gemini)."""
    if settings.GROQ_API_KEY:
        from langchain_groq import ChatGroq
        logger.info(f"Using Groq LLM: {settings.GROQ_MODEL}")
        return ChatGroq(
            model=settings.GROQ_MODEL,
            groq_api_key=settings.GROQ_API_KEY,
            temperature=settings.GROQ_TEMPERATURE,
            max_tokens=settings.GROQ_MAX_TOKENS,
        )

    if not settings.GEMINI_API_KEY:
        raise ValueError(
            "Neither GROQ_API_KEY nor GEMINI_API_KEY is set. Add one to your .env file."
        )

    logger.info(f"Using Gemini LLM: {settings.GEMINI_MODEL}")
    genai.configure(api_key=settings.GEMINI_API_KEY)
    return ChatGoogleGenerativeAI(
        model=settings.GEMINI_MODEL,
        google_api_key=settings.GEMINI_API_KEY,
        temperature=settings.GEMINI_TEMPERATURE,
        max_output_tokens=settings.GEMINI_MAX_TOKENS,
        convert_system_message_to_human=True,
    )


def call_llm(
    system_prompt: str,
    user_prompt: str,
    use_cache: bool = True,
    cache_ttl: int = 3600,
) -> str:
    """
    Call Gemini 1.5 Flash with system + user prompts.
    Caches responses in Redis by prompt hash (optional).

    Returns the response text, or an error string starting with "Error:".
    """
    # Generate cache key
    cache_key = None
    if use_cache:
        prompt_hash = hashlib.sha256(
            f"{system_prompt}|||{user_prompt}".encode()
        ).hexdigest()[:16]
        cache_key = f"llm_cache:{prompt_hash}"

        redis = _get_cached_redis()
        if redis:
            try:
                cached = redis.get(cache_key)
                if cached:
                    logger.debug(f"LLM cache hit: {cache_key}")
                    return cached
            except Exception:
                pass

    # Call LLM
    try:
        llm = get_llm()
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt),
        ]
        response = llm.invoke(messages)
        answer = response.content

        # Cache the response
        if use_cache and cache_key:
            redis = _get_cached_redis()
            if redis:
                try:
                    redis.setex(cache_key, cache_ttl, answer)
                except Exception:
                    pass

        return answer

    except Exception as e:
        logger.error(f"LLM call failed: {e}")
        return f"Error: {str(e)}"


def call_llm_streaming(system_prompt: str, user_prompt: str):
    """Generator that streams tokens from Gemini 1.5 Flash."""
    try:
        llm = get_llm()
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt),
        ]
        for chunk in llm.stream(messages):
            if hasattr(chunk, "content") and chunk.content:
                yield chunk.content
    except Exception as e:
        logger.error(f"LLM streaming failed: {e}")
        yield f"Error: {str(e)}"
