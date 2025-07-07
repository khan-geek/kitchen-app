from django.urls import path
from .drf_views import (
    ChefSignupAPI,
    CustomerSignupAPI,
    LoginAPIView,
    LogoutAPIView,
    KitchenItemListCreateAPIView,
    VerifyEmailAPIView,
    UpdateKitchenNameAPIView,
    UserStatusAPIView,
    KitchenItemDeleteUpdateView,
    PlaceOrderAPIView,
    KitchenDetailAPIView,
    CustomerOrdersAPIView,
    KitchenListAPIView,
)

urlpatterns = [
    path("signup/chef/", ChefSignupAPI.as_view(), name="chef-signup"),
    path("signup/customer/", CustomerSignupAPI.as_view(), name="customer-signup"),
    path("login/", LoginAPIView.as_view(), name="login"),
    path("logout/", LogoutAPIView.as_view(), name="logout"),
    path(
        "dashboard/chef/", KitchenItemListCreateAPIView.as_view(), name="chef-dashboard"
    ),
    path(
        "verify-email/<str:token>/", VerifyEmailAPIView.as_view(), name="verify-email"
    ),
    path(
        "add-kitchen/",
        UpdateKitchenNameAPIView.as_view(),
        name="update-kitchen-name",
    ),
    path("status/", UserStatusAPIView.as_view(), name="user-status"),
    path(
        "dashboard/chef/<int:pk>/",
        KitchenItemDeleteUpdateView.as_view(),
        name="chef-item-detail",
    ),
    path("kitchen/<int:id>/", KitchenDetailAPIView.as_view(), name="kitchen-detail"),
    path("place-order/", PlaceOrderAPIView.as_view(), name="place-order"),
    path("my-orders/", CustomerOrdersAPIView.as_view(), name="customer-orders"),
    path("get-all-kitchens/", KitchenListAPIView.as_view(), name="get-all-kitchens"),
]
