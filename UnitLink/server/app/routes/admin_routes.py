# server/app/routes/admin_routes.py
import datetime
import uuid
from flask import Blueprint, jsonify, request, current_app # Додано current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from itsdangerous import URLSafeTimedSerializer # Залишаємо для генерації токенів
from app import db # Переконуємось, що db імпортовано
# Прибираємо імпорти flask_mail, якщо він більше не потрібен
# from app import mail
# from flask_mail import Message
from app.models import RegistrationRequest, RegistrationRequestStatus, User, UserRole
from app.decorators import admin_required # Імпортуємо декоратор

admin_bp = Blueprint('admin', __name__)

# Константи для токена встановлення паролю
PASSWORD_SETUP_SALT = 'password-setup-salt'
PASSWORD_SETUP_MAX_AGE = 86400 # 24 години в секундах

@admin_bp.route('/registration_requests', methods=['GET'])
@admin_required() # Захищаємо маршрут
def get_registration_requests():
    """Отримує список запитів на реєстрацію зі статусом PENDING."""
    pending_requests = RegistrationRequest.query.filter_by(
        status=RegistrationRequestStatus.PENDING
    ).order_by(RegistrationRequest.requested_at.asc()).all()

    output = []
    for req in pending_requests:
        output.append({
            "id": str(req.id),
            "requested_username": req.requested_username,
            "email": req.email,
            "full_name": req.full_name,
            "rank": req.rank,
            "reason": req.reason,
            "requested_at": req.requested_at.isoformat() if req.requested_at else None,
        })
    return jsonify(requests=output), 200

@admin_bp.route('/registration_requests/<uuid:request_id>/approve', methods=['POST'])
@admin_required()
def approve_registration_request(request_id):
    """
    Схвалює запит на реєстрацію, створює НЕАКТИВНОГО користувача
    та повертає посилання для встановлення паролю адміністратору.
    """
    admin_user_id = get_jwt_identity() # ID адміністратора, що схвалює
    req = RegistrationRequest.query.get_or_404(request_id)

    if req.status != RegistrationRequestStatus.PENDING:
        return jsonify(message="Request already processed."), 400

    # Перевірка, чи не зайняті ім'я користувача або email
    existing_user = User.query.filter(
        (User.username == req.requested_username) | (User.email == req.email)
    ).first()
    if existing_user:
         req.status = RegistrationRequestStatus.REJECTED # Відхиляємо автоматично
         req.reviewed_by_user_id = admin_user_id
         req.reviewed_at = datetime.datetime.now(datetime.timezone.utc)
         db.session.commit()
         return jsonify(message=f"Cannot approve. User with username '{req.requested_username}' or email '{req.email}' already exists. Request rejected."), 409

    # Створюємо нового неактивного користувача з placeholder паролем
    new_user = User(
        username=req.requested_username,
        email=req.email,
        role=UserRole.OPERATOR,
        is_active=False
    )
    # Встановлюємо безпечний placeholder хеш паролю
    random_password_for_hash = str(uuid.uuid4())
    new_user.set_password(random_password_for_hash)

    # Оновлюємо статус запиту
    req.status = RegistrationRequestStatus.APPROVED
    req.reviewed_by_user_id = admin_user_id
    req.reviewed_at = datetime.datetime.now(datetime.timezone.utc)

    db.session.add(new_user)
    try:
        # Виконуємо flush, щоб отримати ID нового користувача для токена
        db.session.flush()

        # Генеруємо токен для встановлення паролю
        serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
        setup_token = serializer.dumps(str(new_user.id), salt=PASSWORD_SETUP_SALT)

        # Формуємо URL для встановлення паролю на фронтенді
        # Переконайтесь, що FRONTEND_URL налаштовано в config.py / .env
        frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:3000')
        setup_url = f"{frontend_url}/set-password?token={setup_token}"

        # *** Видалено код надсилання email ***

        # Зберігаємо зміни (користувача та запит) в БД
        db.session.commit()

        # Повертаємо повідомлення та URL адміністратору
        return jsonify(
            message=f"Request approved. User '{req.requested_username}' created as inactive.",
            instruction="Please PROVIDE THIS SETUP LINK to the user SECURELY:", # Інструкція для адміна
            setup_url=setup_url # Повертаємо URL
        ), 200

    except Exception as e:
        db.session.rollback() # Відкат у разі будь-якої помилки
        current_app.logger.error(f"Error approving request {request_id}: {e}") # Логування помилки
        return jsonify(message=f"Internal server error during approval: {str(e)}"), 500


@admin_bp.route('/registration_requests/<uuid:request_id>/reject', methods=['POST'])
@admin_required()
def reject_registration_request(request_id):
    """Відхиляє запит на реєстрацію."""
    admin_user_id = get_jwt_identity()
    req = RegistrationRequest.query.get_or_404(request_id)

    if req.status != RegistrationRequestStatus.PENDING:
        return jsonify(message="Request already processed."), 400

    req.status = RegistrationRequestStatus.REJECTED
    req.reviewed_by_user_id = admin_user_id
    req.reviewed_at = datetime.datetime.now(datetime.timezone.utc)

    try:
        db.session.commit()
        # TODO: Можна надіслати email користувачу про відхилення (якщо налаштувати Mail для інших цілей)
        return jsonify(message=f"Registration request for '{req.requested_username}' rejected."), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error rejecting request {request_id}: {e}") # Логування помилки
        return jsonify(message="Internal server error during rejection."), 500