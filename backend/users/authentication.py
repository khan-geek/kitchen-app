from rest_framework_simplejwt.authentication import JWTAuthentication

class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        print("cookie authentication check")
        access_token = request.COOKIES.get('access')
        if access_token is None:
            return None
        try:
            validated_token = self.get_validated_token(access_token)
            print(validated_token, self.get_user(validated_token), validated_token)
            return self.get_user(validated_token), validated_token
        except Exception:
            return None
