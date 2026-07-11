from __future__ import annotations

"""LangGraph-compatible local state graph runner (Python 3.9 friendly).

On Python 3.10+, set GRAPH_BACKEND=langgraph and install langgraph to swap engines.
"""

from typing import Any, Callable, Dict, List, Optional, Union

from agent.state import AgentState

NodeFn = Callable[[AgentState], AgentState]
ConditionFn = Callable[[AgentState], str]

START = "__start__"
END = "__end__"


class StateGraph:
    def __init__(self, state_cls: type = AgentState) -> None:
        self.state_cls = state_cls
        self.nodes: Dict[str, NodeFn] = {}
        self.edges: Dict[str, str] = {}
        self.conditional_edges: Dict[str, Dict[str, Any]] = {}
        self.entry: Optional[str] = None

    def add_node(self, name: str, fn: NodeFn) -> None:
        self.nodes[name] = fn

    def set_entry_point(self, name: str) -> None:
        self.entry = name

    def add_edge(self, source: str, target: str) -> None:
        self.edges[source] = target

    def add_conditional_edges(
        self,
        source: str,
        condition: ConditionFn,
        mapping: Dict[str, str],
    ) -> None:
        self.conditional_edges[source] = {"condition": condition, "mapping": mapping}

    def compile(self) -> "CompiledGraph":
        if not self.entry:
            raise ValueError("Entry point required")
        return CompiledGraph(self)


class CompiledGraph:
    def __init__(self, graph: StateGraph) -> None:
        self.graph = graph

    def invoke(
        self,
        state: Union[AgentState, Dict[str, Any]],
        *,
        stop_before: Optional[str] = None,
        max_steps: int = 50,
    ) -> AgentState:
        if isinstance(state, dict):
            current = AgentState.model_validate(state)
        else:
            current = state

        node_name = self.graph.entry
        steps = 0
        while node_name and node_name != END and steps < max_steps:
            if current.stop_requested:
                current.current_stage = "stopped"
                current.workflow_complete = True
                current.add_timeline("Agent run stopped by operator")
                break
            if current.pause_requested:
                current.add_timeline("Agent run paused")
                break
            if stop_before and node_name == stop_before:
                break

            fn = self.graph.nodes[node_name]
            current = fn(current)
            steps += 1

            if current.awaiting_human and node_name == "approval":
                # Pause graph until human decision is injected and resume is called
                break

            if node_name in self.graph.conditional_edges:
                cond = self.graph.conditional_edges[node_name]
                route = cond["condition"](current)
                node_name = cond["mapping"].get(route, END)
            elif node_name in self.graph.edges:
                node_name = self.graph.edges[node_name]
            else:
                break

        return current

    def resume(self, state: AgentState, from_node: str = "execute") -> AgentState:
        """Resume after human approval gate."""
        # Temporarily set entry-like walk from from_node
        original_entry = self.graph.entry
        self.graph.entry = from_node
        try:
            return self.invoke(state)
        finally:
            self.graph.entry = original_entry
