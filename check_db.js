import mongoose from 'mongoose';
import dotenv from 'dotenv';
import News from './src/modules/news/news.model.js';

dotenv.config();

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const stats = await News.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]);
    const recent = await News.find().sort({ createdAt: -1 }).limit(5).select('title category slug');
    console.log('Stats:', JSON.stringify(stats, null, 2));
    console.log('Recent Articles:', JSON.stringify(recent, null, 2));
    process.exit(0);
}

check();
