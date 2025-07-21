// wsSessionUpgrade.js

module.exports = (server, wss, sessionParser) => {
  server.on('upgrade', (request, socket, head) => {
    // Manually parse the session from cookies
    sessionParser(request, {}, () => {
      if (!request.session?.user?.uid) {
        // If not logged in, block WebSocket connection
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      // Upgrade to WebSocket
      wss.handleUpgrade(request, socket, head, (ws) => {
        // Trigger the actual connection logic with session-enabled request
        wss.emit('connection', ws, request);
      });
    });
  });
};
