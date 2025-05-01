import datetime # Потрібно для оновлення last_login_at
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token
from app import db # Імпортуємо db
from app.models import User, RegistrationRequest, RegistrationRequestStatus # Імпортуємо моделі

# Створюємо Blueprint для маршрутів аутентифікації
auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({"message": "Request body must be JSON"}), 400

    login_identifier = data.get('username') # Можна логінитись по username або email
    password = data.get('password')

    if not login_identifier or not password:
        return jsonify({"message": "Missing username/email or password"}), 400

    # Шукаємо користувача за username або email
    user = User.query.filter((User.username == login_identifier) | (User.email == login_identifier)).first()

    # Перевіряємо чи користувач існує, чи активний, і чи пароль вірний
    if user and user.is_active and user.check_password(password):
        # Оновлюємо час останнього входу
        user.last_login_at = datetime.datetime.now(datetime.timezone.utc)
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            # Логування помилки бажане тут
            print(f"Error updating last_login_at for user {user.id}: {e}")
            return jsonify({"message": "An internal error occurred during login."}), 500


        # Створюємо токени. Використовуємо user.id (UUID) як identity
        access_token = create_access_token(identity=str(user.id)) # Перетворюємо UUID в рядок
        refresh_token = create_refresh_token(identity=str(user.id))

        return jsonify(
            message="Login successful",
            access_token=access_token,
            refresh_token=refresh_token,
            user_role=user.role.name # Додаємо роль користувача у відповідь
        ), 200
    else:
        # Не вказуємо, що саме не так (логін чи пароль) для безпеки
        return jsonify({"message": "Invalid credentials or inactive user"}), 401

@auth_bp.route('/register_request', methods=['POST'])
def register_request():
    data = request.get_json()
    if not data:
        return jsonify({"message": "Request body must be JSON"}), 400

    requested_username = data.get('requested_username')
    email = data.get('email')
    reason = data.get('reason', '') # Причина опціональна

    if not requested_username or not email:
        return jsonify({"message": "Missing requested username or email"}), 400

    # (Опціонально) Перевірка, чи не існує вже користувач або активний запит з такими даними
    existing_user = User.query.filter((User.username == requested_username) | (User.email == email)).first()
    existing_request = RegistrationRequest.query.filter(
        (RegistrationRequest.email == email) | (RegistrationRequest.requested_username == requested_username),
        RegistrationRequest.status == RegistrationRequestStatus.PENDING
    ).first()

    if existing_user:
        return jsonify({"message": "User with this username or email already exists."}), 409 # Conflict
    if existing_request:
         return jsonify({"message": "A pending registration request with this username or email already exists."}), 409 # Conflict

    # Створюємо новий запит
    new_request = RegistrationRequest(
        requested_username=requested_username,
        email=email,
        reason=reason,
        status=RegistrationRequestStatus.PENDING
    )

    db.session.add(new_request)
    try:
        db.session.commit()
        # TODO: Додати логіку сповіщення адміністратора (наприклад, email)
        return jsonify({"message": "Registration request submitted successfully. Waiting for administrator approval."}), 201 # Created
    except Exception as e:
        db.session.rollback()
        # TODO: Логування помилки
        print(f"Error saving registration request: {e}")
        return jsonify({"message": "Failed to submit registration request due to an internal error."}), 500


# TODO: Додати маршрут для оновлення токену ('/refresh') використовуючи @jwt_required(refresh=True)
# TODO: Додати маршрут для виходу ('/logout') - потребує механізму блокування токенів (blacklist)