import mongoose from "mongoose"

const dbConfig = {
    connectDB: async () => {
        try {
            await mongoose.connect(process.env.mongoose_url, {
                dbName: process.env.db_name
            });
            console.log("Database connected successfully");
        }
        catch (err) {
            console.log("Database connection failed", err);
        }
    }
}

export default dbConfig;