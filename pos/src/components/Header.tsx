import { useState, useEffect, useRef } from 'react';
import { t } from '../i18n';
import { Link, useLocation } from 'react-router-dom';
import { 
  Command,
  User,
  ChevronDown,
  Monitor,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { Button, Input } from './ui';
import { useRootStore } from '../store/root-store';
import { usePOSStore } from '../store/pos-store';
import type { RootState } from '../store/root-store';
import { logout } from '../lib/auth-api';
import { showToast } from './ui/toast';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
  title?: string;
  hideSearch?: boolean;
  showUserMenu?: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  title, 
  hideSearch = false, 
  showUserMenu: showUserMenuProp = true 
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const user = useRootStore((state: RootState) => state.user);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const { searchQuery, setSearchQuery } = usePOSStore();
  const { orderSearchQuery, setOrderSearchQuery } = useRootStore();
  const [orderSearchInput, setOrderSearchInput] = useState(orderSearchQuery);

  // Determine placeholder and handlers based on route
  let searchPlaceholder = t('header.search_placeholder_default');
  let searchValue: string | undefined = undefined;
  let searchOnChange: ((e: React.ChangeEvent<HTMLInputElement>) => void) | undefined = undefined;

  if (location.pathname === '/orders') {
    searchPlaceholder = t('header.search_placeholder_orders');
    searchValue = orderSearchInput;
    searchOnChange = (e) => setOrderSearchInput(e.target.value);
  } else if (location.pathname === '/') {
    searchPlaceholder = t('header.search_placeholder_menu');
    searchValue = searchQuery;
    searchOnChange = (e) => setSearchQuery(e.target.value);
  }

  // Debounce order search
  useEffect(() => {
    if (location.pathname !== '/orders') return;
    const handler = setTimeout(() => {
      setOrderSearchQuery(orderSearchInput);
    }, 300);
    return () => clearTimeout(handler);
  }, [orderSearchInput, setOrderSearchQuery, location.pathname]);

  // Keep input in sync with store (if cleared elsewhere)
  useEffect(() => {
    if (location.pathname === '/orders') {
      setOrderSearchInput(orderSearchQuery);
    }
  }, [location.pathname, orderSearchQuery]);

  // Handle clicks outside of menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleUserMenuToggle = () => {
    setShowUserMenu(!showUserMenu);
  };

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login?redirect-to=%2Fpos';
    } catch (error) {
      showToast.error(t('errors.failed_logout'));
    }
  };

  const handleClearCache = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Logo & Title */}
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-3">
            <img 
              src="/assets/ury/pos/ury_pos.png" 
              alt="URY POS" 
              className="h-10 w-auto"
            />
          </Link>
          {title && (
            <div className="flex items-center gap-3 border-l border-gray-200 ps-4">
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h1>
            </div>
          )}
        </div>

        {/* Search Bar - Hidden if hideSearch is true */}
        {!hideSearch && (
          <div className="px-4 py-2 flex-1 flex items-center max-w-2xl mx-8 bg-gray-50 hover:bg-gray-100 border border-input rounded-md transition-colors">
            <Input
              ref={searchInputRef}
              placeholder={searchPlaceholder}
              className="h-fit p-0 w-full bg-transparent border-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
              value={searchValue}
              onChange={searchOnChange}
            />
            <div className="flex items-center gap-2 text-gray-400">
              <Command className="w-4 h-4" />
              <span className="text-[10px] font-bold">K</span>
            </div>
          </div>
        )}

        {/* Right side actions */}
        <div className="flex items-center gap-4">
          {showUserMenuProp && (
            <div className="relative" ref={userMenuRef}>
              <Button
                onClick={handleUserMenuToggle}
                variant="ghost"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 h-10 px-3"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-sm">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold">{user?.full_name || 'User'}</span>
                <ChevronDown className={cn("w-4 h-4 transition-transform", showUserMenu && "rotate-180")} />
              </Button>

              {/* User dropdown */}
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute end-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden"
                  >
                    <div className="p-4 bg-gray-50/50 border-b border-gray-200">
                      <p className="text-sm font-bold text-gray-900">{user?.full_name || 'User'}</p>
                      <p className="text-xs font-medium text-gray-500 mt-0.5 truncate">{user?.name || ''}</p>
                    </div>
                    <div className="p-1.5">
                      <Button
                        variant="ghost"
                        className="flex justify-start items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors gap-3 h-10"
                        onClick={() => window.location.href = '/app'}
                      >
                        <Monitor className="w-4 h-4" />
                        {t('header.switch_to_desk')}
                      </Button>
                      <Button
                        variant="ghost"
                        className="flex justify-start items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors gap-3 h-10"
                        onClick={handleClearCache}
                      >
                        <RefreshCw className="w-4 h-4" />
                        {t('header.clear_cache')}
                      </Button>
                      <div className="h-px bg-gray-100 my-1.5 mx-1" />
                      <Button
                        variant="ghost"
                        className="flex justify-start items-center w-full px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors gap-3 h-10"
                        onClick={handleLogout}
                      >
                        <LogOut className="w-4 h-4" />
                        {t('header.logout')}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 