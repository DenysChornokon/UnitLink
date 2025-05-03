import datetime
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import RegistrationRequest, RegistrationRequestStatus, User, UserRole
from app.decorators import admin_required # <--- Імпортуємо наш декоратор

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/registration_requests', methods=['GET'])
@admin_required() # <--- Захищаємо маршрут (вимагає JWT + роль ADMIN)
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
    """Схвалює запит на реєстрацію та створює НЕАКТИВНОГО користувача."""
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

    # Створюємо нового користувача
    new_user = User(
        username=req.requested_username,
        email=req.email,
        # full_name=req.full_name, # Можна додати поле ПІБ до моделі User, якщо потрібно
        # rank=req.rank,           # Можна додати поле Звання до моделі User
        role=UserRole.OPERATOR,    # За замовчуванням - Оператор
        is_active=False             # <--- Важливо: створюємо НЕАКТИВНИМ
    )
    # Пароль НЕ встановлюємо. Потрібен окремий процес активації/встановлення паролю.
    # new_user.set_password(some_random_password) # НЕ РОБИТИ ТАК

    # Оновлюємо статус запиту
    req.status = RegistrationRequestStatus.APPROVED
    req.reviewed_by_user_id = admin_user_id
    req.reviewed_at = datetime.datetime.now(datetime.timezone.utc)

    db.session.add(new_user)
    try:
        db.session.commit()
        # TODO: Можна ініціювати процес надсилання email для встановлення паролю
        return jsonify(message=f"Registration request for '{req.requested_username}' approved. User created as inactive."), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error approving request {request_id}: {e}")
        return jsonify(message="Internal server error during approval."), 500


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
        # TODO: Можна надіслати email користувачу про відхилення
        return jsonify(message=f"Registration request for '{req.requested_username}' rejected."), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error rejecting request {request_id}: {e}")
        return jsonify(message="Internal server error during rejection."), 500