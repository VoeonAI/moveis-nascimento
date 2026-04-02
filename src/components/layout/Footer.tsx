import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Mail, MapPin, Phone } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Logo e Texto Institucional */}
          <div>
            <div className="mb-4">
              <img
                src="https://kbpkdnptzvsvoujirfwe.supabase.co/storage/v1/object/public/logo-variacoes/Moveis-nascimento---logo-site.png"
                alt="Móveis Nascimento"
                className="h-16 w-auto"
              />
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Transformando casas em lares com móveis planejados de alta qualidade. 
              Atendimento personalizado e entrega em toda região.
            </p>
          </div>

          {/* Links Rápidos */}
          <div>
            <h4 className="font-semibold mb-4 text-lg">Links Rápidos</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link to="/catalog" className="hover:text-green-400 transition-colors">Catálogo</Link></li>
              <li><Link to="/sobre" className="hover:text-green-400 transition-colors">Sobre Nós</Link></li>
              <li><Link to="/montadores" className="hover:text-green-400 transition-colors">Montadores</Link></li>
            </ul>
          </div>

          {/* Lojas */}
          <div>
            <h4 className="font-semibold mb-4 text-lg">Nossas Lojas</h4>
            <ul className="space-y-4 text-gray-400">
              <li>
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="mt-1 text-green-400 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-white">Joanópolis - SP</p>
                    <p className="text-sm">Av. Principal, 1234<br/>Centro - Joanópolis/SP</p>
                  </div>
                </div>
              </li>
              <li>
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="mt-1 text-green-400 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-white">Extrema - MG</p>
                    <p className="text-sm">Rua das Flores, 567<br/>Centro - Extrema/MG</p>
                  </div>
                </div>
              </li>
            </ul>
          </div>

          {/* Contato e Redes Sociais */}
          <div>
            <h4 className="font-semibold mb-4 text-lg">Contato</h4>
            <ul className="space-y-3 text-gray-400 mb-6">
              <li className="flex items-center gap-2">
                <Phone size={16} className="text-green-400" />
                <span>(11) 99999-9999</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={16} className="text-green-400" />
                <span>contato@moveisnascimento.com.br</span>
              </li>
            </ul>

            <h4 className="font-semibold mb-3 text-white">Redes Sociais</h4>
            <div className="flex gap-4">
              <a
                href="https://facebook.com/moveisnascimento"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-800 hover:bg-green-600 transition-colors p-2 rounded-full"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a
                href="https://instagram.com/moveisnascimento"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-800 hover:bg-green-600 transition-colors p-2 rounded-full"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-gray-400 text-sm">
            <p>© 2024 Móveis Nascimento. Todos os direitos reservados.</p>
            <a
              href="https://voeagencia.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-green-400 transition-colors"
            >
              Desenvolvido por Voe Agência
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;