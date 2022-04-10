const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
  console.log("Send index.html");
});

io.on('connection', (socket) => {
  socket.on('log message', msg => {
    console.log("Receive log message:", msg);
    io.emit('log message', msg);
  });
  socket.on('attach', name => {
    console.log(`Process ${name} attached.`);
    io.emit('attach', name);
  });
  socket.on('dettach', () => {
    console.log(`Process dettached.`);
    io.emit('dettach');
  });
});

http.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
  require('better-opn')(`http://localhost:${port}/`);
});