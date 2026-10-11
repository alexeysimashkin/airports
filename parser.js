const fs = require('fs');
const https = require('https');

// ПОЛНЫЙ словарь аэропортов РФ (Европейская часть, Урал, Сибирь до Новосибирска)
const airportKeywords = {
    // === МОСКВА (МСК) ===
    'Шереметьево (им. А.С. Пушкина)': ['шереметьев'],
    'Внуково (им. А.Н. Туполева)': ['внуков'],
    'Домодедово (им. М.В. Ломоносова)': ['домодедов'],
    'Жуковский (Раменское)': ['жуковск', 'раменск'],

    // === СЕВЕРО-ЗАПАД ===
    'Пулково (Санкт-Петербург)': ['пулков'],
    'Калининград (Храброво им. Елизаветы Петровны)': ['храбров', 'калининград'],
    'Архангельск (Талаги им. Ф.А. Абрамова)': ['талаг', 'архангельск'],
    'Мурманск (им. Николая II)': ['мурманск'],
    'Petrozavodsk (Бесовец)': ['петрозаводск', 'бесовец'],
    'Псков (Кресты им. княгини Ольги)': ['псков', 'кресты'],
    'Череповец': ['череповец'],

    // === ЦЕНТРАЛЬНАЯ РОССИЯ И ЮГ ===
    'Калуга (Грабцево им. К.Э. Циолковского)': ['калуг', 'grabcevo'],
    'Ярославль (Туношна)': ['туношн', 'ярославль'],
    'Иваново (Южный)': ['иванов'],
    'Кострома (Сокеркино)': ['костром', 'сокеркин'],
    'Липецк': ['липецк'],
    'Воронеж (Чертовицкое им. Петра I)': ['воронеж', 'чертовицк'],
    'Белгород (им. В.Г. Шухова)': ['белгород'],
    'Курск (Восточный им. М.И. Гуревича)': ['курск'],
    'Брянск': ['брянск'],
    'Тамбов (Донское)': ['тамбов', 'донск'],
    'Пенза (им. В.Г. Белинского)': ['пенз'],

    // === ПОВОЛЖЬЕ ===
    'Казань (им. Г. Тукая)': ['казан'],
    'Нижнекамск / Набережные Челны (Бегишево)': ['бегишев', 'нижнекамск'],
    'Нижний Новгород (Стригино им. В.П. Чкалова)': ['стригин', 'нижн', 'новгород'],
    'Самара (Курумоч им. С.П. Королева)': ['курумоч', 'самар'],
    'Саратов (Гагарин)': ['гагарин', 'саратов'],
    'Уфа (им. Мустая Карима)': ['уфа'],
    'Пермь (Большое Савино)': ['савино', 'пермь'],
    'Чебоксары (им. А.Г. Николаева)': ['чебоксар'],
    'Оренбург (Центральный им. Ю.А. Гагарина)': ['оренбург'],
    'Орск': ['орск'],
    'Киров (Победилово)': ['победилов', 'киров'],
    'Ижевск': ['ижевск'],
    'Ульяновск (Баратаевка им. Н.М. Карамзина)': ['баратаевк', 'ульяновск'],

    // === ЮЖНЫЙ И КАВКАЗСКИЙ ОКРУГА ===
    'Сочи (Адлер им. В.И. Севастьянова)': ['сочи', 'адлер'],
    'Краснодар (Пашковский им. Екатерины II)': ['краснодар', 'пашковск'],
    'Анапа (Витязево им. В.К. Коккинаки)': ['анап', 'витязев'],
    'Волгоград (Гумрак)': ['гумрак', 'волгоград'],
    'Астрахань (Нариманово)': ['нариманов', 'астрахань'],
    'Ставрополь (им. А.В. Суворова)': ['ставрополь'],
    'Минеральные Воды (им. М.Ю. Лермонтова)': ['минеральн', 'вод'],
    'Владикавказ (Беслан)': ['беслан', 'владикавказ'],
    'Махачкала (Уйташ им. Амет-Хана Султана)': ['уйташ', 'махачкал'],
    'Грозный (Северный им. А.А. Кадырова)': ['grozn', 'грозн'],
    'Нальчик': ['нальчик'],
    'Элиста': ['элист'],

    // === УРАЛ ===
    'Екатеринбург (Кольцово им. А.Н. Демидова)': ['кольцов', 'екатеринбург'],
    'Челябинск (Баландино им. И.В. Курчатова)': ['баландин', 'челябинск'],
    'Тюмень (Рощино им. Д.И. Менделеева)': ['рощин', 'тюмен'],
    'Сургут (им. Ф.К. Салманова)': ['сургут'],
    'Нижневартовск (им. В.И. Муравленко)': ['нижневартовск'],
    'Ханты-Мансийск': ['ханты', 'мансийск'],
    'Магнитогорск': ['магнитогорск'],
    'Новый Уренгой (им. И.М. Губкина)': ['уренгой'],
    'Ноябрьск': ['ноябрьск'],

    // === ЗАПАДНАЯ СИБИРЬ ===
    'Новосибирск (Толмачёво им. А.И. Покрышкина)': ['толмачев', 'новосибирск'],
    'Омск (Центральный им. Д.М. Карбышева)': ['омск'],
    'Томск (Богашево им. Н.И. Камова)': ['богашев', 'томск'],
    'Кемерово (им. А.А. Леонова)': ['кемеров'],
    'Новокузнецк (Спиченково им. Б.В. Волынова)': ['спиченков', 'новокузнецк'],
    'Барнаул (Михайловка им. Г.С. Титова)': ['барнаул', 'михайловк'],
    'Горно-Алтайск': ['алтайск']
};

