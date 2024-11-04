const express = require('express');
const cors = require('cors');
const { migrateData } = require('./migration');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors())
app.use(express.json());
app.use(express.static(path.join(__dirname, 'ui')))

// Track migration status
let migrationStatus = {
    isRunning: false,
    progress: 0,
    currentModel: '',
    completed: {
        users: 0,
        books: 0,
        chats: 0
    },
    errors: [],
    startTime: null,
    endTime: null
}

// API Endpoints
app.post('/api/migration/start', async (req, res) => {
    try {
        if(migrationStatus.isRunning) {
            return res.status(400).json({ message: 'Migration is already running' });
        }

        migrationStatus.isRunning = true;
        migrationStatus.startTime = new Date();

        // Start migration asynchronously
        migrateData()
            .then(() => {
                migrationStatus.isRunning = false;
                migrationStatus.endTime = new Date();
                migrationStatus.progress = 100;
            })
            .catch(err => {
                migrationStatus.isRunning = false;
                migrationStatus.endTime = new Date();
                migrationStatus.errors.push(err);
            })

        res.status(200).json({ message: 'Migration started' });

    } catch(err) {
        res.status(500).json({ message: err.message });
    }
})

// Get migration status
app.get('/api/migration/status', async (req, res) => {
    try {
        res.status(200).json(migrationStatus);
    } catch(err) {
        res.status(500).json({ message: err.message });
    }
})

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'ui', 'index.html'));
})

// Start server
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
})