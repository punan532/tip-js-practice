# ПР9. Сервер на Node.js и Express

Пунанов Егор, ЭФБО-06-25, вариант 5. Для `categoryId=1` возвращаются задачи 1, 7 и 13. Для `categoryId=01` сервер возвращает 400.

```bash
npm ci
npm test
npm start
```

Для запуска освободить порт 5505. Данные хранятся в памяти одного экземпляра приложения. GET возвращает массив в поле data и счётчик в meta.total. Сервер проверяет параметры и объединяет фильтры через И. Для КР3 добавлен POST с серверной проверкой полей и ответом 201 либо структурированной ошибкой 400.

```bash
curl -i 'http://localhost:5505/api/tasks?completed=true'
curl -i 'http://localhost:5505/api/tasks' \
  -H 'Content-Type: application/json' \
  --data '{"title":"   ","priority":"high","categoryId":2}'
```

Проверки: 92/92, включая создание и отказ без изменения набора.
