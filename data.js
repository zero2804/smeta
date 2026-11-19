// Справочник материалов и работ, шаблоны смет.
// Цены — в сумах (базовая валюта). Взяты из последних смет 2025–2026 гг.
// Формулы количества используют: S — площадь (м²), L — длина парапета/примыканий (м),
// N — количество воронок (шт), T — толщина утеплителя (м).
// up(x, шаг) — округлить вверх до шага; r2(x) — округлить до 0,01; ceil(x) — вверх до целого.

const DEFAULT_CATALOG = [
  // ---------- Материалы: ПВХ ----------
  { id: 'geo300', kind: 'mat', ru: 'Геотекстиль ГЕО СТАНДАРТ 300 (2,1×50 м)', uz: 'Geotekstil GEO STANDART 300 (2,1×50 m)', unit: 'm2', price: 14000, country: 'RU' },
  { id: 'geo150', kind: 'mat', ru: 'Геотекстиль ГЕО СТАНДАРТ 150 (2,1×50 м)', uz: 'Geotekstil GEO STANDART 150 (2,1×50 m)', unit: 'm2', price: 10000, country: 'RU' },
  { id: 'pvc_geo', kind: 'mat', ru: 'ПВХ мембрана PLASTFOIL GEO 1,5 мм', uz: 'PVX membrana PLASTFOIL GEO 1,5 mm', unit: 'm2', price: 100000, country: 'RU' },
  { id: 'pvc_eco', kind: 'mat', ru: 'ПВХ мембрана PLASTFOIL ECO 1,5 мм (на парапет)', uz: 'PVX membrana PLASTFOIL ECO 1,5 mm (parapet uchun)', unit: 'm2', price: 105000, country: 'RU' },
  { id: 'pvc_tn', kind: 'mat', ru: 'ПВХ мембрана ТЕХНОНИКОЛЬ 1,5 мм', uz: 'PVX membrana TEXNONIKOL 1,5 mm', unit: 'm2', price: 100000, country: 'RU' },
  { id: 'protan', kind: 'mat', ru: 'ПВХ мембрана Protan SE 1,2 мм', uz: 'PVX membrana Protan SE 1,2 mm', unit: 'm2', price: 120000, country: 'TR' },
  { id: 'pvc_corner', kind: 'mat', ru: 'ПВХ для углов', uz: 'Burchaklar uchun PVX', unit: 'm2', price: 120000, country: 'RU' },
  { id: 'xps', kind: 'mat', ru: 'Утеплитель ТЕХНОНИКОЛЬ XPS CARBON ECO', uz: 'Issiqlik izolyatsiyasi TEXNONIKOL XPS CARBON ECO', unit: 'm3', price: 800000, country: 'RU' },
  { id: 'penoplex', kind: 'mat', ru: 'Плиты «Пеноплекс» Основа 50×585×1185', uz: '«Penopleks» Osnova plitalari 50×585×1185', unit: 'm3', price: 900000, country: 'RU' },
  { id: 'rail_edge', kind: 'mat', ru: 'Рейка краевая 3 м, арт. 03.012', uz: 'Chekka reyka 3 m, art. 03.012', unit: 'm', price: 22000, country: 'RU' },
  { id: 'rail_press', kind: 'mat', ru: 'Рейка прижимная 3 м, арт. 03.013', uz: 'Qisuvchi reyka 3 m, art. 03.013', unit: 'm', price: 21000, country: 'RU' },
  { id: 'sealant', kind: 'mat', ru: 'Герметик полиуретановый', uz: 'Poliuretan germetik', unit: 'pcs', price: 150000, country: 'RU' },
  { id: 'disc', kind: 'mat', ru: 'Круглый тарельчатый держатель Стандарт', uz: 'Dumaloq tarelkasimon ushlagich Standart', unit: 'pcs', price: 1300, country: 'RU' },
  { id: 'drain_parapet', kind: 'mat', ru: 'Парапетная воронка с листвоуловителем VC-PVC 100×100×650, арт. 01.067', uz: 'Barg tutgichli parapet voronkasi VC-PVC 100×100×650, art. 01.067', unit: 'pcs', price: 1450000, country: 'RU' },
  { id: 'drain_roof', kind: 'mat', ru: 'Воронка кровельная V-PVC, арт. 01.107', uz: 'Tom voronkasi V-PVC, art. 01.107', unit: 'pcs', price: 1400000, country: 'RU' },
  { id: 'drain_ext', kind: 'mat', ru: 'Воронка ПВХ экструдируемая', uz: 'Ekstruziyalangan PVX voronka', unit: 'pcs', price: 950000, country: 'RU' },
  { id: 'drain_angle', kind: 'mat', ru: 'Угловая кровельная воронка ПВХ-П 90°, Ø110, L=500 мм', uz: 'PVX-P 90° burchakli tom voronkasi, Ø110, L=500 mm', unit: 'pcs', price: 1400000, country: 'IT' },
  { id: 'aerator', kind: 'mat', ru: 'Аэратор кровельный A75×375 PVC, арт. 01.171', uz: 'Tom aeratori A75×375 PVC, art. 01.171', unit: 'pcs', price: 320000, country: 'RU' },
  { id: 'dowel', kind: 'mat', ru: 'Дюбель-гвоздь 6/40', uz: 'Dyubel-mix 6/40', unit: 'kg', price: 45000, country: 'UZ' },
  { id: 'cleaner', kind: 'mat', ru: 'Очиститель для ПВХ мембран ТЕХНОНИКОЛЬ 3 кг', uz: 'PVX membrana tozalagichi TEXNONIKOL 3 kg', unit: 'pcs', price: 1400000, country: 'RU' },
  { id: 'glue_pvc', kind: 'mat', ru: 'Клей для ПВХ мембраны', uz: 'PVX membrana uchun yelim', unit: 'l', price: 220000, country: 'RU' },
  { id: 'clamp', kind: 'mat', ru: 'Хомуты', uz: 'Xomutlar', unit: 'pcs', price: 15000, country: 'RU' },
  { id: 'plasgard', kind: 'mat', ru: 'Защитный дренажный слой Plas-gard', uz: 'Himoya drenaj qatlami Plas-gard', unit: 'm2', price: 55000, country: 'RU' },
  { id: 'delta', kind: 'mat', ru: 'Защитный дренажный слой DELTA-NP-DRAIN', uz: 'Himoya drenaj qatlami DELTA-NP-DRAIN', unit: 'm2', price: 72000, country: 'TR' },
  { id: 'film_pe', kind: 'mat', ru: 'Пароизоляционная плёнка Eurovent DB 0,20 (2×50 м)', uz: "Bug'izolyatsiya plyonkasi Eurovent DB 0,20 (2×50 m)", unit: 'm2', price: 6500, country: 'PL' },
  { id: 'tape_duo', kind: 'mat', ru: 'Двусторонний скотч Eurovent DUO (20 мм × 25 м)', uz: 'Ikki tomonlama skotch Eurovent DUO (20 mm × 25 m)', unit: 'pcs', price: 103000, country: 'PL' },
  { id: 'nail_nt', kind: 'mat', ru: 'Гвоздь NT-215 с термоголовкой', uz: 'Termokallakli mix NT-215', unit: 'pcs', price: 910, country: 'RU' },
  { id: 'dowel_bog', kind: 'mat', ru: 'Дюбель BOGIRUS 8×215 мм', uz: 'Dyubel BOGIRUS 8×215 mm', unit: 'pcs', price: 980, country: 'RU' },
  // ---------- Материалы: битум ----------
  { id: 'primer', kind: 'mat', ru: 'Праймер битумный BITUMAST быстросохнущий (21,5 л / 17 кг, ведро)', uz: 'Bitumli praymer BITUMAST tez quriydigan (21,5 l / 17 kg, chelak)', unit: 'bucket', price: 570000, country: 'RU' },
  { id: 'izorol', kind: 'mat', ru: 'Битумная мембрана IZOROLL P3000, 3 мм (рулон 10 м²)', uz: 'Bitumli membrana IZOROLL P3000, 3 mm (rulon 10 m²)', unit: 'm2', price: 28000, country: 'TM' },
  { id: 'elastobit_epp', kind: 'mat', ru: 'Эластобит ЭПП-3,5 (рулон 10 м²) — нижний слой', uz: 'Elastobit EPP-3,5 (rulon 10 m²) — pastki qatlam', unit: 'm2', price: 48000, country: 'RU' },
  { id: 'elastobit_ekp', kind: 'mat', ru: 'Эластобит ЭКП-4,5 сланец (рулон 10 м²) — верхний слой', uz: 'Elastobit EKP-4,5 slanets (rulon 10 m²) — ustki qatlam', unit: 'm2', price: 53000, country: 'RU' },
  { id: 'uniflex', kind: 'mat', ru: 'Битумная пароизоляция Унифлекс ЭПП ТЕХНОНИКОЛЬ', uz: "Bitumli bug'izolyatsiya Uniflex EPP TEXNONIKOL", unit: 'm2', price: 45000, country: 'RU' },
  { id: 'foam_glue', kind: 'mat', ru: 'Клей-пена', uz: "Yelim-ko'pik", unit: 'pcs', price: 105000, country: 'RU' },
  { id: 'mount_foam', kind: 'mat', ru: 'Монтажная пена Tytan Professional', uz: "Montaj ko'pigi Tytan Professional", unit: 'pcs', price: 130000, country: 'RU' },
  { id: 'tile_glue', kind: 'mat', ru: 'Плиточный клей', uz: 'Kafel yelimi', unit: 'pcs', price: 48000, country: 'RU' },
  { id: 'delivery', kind: 'mat', ru: 'Доставка', uz: 'Yetkazib berish', unit: 'trip', price: 1000000, country: 'UZ' },

  // ---------- Работы ----------
  { id: 'w_drill', kind: 'work', ru: 'Алмазное бурение отверстий под воронки', uz: 'Voronkalar uchun olmosli teshik ochish', unit: 'pcs', price: 150000 },
  { id: 'w_slope', kind: 'work', ru: 'Уклонообразующая стяжка (с дорожной сеткой)', uz: "Nishab hosil qiluvchi styajka (yo'l to'ri bilan)", unit: 'm2', price: 30000 },
  { id: 'w_drain', kind: 'work', ru: 'Устройство воронок', uz: "Voronkalarni o'rnatish", unit: 'pcs', price: 100000 },
  { id: 'w_geo300', kind: 'work', ru: 'Укладка защитно-разделительного слоя (геотекстиль 300 г)', uz: 'Himoya-ajratuvchi qatlamni yotqizish (geotekstil 300 g)', unit: 'm2', price: 4000 },
  { id: 'w_pvc', kind: 'work', ru: 'Устройство гидроизоляционного слоя ПВХ или ТПО', uz: "PVX yoki TPO gidroizolyatsiya qatlamini o'rnatish", unit: 'm2', price: 70000 },
  { id: 'w_parapet', kind: 'work', ru: 'Устройство примыканий ПВХ или ТПО мембраны к парапету', uz: 'PVX yoki TPO membranani parapetga tutashtirish', unit: 'lm', price: 50000 },
  { id: 'w_seal', kind: 'work', ru: 'Обмазка герметиком краевой рейки', uz: 'Chekka reykani germetik bilan surtish', unit: 'm', price: 4000 },
  { id: 'w_geo150', kind: 'work', ru: 'Укладка защитно-разделительного слоя (геотекстиль 150 г)', uz: 'Himoya-ajratuvchi qatlamni yotqizish (geotekstil 150 g)', unit: 'm2', price: 4000 },
  { id: 'w_insul', kind: 'work', ru: 'Укладка теплоизоляции (пеноплекс)', uz: 'Issiqlik izolyatsiyasini yotqizish (penopleks)', unit: 'm3', price: 190000 },
  { id: 'w_drainage', kind: 'work', ru: 'Укладка защитно-дренажного слоя', uz: 'Himoya-drenaj qatlamini yotqizish', unit: 'm2', price: 25000 },
  { id: 'w_screed', kind: 'work', ru: 'Защитная стяжка (с дорожной сеткой)', uz: "Himoya styajkasi (yo'l to'ri bilan)", unit: 'm2', price: 30000 },
  { id: 'w_aerator', kind: 'work', ru: 'Установка аэраторов', uz: "Aeratorlarni o'rnatish", unit: 'pcs', price: 50000 },
  { id: 'w_test', kind: 'work', ru: 'Гидроиспытание водой 3 дня', uz: 'Suv bilan 3 kunlik sinov', unit: 'pcs', price: 0 },
  { id: 'w_stand', kind: 'work', ru: 'Обработка стоек гидроизоляцией и герметиком', uz: 'Ustunlarga gidroizolyatsiya va germetik bilan ishlov berish', unit: 'pcs', price: 50000 },
  { id: 'w_vapor_bit', kind: 'work', ru: 'Обеспыливание, обмазка праймером и наплавляемая битумная пароизоляция', uz: "Changsizlantirish, praymer surtish va eritib yopishtiriladigan bitumli bug'izolyatsiya", unit: 'm2', price: 30000 },
  { id: 'w_bit_parapet', kind: 'work', ru: 'Примыкание битумной мембраны к парапету', uz: 'Bitumli membranani parapetga tutashtirish', unit: 'lm', price: 25000 },
  { id: 'w_bit1', kind: 'work', ru: 'Обеспыливание, обмазка праймером и битумная гидроизоляция (1-й слой)', uz: 'Changsizlantirish, praymer surtish va bitumli gidroizolyatsiya (1-qatlam)', unit: 'm2', price: 25000 },
  { id: 'w_bit2', kind: 'work', ru: 'Битумная гидроизоляция (2-й слой)', uz: 'Bitumli gidroizolyatsiya (2-qatlam)', unit: 'm2', price: 25000 },
  { id: 'w_galtel', kind: 'work', ru: 'Установка галтелей', uz: "Galtellarni o'rnatish", unit: 'lm', price: 15000 },
  { id: 'w_rail', kind: 'work', ru: 'Прибивание краевой рейки и обмазка герметиком', uz: 'Chekka reykani qoqish va germetik bilan surtish', unit: 'lm', price: 10000 },
  { id: 'w_xps_glue', kind: 'work', ru: 'Установка плит XPS на клей-пену', uz: "XPS plitalarini yelim-ko'pikka o'rnatish", unit: 'm2', price: 15000 },
  { id: 'w_roof_insul', kind: 'work', ru: 'Подъём материала, очистка, укладка пароизоляции и утеплителя 150 мм в три слоя с механическим креплением', uz: "Materialni ko'tarish, tozalash, bug'izolyatsiya va 150 mm issiqlik izolyatsiyasini uch qatlamda yotqizish, mexanik mahkamlash", unit: 'm2', price: 65000 },
];

