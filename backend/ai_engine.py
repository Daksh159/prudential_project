import json
import os
import requests
from dotenv import load_dotenv

# Load .env relative to this file so it works regardless of cwd
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"


def _ask(prompt: str) -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY not set in .env")
    resp = requests.post(
        f"{GEMINI_URL}?key={api_key}",
        json={"contents": [{"parts": [{"text": prompt}]}]},
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()
    return data["candidates"][0]["content"]["parts"][0]["text"]


def _parse_json(text: str):
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else "\n".join(lines[1:])
    return json.loads(text)


def generate_policy(natural_language: str) -> list[dict]:
    prompt = f"""You are an RBAC policy engine for a health insurance company.
Convert this policy to structured RBAC rules as a JSON array.
Each item must have: role (string), action (string), resource (string), effect ("allow" or "deny").
Return ONLY the JSON array, no explanation.

Policy: {natural_language}"""
    try:
        raw = _ask(prompt)
        return _parse_json(raw)
    except Exception as e:
        print(f"[AI ERROR] generate_policy: {e}")
        return []


def recommend_permissions(role_name: str, existing_roles: list[str]) -> dict:
    prompt = f"""You are an RBAC advisor for a health insurance company.
Recommend permissions for the role: "{role_name}".
Existing roles for context: {existing_roles}.

Return ONLY JSON in this exact shape:
{{
  "recommended": [{{"action": "...", "resource": "..."}}],
  "restricted": [{{"action": "...", "resource": "..."}}],
  "reasoning": "..."
}}

Use actions like: view, create, update, delete, approve, reject, upload
Use resources like: claim, policy, medical_report, customer_profile, premium_info, risk_assessment"""
    try:
        raw = _ask(prompt)
        return _parse_json(raw)
    except Exception as e:
        print(f"[AI ERROR] recommend_permissions: {e}")
        return {
            "recommended": [{"action": "view", "resource": "claim"}],
            "restricted": [{"action": "delete", "resource": "medical_report"}],
            "reasoning": "AI unavailable — showing default recommendations.",
        }


def detect_risks(role_name: str, permissions: list[dict]) -> list[dict]:
    perm_list = [f"{p['action']}_{p['resource']}" for p in permissions]
    prompt = f"""You are a security auditor for a health insurance company.
Analyze these permissions for role "{role_name}" and flag any mismatches or risks.
Permissions: {perm_list}

Return ONLY a JSON array where each item has:
- permission (string, e.g. "delete_medical_report")
- risk_level ("low", "medium", or "high")
- reason (one sentence)

Only include items with medium or high risk. Return empty array [] if all permissions are safe."""
    try:
        raw = _ask(prompt)
        result = _parse_json(raw)
        return result if isinstance(result, list) else []
    except Exception:
        return []


def explain_access(
    user_id: int,
    action: str,
    resource: str,
    allowed: bool,
    roles: list[str],
    permissions: list[str],
) -> str:
    decision = "GRANTED" if allowed else "DENIED"
    prompt = f"""Explain in one clear, concise sentence why access was {decision}.
Action: {action}, Resource: {resource}
User roles: {roles}
Matching permissions: {permissions}
Write as if explaining to a non-technical health insurance manager."""
    try:
        return _ask(prompt).strip()
    except Exception:
        if allowed:
            return f"Access granted because the user's role ({', '.join(roles)}) includes the '{action}_{resource}' permission."
        return f"Access denied because none of the user's roles ({', '.join(roles)}) have permission to {action} {resource}."