function formatToMSK(isoString) {
    const date = isoString ? new Date(isoString) : new Date();
    const options = { timeZone: 'Europe/Moscow', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleTimeString('ru-RU', options) + ' МСК';
}

function fetchPage(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', (err) => reject(err));
    });
}

async function startParser() {
    try {
        if (!fs.existsSync('status.json')) throw new Error('Файл status.json не найден!');
        const dbData = JSON.parse(fs.readFileSync('status.json', 'utf8'));
        let lastId = dbData.lastScrapedPostId || 0;
        let airports = dbData.airports || [];

        console.log('Запуск парсера. Текущий ID в базе: ' + lastId);

        // Скачиваем виджет канала
        const html = await fetchPage('https://t.me');
        
        // Разрезаем страницу на отдельные сообщения по тегу виджета
        const parts = html.split('class="tgme_widget_message_wrap');
        // Убираем шапку страницы
        parts.shift(); 

        const newPosts = [];

        parts.forEach(part => {
            // Вытаскиваем ID поста
            const idMatch = part.match(/data-post="favt_info\/(\d+)"/);
            if (!idMatch) return;
            const postId = parseInt(idMatch[1], 10);

            if (postId <= lastId) return;

            // Вырезаем блок с текстом сообщения
            const textBlockMatch = part.match(/<div class="tgme_widget_message_text[^>]*>([\s\(\S\)]*?)<\/div>/);
            if (!textBlockMatch) return;
            
            // Очищаем текст от HTML тегов
            const cleanText = textBlockMatch[1].replace(/<[^>]*>/g, '').toLowerCase();

            // Вытаскиваем время
            const timeMatch = part.match(/<time[^>]*datetime="([^"]+)"/);
            const isoTime = timeMatch ? timeMatch[1] : new Date().toISOString();

            newPosts.push({ id: postId, text: cleanText, isoTime: isoTime });
        });

        console.log('Найдено новых постов для анализа: ' + newPosts.length);

        if (newPosts.length === 0) {
            console.log('Все сообщения актуальны. Обновлений нет.');
            return;
        }

        // Сортируем от старых к новым
        newPosts.sort((a, b) => a.id - b.id);

        newPosts.forEach(post => {
            let statusFound = null;
            console.log(`Разбор поста №${post.id}: ${post.text.substring(0, 60)}...`);

            if (post.text.includes('введены ограничения')) {
                statusFound = 'закрыт';
            } else if (post.text.includes('по согласованию')) {
                statusFound = 'по согласованию';
            } else if (post.text.includes('сняты ограничения')) {
                statusFound = 'открыт';
            }

            if (statusFound) {
                const formattedTime = formatToMSK(post.isoTime);

                for (const [officialName, searchWords] of Object.entries(airportKeywords)) {
                    const isMentioned = searchWords.some(word => post.text.includes(word));
                    
                    if (isMentioned) {
                        let airport = airports.find(ap => ap.name === officialName);
                        if (!airport) {
                            airport = { name: officialName, status: '', time: '' };
                            airports.push(airport);
                        }
                        airport.status = statusFound;
                        airport.time = formattedTime;
                        console.log(` -> Обновлен аэропорт: ${officialName} -> ${statusFound} (${formattedTime})`);
                    }
                }
            }
            lastId = post.id;
        });

        const updatedDb = {
            lastScrapedPostId: lastId,
            airports: airports
        };

        fs.writeFileSync('status.json', JSON.stringify(updatedDb, null, 2), 'utf8');
        console.log('Файл status.json успешно сохранен. Новый ID: ' + lastId);

    } catch (error) {
        console.error('Ошибка исполнения:', error.message);
        process.exit(1);
    }
}

startParser();
