const host = window.location.origin.replace(/^http/, 'ws').replace(/^https/, 'wss');
const ws = new WebSocket(host);

ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    const data = message.data;
    document.getElementById("mail_box").textContent = "Welcome "+ data.name || 'N/A';
    let state = data.dashboard;
    // for(let state of data.dashboard){
        document.getElementById('humi').textContent = state.Humidity || 'N/A';
        document.getElementById('temp').textContent = state.Temp || 'N/A';
        document.getElementById('curr').textContent = state.current || 'N/A';
        document.getElementById('volt').textContent = state.voltage || 'N/A';
        document.getElementById('totalcusm').textContent = state.TotalCusm || 'N/A';
    // }
}