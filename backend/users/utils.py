
from django.core.mail import send_mail
from django.conf import settings
from .models import EmailVerificationToken
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired
import json
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
# def handle_otp_for_user(user):
#     otp = generate_otp()

#     # Remove any previous OTP for this user
#     EmailVerificationToken.objects.filter(user=user).delete()

#     # Save new OTP
#     EmailVerificationToken.objects.create(user=user, otp=otp)

#     # Send OTP via email
#     send_otp_email(user.email, otp)
def handle_otp_for_user(user, role, response):
    otp = generate_otp()
    EmailVerificationToken.objects.filter(user=user).delete()

    EmailVerificationToken.objects.create(user=user,otp=otp)
    # send_otp_email(user.email, otp)
    print("otp", otp )
    signed_token = create_signed_token(user.email, role)
    response.set_cookie(
                key="otp_token",
                value=signed_token,
                max_age=300,  # 5 minutes
                httponly=True,  # You want frontend JS to access it
                secure=False,     # Only over HTTPS
                samesite="Lax"
            )
    return response
    

signer = TimestampSigner()

def create_signed_token(email, purpose):
    payload = json.dumps({"email": email, "purpose": purpose})
    return signer.sign(payload)

def verify_signed_token(token, max_age=300):
    try:
        payload = signer.unsign(token, max_age=max_age)
        return json.loads(payload)
    except (BadSignature, SignatureExpired):
        return None

 
def get_fields(data):
    pass