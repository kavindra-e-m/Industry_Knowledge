"""
Impact Analyser — BFS-based downstream impact analysis on P&ID connection graph.
Owner: Member 2 — ML & Document Intelligence Lead
"""
from collections import deque
from loguru import logger


class ImpactAnalyser:
    """
    Analyse downstream impact when a piece of equipment fails.

    The connection_graph is an adjacency dict:
        { "P-101": ["E-101", "V-101"], "E-101": ["T-101"], ... }

    where an edge A → B means B is downstream of A (A feeds into B).
    """

    def __init__(self, connection_graph: dict[str, list[str]] | None = None):
        self.graph: dict[str, list[str]] = connection_graph or {}
        # Build reverse graph for upstream traversal
        self._reverse: dict[str, list[str]] = {}
        self._build_reverse()

    def load_graph(self, graph: dict[str, list[str]]):
        self.graph = graph
        self._build_reverse()

    def _build_reverse(self):
        self._reverse = {}
        for src, dsts in self.graph.items():
            for dst in dsts:
                self._reverse.setdefault(dst, []).append(src)

    # ------------------------------------------------------------------
    def analyse_impact(
        self,
        failed_equipment: str,
        max_depth: int = 6,
    ) -> dict:
        """
        BFS from failed_equipment to find all downstream affected equipment.

        Returns:
            {
                failed_equipment: str,
                affected_equipment: list[{equipment, depth, path}],
                direct_impact: list[str],  # depth == 1
                indirect_impact: list[str],  # depth > 1
                impact_count: int,
                propagation_summary: str,
            }
        """
        if failed_equipment not in self.graph:
            logger.warning(f"{failed_equipment} not found in connection graph")
            return {
                "failed_equipment": failed_equipment,
                "affected_equipment": [],
                "direct_impact": [],
                "indirect_impact": [],
                "impact_count": 0,
                "propagation_summary": f"{failed_equipment} not found in P&ID graph.",
            }

        visited: set[str] = set()
        queue: deque = deque([(failed_equipment, 0, [failed_equipment])])
        affected: list[dict] = []

        while queue:
            current, depth, path = queue.popleft()
            if current in visited or depth > max_depth:
                continue
            visited.add(current)

            if current != failed_equipment:
                affected.append({
                    "equipment": current,
                    "depth": depth,
                    "path": " → ".join(path),
                })

            for downstream in self.graph.get(current, []):
                if downstream not in visited:
                    queue.append((downstream, depth + 1, path + [downstream]))

        direct = [a["equipment"] for a in affected if a["depth"] == 1]
        indirect = [a["equipment"] for a in affected if a["depth"] > 1]

        summary = (
            f"Failure of {failed_equipment} directly impacts {len(direct)} equipment "
            f"and indirectly affects {len(indirect)} downstream assets across "
            f"up to {max(a['depth'] for a in affected) if affected else 0} process stages."
        )

        return {
            "failed_equipment": failed_equipment,
            "affected_equipment": affected,
            "direct_impact": direct,
            "indirect_impact": indirect,
            "impact_count": len(affected),
            "propagation_summary": summary,
        }

    def get_isolation_path(self, equipment: str) -> dict:
        """
        Traverse upstream to find all isolation valves needed before maintenance.

        Returns:
            {
                equipment: str,
                upstream_equipment: list[str],
                isolation_valves: list[str],
                note: str,
            }
        """
        upstream: list[str] = []
        valves: list[str] = []
        visited: set[str] = set()
        queue: deque = deque([equipment])

        while queue:
            current = queue.popleft()
            if current in visited:
                continue
            visited.add(current)

            for up in self._reverse.get(current, []):
                if up not in visited:
                    upstream.append(up)
                    # Detect valve tags (starts with V- or CV- or SV- or contains "valve")
                    tag_upper = up.upper()
                    if (
                        tag_upper.startswith("V-") or
                        tag_upper.startswith("CV-") or
                        tag_upper.startswith("SV-") or
                        "valve" in up.lower()
                    ):
                        valves.append(up)
                    queue.append(up)

        return {
            "equipment": equipment,
            "upstream_equipment": list(set(upstream)),
            "isolation_valves": list(set(valves)),
            "note": (
                "SAFETY: Close ALL listed isolation valves before commencing maintenance. "
                "Verify gas-free / depressurised before opening equipment. "
                "Issue Permit to Work per plant PTW procedure."
            ),
        }

    def get_critical_path(self, equipment: str) -> list[str]:
        """Return the longest downstream chain from this equipment."""
        if equipment not in self.graph:
            return [equipment]

        best_path: list[str] = [equipment]

        def dfs(node: str, path: list[str], visited: set):
            nonlocal best_path
            if len(path) > len(best_path):
                best_path = list(path)
            for downstream in self.graph.get(node, []):
                if downstream not in visited:
                    visited.add(downstream)
                    dfs(downstream, path + [downstream], visited)
                    visited.discard(downstream)

        dfs(equipment, [equipment], {equipment})
        return best_path