const BIT_NOTE = {
  ru: 'В стоимость работ входят: расход газа (пропан), валики, дюбель-гвозди и обед.',
  uz: "Ish narxiga kiradi: gaz (propan), valiklar, dyubel-mixlar va tushlik.",
};

const DEFAULT_TEMPLATES = [
  {
    id: 'pvc_full', icon: '🏢',
    ru: 'ПВХ терраса — полная', uz: "PVX terrasa — to'liq",
    descRu: 'Стяжка, утепление, ПВХ, дренаж, защитная стяжка', descUz: 'Styajka, issiqlik izolyatsiyasi, PVX, drenaj, himoya styajkasi',
    vars: ['S', 'L', 'N', 'T'], defaults: { S: 100, L: 40, N: 2, T: 100 },
    mats: [
      ['geo300', 'up(S*1.05,10)'], ['pvc_geo', 'up(S*1.12,5)'], ['pvc_eco', 'ceil(L/60)*42'],
      ['geo150', 'up(S*1.05,10)'], ['xps', 'r2(S*T*1.02)'], ['rail_edge', 'up(L*1.03,3)'],
      ['rail_press', 'up(L*1.03,3)'], ['sealant', 'ceil(L/7)'], ['disc', 'up(L*2.5,50)'],
      ['drain_parapet', 'N'], ['dowel', 'ceil(L/20)'], ['cleaner', '1'], ['pvc_corner', '1'],
      ['plasgard', 'up(S*1.15,10)'], ['delivery', '1'],
    ],
    works: [
      ['w_drill', 'N'], ['w_slope', 'S'], ['w_drain', 'N'], ['w_geo300', 'S'], ['w_pvc', 'S'],
      ['w_parapet', 'L'], ['w_seal', 'L'], ['w_geo150', 'S'], ['w_insul', 'r2(S*T*1.02)'],
      ['w_drainage', 'S'], ['w_screed', 'S'], ['w_test', '1'],
    ],
  },
  {
    id: 'pvc_vapor', icon: '🏨',
    ru: 'ПВХ терраса + битумная пароизоляция', uz: "PVX terrasa + bitumli bug'izolyatsiya",
    descRu: 'Пароизоляция, утепление, стяжка, ПВХ, аэраторы', descUz: "Bug'izolyatsiya, issiqlik izolyatsiyasi, styajka, PVX, aeratorlar",
    vars: ['S', 'L', 'N', 'T'], defaults: { S: 100, L: 40, N: 2, T: 150 },
    mats: [
      ['primer', 'ceil(S/80)'], ['uniflex', 'up(S*1.17,10)'], ['geo150', 'up(S*1.05,10)'],
      ['geo300', 'up(S*1.05,10)'], ['pvc_geo', 'up(S*1.12,5)'], ['pvc_eco', 'ceil(L/60)*42'],
      ['penoplex', 'r2(S*T*1.02)'], ['rail_edge', 'up(L*1.03,3)'], ['rail_press', 'up(L*1.03,3)'],
      ['sealant', 'ceil(L/7)'], ['disc', 'up(L*2.5,50)'], ['drain_parapet', 'N'], ['dowel', 'ceil(L/20)'],
      ['cleaner', '1'], ['pvc_corner', '1'], ['aerator', 'ceil(S/50)'], ['delivery', '1'],
    ],
    works: [
      ['w_vapor_bit', 'S'], ['w_geo150', 'S'], ['w_insul', 'r2(S*T*1.02)'], ['w_drill', 'N'],
      ['w_slope', 'S'], ['w_geo300', 'S'], ['w_drain', 'N'], ['w_pvc', 'S'], ['w_parapet', 'L'],
      ['w_seal', 'L'], ['w_aerator', 'ceil(S/50)'], ['w_test', '1'],
    ],
  },
  {
    id: 'pvc_noinsul', icon: '🏠',
    ru: 'ПВХ терраса без утепления', uz: 'Issiqlik izolyatsiyasisiz PVX terrasa',
    descRu: 'Стяжка, ПВХ, дренаж, защитная стяжка', descUz: 'Styajka, PVX, drenaj, himoya styajkasi',
    vars: ['S', 'L', 'N'], defaults: { S: 50, L: 30, N: 1 },
    mats: [
      ['geo300', 'up(S*1.1,10)'], ['pvc_geo', 'up(S*1.15,5)'], ['pvc_eco', 'ceil(L/60)*42'],
      ['rail_edge', 'up(L*1.03,3)'], ['rail_press', 'up(L*1.03,3)'], ['sealant', 'ceil(L/8)'],
      ['drain_ext', 'N'], ['dowel', 'ceil(L/20)'], ['plasgard', 'up(S*1.15,10)'], ['delivery', '1'],
    ],
    works: [
      ['w_slope', 'S'], ['w_geo300', 'S'], ['w_drain', 'N'], ['w_pvc', 'S'], ['w_parapet', 'L'],
      ['w_seal', 'L'], ['w_drainage', 'S'], ['w_screed', 'S'],
    ],
  },
  {
    id: 'pvc_simple', icon: '🧱',
    ru: 'ПВХ — только мембрана', uz: 'PVX — faqat membrana',
    descRu: 'Геотекстиль, ПВХ, примыкания, воронки', descUz: 'Geotekstil, PVX, tutashmalar, voronkalar',
    vars: ['S', 'L', 'N'], defaults: { S: 30, L: 20, N: 1 },
    mats: [
      ['geo300', 'up(S*1.1,10)'], ['pvc_eco', 'up(S*1.15+L*0.5,5)'], ['rail_edge', 'up(L*1.03,3)'],
      ['rail_press', 'up(L*1.03,3)'], ['sealant', 'ceil(L/8)'], ['drain_ext', 'N'], ['dowel', 'ceil(L/20)'],
    ],
    works: [
      ['w_drain', 'N'], ['w_geo300', 'S'], ['w_pvc', 'S'], ['w_parapet', 'L'], ['w_seal', 'L'],
    ],
  },
  {
    id: 'bit_two', icon: '🔥',
    ru: 'Битумная гидроизоляция в 2 слоя', uz: 'Ikki qatlamli bitumli gidroizolyatsiya',
    descRu: 'Праймер, Эластобит ЭПП + ЭКП, галтели, воронки', descUz: 'Praymer, Elastobit EPP + EKP, galtellar, voronkalar',
    vars: ['S', 'L', 'N'], defaults: { S: 100, L: 40, N: 2 },
    mats: [
      ['primer', 'ceil(S/60)'], ['elastobit_epp', 'up(S*1.2,10)'], ['elastobit_ekp', 'up(S*1.2,10)'],
      ['rail_edge', 'up(L*1.03,3)'], ['sealant', 'ceil(L/10)'], ['drain_parapet', 'N'], ['dowel', 'ceil(L/25)'],
      ['delivery', '1'],
    ],
    works: [
      ['w_bit1', 'S'], ['w_bit2', 'S'], ['w_galtel', 'L'], ['w_drain', 'N'], ['w_rail', 'L'],
    ],
    note: BIT_NOTE,
  },
  {
    id: 'bit_one', icon: '🛢️',
    ru: 'Битумная гидроизоляция в 1 слой', uz: 'Bir qatlamli bitumli gidroizolyatsiya',
    descRu: 'Праймер и наплавляемая мембрана IZOROLL', descUz: 'Praymer va eritib yopishtiriladigan IZOROLL membranasi',
    vars: ['S'], defaults: { S: 100 },
    mats: [['primer', 'ceil(S/80)'], ['izorol', 'up(S*1.17,10)'], ['delivery', '1']],
    works: [['w_bit1', 'S']],
    note: BIT_NOTE,
  },
  {
    id: 'bit_vert', icon: '🧊',
    ru: 'Вертикальная битумная изоляция + XPS', uz: 'Vertikal bitumli izolyatsiya + XPS',
    descRu: 'Фундамент/стены: битум, галтели, утепление XPS на клей-пену', descUz: "Poydevor/devorlar: bitum, galtellar, yelim-ko'pikka XPS",
    vars: ['S', 'L', 'T'], defaults: { S: 80, L: 20, T: 50 },
    mats: [
      ['primer', 'ceil(S/80)'], ['izorol', 'up(S*1.15,10)'], ['rail_edge', 'up(L*1.03,3)'],
      ['sealant', 'ceil(L/10)'], ['xps', 'r2(S*T*1.02)'], ['foam_glue', 'ceil(S*T*2.5)'], ['delivery', '1'],
    ],
    works: [['w_bit1', 'S'], ['w_galtel', 'L'], ['w_rail', 'L'], ['w_xps_glue', 'S']],
    note: BIT_NOTE,
  },
  {
    id: 'vapor', icon: '💨',
    ru: 'Битумная пароизоляция', uz: "Bitumli bug'izolyatsiya",
    descRu: 'Праймер и наплавляемая пароизоляция с заходом на парапет', descUz: "Praymer va parapetga chiqadigan bug'izolyatsiya",
    vars: ['S', 'L'], defaults: { S: 200, L: 60 },
    mats: [['primer', 'ceil(S/55)'], ['uniflex', 'up(S*1.2,10)']],
    works: [['w_vapor_bit', 'S'], ['w_bit_parapet', 'L']],
    note: BIT_NOTE,
  },
  {
    id: 'roof_insul', icon: '🧤',
    ru: 'Утепление крыши', uz: 'Tomni isitish',
    descRu: 'Пароизоляционная плёнка, пеноплекс, механический крепёж', descUz: "Bug'izolyatsiya plyonkasi, penopleks, mexanik mahkamlash",
    vars: ['S', 'T'], defaults: { S: 200, T: 150 },
    mats: [
      ['film_pe', 'up(S*1.5,50)'], ['penoplex', 'r2(S*T*1.02)'], ['nail_nt', 'up(S*3,50)'],
      ['dowel_bog', 'up(S*3,50)'], ['tape_duo', 'ceil(S/35)'],
    ],
    works: [['w_roof_insul', 'S']],
  },
  {
    id: 'blank', icon: '📄',
    ru: 'Пустая смета', uz: "Bo'sh smeta",
    descRu: 'Добавить строки вручную', descUz: "Qatorlarni qo'lda qo'shish",
    vars: ['S', 'L'], defaults: { S: 0, L: 0 },
    mats: [], works: [],
  },
];

