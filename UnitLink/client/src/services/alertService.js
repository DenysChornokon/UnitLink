// client/src/services/alertService.js
import apiClient from "./api";

const getUnacknowledged = async () => {
  try {
    const response = await apiClient.get("/api/alerts/unacknowledged");
    return response.data.alerts || [];
  } catch (error) {
    console.error("Get Unacknowledged Alerts API error:", error);
    throw error;
  }
};

const acknowledge = async (alertId) => {
  try {
    const response = await apiClient.post(`/api/alerts/${alertId}/acknowledge`);
    return response.data;
  } catch (error) {
    console.error("Acknowledge Alert API error:", error);
    throw error;
  }
};

const alertService = {
  getUnacknowledged,
  acknowledge,
};

export default alertService;
