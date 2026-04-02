import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/core/supabaseClient';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);
    
    if (error) {
      alert(error.message);
    } else {
      navigate('/app/pipeline');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="https://kbpkdnptzvsvoujirfwe.supabase.co/storage/v1/object/public/logo-variacoes/Moveis-nascimento---logo-site.png"
            alt="Móveis Nascimento"
            className="h-20 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-gray-900">Acesso Interno</h1>
          <p className="text-gray-600 mt-2">Entre para acessar o sistema</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="border-gray-300 focus:border-green-500 focus:ring-green-500"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-700">Senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="border-gray-300 focus:border-green-500 focus:ring-green-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 font-semibold"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;