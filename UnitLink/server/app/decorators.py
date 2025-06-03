# server/app/services/decorators.py

from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt
from app.models import UserRole  # Переконайся, що імпорт правильний


def admin_required(fn):
    """
    Декоратор, що перевіряє, чи має користувач роль ADMIN.
    """

    @wraps(fn)
    def wrapper(*args, **kwargs):
        # Спочатку перевіряємо наявність та валідність JWT токена
        verify_jwt_in_request()
        # Потім отримуємо дані з токена
        claims = get_jwt()
        # Перевіряємо роль
        if claims.get('role') != UserRole.ADMIN.value:
            return jsonify(message="Admins only access!"), 403

        # Якщо перевірка пройдена, викликаємо оригінальну функцію
        return fn(*args, **kwargs)

    return wrapper