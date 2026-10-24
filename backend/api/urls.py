from django.urls import path
from . import views

urlpatterns = [
    path("health/", views.health, name="health"),
    path("recommendations/", views.recommend, name="recommendations"),
    path("crops/", views.crops_list, name="crops"),
]
