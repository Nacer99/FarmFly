const mongoose = require('mongoose');

// Define the Farm schema
const farmSchema = new mongoose.Schema({
  name: String,
  location: String,
  description: String,
  images: [String],
  meals: [
    {
      name: String,
      description: String,
      price: Number,
    },
  ],
});

// Create the Farm model
const Farm = mongoose.model('Farm', farmSchema);

const sampleFarms = [
  {
    name: "Green Meadows Farm",
    location: "Countryside",
    description: "A beautiful farm with rolling hills and fresh air.",
    images: ["https://example.com/farm1.jpg"],
    meals: [
      { name: "Farm Breakfast", description: "Fresh eggs and bacon", price: 15 },
      { name: "Picnic Lunch", description: "Sandwiches and fruit", price: 20 },
    ],
  },
  {
    name: "Sunset Valley Ranch",
    location: "Mountain",
    description: "Experience farm life with a stunning mountain backdrop.",
    images: ["https://example.com/farm2.jpg"],
    meals: [
      { name: "Cowboy Dinner", description: "Hearty stew and cornbread", price: 25 },
      { name: "Mountain Brunch", description: "Pancakes with local berries", price: 18 },
    ],
  },
  // Add more sample farms here if desired
];

async function addSampleData() {
  try {
    await Farm.deleteMany({}); // Clear existing data
    await Farm.insertMany(sampleFarms);
    console.log("Sample data added successfully");
  } catch (error) {
    console.error("Error adding sample data:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
}).then(() => {
  console.log("Connected to MongoDB");
  addSampleData();
}).catch((err) => {
  console.error("MongoDB connection error:", err);
});