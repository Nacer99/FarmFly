const mongoose = require('mongoose');

const farmSchema = new mongoose.Schema({
  name: String,
  location: String,
  description: String,
  images: [String],
  meals: [{ name: String, description: String, price: Number }],
});

const Farm = mongoose.model('Farm', farmSchema);

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log("Connected to MongoDB");
  const farms = await Farm.find();
  console.log("Farms in the database:", JSON.stringify(farms, null, 2));
  await mongoose.disconnect();
  console.log("Disconnected from MongoDB");
})
.catch((err) => {
  console.error("MongoDB connection error:", err);
});