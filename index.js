const express = require('express');
const mongoose = require('mongoose');
const { nanoid } = require('nanoid');
const Url = require('./models/Url');
const path = require('path');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect('mongodb://127.0.0.1:27017/urlShortener')
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.log('❌ MongoDB Error:', err));

// --- ROUTES ---

// 1. Shorten URL (POST)
app.post('/shorten', async (req, res) => {
    const { originalUrl } = req.body;
    if (!originalUrl) return res.status(400).json({ error: 'URL is required' });

    try {
        const shortCode = nanoid(6);
        const baseUrl = 'http://localhost:3000';

        const newUrl = new Url({
            originalUrl,
            shortCode,
            clickCount: 0
        });

        await newUrl.save();

        res.json({
            originalUrl,
            shortCode,
            shortUrl: `${baseUrl}/${shortCode}`
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// 2. Redirect URL (GET) - NOW WITH COUNTING!
app.get('/:code', async (req, res) => {
    try {
        const url = await Url.findOne({ shortCode: req.params.code });

        if (url) {
            // --- NEW: Increment Click Count ---
            url.clickCount++; 
            await url.save(); // Save the update to the database
            // ----------------------------------

            return res.redirect(url.originalUrl);
        } else {
            return res.status(404).json('No URL found');
        }
    } catch (err) {
        console.error(err);
        res.status(500).json('Server Error');
    }
});

// 3. Analytics Endpoint (GET) - NEW!
// This lets you check how many clicks a link has.
app.get('/analytics/:code', async (req, res) => {
    try {
        const url = await Url.findOne({ shortCode: req.params.code });
        
        if (url) {
            res.json({
                originalUrl: url.originalUrl,
                shortCode: url.shortCode,
                clickCount: url.clickCount // This is what we want to see!
            });
        } else {
            res.status(404).json({ error: "Short code not found" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server Error" });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));