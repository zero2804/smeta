// Тексты интерфейса и документов на русском и узбекском (латиница).
const STR = {
  ru: {
    appName: 'Сметы', estimates: 'Сметы', prices: 'Цены', settings: 'Настройки',
    newEstimate: 'Новая смета', search: 'Поиск по клиенту…', noEstimates: 'Смет пока нет. Нажмите «+ Новая смета».',
    chooseTemplate: 'Выберите вид работ', client: 'Клиент / объект', clientPh: 'Например: Азиз ака, Янгибазар',
    objectType: 'Тип объекта', area: 'Площадь S, м²', perimeter: 'Длина парапета L, м', drains: 'Воронок, шт',
    thickness: 'Толщина утеплителя, мм', create: 'Создать смету', cancel: 'Отмена', save: 'Сохранить', del: 'Удалить',
    back: 'Назад', materials: 'Материалы', works: 'Работы', addLine: '+ Добавить строку', fromCatalog: 'Из справочника',
    customLine: 'Своя строка', name: 'Наименование', unit: 'Ед.', qty: 'Кол-во', price: 'Цена', sum: 'Сумма',
    country: 'Страна', totalMat: 'Итого материал', totalWork: 'Итого работа', total: 'Итого материал и работа',
    perM2: 'за 1 м²', workPerM2: 'Работа за 1 м²', currency: 'Валюта', docLang: 'Язык сметы',
    share: 'Отправить PDF', savePdf: 'Сохранить PDF', savedTo: 'Файл сохранён в «Загрузки»', print: 'Печать', act: 'Акт работ', duplicate: 'Копия', deleteEstimate: 'Удалить смету',
    confirmDelete: 'Удалить эту смету? Это нельзя отменить.', note: 'Примечание', notePh: 'Например: в стоимость входит доставка',
    options: 'Что показать в смете', showCountry: 'Страна производителя', showPerM2: 'Цена за 1 м²',
    showSecond: 'Итог во второй валюте', secondCurrency: 'Вторая валюта', recalc: 'Пересчитать количества',
    recalcHint: 'Количества считаются сами от S, L и воронок. Если вы меняли цифру руками, она не перезапишется.',
    recalcAll: 'Пересчитать всё заново (сбросить ручные правки)', manual: 'вручную', date: 'Дата',
    catalogTitle: 'Справочник цен', catalogHint: 'Цены отсюда подставляются в новые сметы. Старые сметы не меняются.',
    addItem: '+ Новая позиция', nameRu: 'Название (рус)', nameUz: 'Название (узб)', kindMat: 'Материал', kindWork: 'Работа',
    language: 'Язык программы', currencies: 'Валюты и курсы', rateHint: 'Сколько сумов стоит 1 единица валюты. Обновляйте курс перед сметой.',
    addCurrency: '+ Добавить валюту', code: 'Код', symbol: 'Знак', rate: 'Курс, сум',
    company: 'Мои реквизиты (для акта и шапки)', companyName: 'Название / ИП', companyNameLatin: 'Название латиницей',
    address: 'Адрес', passport: 'Паспорт', passportIssued: 'Кем и когда выдан', phone: 'Телефон', pinfl: 'ПИНФЛ', license: 'Свидетельство',
    showContacts: 'Показывать телефон и название в смете', warrantyDefault: 'Гарантия по умолчанию, лет',
    backup: 'Резервная копия', exportData: 'Сохранить копию (файл)', importData: 'Загрузить из файла',
    importOk: 'Данные загружены', importBad: 'Файл не подходит', resetPrices: 'Вернуть цены по умолчанию',
    confirmReset: 'Вернуть все цены справочника к исходным? Ваши новые позиции сохранятся.',
    actTitle: 'Акт выполненных работ', customerFio: 'Заказчик (ФИО)', objectAddress: 'Адрес объекта',
    workKind: 'Вид работ', volume: 'Объём, м²', amount: 'Сумма', warranty: 'Гарантия, лет', makeAct: 'Отправить PDF акта', saveAct: 'Сохранить PDF акта',
    preparing: 'Готовлю PDF…', saved: 'Сохранено', copied: 'Копия создана', tplNote: 'Строки можно изменить, удалить или добавить.',
    install: 'Установить на телефон', installHint: 'Откройте меню браузера ⋮ и выберите «Добавить на главный экран».',
    items: 'поз.', edit: 'Изменить', done: 'Готово', pickItem: 'Выберите позицию', noResults: 'Ничего не найдено',
    online: '', offlineReady: 'Работает без интернета', moveUp: 'Выше', moveDown: 'Ниже',
    paid: 'Аванс получен', remain: 'Остаток к оплате', showAdvance: 'Учесть аванс',
  },
  uz: {
    appName: 'Smetalar', estimates: 'Smetalar', prices: 'Narxlar', settings: 'Sozlamalar',
    newEstimate: 'Yangi smeta', search: "Mijoz bo'yicha qidirish…", noEstimates: "Hozircha smeta yo'q. «+ Yangi smeta» tugmasini bosing.",
    chooseTemplate: 'Ish turini tanlang', client: 'Mijoz / obyekt', clientPh: 'Masalan: Aziz aka, Yangibozor',
    objectType: 'Obyekt turi', area: 'Maydon S, m²', perimeter: 'Parapet uzunligi L, m', drains: 'Voronkalar, dona',
    thickness: 'Issiqlik izolyatsiyasi qalinligi, mm', create: 'Smeta yaratish', cancel: 'Bekor qilish', save: 'Saqlash', del: "O'chirish",
    back: 'Orqaga', materials: 'Materiallar', works: 'Ishlar', addLine: "+ Qator qo'shish", fromCatalog: "Ma'lumotnomadan",
    customLine: "O'z qatorim", name: 'Nomi', unit: "O'lch.", qty: 'Miqdor', price: 'Narx', sum: 'Summa',
    country: 'Davlat', totalMat: 'Jami material', totalWork: 'Jami ish', total: 'Jami material va ish',
    perM2: '1 m² uchun', workPerM2: '1 m² uchun ish', currency: 'Valyuta', docLang: 'Smeta tili',
    share: 'PDF yuborish', savePdf: 'PDF saqlash', savedTo: "Fayl «Yuklanmalar» ga saqlandi", print: 'Chop etish', act: 'Ish dalolatnomasi', duplicate: 'Nusxa', deleteEstimate: "Smetani o'chirish",
    confirmDelete: "Bu smetani o'chirasizmi? Qaytarib bo'lmaydi.", note: 'Izoh', notePh: 'Masalan: narxga yetkazib berish kiradi',
    options: "Smetada ko'rsatish", showCountry: 'Ishlab chiqaruvchi davlat', showPerM2: '1 m² narxi',
    showSecond: 'Ikkinchi valyutadagi jami', secondCurrency: 'Ikkinchi valyuta', recalc: 'Miqdorlarni qayta hisoblash',
    recalcHint: "Miqdorlar S, L va voronkalardan avtomatik hisoblanadi. Qo'lda o'zgartirgan raqamingiz o'zgarmaydi.",
    recalcAll: "Hammasini qaytadan hisoblash (qo'lda o'zgartirishlarni bekor qilish)", manual: "qo'lda", date: 'Sana',
    catalogTitle: "Narxlar ma'lumotnomasi", catalogHint: "Bu yerdagi narxlar yangi smetalarga qo'yiladi. Eski smetalar o'zgarmaydi.",
    addItem: '+ Yangi pozitsiya', nameRu: 'Nomi (rus)', nameUz: "Nomi (o'zb)", kindMat: 'Material', kindWork: 'Ish',
    language: 'Dastur tili', currencies: 'Valyutalar va kurslar', rateHint: "1 birlik valyuta necha so'm turadi. Smetadan oldin kursni yangilang.",
    addCurrency: "+ Valyuta qo'shish", code: 'Kod', symbol: 'Belgi', rate: "Kurs, so'm",
    company: "Mening rekvizitlarim (dalolatnoma va sarlavha uchun)", companyName: 'Nomi / YaTT', companyNameLatin: 'Lotin harflarida nomi',
    address: 'Manzil', passport: 'Pasport', passportIssued: 'Kim va qachon bergan', phone: 'Telefon', pinfl: 'JShShIR', license: 'Guvohnoma',
    showContacts: "Smetada telefon va nomni ko'rsatish", warrantyDefault: "Standart kafolat, yil",
    backup: 'Zaxira nusxa', exportData: 'Nusxani saqlash (fayl)', importData: 'Fayldan yuklash',
    importOk: "Ma'lumotlar yuklandi", importBad: 'Fayl mos emas', resetPrices: 'Standart narxlarni qaytarish',
    confirmReset: "Barcha narxlarni boshlang'ich holatga qaytarasizmi? Yangi pozitsiyalaringiz saqlanadi.",
    actTitle: 'Bajarilgan ishlar dalolatnomasi', customerFio: 'Buyurtmachi (F.I.Sh.)', objectAddress: 'Obyekt manzili',
    workKind: 'Ish turi', volume: 'Hajm, m²', amount: 'Summa', warranty: 'Kafolat, yil', makeAct: 'Dalolatnoma PDF yuborish', saveAct: 'Dalolatnoma PDF saqlash',
    preparing: 'PDF tayyorlanmoqda…', saved: 'Saqlandi', copied: 'Nusxa yaratildi', tplNote: "Qatorlarni o'zgartirish, o'chirish yoki qo'shish mumkin.",
    install: "Telefonga o'rnatish", installHint: "Brauzer menyusi ⋮ ni oching va «Bosh ekranga qo'shish» ni tanlang.",
    items: 'poz.', edit: "O'zgartirish", done: 'Tayyor', pickItem: 'Pozitsiyani tanlang', noResults: 'Hech narsa topilmadi',
    online: '', offlineReady: 'Internetsiz ishlaydi', moveUp: 'Yuqoriga', moveDown: 'Pastga',
    paid: "Avans olindi", remain: "To'lash uchun qoldiq", showAdvance: 'Avansni hisobga olish',
  },
};

