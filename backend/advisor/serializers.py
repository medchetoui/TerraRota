"""
TerraRota Advisor Serializers.
"""
from rest_framework import serializers
from .models import AdvisorSession, AdvisorMessage


class AdvisorMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdvisorMessage
        fields = ['id', 'role', 'content', 'intent', 'ai_response', 'created_at']
        read_only_fields = ['id', 'created_at']


class AdvisorSessionSerializer(serializers.ModelSerializer):
    messages = AdvisorMessageSerializer(many=True, read_only=True)
    message_count = serializers.SerializerMethodField()

    class Meta:
        model = AdvisorSession
        fields = ['id', 'lang', 'parcel_id', 'started_at', 'last_activity', 'message_count', 'messages']
        read_only_fields = ['id', 'started_at', 'last_activity']

    def get_message_count(self, obj):
        return obj.messages.count()


class AdvisorSessionListSerializer(serializers.ModelSerializer):
    """Slim serializer for listing sessions (no messages)."""
    message_count = serializers.SerializerMethodField()
    last_message_preview = serializers.SerializerMethodField()

    class Meta:
        model = AdvisorSession
        fields = ['id', 'lang', 'parcel_id', 'started_at', 'last_activity', 'message_count', 'last_message_preview']

    def get_message_count(self, obj):
        return obj.messages.count()

    def get_last_message_preview(self, obj):
        last = obj.messages.order_by('-created_at').first()
        if last:
            return last.content[:80]
        return None


class ChatRequestSerializer(serializers.Serializer):
    question = serializers.CharField(min_length=1, max_length=500)
    lang = serializers.ChoiceField(choices=['ar', 'fr', 'en'], default='ar')
    session_id = serializers.IntegerField(required=False, allow_null=True)
    parcel_id = serializers.IntegerField(required=False, allow_null=True)
    scenario_id = serializers.CharField(max_length=60, default='cereales_apres_cereale', required=False)


class CompareRequestSerializer(serializers.Serializer):
    crop_a = serializers.CharField(max_length=60)
    crop_b = serializers.CharField(max_length=60)
    lang = serializers.ChoiceField(choices=['ar', 'fr', 'en'], default='ar')
    parcel_id = serializers.IntegerField(required=False, allow_null=True)


class PlanProposalSerializer(serializers.Serializer):
    crop_id = serializers.CharField(max_length=60)
    reason = serializers.CharField(max_length=500)
    lang = serializers.ChoiceField(choices=['ar', 'fr', 'en'], default='ar')
    parcel_id = serializers.IntegerField(required=False, allow_null=True)
    session_id = serializers.IntegerField(required=False, allow_null=True)
