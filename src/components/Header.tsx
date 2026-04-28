import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, Heart, MessageSquare, PlusSquare, Menu, LogOut, ShieldCheck, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Header = () => {
  const { user, profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 transition-colors">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl group-hover:bg-blue-700 transition-colors">
            ВР
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block">ВРуки</span>
        </Link>

        <div className="flex-1 max-w-xl mx-8 hidden md:block">
          <div className="relative">
            <input
              type="text"
              placeholder="Поиск объявлений..."
              className="w-full bg-gray-100 dark:bg-gray-800 dark:text-white border-none rounded-full py-2 pl-10 pr-4 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700 transition-all outline-none"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button 
            onClick={toggleTheme}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            title={theme === 'light' ? 'Включить темную тему' : 'Включить светлую тему'}
          >
            {theme === 'light' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
          </button>
          {user ? (
            <>
              <Link to="/favorites" className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors relative">
                <Heart className="w-6 h-6" />
              </Link>
              <Link to="/messages" className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                <MessageSquare className="w-6 h-6" />
              </Link>
              <div className="relative group">
                <button className="flex items-center gap-2 p-1 hover:bg-gray-100 rounded-lg transition-colors">
                  <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <User className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                </button>
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all py-2 z-50">
                  <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">Мой профиль</Link>
                  <Link to="/my-listings" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">Мои объявления</Link>
                  {profile?.role === 'admin' && (
                    <Link to="/admin" className="block px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 font-medium flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      Админка
                    </Link>
                  )}
                  <hr className="my-1 border-gray-100 dark:border-gray-700" />
                  <button onClick={() => signOut()} className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2">
                    <LogOut className="w-4 h-4" />
                    Выйти
                  </button>
                </div>
              </div>
              {profile?.role === 'admin' && (
                <Link to="/admin" className="hidden lg:flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors font-bold shadow-sm shadow-amber-200">
                  <ShieldCheck className="w-5 h-5" />
                  Админка
                </Link>
              )}
              <Link to="/listings/new" className="hidden sm:flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                <PlusSquare className="w-5 h-5" />
                Разместить
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-600 dark:text-gray-400 font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Вход</Link>
              <Link to="/register" className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap">Подать объявление</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
