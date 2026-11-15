from django.urls import path
from . import views

urlpatterns = [
    # Farmer context
    path("context/", views.advisor_context, name="advisor_context"),

    # AI Chat
    path("chat/", views.advisor_chat, name="advisor_chat"),

    # Conversation history
    path("history/", views.advisor_history_list, name="advisor_history_list"),
    path("history/<int:session_id>/", views.advisor_history_detail, name="advisor_history_detail"),

    # Crop comparison
    path("compare/", views.advisor_compare, name="advisor_compare"),

    # What-if simulation with farmer context
    path("what-if/", views.advisor_whatif, name="advisor_whatif"),

    # Plan proposal workflow (propose → farmer approves/rejects)
    path("plan-proposal/", views.advisor_plan_proposal, name="advisor_plan_proposal"),
    path("plan-proposal/<int:proposal_id>/approve/", views.advisor_plan_proposal_approve, name="advisor_plan_proposal_approve"),
]
