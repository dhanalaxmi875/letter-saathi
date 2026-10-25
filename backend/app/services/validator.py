import re
from typing import Any

from pydantic import BaseModel, Field, ValidationError
from fastapi import HTTPException


class Deadline(BaseModel):
    value: str | None = None
    status: str = "missing_from_provided_text"


class Analysis(BaseModel):
    document_type: str = "Official letter"
    purpose: str = ""
    deadline: Deadline = Field(default_factory=Deadline)
    important_facts: list[str] = Field(default_factory=list)
    required_actions: list[str] = Field(default_factory=list)
    required_documents: list[str] = Field(default_factory=list)
    amounts: list[str] = Field(default_factory=list)
    consequences: list[str] = Field(default_factory=list)
    simple_explanation: str = ""
    human_verification_required: bool = True
    uncertainties: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)


def validate_result(raw: dict[str, Any]) -> dict:
    if not isinstance(raw, dict):
        raise HTTPException(status_code=502, detail="The letter result was incomplete. Please try again.")
    # Models sometimes return a bare null for an absent deadline instead of
    # the schema's object; normalize it to the safe missing-deadline default.
    if raw.get("deadline") is None:
        raw["deadline"] = {"value": None, "status": "missing_from_provided_text"}
    try:
        result = Analysis.model_validate(raw).model_dump()
    except (ValidationError, TypeError, ValueError) as exc:
        raise HTTPException(status_code=502, detail="The letter result was incomplete. Please try again.") from exc
    result["human_verification_required"] = True
    warnings = list(result["warnings"])
    deadline = result["deadline"]
    if deadline["value"] is None or deadline["status"] != "found":
        warnings.append("No clear deadline was found in the letter. Check with the issuing office.")
    extracted = " ".join([result["purpose"], *result["important_facts"], *result["required_actions"], *result["required_documents"]])
    if re.search(r"\[\s*(?:date)?\s*\]|\[\s*\]|_{2,}|XX/XX|as per schedule", extracted, re.I):
        warnings.append("The letter may contain an unfilled placeholder or refer to a missing schedule.")
    if result["uncertainties"]:
        warnings.append("Some information could not be read with confidence. Verify it before acting.")
    result["warnings"] = list(dict.fromkeys(warnings))
    return result
