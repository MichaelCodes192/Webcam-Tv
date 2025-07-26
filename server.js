const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

io.on('connection', socket => {
  socket.on('join-room', (id, name) => {
    socket.join(id);
    socket.to(id).emit('user-connected', socket.id, name);

    socket.on('disconnect', () => {
      socket.to(id).emit('user-disconnected', socket.id);
    });

    socket.on('message', msg => {
      io.to(id).emit('createMessage', msg, name);
    });

    socket.on('signal', data => {
      socket.to(data.to).emit('signal', {
        from: socket.id,
        signal: data.signal,
        name: name
      });
    });
  });
});

http.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
