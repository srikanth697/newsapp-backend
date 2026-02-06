import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            family: 4 // Use IPv4, skip IPv6
        });

        console.log("✅ MongoDB Connected Successfully");
        console.log(`📦 Host: ${conn.connection.host}`);
        console.log(`🗂️  Database: ${conn.connection.name}`);
    } catch (error) {
        console.error("❌ MongoDB connection failed");
        console.error(error.message);
        process.exit(1);
    }
};

export default connectDB;
