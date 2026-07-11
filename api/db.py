from __future__ import annotations

"""SQLite persistence for agent runs (synthetic prototype)."""

import json
import sqlite3
from pathlib import Path
from typing import Any, Dict, List, Optional

DB_PATH = Path(__file__).resolve().parents[1] / "data" / "agent.db"


def get_connection() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    conn = get_connection()
    try:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS submissions (
                submission_id TEXT PRIMARY KEY,
                scenario_id TEXT,
                created_at TEXT,
                status TEXT,
                state_json TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS events (
                event_id TEXT PRIMARY KEY,
                submission_id TEXT,
                timestamp TEXT,
                payload_json TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS metrics (
                key TEXT PRIMARY KEY,
                value_json TEXT NOT NULL
            );
            """
        )
        conn.commit()
    finally:
        conn.close()


def save_state(state: Dict[str, Any]) -> None:
    init_db()
    conn = get_connection()
    try:
        conn.execute(
            """
            INSERT INTO submissions (submission_id, scenario_id, created_at, status, state_json)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(submission_id) DO UPDATE SET
                scenario_id=excluded.scenario_id,
                status=excluded.status,
                state_json=excluded.state_json
            """,
            (
                state["submission_id"],
                state.get("scenario_id"),
                state.get("started_at"),
                state.get("current_stage"),
                json.dumps(state),
            ),
        )
        for event in state.get("audit_events", []):
            conn.execute(
                """
                INSERT OR REPLACE INTO events (event_id, submission_id, timestamp, payload_json)
                VALUES (?, ?, ?, ?)
                """,
                (
                    event.get("event_id"),
                    state["submission_id"],
                    event.get("timestamp"),
                    json.dumps(event),
                ),
            )
        conn.commit()
    finally:
        conn.close()


def load_state(submission_id: str) -> Optional[Dict[str, Any]]:
    init_db()
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT state_json FROM submissions WHERE submission_id = ?",
            (submission_id,),
        ).fetchone()
        if not row:
            return None
        return json.loads(row["state_json"])
    finally:
        conn.close()


def list_states() -> List[Dict[str, Any]]:
    init_db()
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT state_json FROM submissions ORDER BY created_at DESC"
        ).fetchall()
        return [json.loads(r["state_json"]) for r in rows]
    finally:
        conn.close()


def list_events(submission_id: str) -> List[Dict[str, Any]]:
    init_db()
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT payload_json FROM events WHERE submission_id = ? ORDER BY timestamp",
            (submission_id,),
        ).fetchall()
        return [json.loads(r["payload_json"]) for r in rows]
    finally:
        conn.close()
