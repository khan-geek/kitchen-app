from rest_framework.permissions import BasePermission

class IsChef(BasePermission):
    """
    Allows access only to users with role='chef'.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "chef"