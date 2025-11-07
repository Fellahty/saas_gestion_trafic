'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/firebase.config';
import { User, UserRole } from '@/lib/types';
import { Users, Shield, Mail, User as UserIcon, Plus, Edit2, Trash2, Building2 } from 'lucide-react';

interface CompanySettings {
  nom: string;
  description: string;
  pays: string;
  email: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
  codePostal?: string;
}

export default function ParametresPage() {
  const [user] = useAuthState(auth);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'profile' | 'entreprise'>('users');
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    nom: 'FleetManager',
    description: 'Gestion de flotte professionnelle',
    pays: 'Maroc',
    email: 'contact@fleetmanager.ma',
  });
  const [loadingCompany, setLoadingCompany] = useState(false);

  useEffect(() => {
    loadData();
    loadCompanySettings();
  }, []);

  const loadData = async () => {
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      setUsers(usersSnap.docs.map(doc => {
        const data = doc.data();
        // Convert Firestore Timestamp to JavaScript Date
        const convertDate = (dateValue: any): Date => {
          if (!dateValue) return new Date();
          if (dateValue instanceof Timestamp) {
            return dateValue.toDate();
          }
          if (dateValue instanceof Date) {
            return isNaN(dateValue.getTime()) ? new Date() : dateValue;
          }
          const dateObj = new Date(dateValue);
          return isNaN(dateObj.getTime()) ? new Date() : dateObj;
        };
        
        return {
          id: doc.id,
          ...data,
          createdAt: convertDate(data.createdAt),
        } as User;
      }));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
      });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Erreur lors de la mise à jour du rôle');
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setShowUserForm(true);
  };

  const handleEditUser = (userToEdit: User) => {
    setEditingUser(userToEdit);
    setShowUserForm(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }

    try {
      const token = await user?.getIdToken();
      if (!token) {
        alert('Erreur d\'authentification');
        return;
      }

      const response = await fetch(`/api/users?userId=${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      setUsers(users.filter(u => u.id !== userId));
      alert('Utilisateur supprimé avec succès');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert(error.message || 'Erreur lors de la suppression de l\'utilisateur');
    }
  };

  const handleUserFormSuccess = () => {
    setShowUserForm(false);
    setEditingUser(null);
    loadData();
  };

  const loadCompanySettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'company'));
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        setCompanySettings({
          nom: data.nom || 'FleetManager',
          description: data.description || 'Gestion de flotte professionnelle',
          pays: data.pays || 'Maroc',
          email: data.email || 'contact@fleetmanager.ma',
          telephone: data.telephone || '',
          adresse: data.adresse || '',
          ville: data.ville || '',
          codePostal: data.codePostal || '',
        });
      }
    } catch (error) {
      console.error('Error loading company settings:', error);
    }
  };

  const handleSaveCompanySettings = async (settings: CompanySettings) => {
    setLoadingCompany(true);
    try {
      const settingsRef = doc(db, 'settings', 'company');
      const settingsDoc = await getDoc(settingsRef);
      
      if (settingsDoc.exists()) {
        await updateDoc(settingsRef, {
          ...settings,
          updatedAt: Timestamp.now(),
        });
      } else {
        // Create document if it doesn't exist
        await setDoc(settingsRef, {
          ...settings,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }
      setCompanySettings(settings);
      alert('Paramètres de l\'entreprise enregistrés avec succès!');
    } catch (error) {
      console.error('Error saving company settings:', error);
      alert('Erreur lors de l\'enregistrement des paramètres');
    } finally {
      setLoadingCompany(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const currentUser = users.find(u => u.id === user?.uid);

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-3 sm:space-y-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Gestion des utilisateurs et paramètres</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 sm:space-x-4 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 border-b-2 transition-colors text-xs sm:text-sm whitespace-nowrap ${
            activeTab === 'users'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users size={16} className="sm:w-[18px] sm:h-[18px]" />
          <span>Utilisateurs</span>
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 border-b-2 transition-colors text-xs sm:text-sm whitespace-nowrap ${
            activeTab === 'profile'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <UserIcon size={16} className="sm:w-[18px] sm:h-[18px]" />
          <span>Profil</span>
        </button>
        <button
          onClick={() => setActiveTab('entreprise')}
          className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 border-b-2 transition-colors text-xs sm:text-sm whitespace-nowrap ${
            activeTab === 'entreprise'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Building2 size={16} className="sm:w-[18px] sm:h-[18px]" />
          <span>Entreprise</span>
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {currentUser?.role === 'admin' && (
            <div className="flex justify-end">
              <button
                onClick={handleAddUser}
                className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus size={18} />
                <span>Ajouter un utilisateur</span>
              </button>
            </div>
          )}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nom
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rôle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date de création
                    </th>
                    {currentUser?.role === 'admin' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {u.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {u.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {currentUser?.role === 'admin' ? (
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                          className="px-2 py-1 text-xs font-semibold rounded-full border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="admin">Admin</option>
                          <option value="comptable">Comptable</option>
                          <option value="magasinier">Magasinier</option>
                          <option value="chauffeur">Chauffeur</option>
                        </select>
                      ) : (
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            u.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : u.role === 'comptable'
                              ? 'bg-blue-100 text-blue-800'
                              : u.role === 'magasinier'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {u.role === 'admin'
                            ? 'Admin'
                            : u.role === 'comptable'
                            ? 'Comptable'
                            : u.role === 'magasinier'
                            ? 'Magasinier'
                            : 'Chauffeur'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    {currentUser?.role === 'admin' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditUser(u)}
                            className="text-primary-600 hover:text-primary-900"
                            title="Modifier"
                          >
                            <Edit2 size={18} />
                          </button>
                          {u.id !== user?.uid && (
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Supprimer"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && currentUser && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="bg-primary-100 p-4 rounded-full">
                <UserIcon className="text-primary-600" size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{currentUser.name}</h2>
                <p className="text-gray-600">{currentUser.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Mail size={20} className="text-gray-600" />
                  <h3 className="font-medium text-gray-900">Email</h3>
                </div>
                <p className="text-gray-600">{currentUser.email}</p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield size={20} className="text-gray-600" />
                  <h3 className="font-medium text-gray-900">Rôle</h3>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    currentUser.role === 'admin'
                      ? 'bg-purple-100 text-purple-800'
                      : currentUser.role === 'comptable'
                      ? 'bg-blue-100 text-blue-800'
                      : currentUser.role === 'magasinier'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {currentUser.role === 'admin'
                    ? 'Admin'
                    : currentUser.role === 'comptable'
                    ? 'Comptable'
                    : currentUser.role === 'magasinier'
                    ? 'Magasinier'
                    : 'Chauffeur'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Entreprise Tab */}
      {activeTab === 'entreprise' && (
        <CompanySettingsForm
          settings={companySettings}
          onSave={handleSaveCompanySettings}
          loading={loadingCompany}
        />
      )}

      {/* User Form Modal */}
      {showUserForm && (
        <UserForm
          user={editingUser}
          onClose={() => {
            setShowUserForm(false);
            setEditingUser(null);
          }}
          onSuccess={handleUserFormSuccess}
        />
      )}
    </div>
  );
}

function UserForm({ user, onClose, onSuccess }: { user: User | null; onClose: () => void; onSuccess: () => void }) {
  const [userAuth] = useAuthState(auth);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'chauffeur' as UserRole,
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      role: user?.role || 'chauffeur' as UserRole,
      password: '',
    });
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = await userAuth?.getIdToken();
      if (!token) {
        throw new Error('Erreur d\'authentification');
      }

      if (user) {
        // Update existing user
        const updateData: any = {
          userId: user.id,
          name: formData.name,
          role: formData.role,
        };

        if (formData.email !== user.email) {
          updateData.email = formData.email;
        }

        if (formData.password) {
          updateData.password = formData.password;
        }

        const response = await fetch('/api/users', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(updateData),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Erreur lors de la mise à jour');
        }
      } else {
        // Create new user
        if (!formData.password) {
          throw new Error('Le mot de passe est requis pour créer un nouvel utilisateur');
        }

        const response = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            name: formData.name,
            role: formData.role,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Erreur lors de la création');
        }
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving user:', error);
      setError(error.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6 my-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {user ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
        </h2>
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="admin">Admin</option>
              <option value="comptable">Comptable</option>
              <option value="magasinier">Magasinier</option>
              <option value="chauffeur">Chauffeur</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe {user ? '(laisser vide pour ne pas modifier)' : ''}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!user}
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {user && (
              <p className="text-xs text-gray-500 mt-1">Laissez vide si vous ne souhaitez pas modifier le mot de passe</p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Enregistrement...' : user ? 'Modifier' : 'Créer'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CompanySettingsForm({ 
  settings, 
  onSave, 
  loading 
}: { 
  settings: CompanySettings; 
  onSave: (settings: CompanySettings) => void;
  loading: boolean;
}) {
  const [formData, setFormData] = useState<CompanySettings>(settings);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Building2 size={24} className="text-primary-600" />
          Informations de l'entreprise
        </h2>
        <p className="text-gray-600 mt-1 text-sm">
          Ces informations seront utilisées dans les factures PDF
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom de l'entreprise *
            </label>
            <input
              type="text"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Téléphone
            </label>
            <input
              type="tel"
              value={formData.telephone || ''}
              onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pays *
            </label>
            <input
              type="text"
              value={formData.pays}
              onChange={(e) => setFormData({ ...formData, pays: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adresse
            </label>
            <input
              type="text"
              value={formData.adresse || ''}
              onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ville
            </label>
            <input
              type="text"
              value={formData.ville || ''}
              onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Code postal
            </label>
            <input
              type="text"
              value={formData.codePostal || ''}
              onChange={(e) => setFormData({ ...formData, codePostal: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
}

