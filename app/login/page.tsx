'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase.config';
import Image from 'next/image';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, Loader2, Truck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        router.push('/dashboard');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create user document in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          name: name || 'Utilisateur',
          role: 'admin', // First user is admin
          createdAt: new Date(),
        });

        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      let errorMessage = 'Une erreur est survenue';
      
      // User-friendly error messages (WCAG 2.1: Error Identification)
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Aucun compte trouvé avec cet email';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Mot de passe incorrect';
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Cet email est déjà utilisé';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Adresse email invalide';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 md:p-6 relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/truck.webp"
          alt="Background"
          fill
          priority
          className="object-cover scale-105 transition-transform duration-700 ease-out"
          quality={90}
        />
        {/* Enhanced dark overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 via-blue-900/80 to-slate-800/85"></div>
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/25 via-transparent to-blue-800/25 animate-pulse"></div>
        {/* Subtle light rays effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/5"></div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center animate-fade-in">
        <div className="bg-white/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] border border-white/40 p-6 sm:p-8 md:p-10 backdrop-saturate-150 w-full transition-all duration-300 hover:shadow-[0_12px_40px_0_rgba(0,0,0,0.45)]">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8 sm:mb-10">
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 bg-gradient-to-br from-primary-600 via-primary-700 to-blue-700 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-[0_8px_24px_rgba(59,130,246,0.4)] flex items-center justify-center mb-4 sm:mb-5 transition-all duration-300 hover:scale-105 hover:shadow-[0_12px_32px_rgba(59,130,246,0.5)]">
              {!logoError ? (
                <Image
                  src="/images/logo_w.png"
                  alt="FleetManager Logo"
                  width={128}
                  height={128}
                  className="brightness-0 invert w-full h-full object-contain"
                  priority
                  onError={() => setLogoError(true)}
                />
              ) : (
                <Truck className="w-14 h-14 sm:w-20 sm:h-20 text-white" />
              )}
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-center mb-3 bg-gradient-to-r from-primary-600 via-blue-600 to-primary-600 bg-clip-text text-transparent tracking-tight">
            {isLogin ? 'Connexion' : 'Créer un compte'}
          </h1>
          <p className="text-center text-gray-600 mb-8 sm:mb-10 text-sm sm:text-base font-medium">
            {isLogin ? 'Accédez à votre tableau de bord' : 'Créez votre compte administrateur'}
          </p>

          {/* Error Message */}
          {error && (
            <div
              role="alert"
              aria-live="polite"
              className="mb-6 p-4 bg-gradient-to-r from-red-50 to-red-100/50 border-l-4 border-red-500 rounded-lg flex items-start gap-3 shadow-sm animate-fade-in"
            >
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-red-800 font-medium">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2.5">
                  Nom complet
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary-600">
                    <User className="h-5 w-5 text-gray-400 group-focus-within:text-primary-600 transition-colors" aria-hidden="true" />
                  </div>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 text-base bg-white/80 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 hover:border-gray-300 hover:bg-white/90 placeholder:text-gray-400"
                    placeholder="Votre nom"
                    autoComplete="name"
                    aria-required="true"
                    aria-invalid={error ? 'true' : 'false'}
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2.5">
                Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary-600">
                  <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-primary-600 transition-colors" aria-hidden="true" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 text-base bg-white/80 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 hover:border-gray-300 hover:bg-white/90 placeholder:text-gray-400"
                  placeholder="votre@email.com"
                  autoComplete="email"
                  required
                  aria-required="true"
                  aria-invalid={error ? 'true' : 'false'}
                  aria-describedby={error ? 'email-error' : undefined}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2.5">
                Mot de passe
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary-600">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-primary-600 transition-colors" aria-hidden="true" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-14 py-3.5 text-base bg-white/80 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 hover:border-gray-300 hover:bg-white/90 placeholder:text-gray-400"
                  placeholder="••••••••"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  required
                  aria-required="true"
                  aria-invalid={error ? 'true' : 'false'}
                  aria-describedby={error ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-xl transition-colors hover:text-gray-700"
                  aria-label={showPassword ? 'Cacher le mot de passe' : 'Afficher le mot de passe'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-600 via-blue-600 to-primary-600 text-white py-4 rounded-xl font-semibold text-base shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus:ring-4 focus:ring-primary-500/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg flex items-center justify-center gap-2.5 relative overflow-hidden group"
              aria-busy={loading}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin relative z-10" aria-hidden="true" />
                  <span className="relative z-10">Chargement...</span>
                </>
              ) : (
                <span className="relative z-10">{isLogin ? 'Se connecter' : 'Créer le compte'}</span>
              )}
            </button>
          </form>

          {/* Toggle Login/Signup */}
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setEmail('');
                setPassword('');
                setName('');
              }}
              className="text-sm text-primary-600 hover:text-primary-700 font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg px-3 py-2 transition-colors duration-200 hover:bg-primary-50"
              aria-label={isLogin ? 'Passer à la création de compte' : 'Passer à la connexion'}
            >
              {isLogin ? 'Pas encore de compte ? Créer un compte' : 'Déjà un compte ? Se connecter'}
            </button>
          </div>

          {!isLogin && (
            <p className="mt-4 text-xs text-center text-gray-500 px-2 font-medium">
              Le premier compte créé sera automatiquement administrateur
            </p>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-white/95 text-xs sm:text-sm mt-8 sm:mt-10 font-medium backdrop-blur-md bg-white/10 rounded-full px-6 py-3 border border-white/20 shadow-lg" suppressHydrationWarning>
          © {currentYear || 2024} FleetManager. Tous droits réservés.
        </p>
      </div>
    </div>
  );
}
