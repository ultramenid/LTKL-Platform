import { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import { COLORS } from '../../config/constants.js';

export default function ProfileNavBar({ tabs, activeTabId, activeSubId, onSelectTab }) {
  const navigationRef = useRef(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // Dropdown only opens via explicit click, so listeners attach only while open
  useEffect(() => {
    if (openDropdownId === null) return;
    function handleOutsidePress(event) {
      if (!navigationRef.current?.contains(event.target)) setOpenDropdownId(null);
    }
    function handleEscape(event) {
      if (event.key === 'Escape') setOpenDropdownId(null);
    }
    document.addEventListener('pointerdown', handleOutsidePress);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('pointerdown', handleOutsidePress);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [openDropdownId]);

  const handleSelectTab = useCallback(
    (tabId, subId = null) => {
      setOpenDropdownId(null);
      onSelectTab(tabId, subId);
    },
    [onSelectTab],
  );

  return (
    <div ref={navigationRef} className="sticky top-0 z-30 bg-coffee-900 shadow-md">
      <nav aria-label="Navigasi profil kabupaten" className="border-t border-white/10">
        <div className="max-w-5xl mx-auto flex flex-wrap">
          {tabs.map((tab) => {
            const isActive = activeTabId === tab.id;
            const isOpen = openDropdownId === tab.id;
            const hasChildren = Boolean(tab.children);
            return (
              <div key={tab.id} className="relative flex-1 min-w-max">
                <button
                  type="button"
                  aria-current={isActive ? 'page' : undefined}
                  aria-haspopup={hasChildren ? 'menu' : undefined}
                  aria-expanded={hasChildren ? isOpen : undefined}
                  onClick={() =>
                    hasChildren
                      ? setOpenDropdownId(isOpen ? null : tab.id)
                      : handleSelectTab(tab.id)
                  }
                  className={`relative cursor-pointer w-full py-3.5 px-4 text-[13px] font-semibold uppercase tracking-wider transition-colors whitespace-nowrap inline-flex items-center justify-center gap-1.5 ${
                    isActive || isOpen
                      ? 'text-parchment-50'
                      : 'text-parchment-200/40 hover:text-parchment-200/80'
                  }`}
                >
                  {tab.label}
                  {hasChildren && (
                    <ChevronDown
                      size={13}
                      aria-hidden="true"
                      className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  )}
                  {isActive && (
                    <span
                      className="absolute inset-x-3 bottom-0 h-[3px]"
                      style={{ backgroundColor: COLORS.PRIMARY }}
                      aria-hidden="true"
                    />
                  )}
                </button>

                {hasChildren && isOpen && (
                  <div
                    role="menu"
                    aria-label={`Sub-bagian ${tab.label}`}
                    className="atlas-drop absolute top-full left-0 w-56 z-10 border border-coffee-900/20 border-t-2 shadow-lg"
                    style={{ borderTopColor: COLORS.PRIMARY }}
                  >
                    <div className="paper-grain bg-parchment-100 py-1.5">
                      {tab.children.map((child) => {
                        const isActiveChild = isActive && activeSubId === child.id;
                        return (
                          <button
                            key={child.id}
                            type="button"
                            role="menuitem"
                            onClick={() => handleSelectTab(tab.id, child.id)}
                            className={`cursor-pointer block w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-parchment-200/70 ${
                              isActiveChild
                                ? 'font-bold text-coffee-900'
                                : 'font-medium text-coffee-600'
                            }`}
                          >
                            <span className="flex items-center justify-between gap-2">
                              {child.label}
                              {isActiveChild && (
                                <span
                                  className="w-1.5 h-1.5 rounded-full shrink-0"
                                  style={{ backgroundColor: COLORS.PRIMARY }}
                                  aria-hidden="true"
                                />
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
