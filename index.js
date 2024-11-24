const { Command } = require('commander');
const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Ініціалізація Commander.js
const program = new Command();
program
  .requiredOption('-h, --host <host>', 'server host address')
  .requiredOption('-p, --port <port>', 'server port')
  .requiredOption('-c, --cache <path>', 'cache directory path');

program.parse(process.argv);
const options = program.opts();

if (!fs.existsSync(options.cache)) {
  console.error(`Error: Cache directory '${options.cache}' does not exist.`);
  process.exit(1);
}

// Ініціалізація Express.js
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Налаштування маршруту для HTML форми
app.get('/UploadForm.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'UploadForm.html'));
});

// Повертає текст нотатки
app.get('/notes/:name', (req, res) => {
  const notePath = path.join(options.cache, `${req.params.name}.txt`);
  if (!fs.existsSync(notePath)) {
    return res.status(404).send('Note not found');
  }
  const noteText = fs.readFileSync(notePath, 'utf-8');
  res.send(noteText);
});

// Замінює текст існуючої нотатки
// Замінює текст існуючої нотатки (text/plain)
app.put('/notes/:name', express.text({ type: 'text/plain' }), (req, res) => {
  const noteName = req.params.name; // Назва нотатки
  const noteText = req.body; // Отриманий текст з тіла запиту

  if (!noteText) {
    return res.status(400).send("Text content is required in the request body.");
  }

  const notePath = path.join(options.cache, `${noteName}.txt`);

  // Перевірка, чи існує файл
  if (!fs.existsSync(notePath)) {
    return res.status(404).send("Note not found");
  }

  // Запис нового тексту у файл
  fs.writeFileSync(notePath, noteText);
  res.send(`Note '${noteName}' has been updated.`);
});


// Видаляє нотатку
app.delete('/notes/:name', (req, res) => {
  const notePath = path.join(options.cache, `${req.params.name}.txt`);
  if (!fs.existsSync(notePath)) {
    return res.status(404).send('Note not found');
  }
  fs.unlinkSync(notePath);
  res.send('Note deleted');
});

// Повертає JSON зі списком існуючих нотаток.
app.get('/notes', (req, res) => {
  const files = fs.readdirSync(options.cache);
  const notes = files
    .filter(file => file.endsWith('.txt'))
    .map(file => {
      const name = path.basename(file, '.txt');
      const text = fs.readFileSync(path.join(options.cache, file), 'utf-8');
      return { name, text };
    });
  res.json(notes);
});

// Створення або оновлення тексту нотатки через POST (text/plain)
app.post('/notes/:name', express.text({ type: 'text/plain' }), (req, res) => {
  const noteName = req.params.name; // Назва нотатки з параметра URL
  const noteText = req.body; // Текст нотатки з тіла запиту (text/plain)

  if (!noteText) {
    return res.status(400).send("Text content is required in the request body.");
  }

  const notePath = path.join(options.cache, `${noteName}.txt`);

  // Створення або перезапис файлу
  fs.writeFileSync(notePath, noteText);
  res.status(201).send(`Note '${noteName}' has been created or updated.`);
});

// Створення HTTP сервера
const server = http.createServer(app);
server.listen(options.port, options.host, () => {
  console.log(`Server is running at http://${options.host}:${options.port}/UploadForm.html`);
});


// node index.js  -h 127.0.0.1 -p 3000 -c ./cache