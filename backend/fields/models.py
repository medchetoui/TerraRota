from django.db import models
from django.contrib.auth.models import User

class Parcel(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='parcels')
    name = models.CharField(max_length=120)
    latitude = models.FloatField()
    longitude = models.FloatField()
    water_access = models.CharField(max_length=30, blank=True, default='')
    soil_type = models.CharField(max_length=30, blank=True, default='unknown')
    field_size_ha = models.FloatField(null=True, blank=True)
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.latitude}, {self.longitude})"
