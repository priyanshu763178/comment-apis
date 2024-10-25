const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });

app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'comment'
});

db.connect();

app.post('/api/login', (req, res) => {
  const sessionId = uuidv4();
  res.json({ sessionId });
});

app.get('/api/comments', (req, res) => {
  db.query('SELECT * FROM comments ORDER BY timestamp DESC', (error, results) => {
    if (error) return res.status(500).send(error);
    res.json(results);
  });
});

app.post('/api/comments', (req, res) => {
  const { username, comment } = req.body;
  db.query(
    'INSERT INTO comments (username, comment) VALUES (?, ?)',
    [username, comment],
    (error, results) => {
      if (error) return res.status(500).send(error);
      io.emit('newComment', { username, comment, timestamp: new Date() });
      res.json({ success: true });
    }
  );
});

io.on('connection', (socket) => {
  console.log('A user connected');
  socket.on('disconnect', () => console.log('User disconnected'));
});

server.listen(4000, () => console.log('Server running on port 4000'));
