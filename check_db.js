import mongoose from 'mongoose';
import dotenv from 'dotenv';
import News from './src/modules/news/news.model.js';

dotenv.config();

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);

    const count = await News.countDocuments();
    const stats = await News.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    console.log('Total News Articles:', count);
    console.log('Categories Stats:');
    stats.forEach(s => {
        console.log(` - ${s._id}: ${s.count}`);
    });

    process.exit(0);
}

check();
