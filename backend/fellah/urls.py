from django.urls import path

from . import views

urlpatterns = [
    path("scenarios/", views.scenarios, name="fellah_scenarios"),
    path("question/", views.question, name="fellah_question"),
    path("audio/<str:clip>.wav", views.audio, name="fellah_audio"),
    path("journal/", views.journal, name="fellah_journal"),
]
