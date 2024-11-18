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
app.put('/notes/:name', (req, res) => {
  const notePath = path.join(options.cache, `${req.params.name}.txt`);
  if (!fs.existsSync(notePath)) {
    return res.status(404).send('Note not found');
  }
  fs.writeFileSync(notePath, req.body.text);
  res.send('Note updated');
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

// Створення нової нотатки через форму
app.post('/write', multer().none(), (req, res) => {
  const noteName = req.body.note_name;
  const noteText = req.body.note;
  const notePath = path.join(options.cache, `${noteName}.txt`);

  if (fs.existsSync(notePath)) {
    return res.status(400).send('Note already exists');
  }

  fs.writeFileSync(notePath, noteText);
  res.status(201).send('Note created');
});

// Створення HTTP сервера
const server = http.createServer(app);
server.listen(options.port, options.host, () => {
  console.log(`Server is running at http://${options.host}:${options.port}/UploadForm.html`);
});


// node index.js  -h 127.0.0.1 -p 3000 -c ./cache