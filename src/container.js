
import { AuthController } from "./controllers/Auth.controller.js";
import { NotificationService } from "./services/Notification.service.js";
const notificationService = new NotificationService();
export const authController = new AuthController(notificationService);