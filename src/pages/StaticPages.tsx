import React from 'react';

interface StaticPageProps {
  title: string;
  children: React.ReactNode;
}

const StaticPageLayout: React.FC<StaticPageProps> = ({ title, children }) => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl min-h-[70vh]">
      <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-8 border-b-4 border-blue-600 pb-4 inline-block">
        {title}
      </h1>
      <div className="prose prose-lg dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed">
        {children}
      </div>
    </div>
  );
};

export const About = () => (
  <StaticPageLayout title="О проекте ВРуки">
    <p><strong>ВРуки (v-ruki.ru)</strong> — это современная и простая доска объявлений, созданная для людей.</p>
    <p>Наша миссия — сделать процесс покупки и продажи вещей максимально быстрым и безопасным, без лишних посредников и скрытых комиссий.</p>
    <h3>Почему выбирают нас?</h3>
    <ul>
      <li>Бесплатное размещение для частных лиц.</li>
      <li>Удобный поиск по карте вашего района.</li>
      <li>Простая модерация и защита от спама.</li>
    </ul>
  </StaticPageLayout>
);

export const Contacts = () => (
  <StaticPageLayout title="Контакты">
    <p>Мы всегда на связи и готовы помочь вам!</p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
      <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800">
        <h4 className="font-bold mb-2 text-blue-600">Поддержка</h4>
        <p>Email: support@v-ruki.ru</p>
        <p>Режим работы: 24/7</p>
      </div>
      <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800">
        <h4 className="font-bold mb-2 text-blue-600">Для СМИ и бизнеса</h4>
        <p>Email: pr@v-ruki.ru</p>
      </div>
    </div>
  </StaticPageLayout>
);

export const Rules = () => (
  <StaticPageLayout title="Правила размещения">
    <p>Чтобы ваше объявление быстро прошло модерацию, соблюдайте эти простые правила:</p>
    <ol>
      <li><strong>Честность:</strong> Описывайте товар реально, указывайте на недостатки.</li>
      <li><strong>Фотографии:</strong> Используйте только свои фото. Скриншоты и картинки из интернета запрещены.</li>
      <li><strong>Запрещенные товары:</strong> Мы не публикуем объявления о продаже оружия, наркотиков, табака и алкоголя.</li>
      <li><strong>Дубли:</strong> Не создавайте несколько одинаковых объявлений.</li>
    </ol>
  </StaticPageLayout>
);

export const HowToBuy = () => (
  <StaticPageLayout title="Как покупать">
    <h3>Процесс покупки на ВРуки:</h3>
    <ol>
      <li>Найдите нужный товар через поиск или на карте.</li>
      <li>Свяжитесь с продавцом через чат или по телефону.</li>
      <li>Договоритесь о встрече в людном месте.</li>
      <li>Проверьте товар и оплатите его удобным способом.</li>
    </ol>
    <p>Помните: ВРуки не является посредником в сделках. Будьте бдительны!</p>
  </StaticPageLayout>
);

export const Safety = () => (
  <StaticPageLayout title="Безопасность">
    <p>Ваша безопасность — наш приоритет.</p>
    <ul>
      <li>Никогда не переводите предоплату за товар.</li>
      <li>Встречайтесь в светлое время суток и в людных местах.</li>
      <li>Не сообщайте CVV-коды карт и коды из СМС.</li>
      <li>Если продавец кажется подозрительным — нажмите кнопку «Пожаловаться».</li>
    </ul>
  </StaticPageLayout>
);

export const Help = () => (
  <StaticPageLayout title="Помощь">
    <p>Часто задаваемые вопросы:</p>
    <details className="mb-4 p-4 border rounded-2xl dark:border-gray-800">
      <summary className="font-bold cursor-pointer">Как поднять объявление?</summary>
      <p className="mt-2 text-sm">В текущей версии v1.0 функция авто-подъема находится в разработке. Вы можете обновить описание товара.</p>
    </details>
    <details className="mb-4 p-4 border rounded-2xl dark:border-gray-800">
      <summary className="font-bold cursor-pointer">Сколько стоит размещение?</summary>
      <p className="mt-2 text-sm">Для частных лиц — бесплатно до 20 объявлений.</p>
    </details>
  </StaticPageLayout>
);

export const Pro = () => (
  <StaticPageLayout title="Бизнес-аккаунт">
    <p>Расширьте возможности вашего бизнеса на ВРуки.</p>
    <div className="p-8 bg-blue-600 text-white rounded-3xl mt-6">
      <h3 className="text-white mb-4 font-bold">Тариф «Профессионал»</h3>
      <ul className="mb-6 space-y-2 opacity-90">
        <li>— Неограниченное количество объявлений</li>
        <li>— Значок проверенного продавца</li>
        <li>— Приоритет в поисковой выдаче</li>
      </ul>
      <button className="bg-white text-blue-600 px-6 py-2 rounded-xl font-bold">Оставить заявку</button>
    </div>
  </StaticPageLayout>
);

export const Tariffs = () => (
  <StaticPageLayout title="Тарифы">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="p-6 border dark:border-gray-800 rounded-3xl">
        <h3 className="font-black text-2xl mb-2">Стандарт</h3>
        <p className="text-3xl font-bold text-blue-600 mb-4">0 ₽</p>
        <p className="text-sm opacity-70 italic">Для личных вещей и редких продаж.</p>
      </div>
      <div className="p-6 border-2 border-blue-600 rounded-3xl relative">
        <span className="absolute -top-3 right-6 bg-blue-600 text-white text-[10px] px-3 py-1 rounded-full uppercase font-black">Скоро</span>
        <h3 className="font-black text-2xl mb-2">Магазин</h3>
        <p className="text-3xl font-bold text-blue-600 mb-4">от 1990 ₽</p>
        <p className="text-sm opacity-70 italic">Для малого и среднего бизнеса.</p>
      </div>
    </div>
  </StaticPageLayout>
);

export const Privacy = () => (
  <StaticPageLayout title="Политика конфиденциальности">
    <p>Мы уважаем вашу приватность.</p>
    <p>Сайт v-ruki.ru собирает только минимально необходимые данные для работы сервиса:</p>
    <ul>
      <li>Ваш email для авторизации.</li>
      <li>Номер телефона (по вашему желанию) для связи.</li>
      <li>Геолокацию (только с вашего разрешения) для поиска рядом.</li>
    </ul>
    <p>Мы не передаем ваши данные третьим лицам без вашего согласия.</p>
  </StaticPageLayout>
);

export const Terms = () => (
  <StaticPageLayout title="Пользовательское соглашение">
    <p>Используя сайт v-ruki.ru, вы соглашаетесь с тем, что:</p>
    <ul>
      <li>Вы несете полную ответственность за содержание ваших объявлений.</li>
      <li>Сервис ВРуки не является участником сделок.</li>
      <li>Администрация имеет право заблокировать аккаунт за нарушение правил.</li>
    </ul>
  </StaticPageLayout>
);

export const CookiesPolicy = () => (
  <StaticPageLayout title="Политика Cookies">
    <p>Мы используем файлы cookies, чтобы сайт работал быстрее и удобнее.</p>
    <p>Cookies помогают нам запомнить ваш город и выбранную тему оформления.</p>
    <p>Вы можете отключить использование cookies в настройках вашего браузера.</p>
  </StaticPageLayout>
);
