const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'rsvps.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function loadRsvps() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function saveRsvps(rsvps) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(rsvps, null, 2));
}

app.post('/api/rsvp', (req, res) => {
  const { name, guests, phone } = req.body;

  if (!name || !guests) {
    return res.status(400).json({ error: 'שם ומספר אורחים הם שדות חובה' });
  }

  if (isNaN(guests) || Number(guests) < 1 || Number(guests) > 20) {
    return res.status(400).json({ error: 'מספר אורחים חייב להיות בין 1 ל-20' });
  }

  const rsvps = loadRsvps();

  const existing = rsvps.find(r => r.name.trim() === name.trim());
  if (existing) {
    return res.status(409).json({ error: 'כבר קיבלנו אישור הגעה מהשם הזה' });
  }

  const entry = {
    id: Date.now(),
    name: name.trim(),
    guests: Number(guests),
    phone: phone ? phone.trim() : '',
    timestamp: new Date().toISOString()
  };

  rsvps.push(entry);
  saveRsvps(rsvps);

  const total = rsvps.reduce((sum, r) => sum + r.guests, 0);
  res.json({ success: true, total, count: rsvps.length });
});

app.get('/api/rsvps', (req, res) => {
  const rsvps = loadRsvps();
  const total = rsvps.reduce((sum, r) => sum + r.guests, 0);
  res.json({ rsvps, total, count: rsvps.length });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
