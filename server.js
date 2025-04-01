const http = require('http');
const url = require('url');

// Создаем сервер
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true); // Парсим URL
    const path = parsedUrl.pathname; // Получаем путь
    const query = parsedUrl.query; // Получаем query-параметры

    // Устанавливаем заголовки
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');

    // Обрабатываем маршруты
    switch (path) {
        case '/':
            res.statusCode = 200;
            res.end('Добро пожаловать на сервер Node.js!');
            break;

        case '/greet':
            if (query.name) {
                res.statusCode = 200;
                res.end(`Привет, ${query.name}!`);
            } else {
                res.statusCode = 400;
                res.end('Укажите имя в параметрах: /greet?name=ВашеИмя');
            }
            break;

        default:
            res.statusCode = 404;
            res.end('Страница не найдена');
    }
});

// Запускаем сервер на порту 3000
server.listen(3000, () => {
    console.log('Сервер запущен на http://localhost:3000');
});

