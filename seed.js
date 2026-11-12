require('dotenv').config();
const { connectDB, isMongoConnected } = require('./config/db');
const postService = require('./models/postService');

const runSeed = async () => {
  console.log('Connecting to database...');
  await connectDB();
  console.log('Seeding sample blog posts...');
  const count = await postService.seedDatabase();
  console.log(`\x1b[32m✔ Successfully seeded ${count} sample posts!\x1b[0m`);
  process.exit(0);
};

runSeed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
