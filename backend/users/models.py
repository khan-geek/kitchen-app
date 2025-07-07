
from django.contrib.auth.models import (
    AbstractBaseUser,
    PermissionsMixin,
    BaseUserManager,
)
from django.db import models


class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, role="customer", **extra_fields):
        if not email:
            raise ValueError("Users must have an email address.")
        email = self.normalize_email(email)
        user = self.model(email=email, role=role, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, password, role="admin", **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ("chef", "Chef"),
        ("customer", "Customer"),
    )

    email = models.EmailField(
        unique=True,
        verbose_name="Email",
        error_messages={"unique": "An account with this email already exists."},
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    kitchen_name = models.CharField(max_length=100, unique=True, null=True)
    first_name = models.CharField(max_length=100)
    second_name = models.CharField(max_length=100, null=True, blank=True)
    phone_number = models.CharField(max_length=20)
    country = models.CharField(max_length=100)

    is_active = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)

    objects = CustomUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "phone_number", "country"]

    def __str__(self):
        return self.email


class KitchenItem(models.Model):
    chef = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="items")
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=6, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    allergens = models.JSONField(default=list, blank=True)
    origin = models.CharField(max_length=100, blank=True)
    ingredients = models.JSONField(default=list, blank=True)
    is_published = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.name} - {self.chef.kitchen_name}"




# class Order(models.Model):
#     customer = models.ForeignKey(
#         CustomUser,
#         on_delete=models.CASCADE,
#         limit_choices_to={"role": "customer"},
#         related_name="orders_placed",
#     )
#     chef = models.ForeignKey(
#         CustomUser,
#         on_delete=models.CASCADE,
#         limit_choices_to={"role": "chef"},
#         related_name="orders_recieved",
#     )
#     item = models.ForeignKey(KitchenItem, on_delete=models.CASCADE)
#     quantity = models.PositiveIntegerField(default=1)
#     created_at = models.DateTimeField(auto_now_add=True)
#     status = models.CharField(
#         max_length=20, default="pending"
#     )  # e.g., pending, accepted, completed

#     def __str__(self):
#         return f"{self.customer.email} ordered {self.quantity} x {self.item.name} from {self.chef.kitchen_name}"


class Order(models.Model):
    customer = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        limit_choices_to={"role": "customer"},
        related_name="orders_placed",
    )
    chef = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        limit_choices_to={"role": "chef"},
        related_name="orders_received",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default="pending")

    def __str__(self):
        return f"Order #{self.pk} by {self.customer.email} from {self.chef.kitchen_name}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    item = models.ForeignKey(KitchenItem, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.quantity} x {self.item.name}"

from django.conf import settings


class EmailVerificationToken(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    otp = models.CharField(max_length=6)  
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        from django.utils import timezone
        from datetime import timedelta
        return timezone.now() - self.created_at > timedelta(minutes=10)