# server/app/routes/log_routes.py

from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required

from app.models import ConnectionLog

# Створюємо Blueprint
log_bp = Blueprint('logs', __name__)


@log_bp.route('/', methods=['GET'])
@jwt_required()  # Захищаємо ендпоінт, доступний для всіх авторизованих
def get_logs():
    """Повертає список логів подій з пагінацією."""
    try:
        # Отримуємо параметри пагінації з запиту, з адекватними значеннями за замовчуванням
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)

        # Використовуємо потужний метод .paginate() від SQLAlchemy
        # Він ефективно робить запити з LIMIT та OFFSET
        paginated_logs = ConnectionLog.query.order_by(ConnectionLog.timestamp.desc()).paginate(
            page=page,
            per_page=per_page,
            error_out=False  # Не видавати помилку 404, якщо сторінка порожня
        )

        # Перетворюємо отримані об'єкти логів у словники
        logs_data = [log.to_dict() for log in paginated_logs.items]

        # Формуємо відповідь, яка включає метадані пагінації
        # Це найкраща практика для API з пагінацією
        return jsonify({
            'logs': logs_data,
            'pagination': {
                'current_page': paginated_logs.page,
                'per_page': paginated_logs.per_page,
                'total_pages': paginated_logs.pages,
                'total_items': paginated_logs.total,
                'has_next': paginated_logs.has_next,
                'has_prev': paginated_logs.has_prev
            }
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching logs: {e}")
        return jsonify(message="An internal error occurred while fetching logs."), 500