import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes, Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
const ReactDatePicker = window.ReactDatePicker;
const API_BASE_URL = ''; // Ensure this is set to your API base URL

function ImageUpload({ onImageUpload }) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/upload-image`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onImageUpload(response.data.imageUrl);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="image-upload">
      <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} />
      {uploading && <p>Uploading...</p>}
    </div>
  );
}

function FarmManagerDashboard() {
  const [view, setView] = useState('home');
  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchFarms();
  }, []);

  const fetchFarms = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/farms`);
      setFarms(response.data);
    } catch (error) {
      console.error("Error fetching farms:", error);
    }
  };

  const handleAddNewFarm = () => {
    setView('addFarm');
  };

  const handleYourFarms = () => {
    setView('yourFarms');
  };

  const handleFarmClick = (farm) => {
    setSelectedFarm(farm);
    setView('farmDetails');
  };

  const handleEditFarm = () => {
    setIsEditing(true);
  };

  const handleConfirmChanges = async (updatedFarm) => {
    try {
      await axios.put(`${API_BASE_URL}/api/farms/${updatedFarm._id}`, updatedFarm);
      setSelectedFarm(updatedFarm);
      setIsEditing(false);
      fetchFarms();
    } catch (error) {
      console.error("Error updating farm:", error);
    }
  };

  const handleNewFarmSubmit = async (newFarm) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/farms`, newFarm);
      setFarms([...farms, response.data]);
      setSelectedFarm(response.data);
      setView('farmDetails');
    } catch (error) {
      console.error("Error adding new farm:", error);
    }
  };

  return (
    <div className="farm-manager-dashboard">
      {view === 'home' && (
        <div className="dashboard-home">
          <h2>Farm Manager Dashboard</h2>
          <button onClick={handleYourFarms}>Your Farms</button>
          <button onClick={handleAddNewFarm}>Add New Farm</button>
        </div>
      )}

      {view === 'yourFarms' && (
        <div className="your-farms">
          <h2>Your Farms</h2>
          <div className="farm-grid">
            {farms.map((farm) => (
              <div key={farm._id} className="farm-item" onClick={() => handleFarmClick(farm)}>
                <img src={farm.images[0]} alt={farm.name} />
                <p>{farm.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'addFarm' && (
        <FarmForm onSubmit={handleNewFarmSubmit} />
      )}

      {view === 'farmDetails' && (
        <FarmDetails
          farm={selectedFarm}
          isEditing={isEditing}
          onEdit={handleEditFarm}
          onConfirmChanges={handleConfirmChanges}
        />
      )}
    </div>
  );
}

function FarmForm({ onSubmit, initialData }) {
  const [formData, setFormData] = useState(initialData || {
    name: '',
    description: '',
    images: [],
    availabilityStart: '',
    availabilityEnd: '',
    meals: [
      { name: '', description: '', price: 0, quantity: 0 },
      { name: '', description: '', price: 0, quantity: 0 },
      { name: '', description: '', price: 0, quantity: 0 }
    ]
  });

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleMealChange = (index, field, value) => {
    const updatedMeals = [...formData.meals];
    updatedMeals[index] = { ...updatedMeals[index], [field]: value };
    setFormData({ ...formData, meals: updatedMeals });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="farm-form">
      <input
        type="text"
        name="name"
        value={formData.name}
        onChange={handleInputChange}
        placeholder="Farm Name"
        required
      />
      <textarea
        name="description"
        value={formData.description}
        onChange={handleInputChange}
        placeholder="Description"
        required
      ></textarea>
      <ImageUpload
        onImageUpload={(url) => setFormData({ ...formData, images: [...formData.images, url] })}
      />
      <div className="availability">
        <label>Availability Period:</label>
        <input
          type="date"
          name="availabilityStart"
          value={formData.availabilityStart}
          onChange={handleInputChange}
          required
        />
        <input
          type="date"
          name="availabilityEnd"
          value={formData.availabilityEnd}
          onChange={handleInputChange}
          required
        />
      </div>
      <div className="meals">
        <h3>Meals</h3>
        {formData.meals.map((meal, index) => (
          <div key={index} className="meal-input">
            <input
              type="text"
              value={meal.name}
              onChange={(e) => handleMealChange(index, 'name', e.target.value)}
              placeholder={`Meal ${index + 1} Name`}
              required
            />
            <input
              type="text"
              value={meal.description}
              onChange={(e) => handleMealChange(index, 'description', e.target.value)}
              placeholder="Description"
              required
            />
            <input
              type="number"
              value={meal.price}
              onChange={(e) => handleMealChange(index, 'price', parseFloat(e.target.value))}
              placeholder="Price"
              required
            />
            <input
              type="number"
              value={meal.quantity}
              onChange={(e) => handleMealChange(index, 'quantity', parseInt(e.target.value))}
              placeholder="Available Quantity"
              required
            />
          </div>
        ))}
      </div>
      <button type="submit">Confirm</button>
    </form>
  );
}

function FarmDetails({ farm, isEditing, onEdit, onConfirmChanges }) {
  const [editedFarm, setEditedFarm] = useState(farm);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setEditedFarm({ ...editedFarm, [name]: value });
  };

  const handleMealChange = (index, field, value) => {
    const updatedMeals = [...editedFarm.meals];
    updatedMeals[index] = { ...updatedMeals[index], [field]: value };
    setEditedFarm({ ...editedFarm, meals: updatedMeals });
  };

  return (
    <div className="farm-details">
      {!isEditing && <button onClick={onEdit}>Edit Farm</button>}
      <h2>{farm.name}</h2>
      {isEditing ? (
        <textarea
          name="description"
          value={editedFarm.description}
          onChange={handleInputChange}
        ></textarea>
      ) : (
        <p>{farm.description}</p>
      )}
      <div className="farm-images">
        {farm.images.map((img, index) => (
          <img key={index} src={img} alt={`${farm.name} - ${index + 1}`} />
        ))}
      </div>
      <div className="availability">
        <h3>Availability</h3>
        {isEditing ? (
          <>
            <input
              type="date"
              name="availabilityStart"
              value={editedFarm.availabilityStart}
              onChange={handleInputChange}
            />
            <input
              type="date"
              name="availabilityEnd"
              value={editedFarm.availabilityEnd}
              onChange={handleInputChange}
            />
          </>
        ) : (
          <p>{`${farm.availabilityStart} to ${farm.availabilityEnd}`}</p>
        )}
      </div>
      <div className="meals">
        <h3>Meals</h3>
        {editedFarm.meals.map((meal, index) => (
          <div key={index} className="meal-item">
            {isEditing ? (
              <>
                <input
                  type="text"
                  value={meal.name}
                  onChange={(e) => handleMealChange(index, 'name', e.target.value)}
                />
                <input
                  type="text"
                  value={meal.description}
                  onChange={(e) => handleMealChange(index, 'description', e.target.value)}
                />
                <input
                  type="number"
                  value={meal.price}
                  onChange={(e) => handleMealChange(index, 'price', parseFloat(e.target.value))}
                />
                <input
                  type="number"
                  value={meal.quantity}
                  onChange={(e) => handleMealChange(index, 'quantity', parseInt(e.target.value))}
                />
              </>
            ) : (
              <>
                <h4>{meal.name}</h4>
                <p>{meal.description}</p>
                <p>Price: ${meal.price}</p>
                <p>Available: {meal.quantity}</p>
              </>
            )}
          </div>
        ))}
      </div>
      {isEditing && (
        <button onClick={() => onConfirmChanges(editedFarm)}>Confirm Changes</button>
      )}
    </div>
  );
}

function Home() {
  const [farms, setFarms] = useState([]);
  const [featuredFarms, setFeaturedFarms] = useState([]);
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(new Date());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableDates, setAvailableDates] = useState([]);
  const navigate = useNavigate(); // Updated to use useNavigate

  useEffect(() => {
    fetchFeaturedFarms();
    fetchAvailableDates();
  }, []);

  const fetchFeaturedFarms = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/featured-farms`);
      setFeaturedFarms(response.data);
    } catch (error) {
      console.error("Error fetching featured farms:", error);
    }
  };

  const fetchAvailableDates = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/available-dates`);
      setAvailableDates(response.data.map(date => new Date(date)));
    } catch (error) {
      console.error("Error fetching available dates:", error);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/search-farms`, {
        params: { location, date: date.toISOString() }
      });
      setFarms(response.data);
    } catch (error) {
      console.error("Error searching farms:", error);
      setError('Failed to search farms. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFarmClick = (farmId) => {
    navigate(`/farm/${farmId}?date=${date.toISOString().split('T')[0]}`); // Updated to use navigate
  };

  return (
    <div className="search-container">
      <div className="search-box">
        <input 
          type="text" 
          placeholder="Where are you going?" 
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="search-input"
        />
        {ReactDatePicker ? (
          <ReactDatePicker
            selected={date}
            onChange={setDate}
            includeDates={availableDates}
            className="search-input"
            placeholderText="Select date"
          />
        ) : (
          <input 
            type="date" 
            value={date.toISOString().split('T')[0]}
            onChange={(e) => setDate(new Date(e.target.value))}
            className="search-input"
          />
        )}
        <button onClick={handleSearch} className="search-button" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      <div className="featured-farms">
        <h2>Featured Farms</h2>
        <div className="farm-grid">
          {featuredFarms.map(farm => (
            <div key={farm._id} className="farm-card" onClick={() => handleFarmClick(farm._id)}>
              <img src={farm.images[0]} alt={farm.name} className="farm-image" />
              <div className="farm-info">
                <h3>{farm.name}</h3>
                <p>{farm.location}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="error">{error}</p>}
      <div className="farm-list">
        {farms.map(farm => (
          <div key={farm._id} className="farm-card">
            <img src={farm.images[0]} alt={farm.name} className="farm-image" />
            <div className="farm-info">
              <h2>{farm.name}</h2>
              <p>{farm.location}</p>
              <Link to={`/farm/${farm._id}?date=${date.toISOString().split('T')[0]}`} className="view-deal">View Deal</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <header>
          <h1>Tourist Farm Bookings</h1>
          <nav>
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/manager" className="nav-link">Farm Manager</Link>
          </nav>
        </header>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/farm/:id" element={<FarmDetails />} />
          <Route path="/manager" element={<FarmManagerDashboard />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App; // Ensure this line is present