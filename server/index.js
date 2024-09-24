const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const nodemailer = require("nodemailer");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

console.log("Starting server...");

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "farm_images",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

const upload = multer({ storage: storage });

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
      quantity: Number,
    },
  ],
  availabilityDates: [Date],
});

const Farm = mongoose.model("Farm", farmSchema);

const bookingSchema = new mongoose.Schema({
  farmId: mongoose.Schema.Types.ObjectId,
  date: Date,
  meals: [
    {
      mealId: mongoose.Schema.Types.ObjectId,
      quantity: Number,
    },
  ],
  userEmail: String,
});

const Booking = mongoose.model("Booking", bookingSchema);

app.get("/api/farms", async (req, res) => {
  try {
    const { location, date } = req.query;
    const farms = await Farm.find({ location: new RegExp(location, "i") });
    res.json(farms);
  } catch (error) {
    console.error("Error fetching farms:", error);
    res.status(500).json({ message: "Error fetching farms" });
  }
});

app.get("/api/farms/:id", async (req, res) => {
  try {
    const farm = await Farm.findById(req.params.id);
    if (!farm) {
      return res.status(404).json({ message: "Farm not found" });
    }
    res.json(farm);
  } catch (error) {
    console.error("Error fetching farm:", error);
    res.status(500).json({ message: "Error fetching farm" });
  }
});

app.post("/api/bookings", async (req, res) => {
  try {
    const { farmId, date, meals, userEmail } = req.body;

    // Check farm availability
    const farm = await Farm.findById(farmId);
    if (!farm.availabilityDates.includes(new Date(date))) {
      return res.status(400).json({ message: "Farm is not available on this date" });
    }

    // Check meal availability
    for (const meal of meals) {
      const farmMeal = farm.meals.find(m => m._id.toString() === meal.mealId.toString());
      if (!farmMeal || farmMeal.quantity < meal.quantity) {
        return res.status(400).json({ message: `Not enough ${farmMeal.name} available` });
      }
    }

    // Create booking and update meal quantities
    const booking = new Booking({ farmId, date, meals, userEmail });
    await booking.save();

    for (const meal of meals) {
      await Farm.updateOne(
        { _id: farmId, "meals._id": meal.mealId },
        { $inc: { "meals.$.quantity": -meal.quantity } }
      );
    }

    let testAccount = await nodemailer.createTestAccount();

    let transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    let info = await transporter.sendMail({
      from: '"Tourist Farm Bookings" <noreply@touristfarms.com>',
      to: booking.userEmail,
      subject: "Booking Confirmation",
      text: `Your booking for ${farm.name} on ${booking.date} has been confirmed. Meals: ${booking.meals.map(m => `${m.mealId} x${m.quantity}`).join(", ")}`,
    });

    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

    res.json({ message: "Booking confirmed", emailPreview: nodemailer.getTestMessageUrl(info) });
  } catch (error) {
    console.error("Error processing booking:", error);
    res.status(500).json({ message: "Error processing booking" });
  }
});

app.get("/api/featured-farms", async (req, res) => {
  try {
    const featuredFarms = await Farm.find().limit(3);
    res.json(featuredFarms);
  } catch (error) {
    console.error("Error fetching featured farms:", error);
    res.status(500).json({ message: "Error fetching featured farms" });
  }
});

app.post("/api/upload-image", upload.single("image"), async (req, res) => {
  try {
    res.json({ imageUrl: req.file.path });
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ message: "Error uploading image" });
  }
});

app.post("/api/farms", async (req, res) => {
  try {
    const { name, location, description, images, meals, availabilityDates } = req.body;
    const farm = new Farm({ name, location, description, images, meals, availabilityDates });
    await farm.save();
    res.status(201).json(farm);
  } catch (error) {
    console.error("Error creating farm:", error);
    res.status(500).json({ message: "Error creating farm" });
  }
});

app.put("/api/farms/:id", async (req, res) => {
  try {
    const { name, location, description, images, meals, availabilityDates } = req.body;
    const farm = await Farm.findByIdAndUpdate(
      req.params.id,
      { name, location, description, images, meals, availabilityDates },
      { new: true }
    );
    if (!farm) {
      return res.status(404).json({ message: "Farm not found" });
    }
    res.json(farm);
  } catch (error) {
    console.error("Error updating farm:", error);
    res.status(500).json({ message: "Error updating farm" });
  }
});

app.get("/api/available-dates", async (req, res) => {
  try {
    const farms = await Farm.find();
    const allDates = farms.flatMap(farm => farm.availabilityDates);
    const uniqueDates = [...new Set(allDates.map(date => date.toISOString().split('T')[0]))];
    res.json(uniqueDates.map(date => new Date(date)));
  } catch (error) {
    console.error("Error fetching available dates:", error);
    res.status(500).json({ message: "Error fetching available dates" });
  }
});

app.use(express.static(path.join(__dirname, 'client')));
console.log("Serving static files from:", path.join(__dirname, 'client'));

app.get('*', (req, res) =>{
    console.log("Catch-all route hit, serving index.html");
    res.sendFile(path.join(__dirname, 'client/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});