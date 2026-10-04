'use strict';
/* ===== Story: we are a friendly demolition crew. Every target is an old,
   unsafe or unwanted structure; the client explains why it has to go and
   the win screen shows what will be built in its place. ===== */
const CLIENTS = [
  { name: { ru: 'Фермер Петрович', en: 'Farmer Pete' }, color: '#7cb342', letter: { ru: 'П', en: 'P' } },
  { name: { ru: 'Мэр Васильева', en: 'Mayor Vasquez' }, color: '#5c8df6', letter: { ru: 'В', en: 'V' } },
  { name: { ru: 'Караванщик Али', en: 'Ali the Trader' }, color: '#f0a040', letter: { ru: 'А', en: 'A' } },
  { name: { ru: 'Полярница Оля', en: 'Polar Explorer Olga' }, color: '#5ec8e8', letter: { ru: 'О', en: 'O' } },
  { name: { ru: 'Пришелец Глорп', en: 'Glorp the Alien' }, color: '#37e0b0', letter: { ru: 'Г', en: 'G' } },
];
const STORY = [
  // village
  { why: { ru: 'Сарай совсем прогнил и вот-вот рухнет сам. Снесите его аккуратно, тут будет огород!', en: 'The shed has rotted through and could fall any day. Take it down, we are planting a garden here!' }, next: { ru: 'Огород с тыквами', en: 'A pumpkin garden' } },
  { why: { ru: 'Прошлогоднее сено отсырело. Разметайте стог, освободим место под новый урожай.', en: 'Last year\'s hay got damp. Scatter the stack to make room for the new harvest.' }, next: { ru: 'Свежий стог', en: 'A fresh haystack' } },
  { why: { ru: 'В этом доме давно никто не живёт, крыша течёт. Построим на его месте новый.', en: 'Nobody has lived here for years and the roof leaks. We will build a new home instead.' }, next: { ru: 'Новый уютный дом', en: 'A cozy new house' } },
  { why: { ru: 'Старая мельница сломалась ещё при дедушке. Нужно место для новой, современной.', en: 'The old mill broke back in grandpa\'s day. We need room for a modern one.' }, next: { ru: 'Ветряная электростанция', en: 'A wind turbine' } },
  { why: { ru: 'Водонапорная башня проржавела. Скоро проведём водопровод, она больше не нужна.', en: 'The water tower is all rust. Pipes are coming soon, so we no longer need it.' }, next: { ru: 'Детская площадка', en: 'A playground' } },
  { why: { ru: 'Большая старая ферма. Разберите её целиком, и деревня построит новую, светлую!', en: 'The big old farm. Take it all down and the village will build a bright new one!' }, next: { ru: 'Новая ферма', en: 'A brand-new farm' } },
  // city
  { why: { ru: 'Этот киоск закрыт уже десять лет. Освободите тротуар для пешеходов.', en: 'This kiosk has been closed for ten years. Clear the sidewalk for people.' }, next: { ru: 'Цветочная клумба', en: 'A flower bed' } },
  { why: { ru: 'Брошенная машина без колёс и хозяина. Отправим её на переработку!', en: 'An abandoned car with no owner. Off to recycling!' }, next: { ru: 'Велопарковка', en: 'A bike rack' } },
  { why: { ru: 'Нашли старый сундук с монетами, но замок заржавел. Вскройте его, монеты пойдут на новый парк!', en: 'We found an old chest of coins, but the lock rusted shut. Open it up, the coins will pay for a park!' }, next: { ru: 'Городской парк', en: 'A city park' } },
  { why: { ru: 'Склад пустует много лет и стал аварийным. На его месте будет спортплощадка.', en: 'The warehouse has stood empty for years and is unsafe. A sports ground goes here.' }, next: { ru: 'Спортплощадка', en: 'A sports ground' } },
  { why: { ru: 'Огромный рекламный щит закрывает всем вид на закат. Уберите его!', en: 'The huge billboard blocks everyone\'s sunset view. Take it down!' }, next: { ru: 'Вид на закат', en: 'A sunset view' } },
  { why: { ru: 'Стройка закончилась, а старый кран остался. Разберите его, пора открывать новый район!', en: 'Construction is over, but the old crane is still here. Take it apart, the new district opens soon!' }, next: { ru: 'Новый район', en: 'A new neighborhood' } },
  // desert
  { why: { ru: 'Глиняную хижину размыло редким дождём. Поставим на её месте прочный дом.', en: 'A rare rain washed the clay hut out. We will put a sturdy house here.' }, next: { ru: 'Каменный дом', en: 'A stone house' } },
  { why: { ru: 'Это не настоящий кактус, а старая декорация из фанеры для кино. Она мешает каравану.', en: 'It is not a real cactus but an old movie prop. It blocks the caravan road.' }, next: { ru: 'Караванная тропа', en: 'A caravan road' } },
  { why: { ru: 'Гигантские песочные часы для фестиваля. Праздник окончен, пора разбирать!', en: 'Giant festival hourglass. The party is over, time to take it down!' }, next: { ru: 'Площадь для ярмарки', en: 'A market square' } },
  { why: { ru: 'Конкурс песчаных замков окончен. Сломайте замок, завтра строим новый, ещё больше!', en: 'The sandcastle contest is over. Knock it down, tomorrow we build an even bigger one!' }, next: { ru: 'Новый песчаный замок', en: 'A new sandcastle' } },
  { why: { ru: 'Старый колодец высох, а пальма засохла. Расчистите место, выроем новый колодец.', en: 'The old well dried up and the palm withered. Clear the spot for a new well.' }, next: { ru: 'Новый колодец', en: 'A new well' } },
  { why: { ru: 'Караван оставил гору пустых ящиков. Разберите её, и дорога снова свободна!', en: 'A caravan left a mountain of empty crates. Clear it and the road is open again!' }, next: { ru: 'Свободная дорога', en: 'A clear road' } },
  // ice
  { why: { ru: 'Пришла весна, снеговику пора на покой. Не грусти, следующей зимой слепим нового!', en: 'Spring is here and the snowman can retire. Next winter we will build a new one!' }, next: { ru: 'Весенняя поляна', en: 'A spring meadow' } },
  { why: { ru: 'Иглу начало таять и стало опасным. Построим тёплый домик для полярников.', en: 'The igloo is melting and unsafe. We will build a warm hut for the explorers.' }, next: { ru: 'Тёплый домик', en: 'A warm hut' } },
  { why: { ru: 'Старый маяк заменили новым, автоматическим. Этот можно разобрать.', en: 'The old lighthouse was replaced by an automatic one. This one can go.' }, next: { ru: 'Смотровая площадка', en: 'A lookout deck' } },
  { why: { ru: 'Пустой корабль вмёрз в лёд сто лет назад. Разберите его, доски пойдут на причал.', en: 'This empty ship froze in a century ago. Its planks will build a new pier.' }, next: { ru: 'Новый причал', en: 'A new pier' } },
  { why: { ru: 'Ледяная скульптура с прошлого фестиваля треснула. Освободите место для новой.', en: 'Last festival\'s ice sculpture cracked. Make room for a new one.' }, next: { ru: 'Новая скульптура', en: 'A new sculpture' } },
  { why: { ru: 'Ледяной замок с зимнего праздника. Праздник прошёл, разберите его до весны!', en: 'The ice castle from the winter fair. The fair is over, take it down before spring!' }, next: { ru: 'Каток', en: 'An ice rink' } },
  // moon
  { why: { ru: 'Глорп купил новый луноход. Старый сломан, помогите его разобрать!', en: 'Glorp bought a new rover. The old one is broken, help take it apart!' }, next: { ru: 'Гараж для лунохода', en: 'A rover garage' } },
  { why: { ru: 'Эта ракета-макет из музея не летает. Освободите стартовую площадку для настоящей!', en: 'This museum mock rocket cannot fly. Clear the launch pad for a real one!' }, next: { ru: 'Стартовая площадка', en: 'A launch pad' } },
  { why: { ru: 'Старый робот-уборщик сломался. Разберите его, детали пойдут на нового.', en: 'The old cleaning robot broke down. Its parts will build a new one.' }, next: { ru: 'Новый робот-помощник', en: 'A new helper robot' } },
  { why: { ru: 'Антенна больше не ловит сигнал. Поставим на её место телескоп!', en: 'The antenna lost its signal for good. A telescope goes here!' }, next: { ru: 'Телескоп', en: 'A telescope' } },
  { why: { ru: 'Это мой старый НЛО. Я переезжаю, а он не заводится. Поможете?', en: 'This is my old UFO. I am moving and it will not start. Can you help?' }, next: { ru: 'Лунный сад', en: 'A moon garden' } },
  { why: { ru: 'Старая база пришельцев опустела, все переехали в новую. Разберите её, тут будет лунный парк!', en: 'The old alien base is empty, everyone moved out. Take it down, a moon park goes here!' }, next: { ru: 'Лунный парк развлечений', en: 'A moon amusement park' } },
];