// Тексты, которые попадают в документ (смета/акт)
const DOC = {
  ru: {
    estimate: 'Смета', no: '№', matName: 'Наименование товара', workName: 'Наименование работ', unit: 'Ед.изм.', qty: 'Кол-во',
    price: 'Цена', sumSupply: 'Сумма поставки', sum: 'Сумма', country: 'Страна производителя',
    totalMat: 'Итого материала', totalWork: 'Итого работа', perM2: 'Итого материал и работа за 1 м²',
    workPerM2: 'Итого работа за 1 м²', total: 'Итого материал и работа', allPricesIn: 'Все цены указаны в валюте:',
    inCurrency: 'В валюте', paid: 'Получен аванс', remain: 'Остаток к оплате', phone: 'Тел.',
    // акт
    to: 'Кому', from: 'От', address: 'Адрес', passport: 'Паспорт', issued: 'Дата выдачи', phoneFull: 'Телефон', pinfl: 'ПИНФЛ',
    license: 'Свидетельство', activity: 'Вид деятельности: строительные услуги',
    actBody: (o) => `Я, ${o.short}, сообщаю, что мной были выполнены ремонтные работы (${o.kind}) по адресу: ${o.address}.`,
    actKind: (o) => `Вид выполненных работ: ${o.kind}, в объёме ${o.volume} м². Работы выполнены в полном объёме и надлежащем качестве.`,
    actSum: (o) => `Общая стоимость выполненных работ составляет: ${o.amount} (${o.words}) с учётом материалов.`,
    actNoClaims: 'Претензий по выполненным работам со стороны заказчика не имеется.',
    actWarranty: (y, w) => `Гарантия на выполненные работы даётся ${y} (${w}) ${plural(y, ['год', 'года', 'лет'])}.`,
    dateLine: 'Дата', signLine: 'Подпись', customerSign: 'Заказчик', contractorSign: 'Исполнитель',
  },
  uz: {
    estimate: 'Smeta', no: '№', matName: 'Mahsulot nomi', workName: 'Ishlar nomi', unit: "O'lch. birl.", qty: 'Miqdori',
    price: 'Narxi', sumSupply: 'Yetkazib berish summasi', sum: 'Summa', country: 'Ishlab chiqaruvchi davlat',
    totalMat: 'Jami material', totalWork: 'Jami ish', perM2: '1 m² uchun jami material va ish',
    workPerM2: '1 m² uchun jami ish', total: 'Jami material va ish', allPricesIn: "Barcha narxlar ko'rsatilgan valyuta:",
    inCurrency: 'Valyutada', paid: 'Olingan avans', remain: "To'lash uchun qoldiq", phone: 'Tel.',
    to: 'Kimga', from: 'Kimdan', address: 'Manzil', passport: 'Pasport', issued: 'Berilgan sana', phoneFull: 'Telefon', pinfl: 'JShShIR',
    license: 'Guvohnoma', activity: "Faoliyat turi: qurilish xizmatlari",
    actBody: (o) => `Men, ${o.short}, ${o.address} manzilida ta'mirlash ishlari (${o.kind}) bajarilganligini ma'lum qilaman.`,
    actKind: (o) => `Bajarilgan ishlar turi: ${o.kind}, hajmi ${o.volume} m². Ishlar to'liq hajmda va sifatli bajarildi.`,
    actSum: (o) => `Bajarilgan ishlarning umumiy qiymati materiallar bilan birga: ${o.amount} (${o.words}).`,
    actNoClaims: "Buyurtmachi tomonidan bajarilgan ishlar bo'yicha e'tirozlar yo'q.",
    actWarranty: (y, w) => `Bajarilgan ishlarga ${y} (${w}) yil kafolat beriladi.`,
    dateLine: 'Sana', signLine: 'Imzo', customerSign: 'Buyurtmachi', contractorSign: 'Ijrochi',
  },
};

