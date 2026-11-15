from django.urls import include, path
from rest_framework_simplejwt.views import TokenRefreshView
from .jwt_views import CustomTokenObtainPairView
from . import views

urlpatterns = [
    # Health and core recommendation
    path("health/", views.health, name="health"),
    path("recommendations/", views.recommend, name="recommendations"),
    path("scenarios/", views.scenarios_view, name="scenarios"),
    path("whatif/", views.whatif_view, name="whatif"),
    path("crops/", views.crops_list, name="crops"),
    path("crops/detail/", views.crops_detail_list, name="crops_detail"),
    path("data-sources/", views.data_sources_list, name="data_sources"),
    path("reports/decision-report/", views.report_generate, name="report_generate"),

    # Authentication & JWT
    path("auth/register/", views.register, name="register"),
    path("auth/login/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/me/", views.current_user, name="current_user"),

    # User saved parcels/farms
    path("parcels/", views.parcels, name="parcels"),
    path("parcels/<int:pk>/", views.parcel_detail, name="parcel_detail"),

    # Farm plan workflow (draft, proposed, approved, modified, rejected)
    path("plans/", views.plans_list_create, name="plans_list_create"),
    path("plans/<int:pk>/", views.plan_detail_patch, name="plan_detail_patch"),

    # Questions du fellah en darija (Membre 3, sur le moteur du Membre 2)
    path("fellah/", include("fellah.urls")),

    # Real-Time AI Agricultural Advisor (Context-Aware, Real Voice Call & Memory)
    path("advisor/", include("advisor.urls")),
]
