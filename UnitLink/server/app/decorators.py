from functools import wraps
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from flask import jsonify
from .models import User, UserRole

def admin_required():
    """Декоратор для перевірки ролі адміністратора."""
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            # Спочатку перевіряємо наявність дійсного JWT
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = User.query.get(user_id) # Отримуємо користувача за ID з токена

            if user and user.role == UserRole.ADMIN and user.is_active:
                 # Якщо користувач існує, активний і є адміном - виконуємо функцію
                return fn(*args, **kwargs)
            else:
                # Інакше повертаємо помилку доступу
                return jsonify(message="Admins only! Access denied."), 403 # Forbidden
        return decorator
    return wrapper