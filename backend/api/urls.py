from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

urlpatterns = [
    # Health and core recommendation
    path("health/", views.health, name="health"),
    path("recommendations/", views.recommend, name="recommendations"),
    path("crops/", views.crops_list, name="crops"),

    # Authentication & JWT
    path("auth/register/", views.register, name="register"),
    path("auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/me/", views.current_user, name="current_user"),

    # User saved parcels/farms
    path("parcels/", views.parcels, name="parcels"),
    path("parcels/<int:pk>/", views.parcel_detail, name="parcel_detail"),
]
