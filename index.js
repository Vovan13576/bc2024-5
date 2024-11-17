const { Command } = require('commander');
const express = require('express');
const fs = require('fs');
const path = require('path');

const program = new Command();
program
  .requiredOption('-h, --host <host>', 'адреса сервера')
  .requiredOption('-p, --port <port>', 'порт сервера', parseInt)
  .requiredOption('-c, --cache <path>', 'шлях до директорії кешу')
  .parse(process.argv);

const options = program.opts();

// Перевірка наявності директорії кешу
if (!fs.existsSync(options.cache)) {
  console.error(`Помилка: Директорія "${options.cache}" не існує.`);
  process.exit(1);
}

const app = express();

app.get('/', (req, res) => {
  res.send('Сервер працює!');
});

const server = app.listen(options.port, options.host, () => {
  console.log(`Сервер запущено на http://${options.host}:${options.port}`);
});
