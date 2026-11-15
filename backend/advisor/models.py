"""
TerraRota Advisor Models — Conversation history for the AI agricultural advisor.

Stores sessions and messages per authenticated farmer.
No LLM API key required — all answers come from the deterministic agronomic engine.
"""
from django.db import models
from django.contrib.auth.models import User


class AdvisorSession(models.Model):
    LANG_CHOICES = [
        ('ar', 'العربية / Darija'),
        ('fr', 'Français'),
        ('en', 'English'),
    ]

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='advisor_sessions',
        null=True, blank=True,
        help_text="Authenticated farmer. Null = demo/guest session."
    )
    lang = models.CharField(max_length=5, choices=LANG_CHOICES, default='ar')
    parcel_id = models.IntegerField(null=True, blank=True, help_text="Active parcel for this session")
    started_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    # snapshot of the farm context used during this session
    context_snapshot = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-last_activity']

    def __str__(self):
        who = self.user.username if self.user else 'guest'
        return f"Session #{self.id} [{who}] {self.lang} @ {self.started_at:%Y-%m-%d %H:%M}"


class AdvisorMessage(models.Model):
    ROLE_CHOICES = [
        ('user', 'Farmer'),
        ('ai', 'Ami Ahmed AI'),
    ]

    session = models.ForeignKey(
        AdvisorSession, on_delete=models.CASCADE, related_name='messages'
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    # Raw text typed / recognized
    content = models.TextField()
    # Detected intent label (QUOI_PLANTER, POURQUOI, etc.)
    intent = models.CharField(max_length=60, blank=True, default='')
    # Structured AI response (phrases, evidence, reasoning)
    ai_response = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        preview = self.content[:60]
        return f"[{self.role}] {preview}"
