from django.urls import path

from . import views

urlpatterns = [
    path("scenarios/", views.scenarios, name="fellah_scenarios"),
    path("question/", views.question, name="fellah_question"),
    path("journal/", views.journal, name="fellah_journal"),
    path("phrases/", views.phrases, name="fellah_phrases"),
    path("phrases/<str:phrase_id>/", views.phrase, name="fellah_phrase"),
    path("clips/<str:clip_id>/", views.clip, name="fellah_clip"),
]
