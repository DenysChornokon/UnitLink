import datetime # Потрібно для оновлення last_login_at
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, get_jwt
from app import db # Імпортуємо db
from app.models import User, RegistrationRequest, RegistrationRequestStatus # Імпортуємо моделі
from flask_jwt_extended import jwt_required, get_jwt_identity
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadTimeSignature
from flask import current_app

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


        # Створюємо токени
        additional_claims = {"role": user.role.value}  # Використовуємо .value ('admin' або 'operator')
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims=additional_claims
        )
        refresh_token = create_refresh_token(
            identity=str(user.id))

        return jsonify(
            message="Login successful",
            access_token=access_token,
            refresh_token=refresh_token,
            user_role=user.role.name,
            username=user.username,
            user_id=str(user.id),
        ), 200
    else:
        # Не вказуємо, що саме не так (логін чи пароль) для безпеки
        return jsonify({"message": "Invalid credentials or inactive user"}), 401

@auth_bp.route('/register_request', methods=['POST'])
def register_request():
    data = request.get_json()
    if not data:
        return jsonify({"message": "Request body must be JSON"}), 400

    # Отримуємо нові поля
    requested_username = data.get('requested_username')
    email = data.get('email')
    full_name = data.get('full_name') # <--- Нове
    rank = data.get('rank')           # <--- Нове
    reason = data.get('reason', '')

    # Додаємо перевірку обов'язкових полів
    if not requested_username or not email or not full_name:
        return jsonify({"message": "Missing required fields: requested_username, email, full_name"}), 400

    # ...(перевірка на існуючих користувачів/запити як раніше)...
    existing_user = User.query.filter((User.username == requested_username) | (User.email == email)).first()
    existing_request = RegistrationRequest.query.filter(
        (RegistrationRequest.email == email) | (RegistrationRequest.requested_username == requested_username),
        RegistrationRequest.status == RegistrationRequestStatus.PENDING
    ).first()

    if existing_user:
        return jsonify({"message": "User with this username or email already exists."}), 409 # Conflict
    if existing_request:
        return jsonify({"message": "A pending registration request with this username or email already exists."}), 409 # Conflict

    # Створюємо новий запит з новими полями
    new_request = RegistrationRequest(
        requested_username=requested_username,
        email=email,
        full_name=full_name, # <--- Нове
        rank=rank,           # <--- Нове
        reason=reason,
        status=RegistrationRequestStatus.PENDING
    )

    db.session.add(new_request)
    try:
        db.session.commit()
        # TODO: Сповіщення адміністратора
        return jsonify({"message": "Registration request submitted successfully. Waiting for administrator approval."}), 201
    except Exception as e:
        db.session.rollback()
        # TODO: Логування
        print(f"Error saving registration request: {e}")
        return jsonify({"message": "Failed to submit registration request due to an internal error."}), 500


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True) # <--- Важливо: вимагає саме REFRESH токен
def refresh():
    """Оновлює access_token за допомогою refresh_token."""
    # Отримуємо ідентифікатор користувача (має бути рядок UUID) з refresh токена
    current_user_id = get_jwt_identity()

    # TODO: Додаткова перевірка (для безпеки Logout):
    # Перевірити, чи цей refresh_token не був відкликаний/доданий до "чорного списку".
    # Це потребує механізму зберігання відкликаних токенів (наприклад, в БД або Redis).
    # is_token_revoked = check_if_token_is_revoked(get_jwt()['jti']) # Приклад
    # if is_token_revoked:
    #     return jsonify({"message": "Refresh token has been revoked"}), 401

    user = User.query.get(current_user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    # Створюємо НОВИЙ access_token
    additional_claims = {"role": user.role.value}
    new_access_token = create_access_token(
        identity=current_user_id,
        additional_claims=additional_claims
    )

# TODO: Додати маршрут для виходу ('/logout') - потребує механізму блокування токенів (blacklist)
# Словник або множина для зберігання JTI відкликаних токенів (ДУЖЕ спрощено, тільки для прикладу!)
# У РЕАЛЬНОМУ ДОДАТКУ ВИКОРИСТОВУЙТЕ БД АБО REDIS!
revoked_tokens_jti = set()

# Функція-перевірка токена (приклад, для використання в @jwt_required та /refresh)
# Цю логіку потрібно інтегрувати з JWTManager
# def is_token_revoked_callback(jwt_header, jwt_payload):
#     jti = jwt_payload['jti']
#     return jti in revoked_tokens_jti

@auth_bp.route('/logout', methods=['DELETE'])
# Можна вимагати будь-який токен (access або refresh) для виходу,
# але логічніше інвалідувати refresh token, тому вимагаємо його.
@jwt_required(refresh=True)
def logout():
    """Додає JTI refresh токена до списку відкликаних."""
    # Отримуємо унікальний ідентифікатор (jti) поточного refresh токена
    jti = get_jwt()['jti']

    # --- ЛОГІКА ДОДАВАННЯ ДО ЧОРНОГО СПИСКУ (Denylist) ---
    # TODO: Реалізувати надійний механізм зберігання відкликаних JTI.
    # Наприклад, додати jti в таблицю 'revoked_tokens' в БД з часом закінчення дії,
    # або в кеш Redis з відповідним TTL.
    revoked_tokens_jti.add(jti) # !!! Тимчасове зберігання в пам'яті !!!
    print(f"Token with jti {jti} revoked (in-memory).")
    # ---------------------------------------------------------

    return jsonify({"message": "Successfully logged out. Refresh token revoked."}), 200

# TODO: Налаштувати JWTManager для перевірки відкликаних токенів
# Потрібно буде додати перевірку в `create_app` через `jwt = JWTManager(app)`
# і @jwt.token_in_blocklist_loader / @jwt.revoked_token_loader
# Див. документацію Flask-JWT-Extended: "Token Revoking" / "Blocklist"


PASSWORD_SETUP_SALT = 'password-setup-salt' # Сіль для токена встановлення паролю
PASSWORD_SETUP_MAX_AGE = 86400 # 24 години в секундах

@auth_bp.route('/validate-setup-token', methods=['POST'])
def validate_setup_token():
    """Перевіряє валідність токена для встановлення паролю."""
    data = request.get_json()
    token = data.get('token')
    if not token:
        return jsonify(message="Token is required"), 400

    serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    try:
        # Перевіряємо токен (підпис, сіль, термін дії)
        user_id_str = serializer.loads(
            token,
            salt=PASSWORD_SETUP_SALT,
            max_age=PASSWORD_SETUP_MAX_AGE
        )
        # Знаходимо користувача
        user = User.query.filter_by(id=user_id_str, is_active=False).first()

        if not user:
            # Або токен недійсний для цього користувача, або користувач вже активний
            return jsonify(valid=False, message="Invalid token or user already active."), 404

        # Токен валідний для неактивованого користувача
        return jsonify(valid=True, message="Token is valid."), 200

    except SignatureExpired:
        return jsonify(valid=False, message="Password setup link has expired."), 400
    except BadTimeSignature:
         return jsonify(valid=False, message="Invalid token signature or data."), 400
    except Exception as e:
        current_app.logger.error(f"Error validating setup token: {e}")
        return jsonify(valid=False, message="Invalid token."), 400


@auth_bp.route('/complete-setup', methods=['POST'])
def complete_setup():
    """Встановлює пароль та активує користувача за токеном."""
    data = request.get_json()
    token = data.get('token')
    password = data.get('password')

    if not token or not password:
        return jsonify(message="Token and password are required"), 400

    # TODO: Додати валідацію складності паролю тут

    serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    try:
        user_id_str = serializer.loads(
            token,
            salt=PASSWORD_SETUP_SALT,
            max_age=PASSWORD_SETUP_MAX_AGE
        )
        user = User.query.filter_by(id=user_id_str, is_active=False).first()

        if not user:
            return jsonify(message="Invalid token or user already active."), 404

        # Встановлюємо новий пароль та активуємо користувача
        user.set_password(password)
        user.is_active = True
        # Можна очистити поля токена, якщо вони були в моделі User
        # user.setup_token_hash = None
        # user.setup_token_expires_at = None

        db.session.commit()
        return jsonify(message="Password set successfully. You can now log in."), 200

    except (SignatureExpired, BadTimeSignature):
        return jsonify(message="Invalid or expired token."), 400
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error completing password setup for user {user_id_str if 'user_id_str' in locals() else 'unknown'}: {e}")
        return jsonify(message="An error occurred setting the password."), 500

# ---------------------------------------------------------------------------------------------------

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required() # Тільки авторизований користувач може змінити свій пароль
def change_password():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    if not user:
        return jsonify({"message": "User not found"}), 404

    data = request.get_json()
    current_password = data.get('currentPassword')
    new_password = data.get('newPassword')
    confirm_password = data.get('confirmPassword')

    if not all([current_password, new_password, confirm_password]):
        return jsonify({"message": "All password fields are required"}), 400

    if not user.check_password(current_password):
        return jsonify({"message": "Invalid current password"}), 401 # Unauthorized or 403 Forbidden

    if new_password != confirm_password:
        return jsonify({"message": "New passwords do not match"}), 400

    # TODO: Додати валідацію складності нового пароля (довжина, символи тощо)
    # if len(new_password) < 8:
    #     return jsonify({"message": "New password must be at least 8 characters long"}), 400

    user.set_password(new_password)
    try:
        db.session.commit()
        return jsonify({"message": "Password updated successfully"}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error changing password for user {user.id}: {e}")
        return jsonify({"message": "An internal error occurred while changing password."}), 500