function plural(n, forms) {
  n = Math.abs(Math.floor(n)) % 100;
  const n1 = n % 10;
  if (n > 10 && n < 20) return forms[2];
  if (n1 > 1 && n1 < 5) return forms[1];
  if (n1 === 1) return forms[0];
  return forms[2];
}

// ---------- Сумма прописью ----------
function wordsRu(num, fem = false) {
  num = Math.floor(Math.abs(num));
  if (num === 0) return 'ноль';
  const ones = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
  const onesF = ['', 'одна', 'две', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
  const teens = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
  const tens = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
  const hundreds = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];
  const groups = [
    { forms: null, fem },
    { forms: ['тысяча', 'тысячи', 'тысяч'], fem: true },
    { forms: ['миллион', 'миллиона', 'миллионов'], fem: false },
    { forms: ['миллиард', 'миллиарда', 'миллиардов'], fem: false },
  ];
  const out = [];
  let g = 0;
  while (num > 0 && g < groups.length) {
    const n = num % 1000;
    if (n) {
      const w = [];
      w.push(hundreds[Math.floor(n / 100)]);
      const t = n % 100;
      if (t >= 10 && t < 20) w.push(teens[t - 10]);
      else { w.push(tens[Math.floor(t / 10)]); w.push((groups[g].fem ? onesF : ones)[t % 10]); }
      if (groups[g].forms) w.push(plural(n, groups[g].forms));
      out.unshift(w.filter(Boolean).join(' '));
    }
    num = Math.floor(num / 1000); g++;
  }
  return out.join(' ');
}

