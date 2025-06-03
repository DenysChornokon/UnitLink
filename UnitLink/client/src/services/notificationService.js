// client/src/services/notificationService.js
import { toast } from "react-toastify";

const options = {
  position: "top-right",
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
};

const notify = {
  success: (message) => {
    toast.success(message, options);
  },
  error: (message) => {
    toast.error(message, options);
  },
  info: (message) => {
    toast.info(message, options);
  },
  warn: (message) => {
    toast.warn(message, options);
  },
};

export default notify;
