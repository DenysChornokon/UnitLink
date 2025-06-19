# server/app/services/decorators.py

from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt
from app.models import UserRole
from flask import request, current_app


def admin_required(fn):
    """
    Декоратор, що перевіряє, чи має користувач роль ADMIN.
    """

    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        claims = get_jwt()
        if claims.get('role') != UserRole.ADMIN.value:
            return jsonify(message="Admins only access!"), 403

        return fn(*args, **kwargs)

    return wrapper


def device_api_key_required(fn):
    """
    Декоратор, що перевіряє наявність та валідність API-ключа пристрою в заголовках.
    """

    @wraps(fn)
    def wrapper(*args, **kwargs):
        api_key = request.headers.get('X-Device-Api-Key')
        expected_key = current_app.config.get('DEVICE_API_KEY')

        if not api_key or api_key != expected_key:
            return jsonify(message="Invalid or missing Device API Key"), 401  # Або 403 Forbidden

        return fn(*args, **kwargs)

    return wrapper