function wordsUz(num) {
  num = Math.floor(Math.abs(num));
  if (num === 0) return 'nol';
  const ones = ['', 'bir', 'ikki', 'uch', "to'rt", 'besh', 'olti', 'yetti', 'sakkiz', "to'qqiz"];
  const tens = ['', "o'n", 'yigirma', "o'ttiz", 'qirq', 'ellik', 'oltmish', 'yetmish', 'sakson', "to'qson"];
  const big = ['', 'ming', 'million', 'milliard'];
  const out = [];
  let g = 0;
  while (num > 0 && g < big.length) {
    const n = num % 1000;
    if (n) {
      const w = [];
      if (n >= 100) w.push(ones[Math.floor(n / 100)], 'yuz');
      w.push(tens[Math.floor((n % 100) / 10)], ones[n % 10]);
      if (big[g]) w.push(big[g]);
      out.unshift(w.filter(Boolean).join(' '));
    }
    num = Math.floor(num / 1000); g++;
  }
  return out.join(' ');
}

const CURRENCY_WORDS = {
  UZS: { ru: ['сум', 'сум', 'сум'], uz: "so'm" },
  USD: { ru: ['доллар США', 'доллара США', 'долларов США'], uz: 'AQSh dollari' },
  RUB: { ru: ['рубль', 'рубля', 'рублей'], uz: 'rubl' },
  EUR: { ru: ['евро', 'евро', 'евро'], uz: 'yevro' },
};

function amountInWords(amount, code, lang) {
  const n = Math.round(amount);
  const cw = CURRENCY_WORDS[code];
  if (lang === 'uz') return `${wordsUz(n)} ${cw ? cw.uz : code}`;
  const cur = cw ? plural(n, cw.ru) : code;
  return `${wordsRu(n, code === 'UZS' ? false : false)} ${cur}`;
}