const UNITS = {
  m2: { ru: 'м²', uz: 'm²' },
  m3: { ru: 'м³', uz: 'm³' },
  m: { ru: 'м', uz: 'm' },
  lm: { ru: 'п.м', uz: 'p.m' },
  pcs: { ru: 'шт', uz: 'dona' },
  kg: { ru: 'кг', uz: 'kg' },
  l: { ru: 'л', uz: 'l' },
  bucket: { ru: 'ведро', uz: 'chelak' },
  roll: { ru: 'рулон', uz: 'rulon' },
  trip: { ru: 'рейс', uz: 'reys' },
  set: { ru: 'компл.', uz: 'kompl.' },
};

const COUNTRIES = {
  '': { ru: '', uz: '' },
  UZ: { ru: 'Узбекистан', uz: "O'zbekiston" },
  RU: { ru: 'Россия', uz: 'Rossiya' },
  TR: { ru: 'Турция', uz: 'Turkiya' },
  TM: { ru: 'Туркменистан', uz: 'Turkmaniston' },
  PL: { ru: 'Польша', uz: 'Polsha' },
  IT: { ru: 'Италия', uz: 'Italiya' },
  CN: { ru: 'Китай', uz: 'Xitoy' },
  KZ: { ru: 'Казахстан', uz: "Qozog'iston" },
  DE: { ru: 'Германия', uz: 'Germaniya' },
  BY: { ru: 'Беларусь', uz: 'Belarus' },
};

const OBJECT_TYPES = {
  terrace: { ru: 'терраса', uz: 'terrasa' },
  roof: { ru: 'кровля', uz: 'tom' },
  foundation: { ru: 'фундамент', uz: 'poydevor' },
  pool: { ru: 'бассейн', uz: 'basseyn' },
  basement: { ru: 'подвал', uz: "yerto'la" },
  other: { ru: 'объект', uz: 'obyekt' },
};

// Валюты: rate — сколько сумов стоит 1 единица валюты. Курсы пользователь меняет в настройках.
const DEFAULT_CURRENCIES = [
  { code: 'UZS', ru: 'сум', uz: "so'm", rate: 1, decimals: 0 },
  { code: 'USD', ru: '$', uz: '$', rate: 12000, decimals: 2 },
  { code: 'RUB', ru: '₽', uz: '₽', rate: 150, decimals: 0 },
  { code: 'EUR', ru: '€', uz: '€', rate: 14000, decimals: 2 },
];
