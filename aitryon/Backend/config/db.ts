import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            console.warn("MONGODB_URI not found. MongoDB connection skipped.");
            return;
        }

        mongoose.connection.on('connected', () => {
            console.log("DB Connected");
        });

        mongoose.connection.on('error', (error) => {
            console.error("MongoDB connection error:", error);
        });

        await mongoose.connect(`${mongoUri}/e-commerce`);
    } catch (error) {
        console.error("MongoDB connection failed:", error);
        // Don't exit, allow server to start so we can see UI and logs
        console.warn("Server will continue without MongoDB connection.");
    }
};

export default connectDB;
