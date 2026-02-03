"""Email generation for recruitment outreach."""

from typing import Optional
from app.models.chat import EmailDraft
from app.models.responses import Candidate


class EmailGenerator:
    """Generates recruitment emails using templates."""

    def generate_email(
        self,
        job_description: Optional[str] = None,
        candidate: Optional[Candidate] = None,
    ) -> EmailDraft:
        """Generate a recruitment email.

        Args:
            job_description: Job description from search
            candidate: Optional specific candidate to personalize for

        Returns:
            EmailDraft with subject and body
        """
        if candidate:
            return self._generate_personalized_email(job_description, candidate)
        else:
            return self._generate_generic_email(job_description)

    def _generate_generic_email(self, job_description: Optional[str]) -> EmailDraft:
        """Generate a generic recruitment email.

        Args:
            job_description: Job description from search

        Returns:
            Generic EmailDraft
        """
        # Extract role/position from job description if available
        role = "Developer"
        if job_description:
            # Simple extraction - look for common role keywords
            jd_lower = job_description.lower()
            if "senior" in jd_lower:
                role = "Senior Developer"
            elif "engineer" in jd_lower:
                role = "Software Engineer"
            elif "frontend" in jd_lower or "front-end" in jd_lower:
                role = "Frontend Developer"
            elif "backend" in jd_lower or "back-end" in jd_lower:
                role = "Backend Developer"
            elif "fullstack" in jd_lower or "full-stack" in jd_lower:
                role = "Full-Stack Developer"

        subject = f"Exciting {role} Opportunity"

        body = f"""Hi there,

I came across your GitHub profile and was impressed by your work. We're currently looking for talented developers to join our team.

We're hiring for a {role} position, and I think your skills and experience could be a great fit.

Would you be open to a brief conversation to learn more about the opportunity?

Best regards,
[Your Name]
[Company Name]"""

        return EmailDraft(
            subject=subject,
            body=body,
            target_candidate=None,
            is_generic=True,
        )

    def _generate_personalized_email(
        self, job_description: Optional[str], candidate: Candidate
    ) -> EmailDraft:
        """Generate a personalized recruitment email for a specific candidate.

        Args:
            job_description: Job description from search
            candidate: Target candidate

        Returns:
            Personalized EmailDraft
        """
        # Get candidate name or username
        name = candidate.name if candidate.name else candidate.login

        # Extract top repo
        top_repo = None
        if candidate.topRepos and len(candidate.topRepos) > 0:
            top_repo = candidate.topRepos[0]

        # Extract role from job description
        role = "Developer"
        if job_description:
            jd_lower = job_description.lower()
            if "senior" in jd_lower:
                role = "Senior Developer"
            elif "engineer" in jd_lower:
                role = "Software Engineer"
            elif "frontend" in jd_lower or "front-end" in jd_lower:
                role = "Frontend Developer"
            elif "backend" in jd_lower or "back-end" in jd_lower:
                role = "Backend Developer"
            elif "fullstack" in jd_lower or "full-stack" in jd_lower:
                role = "Full-Stack Developer"

        subject = f"Opportunity for {name} - {role} Position"

        # Build personalized body
        body = f"""Hi {name},

I came across your GitHub profile and was particularly impressed by your work"""

        if top_repo:
            body += f" on {top_repo.nameWithOwner}"

        body += """.

"""

        # Add match reason if available
        if candidate.matchReason:
            body += f"{candidate.matchReason}\n\n"

        body += f"""We're currently hiring for a {role} position, and I believe your background and skills would be an excellent fit for our team.

Would you be open to a brief conversation to discuss this opportunity?

Best regards,
[Your Name]
[Company Name]"""

        return EmailDraft(
            subject=subject,
            body=body,
            target_candidate=candidate.login,
            is_generic=False,
        )


# Global generator instance
_email_generator: Optional[EmailGenerator] = None


def get_email_generator() -> EmailGenerator:
    """Get the global EmailGenerator instance.

    Returns:
        EmailGenerator instance
    """
    global _email_generator
    if _email_generator is None:
        _email_generator = EmailGenerator()
    return _email_generator
