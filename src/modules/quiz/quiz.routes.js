import { getQuiz, generateCustomQuiz, submitAttempt, getCategories, getAdminQuizzes, createQuiz, updateQuiz, deleteQuiz } from "./quiz.controller.js";
import { protect, adminOnly } from "../../middleware/authMiddleware.js";

const router = express.Router();

// 👩‍💼 Admin Panel Routes
router.get("/admin/list", protect, adminOnly, getAdminQuizzes);
router.post("/admin/create", protect, adminOnly, createQuiz);
router.put("/admin/:id", protect, adminOnly, updateQuiz);
router.delete("/admin/:id", protect, adminOnly, deleteQuiz);

// 📱 Mobile App Routes
router.get("/categories", getCategories);
router.get("/:id([0-9a-fA-F]{24})", getQuiz);
router.get("/", getQuiz);
router.post("/generate-from-url", generateCustomQuiz);
router.post("/submit", protect, submitAttempt);

export default router;
