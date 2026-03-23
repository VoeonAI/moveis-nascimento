import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Image as ImageIcon, 
  LayoutTemplate, 
  Megaphone, 
  Users, 
  Settings as SettingsIcon,
  ArrowRight,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Site = () => {
  const siteSections = [
    {
      id: 'hero',
      title: 'Banner Principal',
      description: 'Configure o banner principal da página inicial com título, destaque e imagem.',
      icon: LayoutTemplate,
      status: 'Disponível',
      statusColor: 'text-green-600',
      link: '/app/site/hero',
    },
    {
      id: 'ambiences',
      title: 'Ambientes',
      description: 'Gerencie os ambientes inspiracionais exibidos na página inicial.',
      icon: ImageIcon,
      status: 'Disponível',
      statusColor: 'text-green-600',
      link: '/app/site/ambiences',
    },
    {
      id: 'promo',
      title: 'Banner Promocional',
      description: 'Configure banners promocionais com imagem e texto.',
      icon: Megaphone,
      status: 'Disponível',
      statusColor: 'text-green-600',
      link: '/app/site/promo',
    },
    {
      id: 'montadores',
      title: 'Montadores',
      description: 'Cadastre e gerencie os montadores de móveis.',
      icon: Users,
      status: 'Em breve',
      statusColor: 'text-orange-600',
      link: null,
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestão de Conteúdo do Site</h1>
        <p className="text-gray-600 mt-2">
          Configure banners, ambientes e conteúdo visual da página inicial.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {siteSections.map((section) => (
          <Card key={section.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <section.icon size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{section.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {section.description}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${section.statusColor}`}>
                    {section.status}
                  </span>
                  {section.status === 'Em breve' && (
                    <Clock size={14} className="text-orange-600" />
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {section.link ? (
                <Link to={section.link}>
                  <Button className="w-full" variant="outline">
                    Configurar
                    <ArrowRight size={16} className="ml-2" />
                  </Button>
                </Link>
              ) : (
                <Button className="w-full" variant="secondary" disabled>
                  <Clock size={16} className="m-2" />
                  Em breve
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Card */}
      <Card className="mt-8 bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <SettingsIcon size={20 className="text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">Configurações Técnicas</h3>
              <p className="text-sm text-blue-700 mt-1">
                Para webhooks, APIs, logs e integrações, acesse a aba <Link to="/app/settings" className="underline hover:text-blue-800">Configurações</Link>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Site;