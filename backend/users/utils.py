from django.core.mail import send_mail
from django.conf import settings
from .models import EmailVerificationToken

def send_verification_email(user):
    token, created = EmailVerificationToken.objects.get_or_create(user=user)
    verification_link = f"{settings.FRONTEND_URL}/verify-email/{token.token}"
    send_mail(
        subject='Verify your email',
        message=f'Click the link to verify your account: {verification_link}',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
    )

def send_otp_email(email, otp):
    send_mail(
        subject="Your verification code",
        message=f"Your OTP is: {otp}. It expires in 10 minutes.",
        from_email="noreply@yourapp.com",
        recipient_list=[email],
    )

import random

def generate_otp():
    return str(random.randint(100000, 999999))
def handle_otp_for_user(user):
    otp = generate_otp()

    # Remove any previous OTP for this user
    EmailVerificationToken.objects.filter(user=user).delete()

    # Save new OTP
    EmailVerificationToken.objects.create(user=user, otp=otp)

    # Send OTP via email
    # send_otp_email(user.email, otp)
    
def get_fields(data):
    pass