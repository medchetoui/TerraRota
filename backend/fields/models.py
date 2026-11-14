from django.db import models
from django.contrib.auth.models import User


class Parcel(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='parcels', null=True, blank=True)
    name = models.CharField(max_length=120)
    latitude = models.FloatField()
    longitude = models.FloatField()
    region = models.CharField(max_length=100, blank=True, default='')
    water_access = models.CharField(max_length=30, blank=True, default='')
    soil_type = models.CharField(max_length=30, blank=True, default='unknown')
    soil_ph = models.FloatField(null=True, blank=True)
    organic_matter_pct = models.FloatField(null=True, blank=True)
    soil_depth_cm = models.FloatField(null=True, blank=True)
    field_size_ha = models.FloatField(null=True, blank=True)
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.latitude}, {self.longitude})"


class RotationHistory(models.Model):
    parcel = models.ForeignKey(Parcel, on_delete=models.CASCADE, related_name='rotation_history')
    crop_id = models.CharField(max_length=60)
    season = models.CharField(max_length=30, help_text="e.g. 2024-2025")
    year = models.IntegerField()
    yield_kg_ha = models.FloatField(null=True, blank=True)
    irrigation_used = models.BooleanField(default=False)
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-year', '-id']

    def __str__(self):
        return f"{self.parcel.name} - {self.crop_id} ({self.season})"


class FarmerPriority(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='priorities')
    priority_name = models.CharField(max_length=60)
    weight = models.FloatField(default=0.5)

    class Meta:
        unique_together = ('user', 'priority_name')

    def __str__(self):
        return f"{self.user.username} - {self.priority_name}: {self.weight}"


class FarmPlan(models.Model):
    PLAN_STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('proposed', 'Proposed'),
        ('approved', 'Approved'),
        ('modified', 'Modified'),
        ('rejected', 'Rejected'),
    ]

    parcel = models.ForeignKey(Parcel, on_delete=models.CASCADE, related_name='plans', null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='plans', null=True, blank=True)
    title = models.CharField(max_length=150, default='Plan de Rotation')
    status = models.CharField(max_length=20, choices=PLAN_STATUS_CHOICES, default='proposed')
    recommended_crops = models.JSONField(default=list, blank=True)
    selected_crop = models.CharField(max_length=60, blank=True, default='')
    crop_sequence = models.JSONField(default=list, blank=True, help_text="Multi-year rotation sequence")
    rejection_reason = models.CharField(max_length=255, blank=True, default='')
    farmer_feedback = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Plan #{self.id} - {self.title} [{self.status}]"
