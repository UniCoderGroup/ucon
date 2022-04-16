const http = require('http').Server();
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

function translateMessage(msg){
  return JSON.parse(msg);
}

io.on('connection', (socket) => {
  socket.on('log', msg => {
    console.log(...translateMessage(msg));
  });
  socket.on('warn', msg => {
    console.warn(...translateMessage(msg));
  });
  socket.on('error', msg => {
    console.error(...translateMessage(msg));
  });
  socket.on('attach', name => {
    console.log(`✔ Process ${name} attached.`);
    console.log(`.${"-".repeat(30)}`);
  });
  socket.on('dettach', () => {
    console.log(`\`${"-".repeat(30)}`);
    console.log(`✖ Process dettached.`);
  });
});

http.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});