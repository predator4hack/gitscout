"""Filter extraction from natural language queries."""

import re
from typing import Optional, Tuple, List
from app.models.chat import FilterProposal, ClarificationQuestion, ClarificationOption


class FilterExtractor:
    """Extracts filter parameters from natural language using rule-based patterns."""

    # Patterns for numeric extraction
    NUMBER_PATTERNS = [
        r"(\d+)\+",  # 100+
        r"more than (\d+)",
        r"at least (\d+)",
        r"minimum (\d+)",
        r"min (\d+)",
        r"(\d+) or more",
        r"greater than (\d+)",
        r"> ?(\d+)",
    ]

    MAX_NUMBER_PATTERNS = [
        r"less than (\d+)",
        r"under (\d+)",
        r"maximum (\d+)",
        r"max (\d+)",
        r"(\d+) or less",
        r"< ?(\d+)",
    ]

    # Location patterns
    LOCATION_PATTERNS = [
        r"in ([A-Z][a-zA-Z\s]+?)(?:\s+with|\s+and|\s*$)",
        r"from ([A-Z][a-zA-Z\s]+?)(?:\s+with|\s+and|\s*$)",
        r"located in ([A-Z][a-zA-Z\s]+?)(?:\s+with|\s+and|\s*$)",
        r"based in ([A-Z][a-zA-Z\s]+?)(?:\s+with|\s+and|\s*$)",
    ]

    # Activity patterns
    ACTIVITY_KEYWORDS = {
        "active": "6m",
        "recently active": "3m",
        "very active": "30d",
        "inactive": None,  # Needs clarification
    }

    def extract_filters(
        self, message: str, context: Optional[str] = None
    ) -> Tuple[Optional[FilterProposal], Optional[List[ClarificationQuestion]]]:
        """Extract filter parameters from natural language.

        Args:
            message: User message text
            context: Optional context from previous messages

        Returns:
            Tuple of (FilterProposal, List of ClarificationQuestions)
            Either FilterProposal or ClarificationQuestions will be None
        """
        message_lower = message.lower()
        clarifications = []

        # Extract location
        location = self._extract_location(message)

        # Extract follower counts
        followers_min = self._extract_min_number(message_lower, ["follower"])
        followers_max = self._extract_max_number(message_lower, ["follower"])

        # Extract email/contact requirements
        has_email = self._extract_email_requirement(message_lower)
        has_any_contact = self._extract_contact_requirement(message_lower)

        # Extract activity/contribution timeframe
        last_contribution = self._extract_activity(message_lower)

        # Check if we need clarifications
        if "experienced" in message_lower or "senior" in message_lower:
            # Ambiguous - need to clarify what "experienced" means
            clarifications.append(
                ClarificationQuestion(
                    question="How many followers should experienced developers have?",
                    options=[
                        ClarificationOption(label="50+ followers", value="50"),
                        ClarificationOption(label="100+ followers", value="100"),
                        ClarificationOption(label="200+ followers", value="200"),
                        ClarificationOption(label="500+ followers", value="500"),
                    ],
                    allow_custom=True,
                    field_name="followers_min",
                )
            )

        if "active" in message_lower and last_contribution is None:
            # Need to clarify timeframe
            clarifications.append(
                ClarificationQuestion(
                    question="What timeframe should we consider for 'active'?",
                    options=[
                        ClarificationOption(label="Last 30 days", value="30d"),
                        ClarificationOption(label="Last 3 months", value="3m"),
                        ClarificationOption(label="Last 6 months", value="6m"),
                        ClarificationOption(label="Last year", value="1y"),
                    ],
                    allow_custom=False,
                    field_name="last_contribution",
                )
            )

        # If we have clarifications, return them instead of a proposal
        if clarifications:
            return None, clarifications

        # Build explanation
        explanation_parts = []
        if location:
            explanation_parts.append(f"located in {location}")
        if followers_min:
            explanation_parts.append(f"at least {followers_min} followers")
        if followers_max:
            explanation_parts.append(f"at most {followers_max} followers")
        if has_email:
            explanation_parts.append("with public email")
        if has_any_contact:
            explanation_parts.append("with contact information")
        if last_contribution:
            timeframe_labels = {"30d": "30 days", "3m": "3 months", "6m": "6 months", "1y": "1 year"}
            explanation_parts.append(f"active in last {timeframe_labels.get(last_contribution, last_contribution)}")

        explanation = "Showing candidates " + ", ".join(explanation_parts) if explanation_parts else "No filters applied"

        proposal = FilterProposal(
            location=location,
            followers_min=followers_min,
            followers_max=followers_max,
            has_email=has_email,
            has_any_contact=has_any_contact,
            last_contribution=last_contribution,
            explanation=explanation,
            estimated_count=None,  # Will be filled by agent
        )

        return proposal, None

    def _extract_location(self, message: str) -> Optional[str]:
        """Extract location from message.

        Args:
            message: Message text

        Returns:
            Location string or None
        """
        for pattern in self.LOCATION_PATTERNS:
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                location = match.group(1).strip()
                # Clean up common trailing words
                location = re.sub(r"\s+(with|and|who|that)$", "", location, flags=re.IGNORECASE)
                return location
        return None

    def _extract_min_number(self, message: str, context_words: List[str]) -> Optional[int]:
        """Extract minimum number from message.

        Args:
            message: Message text (lowercase)
            context_words: Words that should appear near the number (e.g., ["follower"])

        Returns:
            Minimum number or None
        """
        for pattern in self.NUMBER_PATTERNS:
            matches = re.finditer(pattern, message)
            for match in matches:
                # Check if context word is nearby
                start = max(0, match.start() - 50)
                end = min(len(message), match.end() + 50)
                context = message[start:end]

                if any(word in context for word in context_words):
                    return int(match.group(1))

        return None

    def _extract_max_number(self, message: str, context_words: List[str]) -> Optional[int]:
        """Extract maximum number from message.

        Args:
            message: Message text (lowercase)
            context_words: Words that should appear near the number

        Returns:
            Maximum number or None
        """
        for pattern in self.MAX_NUMBER_PATTERNS:
            matches = re.finditer(pattern, message)
            for match in matches:
                # Check if context word is nearby
                start = max(0, match.start() - 50)
                end = min(len(message), match.end() + 50)
                context = message[start:end]

                if any(word in context for word in context_words):
                    return int(match.group(1))

        return None

    def _extract_email_requirement(self, message: str) -> Optional[bool]:
        """Extract email requirement from message.

        Args:
            message: Message text (lowercase)

        Returns:
            True if email required, False if email excluded, None if not mentioned
        """
        if any(phrase in message for phrase in ["with email", "has email", "public email", "have email"]):
            return True
        if any(phrase in message for phrase in ["without email", "no email"]):
            return False
        return None

    def _extract_contact_requirement(self, message: str) -> Optional[bool]:
        """Extract contact requirement from message.

        Args:
            message: Message text (lowercase)

        Returns:
            True if any contact required, None if not mentioned
        """
        if any(
            phrase in message
            for phrase in [
                "with contact",
                "has contact",
                "contact information",
                "contactable",
                "can contact",
            ]
        ):
            return True
        return None

    def _extract_activity(self, message: str) -> Optional[str]:
        """Extract activity/contribution timeframe from message.

        Args:
            message: Message text (lowercase)

        Returns:
            Timeframe code (30d, 3m, 6m, 1y) or None
        """
        # Check for explicit timeframes
        if "30 days" in message or "month" in message:
            return "30d"
        if "3 months" in message or "quarter" in message:
            return "3m"
        if "6 months" in message or "half year" in message:
            return "6m"
        if "year" in message or "12 months" in message:
            return "1y"

        # Check for activity keywords
        for keyword, timeframe in self.ACTIVITY_KEYWORDS.items():
            if keyword in message:
                return timeframe

        return None


# Global extractor instance
_filter_extractor: Optional[FilterExtractor] = None


def get_filter_extractor() -> FilterExtractor:
    """Get the global FilterExtractor instance.

    Returns:
        FilterExtractor instance
    """
    global _filter_extractor
    if _filter_extractor is None:
        _filter_extractor = FilterExtractor()
    return _filter_extractor
