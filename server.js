const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const axios = require('axios');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3002',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// CORS configuration
const corsOptions = {
  origin: 'http://localhost:3002',
  credentials: true,
};
app.use(cors(corsOptions));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.get('/api/price', async (req, res) => {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/bitcoin');
    const price = response.data.market_data.current_price.usd; // Assuming this is the structure
    res.json({ price });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch price' });
  }
});

io.on('connection', (socket) => {
  console.log('New client connected');

  // Fetch the Bitcoin price every 10 seconds
  const priceInterval = setInterval(async () => {
    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/coins/bitcoin');
      const price = response.data.market_data.current_price.usd; // Adjust this path according to the response structure
      socket.emit('priceUpdate', price);
    } catch (error) {
      console.error('Error fetching Bitcoin price:', error);
    }
  }, 100000);

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    clearInterval(priceInterval);
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log('Server started on port 3000');
});
