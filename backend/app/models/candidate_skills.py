from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum


class SkillLevel(str, Enum):
    """Skill proficiency levels"""
    BEGINNER = "Beginner"
    INTERMEDIATE = "Intermediate"
    ADVANCED = "Advanced"
    EXPERT = "Expert"


class DomainSkill(BaseModel):
    """A domain expertise skill (e.g., Machine Learning, Distributed Systems)"""
    name: str
    level: SkillLevel
    evidence: str
    repositories: List[str] = Field(default_factory=list)


class TechnicalSkill(BaseModel):
    """A technical skill (programming language, framework, tool)"""
    name: str
    level: SkillLevel
    years_active: Optional[int] = None
    evidence: Optional[str] = None
    repositories: List[str] = Field(default_factory=list)


class BehavioralPattern(BaseModel):
    """A behavioral pattern (e.g., Open Source Contributor, Code Reviewer)"""
    name: str
    description: str
    evidence: str


class CandidateSkillsAnalysis(BaseModel):
    """Complete skills analysis for a candidate"""
    login: str
    generated_at: datetime
    profile_summary: str
    domain_expertise: List[DomainSkill] = Field(default_factory=list)
    technical_expertise: List[TechnicalSkill] = Field(default_factory=list)
    behavioral_patterns: List[BehavioralPattern] = Field(default_factory=list)
    cached: bool = False


class SkillsAnalysisRequest(BaseModel):
    """Request body for skills analysis endpoint"""
    login: str
    session_id: str
    force_refresh: bool = False
