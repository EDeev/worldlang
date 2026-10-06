# WorldLang

**Русский** · [English](README.en.md)

[![CI](https://github.com/EDeev/worldlang/actions/workflows/ci.yml/badge.svg)](https://github.com/EDeev/worldlang/actions/workflows/ci.yml)

Экзаменационный проект по «Основам веб-технологий»: сайт онлайн-школы иностранных языков с каталогом
курсов и репетиторов, заявками, личным кабинетом и картой учебных ресурсов на учебном API.

**Статус:** учебный проект (Московский Политех, группа 241-327, экзамен, январь 2026), завершён, в архиве ·
сайт — [lang.deev.su](https://lang.deev.su) (учебный API доступен не всегда)

![Главная страница WorldLang](docs/screenshots/main.png)

**Стек:** HTML5 · CSS3 · JavaScript (ES6+, fetch) · Bootstrap 5 · API Яндекс.Карт

- Каталог курсов и репетиторов с поиском, фильтрами и пагинацией
- Оформление заявки с расчётом стоимости, выбором даты и времени
- Личный кабинет: просмотр, правка и удаление заявок
- Карта учебных ресурсов (Яндекс.Карты) со списком мест
- Данные из API экранируются перед вставкой в страницу (`esc()` в `js/utils.js`)

## Запуск

Сайт статический. На [lang.deev.su](https://lang.deev.su) nginx отдаёт файлы и проксирует учебный API
по адресу `/api`. Для запуска с диска поставьте в `js/api.js` полный адрес API (указан там в
комментарии) и откройте `index.html`.

Проверки: `node --check js/*.js` и `npx htmlhint *.html` (правила — в `.htmlhintrc`, их же гоняет CI).

## Лицензия

Учебный проект (Основы веб-технологий, Московский Политех, 2025/26). Код открыт для изучения, отдельной
лицензии нет.

## Автор

**Деев Егор Викторович** — [GitHub](https://github.com/EDeev) · [Telegram](https://t.me/DeevEgor) · [egor@deev.space](mailto:egor@deev.space)

---

<div align="center">
  <sub>⭐ Если проект оказался полезным, поставьте звёздочку на GitHub!</sub>
  <p><sub>Сделано с ❤️ — <a href="https://deev.space">deev.space</a></sub></p>
</div>
