"""
API serializers — input validation for TerraRota recommendation requests.
"""
from rest_framework import serializers
from django.contrib.auth.models import User
from fields.models import Parcel, RotationHistory, FarmerPriority, FarmPlan

WATER_ACCESS_CHOICES = ["rainfed", "irrigated", "partial"]
SOIL_TYPE_CHOICES = ["clay", "clay_loam", "loam", "sandy_loam", "sandy", "unknown"]
CROP_ID_CHOICES = [
    "wheat_hard", "wheat_soft", "barley", "olive",
    "argan", "tomato", "chickpea", "cactus_pear",
    "potato", "almond", "lentil", "faba_bean", "fallow",
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
        max_length=15,
    )
    farmer_priorities = serializers.DictField(
        child=serializers.FloatField(min_value=0.0, max_value=1.0),
        required=False,
        default=dict,
    )
    notes = serializers.CharField(
        max_length=500, required=False, allow_blank=True, default=""
    )


class WhatIfRequestSerializer(serializers.Serializer):
    latitude = serializers.FloatField(min_value=-90.0, max_value=90.0)
    longitude = serializers.FloatField(min_value=-180.0, max_value=180.0)
    previous_crop = serializers.ChoiceField(choices=CROP_ID_CHOICES, required=False, allow_null=True)
    water_access = serializers.ChoiceField(choices=WATER_ACCESS_CHOICES, required=False, allow_null=True)
    soil_type = serializers.ChoiceField(choices=SOIL_TYPE_CHOICES, required=False, default="unknown")
    field_size_ha = serializers.FloatField(min_value=0.01, required=False, default=4.8)
    simulated_changes = serializers.DictField(required=True)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user


class RotationHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = RotationHistory
        fields = ['id', 'parcel', 'crop_id', 'season', 'year', 'yield_kg_ha', 'irrigation_used', 'notes', 'created_at']
        read_only_fields = ['id', 'created_at']


class ParcelSerializer(serializers.ModelSerializer):
    rotation_history = RotationHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Parcel
        fields = [
            'id', 'name', 'latitude', 'longitude', 'region',
            'water_access', 'soil_type', 'soil_ph', 'organic_matter_pct',
            'soil_depth_cm', 'field_size_ha', 'notes', 'rotation_history',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class FarmerPrioritySerializer(serializers.ModelSerializer):
    class Meta:
        model = FarmerPriority
        fields = ['id', 'priority_name', 'weight']
        read_only_fields = ['id']


class FarmPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = FarmPlan
        fields = [
            'id', 'parcel', 'user', 'title', 'status',
            'recommended_crops', 'selected_crop', 'crop_sequence',
            'rejection_reason', 'farmer_feedback',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']
