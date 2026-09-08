const express = require('express');
const app = express();
app.get('*', (req, res) => {
  res.sendFile(__dirname + '/missing.html');
});
app.listen(3001, () => console.log('started'));
