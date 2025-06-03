# server/app/routes/alert_routes.py
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Alert
import datetime

alert_bp = Blueprint('alerts', __name__)

@alert_bp.route('/unacknowledged', methods=['GET'])
@jwt_required()
def get_unacknowledged_alerts():
    """Повертає список всіх непідтверджених сповіщень."""
    alerts = Alert.query.filter_by(is_acknowledged=False).order_by(Alert.timestamp.desc()).all()
    return jsonify(alerts=[alert.to_dict() for alert in alerts]), 200

@alert_bp.route('/<uuid:alert_id>/acknowledge', methods=['POST'])
@jwt_required()
def acknowledge_alert(alert_id):
    """Позначає сповіщення як підтверджене."""
    user_id = get_jwt_identity()
    alert = Alert.query.get_or_404(alert_id)
    if not alert.is_acknowledged:
        alert.is_acknowledged = True
        alert.acknowledged_at = datetime.datetime.now(datetime.timezone.utc)
        alert.acknowledged_by_user_id = user_id
        db.session.commit()
    return jsonify(message="Alert acknowledged.", alert=alert.to_dict()), 200