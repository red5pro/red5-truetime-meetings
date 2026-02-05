require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./src/routes/apiRoutes');
const configService = require('./src/services/configService');
const healthController = require('./src/controllers/healthController');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRoutes);
app.get('/health', healthController.check);

// Start server
configService.initialize().then(() => {
  app.listen(PORT, () => {
    console.log(`Config service running on port ${PORT}`);
    console.log(`Config file location: ${configService.getConfigFilePath()}`);
  });
}).catch(error => {
  console.error('Failed to initialize config service:', error);
  process.exit(1);
});
