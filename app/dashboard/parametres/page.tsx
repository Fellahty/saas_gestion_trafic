'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/firebase.config';
import { User, UserRole } from '@/lib/types';
import { Users, Shield, Mail, User as UserIcon } from 'lucide-react';

export default function ParametresPage() {
  const [user] = useAuthState(auth);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'profile'>('users');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      setUsers(usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
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
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
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
                  </tr>
                ))}
              </tbody>
            </table>
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
    </div>
  );
}

