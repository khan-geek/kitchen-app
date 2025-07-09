from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import CustomUser, KitchenItem
from .utils import handle_otp_for_user
import uuid


class LoginSerializer(serializers.Serializer):
    identifier = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        identifier = data.get("identifier", "").strip().lower()
        password = data.get("password")

        try:
            if "@" in identifier:
                user = CustomUser.objects.get(email__iexact=identifier)
            else:
                user = CustomUser.objects.get(
                    kitchen_name__iexact=identifier, role="chef"
                )
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError("Invalid credentials.")
        print(user.email, password)
        # user = authenticate(
        #     request=self.context.get("request"), username=user.email, password=password
        # )
        if (user.check_password(password)):
            data["user"] = user
            return data
        # print(user)
        else:
            raise serializers.ValidationError("Invalid credentials.")

        # if not user.is_active:
        #     raise serializers.ValidationError(
        #         "Please verify your email before logging in."
        #     )



class BaseUserSerializer(serializers.ModelSerializer):
    def validate_email(self, email):
        user = self.context.get("request").user if self.context.get("request") else None
        if (
            CustomUser.objects.filter(email__iexact=email)
            .exclude(id=getattr(user, "id", None))
            .exists()
        ):
            raise serializers.ValidationError(
                "An account with this email already exists."
            )
        return email

    class Meta:
        model = CustomUser
        fields = [
            "email",
            "first_name",
            "second_name",
            "phone_number",
            "country",
            "password",
        ]


class ChefUserSerializer(BaseUserSerializer):
    class Meta(BaseUserSerializer.Meta):
        model = CustomUser
        fields = BaseUserSerializer.Meta.fields + ["kitchen_name"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        """ validated_data["kitchen_name"] = (
            f"kitchen_{uuid.uuid4().hex[:8]}"
            if not validated_data.get("kitchen_name")
            else validated_data["kitchen_name"]
        ) """
        validated_data["role"] = "chef"
        user = CustomUser.objects.create_user(**validated_data)

        return user


class CustomerUserSerializer(BaseUserSerializer):
    class Meta(BaseUserSerializer.Meta):
        model = CustomUser
        fields = BaseUserSerializer.Meta.fields
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        print(validated_data)
        validated_data["role"] = "customer"
        user = CustomUser.objects.create_user(**validated_data)
        return user


class KitchenItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = KitchenItem
        fields = [
            "id",
            "name",
            "price",
            "description",
            "origin",
            "ingredients",
            "allergens",
            "is_published",
        ]


from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="item.name", read_only=True)
    price = serializers.DecimalField(
        source="item.price", max_digits=10, decimal_places=2, read_only=True
    )

    class Meta:
        model = OrderItem
        fields = ["id", "name", "price", "quantity"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    chef = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ["id", "customer", "chef", "items", "created_at", "status"]
        read_only_fields = ["customer", "chef", "created_at", "status"]

    def create(self, validated_data):
        items_data = validated_data.pop("items")
        order = Order.objects.create(**validated_data)

        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)

        return order

    def get_chef(self, obj):
        return {
            "id": obj.chef.id,
            "kitchen_name": obj.chef.kitchen_name,
        }
