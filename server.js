const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const dataFile = path.join(__dirname, 'data.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function getReservations() {
  try {
    const raw = fs.readFileSync(dataFile, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

function saveReservations(reservations) {
  fs.writeFileSync(dataFile, JSON.stringify(reservations, null, 2));
}

app.get('/api/reservations', (req, res) => {
  res.status(200).json(getReservations());
});

app.get('/api/reservations/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const reservation = getReservations().find(r => r.id === id);

  if (!reservation) {
    return res.status(404).json({ error: 'Reservation not found' });
  }

  res.status(200).json(reservation);
});

app.post('/api/reservations', (req, res) => {
  const { room, reserved_by, date, start_time, end_time } = req.body;

  if (!room || !reserved_by || !date || !start_time || !end_time) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (end_time <= start_time) {
    return res.status(400).json({ error: 'End time must be later than start time' });
  }

  const reservations = getReservations();

  const conflict = reservations.find(
    r => r.room.toLowerCase() === room.trim().toLowerCase() && r.date === date
  );

  if (conflict) {
    return res.status(409).json({
      error: 'Room ' + room + ' already has a reservation on ' + date
    });
  }

  const newReservation = {
    id: reservations.length > 0 ? Math.max(...reservations.map(r => r.id)) + 1 : 1,
    room: room.trim(),
    reserved_by: reserved_by.trim(),
    date,
    start_time,
    end_time
  };

  reservations.push(newReservation);
  saveReservations(reservations);

  res.status(201).json(newReservation);
});

app.delete('/api/reservations/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const reservations = getReservations();
  const index = reservations.findIndex(r => r.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Reservation not found' });
  }

  const deleted = reservations.splice(index, 1)[0];
  saveReservations(reservations);

  res.status(200).json({ message: 'Reservation deleted', deleted });
});

app.listen(PORT, () => {
  console.log('Server running on http://localhost:' + PORT);
});