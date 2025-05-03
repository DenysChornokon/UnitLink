import datetime # Потрібно для оновлення last_login_at
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, get_jwt
from app import db # Імпортуємо db
from app.models import User, RegistrationRequest, RegistrationRequestStatus # Імпортуємо моделі
from flask_jwt_extended import jwt_required, get_jwt_identity

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

    # Створюємо НОВИЙ access_token
    new_access_token = create_access_token(identity=current_user_id)
    return jsonify(access_token=new_access_token), 200

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