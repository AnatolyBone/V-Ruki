import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pt-12 pb-8 transition-colors">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">ВРуки (v-ruki.ru)</h3>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">О проекте</Link></li>
              <li><Link to="/contacts" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Контакты</Link></li>
              <li><Link to="/rules" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Правила</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Покупателям</h3>
            <ul className="space-y-2">
              <li><Link to="/how-to-buy" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Как покупать</Link></li>
              <li><Link to="/safety" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Безопасность</Link></li>
              <li><Link to="/help" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Помощь</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Продавцам</h3>
            <ul className="space-y-2">
              <li><Link to="/listings/new" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Подать объявление</Link></li>
              <li><Link to="/pro" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Бизнес-аккаунт</Link></li>
              <li><Link to="/tariffs" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Тарифы</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Правовая информация</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Политика конфиденциальности</Link></li>
              <li><Link to="/terms" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Пользовательское соглашение</Link></li>
              <li><Link to="/cookies" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Политика Cookies</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            © {new Date().getFullYear()} ВРуки. v-ruki.ru. Все права защищены.
          </p>
          <div className="flex gap-6">
            <span className="text-gray-400 text-sm hover:text-gray-600 cursor-pointer">VK</span>
            <span className="text-gray-400 text-sm hover:text-gray-600 cursor-pointer">Telegram</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
