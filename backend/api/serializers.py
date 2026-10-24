"""
API serializers — input validation for TerraRota recommendation requests.
"""
from rest_framework import serializers


WATER_ACCESS_CHOICES = ["rainfed", "irrigated", "partial"]
SOIL_TYPE_CHOICES = ["clay", "clay_loam", "loam", "sandy_loam", "sandy", "unknown"]
CROP_ID_CHOICES = [
    "wheat_hard", "wheat_soft", "barley", "olive",
    "argan", "tomato", "chickpea", "cactus_pear",
]


class RecommendationRequestSerializer(serializers.Serializer):
    latitude = serializers.FloatField(
        min_value=-90.0, max_value=90.0,
        help_text="Decimal latitude (-90 to 90)"
    )
    longitude = serializers.FloatField(
        min_value=-180.0, max_value=180.0,
        help_text="Decimal longitude (-180 to 180)"
    )
    previous_crop = serializers.ChoiceField(
        choices=CROP_ID_CHOICES, required=False, allow_null=True, default=None
    )
    water_access = serializers.ChoiceField(
        choices=WATER_ACCESS_CHOICES, required=False, allow_null=True, default=None
    )
    soil_type = serializers.ChoiceField(
        choices=SOIL_TYPE_CHOICES, required=False, allow_null=True, default="unknown"
    )
    field_size_ha = serializers.FloatField(
        min_value=0.01, required=False, allow_null=True, default=None
    )
    preferred_crops = serializers.ListField(
        child=serializers.ChoiceField(choices=CROP_ID_CHOICES),
        required=False,
        default=list,
        max_length=8,
    )
    notes = serializers.CharField(
        max_length=500, required=False, allow_blank=True, default=""
    )
