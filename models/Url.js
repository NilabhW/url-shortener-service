// models/Url.js

// 1. Import Mongoose
// Mongoose is the tool that lets Node talk to MongoDB.
const mongoose = require('mongoose');

// 2. Define the Schema (The Blueprint)
// This strictly defines what a "URL" looks like in our database.
const urlSchema = new mongoose.Schema({
    originalUrl: {
        type: String,       // It must be text
        required: true      // We CANNOT save without this
    },
    shortCode: {
        type: String,
        required: true,
        unique: true        // No two URLs can have the same short code
    },
    clickCount: {
        type: Number,
        default: 0          // Start at 0 clicks automatically
    },
    date: {
        type: Date,
        default: Date.now   // Automatically set the timestamp to "now"
    }
});

// 3. Export the Model
// We "export" this so we can use it in other files (like index.js).
// 'Url' is the name of the collection in the database.
module.exports = mongoose.model('Url', urlSchema);