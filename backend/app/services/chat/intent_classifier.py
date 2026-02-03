"""Intent classification for chat messages."""

from typing import Optional
from app.models.chat import ChatIntent


class IntentClassifier:
    """Classifies user intent from chat messages using rule-based keyword matching."""

    # Keywords for each intent type
    FILTER_KEYWORDS = [
        "filter",
        "show only",
        "show me",
        "exclude",
        "location",
        "followers",
        "email",
        "contact",
        "active",
        "contribution",
        "in",
        "from",
        "with",
        "more than",
        "less than",
        "at least",
        "minimum",
        "maximum",
    ]

    EMAIL_KEYWORDS = [
        "email",
        "draft",
        "message",
        "outreach",
        "write",
        "compose",
        "send",
        "contact",
        "reach out",
    ]

    CANDIDATE_INFO_KEYWORDS = [
        "who is",
        "tell me about",
        "show me",
        "information about",
        "details about",
        "@",
    ]

    COMPARE_KEYWORDS = [
        "compare",
        "difference between",
        "versus",
        "vs",
        "better",
    ]

    def classify(self, message: str, previous_intent: Optional[ChatIntent] = None) -> ChatIntent:
        """Classify the intent of a user message.

        Args:
            message: User message text
            previous_intent: Previous conversation intent (for context)

        Returns:
            Classified ChatIntent
        """
        message_lower = message.lower()

        # If we're already in a conversation with established intent, maintain it
        # unless there's a clear topic change
        if previous_intent and previous_intent != ChatIntent.OUT_OF_SCOPE:
            # Check if user is clearly changing topics
            if any(keyword in message_lower for keyword in ["instead", "actually", "no", "nevermind"]):
                # Reclassify from scratch
                pass
            elif previous_intent == ChatIntent.FILTER_CANDIDATES:
                # If we're in filtering mode, most responses are likely filter refinements
                if not any(keyword in message_lower for keyword in self.EMAIL_KEYWORDS):
                    return ChatIntent.FILTER_CANDIDATES

        # Check for email intent first (higher priority)
        if self._check_keywords(message_lower, self.EMAIL_KEYWORDS):
            # Make sure it's not just asking about contact info
            if "who has" not in message_lower and "show" not in message_lower:
                return ChatIntent.DRAFT_EMAIL

        # Check for candidate info intent (with @ mention or specific queries)
        if "@" in message or self._check_keywords(message_lower, self.CANDIDATE_INFO_KEYWORDS):
            return ChatIntent.CANDIDATE_INFO

        # Check for comparison intent
        if self._check_keywords(message_lower, self.COMPARE_KEYWORDS):
            return ChatIntent.COMPARE_CANDIDATES

        # Check for filter intent
        if self._check_keywords(message_lower, self.FILTER_KEYWORDS):
            return ChatIntent.FILTER_CANDIDATES

        # Default to out of scope
        return ChatIntent.OUT_OF_SCOPE

    def _check_keywords(self, message: str, keywords: list[str]) -> bool:
        """Check if any keywords are present in the message.

        Args:
            message: Message text (lowercase)
            keywords: List of keywords to check

        Returns:
            True if any keyword is found
        """
        return any(keyword in message for keyword in keywords)


# Global classifier instance
_intent_classifier: Optional[IntentClassifier] = None


def get_intent_classifier() -> IntentClassifier:
    """Get the global IntentClassifier instance.

    Returns:
        IntentClassifier instance
    """
    global _intent_classifier
    if _intent_classifier is None:
        _intent_classifier = IntentClassifier()
    return _intent_classifier
