// websocket.js

const { db } = require('./firebaseConfig');

module.exports = (wss) => {
  wss.on('connection', (ws, req) => {
    console.log('✅ WebSocket connected');

    const uid = req.session?.user?.uid;

    if (!uid) {
      ws.send(JSON.stringify({ error: 'Unauthorized WebSocket' }));
      return ws.close();
    }

    const userRef = db.ref(`users/${uid}`);

    const onValueChange = (snapshot) => {
      const data = snapshot.val();
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ data }));
      }
    };

    userRef.on('value', onValueChange);

    ws.on('close', () => {
      console.log('❌ WebSocket closed');
      userRef.off('value', onValueChange); // 🧹 Clean up listener
    });
  });
};
