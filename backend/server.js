const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./database');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// ...

// Configure Multer (Memory Storage for Vercel Compatibility)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Serve uploads statically (fallback for old local files)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Upload endpoint
app.post('/api/upload', upload.single('image'), (req, res) => {
    console.log("Upload request received");
    if (!req.file) {
        console.error("Upload failed: No file received");
        return res.status(400).json({ error: 'No file uploaded' });
    }

    // Convert buffer to Base64 Data URI
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const mimeType = req.file.mimetype;
    const dataURI = `data:${mimeType};base64,${b64}`;

    console.log("File processed in memory");
    res.json({ url: dataURI });
});
app.get('/api/habits', (req, res) => {
    db.all("SELECT * FROM habits", [], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json(rows);
    });
});

// Create habit
app.post('/api/habits', (req, res) => {
    const { name, category, color, target_days_per_week } = req.body;
    if (!name) {
        res.status(400).json({ "error": "Name is required" });
        return;
    }
    const sql = 'INSERT INTO habits (name, category, color, target_days_per_week) VALUES (?,?,?,?)';
    const params = [name, category || 'General', color || '#4F46E5', target_days_per_week || 7];
    db.run(sql, params, function (err, result) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": { id: this.lastID, name, category, color, target_days_per_week }
        });
    });
});

// Delete habit
app.delete('/api/habits/:id', (req, res) => {
    db.run('DELETE FROM habits WHERE id = ?', req.params.id, function (err, result) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "deleted", changes: this.changes });
    });
});

// Get logs (all logs for now, client can filter)
app.get('/api/logs', (req, res) => {
    const sql = "SELECT * FROM habit_logs";
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json(rows);
    });
});

// Toggle log
app.post('/api/logs', (req, res) => {
    const { habit_id, date } = req.body;

    db.get("SELECT id FROM habit_logs WHERE habit_id = ? AND date = ?", [habit_id, date], (err, row) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }

        if (row) {
            db.run("DELETE FROM habit_logs WHERE id = ?", row.id, (err) => {
                if (err) return res.status(400).json({ "error": err.message });
                res.json({ "status": "removed", "id": row.id, "habit_id": habit_id, "date": date });
            });
        } else {
            const insert = 'INSERT INTO habit_logs (habit_id, date, status) VALUES (?,?,?)';
            db.run(insert, [habit_id, date, 'completed'], function (err) {
                if (err) return res.status(400).json({ "error": err.message });
                res.json({ "status": "added", "data": { id: this.lastID, habit_id, date, status: 'completed' } });
            });
        }
    });
});

// Get journal entries
app.get('/api/journal', (req, res) => {
    const sql = "SELECT * FROM journal_entries ORDER BY date DESC";
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json(rows);
    });
});

// Save journal entry (Upsert)
app.post('/api/journal', (req, res) => {
    const { date, content, reflection, mood } = req.body;
    if (!date) {
        res.status(400).json({ "error": "Date is required" });
        return;
    }

    // Check if exists
    db.get("SELECT id FROM journal_entries WHERE date = ?", [date], (err, row) => {
        if (err) return res.status(400).json({ "error": err.message });

        if (row) {
            // Update
            const sql = `UPDATE journal_entries SET content = ?, reflection = ?, mood = ? WHERE id = ?`;
            db.run(sql, [content, reflection, mood, row.id], function (err) {
                if (err) return res.status(400).json({ "error": err.message });
                res.json({ message: "updated", data: { id: row.id, date, content, reflection, mood } });
            });
        } else {
            // Insert
            const sql = `INSERT INTO journal_entries (date, content, reflection, mood) VALUES (?, ?, ?, ?)`;
            db.run(sql, [date, content, reflection, mood || 'neutral'], function (err) {
                if (err) return res.status(400).json({ "error": err.message });
                res.json({ message: "created", data: { id: this.lastID, date, content, reflection, mood } });
            });
        }
    });
});



// Get user profile
app.get('/api/profile', (req, res) => {
    db.get("SELECT * FROM user_profile LIMIT 1", [], (err, row) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json(row);
    });
});

// Update user profile
app.post('/api/profile', (req, res) => {
    const { name, title, bio, avatar_url, gender } = req.body;
    // We assume only one user for now, ID 1
    const sql = `UPDATE user_profile SET name = COALESCE(?, name), title = COALESCE(?, title), bio = COALESCE(?, bio), avatar_url = COALESCE(?, avatar_url), gender = COALESCE(?, gender), updated_at = CURRENT_TIMESTAMP WHERE id = (SELECT id FROM user_profile LIMIT 1)`;

    db.run(sql, [name, title, bio, avatar_url, gender], function (err) {
        if (err) return res.status(400).json({ "error": err.message });
        res.json({ message: "updated", changes: this.changes });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
