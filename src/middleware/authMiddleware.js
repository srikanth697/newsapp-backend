import jwt from "jsonwebtoken";
import User from "../models/User.js";

// 🛡️ Middleware: Verify JWT and attach User to Request
export const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        try {
            token = req.headers.authorization.split(" ")[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Fetch user from DB excluding password
            // decoded.id comes from the payload we signed (adminLogin/userLogin)
            req.user = await User.findById(decoded.id || decoded.userId).select("-password");

            if (!req.user) {
                return res.status(401).json({ success: false, message: "User not found" });
            }

            req.userId = req.user._id; // Compatibility for controllers using req.userId


            next();
        } catch (error) {
            console.error("Auth Middleware Error:", error.message);
            return res.status(401).json({ success: false, message: "Not authorized, token failed" });
        }
    } else {
        return res.status(401).json({ success: false, message: "Not authorized, no token" });
    }
};

// 👮 Middleware: Check if User is Admin
export const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        next();
    } else {
        res.status(403).json({ success: false, message: "Access denied. Admins only." });
    }
};
