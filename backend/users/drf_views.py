from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status, viewsets
from .models import KitchenItem, EmailVerificationToken, CustomUser, Order, OrderItem
from .serializers import (
    KitchenItemSerializer,
    ChefUserSerializer,
    CustomerUserSerializer,
    LoginSerializer,
    OrderSerializer,
)
from .utils import handle_otp_for_user
from django.conf import settings
from rest_framework.parsers import MultiPartParser, FormParser
from .permissions import IsChef


class KitchenItemListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated, IsChef]

    def get(self, request):

        items = KitchenItem.objects.filter(chef=request.user)
        serializer = KitchenItemSerializer(items, many=True)
        print("items returned")
        return Response(serializer.data)

    def post(self, request):

        serializer = KitchenItemSerializer(data=request.data)
        if serializer.is_valid():
            item = serializer.save(chef=request.user)
            item.chef = request.user
            item.save()
            return Response(
                KitchenItemSerializer(item).data, status=status.HTTP_201_CREATED
            )
        print(serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyEmailAPIView(APIView):
    def get(self, request, token):
        try:
            token_obj = EmailVerificationToken.objects.get(token=token)
            user = token_obj.user
            user.is_active = True
            user.save()
            token_obj.delete()
            return Response({"message": "Email verified successfully."})
        except EmailVerificationToken.DoesNotExist:
            return Response({"error": "Invalid or expired token."}, status=400)


class ChefSignupAPI(APIView):
    # parser_classes = (MultiPartParser, FormParser)
    def post(self, request):
        if request.user.is_authenticated:
            return Response({"status": "Already logged in"})

        print("chef signup view")
        print(request.data)
        serializer = ChefUserSerializer(data=request.data)
        if serializer.is_valid():
            print(serializer.validated_data)

            user = serializer.save()
            user.is_active = False  # Block login until verified
            user.save()

            response = handle_otp_for_user(user,"signup", response = Response(
                {"message": "Account created. Please verify your email."},
                status=status.HTTP_201_CREATED,
            ))

            return response

        else:
            print(serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CustomerSignupAPI(APIView):
    # parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        if request.user.is_authenticated:
            return Response({"status": "Already logged in"})

        print(request.data)
        serializer = CustomerUserSerializer(data=request.data)
        if serializer.is_valid():
            print("valid")
            user = serializer.save()
            user.is_active = False
            user.save()

            

            response = handle_otp_for_user(user,"signup", response = Response(
                {"message": "Account created. Please verify your email."},
                status=status.HTTP_201_CREATED,
            ))

            return response

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginAPIView(APIView):
    def post(self, request):
        print("login")
        if request.user.is_authenticated:
            return Response({"status": "Already logged in"})

        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data["user"]
            if (not user.is_active):
                return handle_otp_for_user(user,"login",Response({"otp_sent":True}))
           
            refresh = RefreshToken.for_user(user)
            response = Response(
                {
                    "user": {
                        "id": user.id,
                        "email": user.email,
                        "role": user.role,
                        "kitchen_name": user.kitchen_name,
                    },
                    "otp_sent": False
                }
            )

            # Set tokens in HttpOnly cookies
            response.set_cookie(
                key="access",
                value=str(refresh.access_token),
                httponly=True,
                secure=settings.DEBUG is False,
                samesite="Lax",
                max_age=3600,
            )
            response.set_cookie(
                key="refresh",
                value=str(refresh),
                httponly=True,
                secure=settings.DEBUG is False,
                samesite="Lax",
                max_age=7 * 24 * 3600,
            )
            print("logged in", response)
            print(response.cookies)
            return response

            # signed_token = handle_otp_for_user(user,"login")
            # print("logged in", response)
            # # print(response.cookies)
            # response = Response({
            #     "message": "OTP sent to your email for verification."
            # }, status=200)

            # # Set signed OTP token as a cookie
            # response.set_cookie(
            #     key="otp_token",
            #     value=signed_token,
            #     max_age=300,  # 5 minutes
            #     httponly=False,  # You want frontend JS to access it
            #     secure=True,     # Only over HTTPS
            #     samesite="Lax"
            # )

            # return response

        else:
            print(serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutAPIView(APIView):
    def post(self, request):
        refresh_token = request.COOKIES.get("refresh")

        if refresh_token is None:
            return Response(
                {"detail": "Refresh token not found."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()  # This requires token blacklist app enabled

            response = Response(
                {"detail": "Logout successful."}, status=status.HTTP_200_OK
            )

            # Clear cookies
            response.delete_cookie("access")
            response.delete_cookie("refresh")

            return response

        except TokenError as e:
            return Response(
                {"detail": f"Token error: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST
            )


class UpdateKitchenNameAPIView(APIView):
    permission_classes = [IsAuthenticated, IsChef]

    def post(self, request):
        user = request.user

        new_kitchen_name = request.data.get("kitchen_name")
        if not new_kitchen_name:
            return Response({"error": "Kitchen name is required."}, status=400)

        # Check if another user already has this kitchen name
        if (
            CustomUser.objects.filter(kitchen_name__iexact=new_kitchen_name)
            .exclude(id=user.id)
            .exists()
        ):
            return Response({"error": "Kitchen name already taken."}, status=400)

        user.kitchen_name = new_kitchen_name
        user.save()

        return Response(
            {
                "message": "Kitchen name updated successfully.",
                "kitchen_name": user.kitchen_name,
            },
            status=200,
        )


class KitchenItemDeleteUpdateView(APIView):
    permission_classes = [IsAuthenticated, IsChef]

    def get_object(self, pk, user):
        try:
            return KitchenItem.objects.get(pk=pk, chef=user)
        except KitchenItem.DoesNotExist:
            return None

    def delete(self, request, pk):

        item = self.get_object(pk, request.user)
        print("delete")
        print(item)
        if not item:
            return Response(
                {"error": "Item not found"}, status=status.HTTP_404_NOT_FOUND
            )
        item.delete()
        return Response({"message": "Item deleted"}, status=status.HTTP_200_OK)

    def put(self, request, pk):
        item = self.get_object(pk, request.user)
        if not item:
            return Response(
                {"error": "Item not found"}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = KitchenItemSerializer(item, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        """Use PATCH to toggle publish status."""
        item = self.get_object(pk, request.user)
        if not item:
            return Response(
                {"error": "Item not found"}, status=status.HTTP_404_NOT_FOUND
            )

        item.is_published = not item.is_published
        item.save()
        print(item.is_published)
        return Response(
            {
                "id": item.id,
                "is_published": item.is_published,
                "message": "Publish status toggled successfully.",
            },
            status=status.HTTP_200_OK,
        )


class UserStatusAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response(
            {
                "id": user.id,
                "email": user.email,
                "role": user.role,
                "kitchen_name": user.kitchen_name,
                "is_authenticated": True,
            }
        )

from .utils import verify_signed_token


class VerifyOTPAPIView(APIView):
    def post(self, request):
        otp = request.data.get("otp")
        otp_token = request.COOKIES.get("otp_token")
       
        if not otp or not otp_token:
            return Response({"detail": "OTP and token required."}, status=400)
        
        payload = verify_signed_token(otp_token)
        if not payload:
            return Response({"detail": "Invalid or expired token."}, status=400)

        email = payload["email"]
        print("email", email, "otp", otp)
        # purpose = payload["purpose"]

        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            return Response({"detail": "User not found."}, status=404)

        try:
            user = CustomUser.objects.get(email=email)
            record = EmailVerificationToken.objects.get(user=user)

            if record.otp != otp:
                return Response({"error": "Invalid OTP"}, status=400)

            if record.is_expired():
                return Response({"error": "OTP expired"}, status=400)

            user.is_active = True
            user.save()
            record.delete()  # OTP used once

            return Response({"message": "Email verified successfully."})

        except CustomUser.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
        except EmailVerificationToken.DoesNotExist:
            return Response({"error": "OTP not found"}, status=404)


class PlaceOrderAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.role != "customer":
            return Response(
                {"error": "Only customers can place orders."},
                status=status.HTTP_403_FORBIDDEN,
            )

        kitchen_id = request.data.get("kitchen_id")
        items = request.data.get("items", [])

        if not items or not kitchen_id:
            return Response(
                {"error": "Missing order details."}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            chef = CustomUser.objects.get(id=kitchen_id, role="chef")
        except CustomUser.DoesNotExist:
            return Response({"error": "Invalid kitchen/chef ID."}, status=400)

        order = Order.objects.create(customer=user, chef=chef)

        for item in items:
            try:
                food = KitchenItem.objects.get(
                    id=item["item_id"], chef=chef, is_published=True
                )
                OrderItem.objects.create(
                    order=order, item=food, quantity=item["quantity"]
                )
            except KitchenItem.DoesNotExist:
                continue  # Skip invalid items
        print(OrderSerializer(order).data)
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


from rest_framework.generics import RetrieveAPIView


class KitchenDetailAPIView(RetrieveAPIView):
    def get(self, request, id):
        try:
            chef = CustomUser.objects.get(id=id, role="chef", is_active=True)
            items = KitchenItem.objects.filter(chef=chef, is_published=True)
            serialized_items = KitchenItemSerializer(items, many=True).data

            return Response(
                {
                    "id": chef.id,
                    "name": chef.kitchen_name,
                    "cuisine_type": (
                        chef.kitchen_type
                        if hasattr(chef, "kitchen_type")
                        else "Unknown"
                    ),
                    "food_items": serialized_items,
                }
            )
        except CustomUser.DoesNotExist:
            return Response(
                {"error": "Kitchen not found."}, status=status.HTTP_404_NOT_FOUND
            )


class CustomerOrdersAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "customer":
            return Response({"error": "Access denied"}, status=403)

        orders = Order.objects.filter(customer=request.user).prefetch_related(
            "items__item"
        )
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)


class KitchenListAPIView(APIView):
    # permission_classes = [IsAuthenticated]

    def get(self, request):
        chefs = CustomUser.objects.filter(role="chef")
        kitchens = []

        for chef in chefs:
            items = KitchenItem.objects.filter(chef=chef, is_published=True)
            if items.exists():
                kitchens.append(
                    {
                        "id": chef.id,
                        "name": chef.kitchen_name,
                        "description": chef.first_name or "",
                        "image": """ chef.profile_picture.url if chef.profile_picture else """
                        "/placeholder-kitchen.jpg",
                        "rating": 4.5,  # You can add logic to calculate actual rating
                        "foodCount": items.count(),
                        "isOpen": True,  # Add logic later if needed
                        "foodItems": KitchenItemSerializer(items, many=True).data,
                    }
                )

        return Response(kitchens)


class ChefOrderListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "chef":
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

        orders = Order.objects.filter(chef=request.user).order_by("-created_at")
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)


class ChefOrderViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsChef]

    def get_queryset(self):
        return Order.objects.filter(chef=self.request.user).prefetch_related(
            "items__item"
        )


class GetKitchen(APIView):
    permission_classes = [IsAuthenticated, IsChef]

    def get(self, request):

        kitchen = bool(request.user.kitchen_name)
        if kitchen:
            return Response({"kitchen": kitchen})
        else:
            return Response({"kitchen": kitchen})

""" from utils import verify_signed_token
class VerifyOTPAPIView(APIView):
    def post(self, request):
        otp = request.data.get("otp")
        otp_token = request.data.get("otp_token")

        if not otp or not otp_token:
            return Response({"detail": "OTP and token required."}, status=400)

        payload = verify_signed_token(otp_token)
        if not payload:
            return Response({"detail": "Invalid or expired token."}, status=400)

        email = payload["email"]
        purpose = payload["purpose"]

        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            return Response({"detail": "User not found."}, status=404)

        try:
            otp_obj = EmailVerificationToken.objects.filter(user=user).latest("created_at")
        except EmailVerificationToken.DoesNotExist:
            return Response({"detail": "No OTP found."}, status=404)

        if otp_obj.is_expired() or otp_obj.otp != otp:
            return Response({"detail": "Invalid or expired OTP."}, status=400)

        if purpose == "signup" and not user.is_active:
            user.is_active = True
            user.save()

        otp_obj.delete()
        refresh = RefreshToken.for_user(user)

        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "message": f"{purpose.capitalize()} verified successfully."
        }, status=200)
 """