const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');

// Словарь для поиска аэропортов в тексте поста
const airportKeywords = {
    'Шереметьево': ['шереметьев'],
    'Внуково': ['внуков'],
    'Домодедово': ['домодедов'],
    'Жуковский (Раменское)': ['жуковск', 'раменск']
};

// Функция перевода системного времени (ISO) в строку времени по Москве (ЧЧ:ММ МСК)
function formatToMSK(isoString) {
    const date = new Date(isoString);
    // Сдвиг на Московское время (UTC+3)
    const options = { timeZone: 'Europe/Moscow', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleTimeString('ru-RU', options) + ' МСК';
}

async function startParser() {
    try {
        // 1. Читаем текущую "базу данных" из файла
        const dbData = JSON.parse(fs.readFileSync('status.json', 'utf8'));
        let lastId = dbData.lastScrapedPostId;
        let airports = dbData.airports;

        // 2. Скачиваем веб-версию телеграм-канала Росавиации
        const response = await axios.get('https://t.me', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        const \$ = cheerio.load(response.data);

        const newPosts = [];

        // 3. Собираем посты со страницы
        \$('.tgme_widget_message_wrap').each((index, element) => {
            const messageElement = \$(element).find('.tgme_widget_message');
            const href = messageElement.attr('data-post'); // Получаем ссылку вида "favt_info/12345"
            if (!href) return;

            const postId = parseInt(href.split('/').pop(), 10);
            
            // Отсекаем посты, которые мы уже когда-то обрабатывали
            if (postId <= lastId) return;

            const text = \$(element).find('.tgme_widget_message_text').text().toLowerCase();
            const timeElement = \$(element).find('time');
            const isoTime = timeElement.attr('datetime'); // Системное время публикации

            if (text && isoTime) {
                newPosts.push({ id: postId, text, isoTime });
            }
        });

        // 4. Сортируем новые посты строго от старых к свежим (хронологический порядок)
        newPosts.sort((a, b) => a.id - b.id);

        if (newPosts.length === 0) {
            console.log('Новых постов за эту минуту нет.');
            return;
        }

        // 5. Разбираем каждый новый пост
        newPosts.forEach(post => {
            let statusFound = null;

            // Определяем статус по ключевым словам
            if (post.text.includes('введены ограничения')) {
                statusFound = 'закрыт';
            } else if (post.text.includes('по согласованию')) {
                statusFound = 'по согласованию';
            } else if (post.text.includes('сняты ограничения')) {
                statusFound = 'открыт';
            }

            // Если нашли один из трех ключевых статусов, ищем аэропорты
            if (statusFound) {
                const formattedTime = formatToMSK(post.isoTime);

                // Проверяем каждый аэропорт из нашего списка
                for (const [officialName, searchWords] of Object.entries(airportKeywords)) {
                    const isMentioned = searchWords.some(word => post.text.includes(word));
                    
                    if (isMentioned) {
                        // Ищем аэропорт в нашей базе и обновляем его статус и время
                        const airport = airports.find(ap => ap.name === officialName);
                        if (airport) {
                            airport.status = statusFound;
                            airport.time = formattedTime;
                            console.log(`Обновлен статус: ${officialName} -> ${statusFound} (${formattedTime})`);
                        }
                    }
                }
            }
            
            // Фиксируем ID обработанного поста
            lastId = post.id;
        });

        // 6. Сохраняем обновленные данные обратно в файл status.json
        const updatedDb = {
            lastScrapedPostId: lastId,
            airports: airports
        };

        fs.writeFileSync('status.json', JSON.stringify(updatedDb, null, 2), 'utf8');
        console.log(`База данных успешно обновлена. Последний обработанный пост ID: ${lastId}`);

    } catch (error) {
        console.error('Ошибка в работе робота-парсера:', error.message);
    }
}

startParser();
