const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('join', (name) => {
    socket.username = name;
    socket.broadcast.emit('message', `${name} joined the chat`);
  });

  socket.on('chat', (msg) => {
    io.emit('chat', { name: socket.username, msg });
  });

  socket.on('video-offer', (data) => {
    socket.broadcast.emit('video-offer', { from: socket.username, ...data });
  });

  socket.on('video-answer', (data) => {
    socket.broadcast.emit('video-answer', data);
  });

  socket.on('ice-candidate', (data) => {
    socket.broadcast.emit('ice-candidate', data);
  });

  socket.on('disconnect', () => {
    if (socket.username)
      socket.broadcast.emit('message', `${socket.username} left the chat`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
