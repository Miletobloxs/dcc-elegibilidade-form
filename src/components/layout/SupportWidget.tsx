"use client";

import { useState, useRef, useEffect } from "react";
import { HelpCircle, MessageSquare, X } from "lucide-react";

export default function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Fecha o menu se clicar fora dele
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={widgetRef} className="fixed bottom-6 right-6 z-50">
      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Central de Ajuda</h3>
              <p className="text-xs text-gray-500 mt-0.5">Suporte e Triagem da Originação</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-50"
            >
              <X size={15} />
            </button>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-gray-600 leading-relaxed">
              Tem alguma dúvida sobre o preenchimento de deals, cadastro de originador ou precisa de suporte técnico? Converse direto com o nosso time de Triagem.
            </p>

            <a
              href="https://wa.me/5511952139707"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2.5 px-4 rounded-xl transition-all shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/20"
            >
              {/* SVG do ícone do WhatsApp */}
              <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.528 2.028 14.07 1.001 11.5 1c-5.44 0-9.866 4.372-9.87 9.802 0 1.714.463 3.39 1.337 4.888l-1.008 3.682 3.768-.989zM17.487 14.39c-.314-.157-1.858-.917-2.143-1.02-.284-.103-.49-.157-.696.157-.206.314-.796.997-.975 1.201-.18.205-.359.231-.673.074-1.922-.964-3.155-2.01-4.225-3.856-.283-.489.283-.453.812-1.512.088-.176.044-.33-.022-.462-.066-.133-.568-1.368-.779-1.879-.206-.499-.44-.43-.604-.438l-.515-.009c-.18 0-.474.067-.722.34-.247.272-.942.921-.942 2.246 0 1.325.964 2.602 1.098 2.781.134.18 1.9 2.901 4.6 4.068.643.278 1.144.444 1.534.569.646.205 1.233.176 1.697.107.518-.078 1.587-.648 1.81-1.272.224-.624.224-1.159.157-1.272-.069-.114-.275-.172-.59-.33z" />
              </svg>
              Falar no WhatsApp
            </a>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 border ${
          isOpen
            ? "bg-gray-900 text-white border-gray-900 rotate-90"
            : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95 shadow-blue-600/20"
        }`}
      >
        {isOpen ? <X size={20} /> : <HelpCircle size={20} />}
      </button>
    </div>
  );
}
