"""
Agent Router — intent classification and routing to correct agent.
Owner: Member 1 — Backend & RAG Lead
"""
import re
from loguru import logger

from backend.agents.agent2_copilot.copilot_agent import CopilotAgent
from backend.agents.agent3_maintenance.maintenance_agent import MaintenanceAgent
from backend.agents.agent4_compliance.compliance_agent import ComplianceAgent
from backend.agents.agent5_lessons.lessons_agent import LessonsAgent
from backend.agents.agent6_pid.pid_agent import PIDAgent

# ---------------------------------------------------------------------------
# Intent patterns — order matters (more specific first)
# ---------------------------------------------------------------------------
INTENT_PATTERNS: dict[str, list[str]] = {
    "maintenance": [
        r"fail(?:ure|ed|ing)?", r"break(?:down)?", r"predict(?:ive)?",
        r"maintenance", r"repair", r"replace", r"overhaul",
        r"rca", r"root.cause", r"vibrat(?:ion)?", r"probabilit",
        r"risk.level", r"bearing", r"seal.fail", r"impeller",
        r"when.will.*fail", r"days.to.failure",
    ],
    "compliance": [
        r"compli(?:ance)?", r"regulat(?:ion|ory)?", r"oisd",
        r"factory.act", r"peso", r"audit", r"certificat(?:e|ion)?",
        r"overdue", r"gap", r"inspection.due", r"statutory",
        r"legal", r"clause", r"section.\d+",
    ],
    "lessons": [
        r"lesson(?:s.learned)?", r"pattern", r"warning",
        r"similar.*incident", r"previous.*failure", r"recur(?:ring)?",
        r"past.*incident", r"history.*failure", r"happened.before",
    ],
    "pid": [
        r"p&id", r"piping", r"fail.*affect", r"downstream",
        r"impact.analysis", r"isolat(?:ion)?", r"which.*valve",
        r"drawing", r"process.flow", r"feeds.into", r"upstream",
    ],
    "knowledge": [
        # Default for general questions
        r"how.(?:do|to|should)", r"what.is", r"procedure",
        r"manual", r"step.by.step", r"torque", r"specification",
        r"temperature", r"pressure.limit",
    ],
}


class AgentRouter:
    """
    Routes incoming queries to the correct specialist agent.

    Uses regex intent classification to determine agent type,
    then delegates to the appropriate agent for processing.
    """

    def __init__(self):
        logger.info("Initialising AgentRouter with all 5 specialist agents...")
        self.agents = {
            "knowledge": CopilotAgent(),
            "maintenance": MaintenanceAgent(),
            "compliance": ComplianceAgent(),
            "lessons": LessonsAgent(),
            "pid": PIDAgent(),
        }
        logger.success("AgentRouter ready")

    # ------------------------------------------------------------------
    def route(
        self,
        question: str,
        equipment_tag: str | None = None,
        metadata: dict | None = None,
    ) -> dict:
        """
        Classify intent and route to correct agent.

        Returns agent response dict with added routing metadata.
        """
        intent = self.classify_intent(question)
        logger.info(f"Routing → {intent} agent | Q: {question[:60]}...")

        agent = self.agents.get(intent, self.agents["knowledge"])

        try:
            result = agent.process(
                question=question,
                equipment_tag=equipment_tag,
                metadata=metadata or {},
            )
            result["routed_to_agent"] = intent
            return result
        except Exception as e:
            logger.error(f"Agent {intent} failed: {e}")
            # Fallback to copilot
            result = self.agents["knowledge"].process(
                question=question,
                equipment_tag=equipment_tag,
                metadata=metadata or {},
            )
            result["routed_to_agent"] = "knowledge"
            result["routing_fallback"] = True
            return result

    def classify_intent(self, question: str) -> str:
        """Classify query intent using regex pattern matching."""
        text = question.lower()
        scores: dict[str, int] = {}

        for intent, patterns in INTENT_PATTERNS.items():
            score = sum(1 for p in patterns if re.search(p, text))
            if score > 0:
                scores[intent] = score

        if not scores:
            return "knowledge"  # Default

        # Return intent with highest score
        return max(scores, key=lambda k: scores[k])
