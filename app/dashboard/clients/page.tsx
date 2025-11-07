'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase.config';
import { Client } from '@/lib/types';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Building,
  User,
  Filter,
  Sparkles,
  TrendingUp,
  CircleDollarSign,
  Users,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'entreprise' | 'particulier'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'balance'>('recent');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const clientsSnap = await getDocs(collection(db, 'clients'));
      setClients(clientsSnap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      } as Client)));
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const totalClients = clients.length;
    const totalSolde = clients.reduce((sum, client) => sum + (client.solde || 0), 0);
    const receivable = clients
      .filter(client => client.solde > 0)
      .reduce((sum, client) => sum + client.solde, 0);
    const payable = clients
      .filter(client => client.solde < 0)
      .reduce((sum, client) => sum + client.solde, 0);

    return {
      totalClients,
      totalSolde,
      receivable,
      payable,
      entreprises: clients.filter(client => client.type === 'entreprise').length,
      particuliers: clients.filter(client => client.type === 'particulier').length,
      updatedAt: clients.length
        ? clients
            .map(client => client.updatedAt)
            .filter(Boolean)
            .sort((a, b) => (b?.getTime?.() || 0) - (a?.getTime?.() || 0))[0] || new Date()
        : null,
    };
  }, [clients]);

  const highlightedClients = useMemo(() => {
    if (!clients.length) return [] as Client[];

    const sorted = [...clients]
      .filter(client => client.solde > 0)
      .sort((a, b) => b.solde - a.solde)
      .slice(0, 3);

    if (sorted.length === 0) {
      return [...clients].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 3);
    }

    return sorted;
  }, [clients]);

  const filteredClients = useMemo(() => {
    const searchFiltered = clients.filter(client =>
      client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.telephone?.includes(searchTerm)
    );

    const typeFiltered =
      activeFilter === 'all'
        ? searchFiltered
        : searchFiltered.filter(client => client.type === activeFilter);

    const sorted = [...typeFiltered];

    switch (sortBy) {
      case 'name':
        sorted.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
        break;
      case 'balance':
        sorted.sort((a, b) => b.solde - a.solde);
        break;
      default:
        sorted.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    }

    return sorted;
  }, [clients, searchTerm, activeFilter, sortBy]);

  const formatDate = (date?: Date | null) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  const handleDeleteClient = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      try {
        await deleteDoc(doc(db, 'clients', id));
        setClients(clients.filter(c => c.id !== id));
      } catch (error) {
        console.error('Error deleting client:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-600 via-primary-500 to-primary-400 text-white shadow-xl">
        <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.25) 0, rgba(255,255,255,0) 60%)' }} />
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center space-x-2 rounded-full bg-white/15 px-3 py-1 text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                <span>Vue 360° de votre portefeuille clients</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold leading-tight">Clients & Relations</h1>
              <p className="text-sm sm:text-base text-white/80">Suivez vos clients, anticipez les encaissements et priorisez vos relances grâce à un tableau clair et immersif.</p>
              {stats.updatedAt && (
                <p className="text-xs text-white/70">Dernière mise à jour : {formatDate(stats.updatedAt)}</p>
              )}
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="rounded-2xl bg-white/15 p-4 shadow-lg backdrop-blur -rotate-2">
                <div className="flex items-center justify-between text-sm text-white/70">
                  <span>Total clients</span>
                  <Users className="h-4 w-4" />
                </div>
                <p className="mt-2 text-3xl font-bold">{stats.totalClients}</p>
                <p className="mt-1 text-xs text-white/60">{stats.entreprises} entreprises · {stats.particuliers} particuliers</p>
              </div>
              <div className="rounded-2xl bg-white/15 p-4 shadow-lg backdrop-blur rotate-2">
                <div className="flex items-center justify-between text-sm text-white/70">
                  <span>Encours net</span>
                  <CircleDollarSign className="h-4 w-4" />
                </div>
                <p className="mt-2 text-3xl font-bold">{formatCurrency(stats.totalSolde)}</p>
                <p className="mt-1 text-xs text-white/60">{formatCurrency(stats.receivable)} à encaisser · {formatCurrency(Math.abs(stats.payable))} à rembourser</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Tableau clients</h2>
              <p className="text-sm text-gray-500">Filtrez, classez et agissez en un regard.</p>
            </div>
            <button
              onClick={() => {
                setSelectedClient(null);
                setShowForm(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-600 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-primary-500/30 transition hover:bg-primary-700"
            >
              <Plus size={16} />
              Nouveau client
            </button>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, email ou téléphone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-full border border-gray-200 bg-gray-50 pl-10 pr-4 py-2 text-sm transition focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600">
                  <Filter className="h-3.5 w-3.5" />
                  Filtres rapides
                </span>
                {[
                  { label: 'Tous', value: 'all' },
                  { label: 'Entreprises', value: 'entreprise' },
                  { label: 'Particuliers', value: 'particulier' },
                ].map(filter => (
                  <button
                    key={filter.value}
                    onClick={() => setActiveFilter(filter.value as typeof activeFilter)}
                    className={`rounded-full border px-4 py-1.5 text-xs font-medium transition ${
                      activeFilter === filter.value
                        ? 'border-primary-500 bg-primary-50 text-primary-600 shadow-sm'
                        : 'border-gray-200 bg-white text-gray-500 hover:border-primary-200 hover:text-primary-500'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
                <div className="ml-auto flex items-center gap-2 text-xs text-gray-500">
                  <span>Trier par</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-100"
                  >
                    <option value="recent">Dernières activités</option>
                    <option value="name">Nom A → Z</option>
                    <option value="balance">Solde décroissant</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50/60">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Client</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 hidden xl:table-cell">Contact</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 hidden lg:table-cell">Localisation</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Solde</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 hidden sm:table-cell">Statut</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {filteredClients.map(client => {
                      const isEntreprise = client.type === 'entreprise';
                      const positiveBalance = client.solde >= 0;
                      return (
                        <tr key={client.id} className="transition hover:bg-primary-50/30">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-11 w-11 items-center justify-center rounded-2xl border text-sm font-semibold shadow-inner ${
                                  isEntreprise
                                    ? 'border-blue-100 bg-blue-50 text-blue-600'
                                    : 'border-emerald-100 bg-emerald-50 text-emerald-600'
                                }`}
                              >
                                {isEntreprise ? <Building className="h-5 w-5" /> : <User className="h-5 w-5" />}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{client.nom}</p>
                                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                  <span className={`rounded-full px-2.5 py-1 font-medium ${
                                    isEntreprise
                                      ? 'bg-blue-50 text-blue-600'
                                      : 'bg-emerald-50 text-emerald-600'
                                  }`}>
                                    {isEntreprise ? 'Entreprise' : 'Particulier'}
                                  </span>
                                  {client.updatedAt && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1">
                                      <TrendingUp className="h-3.5 w-3.5 text-gray-400" />
                                      {formatDate(client.updatedAt)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="hidden px-4 py-4 text-sm text-gray-600 xl:table-cell">
                            <div className="space-y-1">
                              <p>{client.email || 'Email indisponible'}</p>
                              <p className="text-xs text-gray-400">{client.telephone || 'Téléphone non renseigné'}</p>
                            </div>
                          </td>
                          <td className="hidden px-4 py-4 text-sm text-gray-600 lg:table-cell">
                            {client.adresse ? (
                              <div className="space-y-1">
                                <p>{client.adresse}</p>
                                {(client.codePostal || client.ville) && (
                                  <p className="text-xs text-gray-400">
                                    {[client.codePostal, client.ville].filter(Boolean).join(' ')}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">Adresse non renseignée</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-sm font-semibold">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-1 ${
                                positiveBalance
                                  ? 'bg-emerald-50 text-emerald-600'
                                  : 'bg-rose-50 text-rose-600'
                              }`}
                            >
                              {formatCurrency(client.solde)}
                            </span>
                          </td>
                          <td className="hidden px-4 py-4 text-sm text-gray-600 sm:table-cell">
                            {client.notes ? (
                              <span className="line-clamp-2 text-xs text-gray-500">{client.notes}</span>
                            ) : (
                              <span className="text-xs text-gray-400">Aucune note</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-right text-sm font-medium text-primary-600">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => {
                                  setSelectedClient(client);
                                  setShowForm(true);
                                }}
                                className="inline-flex items-center justify-center rounded-full border border-transparent bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-600 transition hover:border-primary-200 hover:bg-primary-100"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteClient(client.id)}
                                className="inline-flex items-center justify-center rounded-full border border-transparent bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:border-rose-200 hover:bg-rose-100"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredClients.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-500">
                    <Users className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">Aucun client trouvé</p>
                  <p className="text-sm text-gray-500">
                    {searchTerm
                      ? 'Essayez un autre mot-clé ou réinitialisez les filtres.'
                      : 'Ajoutez votre premier client pour commencer à suivre vos relations.'}
                  </p>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setActiveFilter('all');
                    }}
                    className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                  >
                    Réinitialiser les filtres
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">Santé financière</h3>
              <TrendingUp className="h-4 w-4 text-primary-500" />
            </div>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-primary-100 bg-primary-50/70 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-primary-600">Encours à encaisser</dt>
                <dd className="mt-2 text-2xl font-bold text-primary-700">{formatCurrency(stats.receivable)}</dd>
                <p className="text-xs text-primary-600/80">Clients avec solde créditeur</p>
              </div>
              <div className="rounded-xl border border-rose-100 bg-rose-50/80 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-rose-600">Montant à restituer</dt>
                <dd className="mt-2 text-2xl font-bold text-rose-600">{formatCurrency(Math.abs(stats.payable))}</dd>
                <p className="text-xs text-rose-600/80">Avoirs ou trop-perçus à rembourser</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Solde net</dt>
                <dd className="mt-2 text-2xl font-bold text-gray-900">{formatCurrency(stats.totalSolde)}</dd>
                <p className="text-xs text-gray-500">Position globale sur l'ensemble des clients</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">Clients à prioriser</h3>
              <CircleDollarSign className="h-4 w-4 text-primary-500" />
            </div>
            <p className="mt-2 text-xs text-gray-500">Top 3 des encaissements à relancer en priorité.</p>
            <div className="mt-4 space-y-4">
              {highlightedClients.length ? (
                highlightedClients.map(client => (
                  <div key={client.id} className="flex items-start justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/70 p-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{client.nom}</p>
                      <p className="text-xs text-gray-500">
                        {client.email || client.telephone || 'Contact à compléter'}
                      </p>
                      {client.ville && (
                        <p className="mt-1 text-xs text-gray-400">{client.ville}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-primary-600">{formatCurrency(client.solde)}</p>
                      <p className="text-[11px] text-gray-400">Maj {formatDate(client.updatedAt)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 p-4 text-center text-xs text-gray-500">
                  Toutes vos créances sont à jour, bravo !
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-primary-600/10 via-white to-white p-5 shadow-inner">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                <Plus className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Ajouter un nouveau client</h4>
                <p className="text-xs text-gray-500">Centralisez toutes les informations pour accélérer vos facturations.</p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedClient(null);
                setShowForm(true);
              }}
              className="mt-4 w-full rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary-500/30 transition hover:bg-primary-700"
            >
              Créer un client
            </button>
          </div>
        </aside>
      </section>

      {/* Form Modal - Simplified for now */}
      {showForm && (
        <ClientForm
          client={selectedClient}
          onClose={() => {
            setShowForm(false);
            setSelectedClient(null);
          }}
          onSuccess={async () => {
            setShowForm(false);
            setSelectedClient(null);
            await loadData();
          }}
        />
      )}
    </div>
  );
}

function ClientForm({ client, onClose, onSuccess }: { client: Client | null; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    nom: client?.nom || '',
    type: client?.type || 'particulier',
    email: client?.email || '',
    telephone: client?.telephone || '',
    adresse: client?.adresse || '',
    ville: client?.ville || '',
    codePostal: client?.codePostal || '',
    pays: client?.pays || 'Maroc',
    numeroTVA: client?.numeroTVA || '',
    siret: client?.siret || '',
    notes: client?.notes || '',
    solde: client?.solde || 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const clientData = {
        ...formData,
        createdAt: client?.createdAt ? Timestamp.fromDate(new Date(client.createdAt)) : Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      if (client) {
        await updateDoc(doc(db, 'clients', client.id), clientData);
      } else {
        await addDoc(collection(db, 'clients'), {
          ...clientData,
          createdAt: Timestamp.now(),
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving client:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {client ? 'Modifier' : 'Nouveau client'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
              <input
                type="text"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="particulier">Particulier</option>
                <option value="entreprise">Entreprise</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <input
                type="tel"
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
              <input
                type="text"
                value={formData.adresse}
                onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code postal</label>
              <input
                type="text"
                value={formData.codePostal}
                onChange={(e) => setFormData({ ...formData, codePostal: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
              <input
                type="text"
                value={formData.ville}
                onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            {formData.type === 'entreprise' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">N° TVA</label>
                  <input
                    type="text"
                    value={formData.numeroTVA}
                    onChange={(e) => setFormData({ ...formData, numeroTVA: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SIRET</label>
                  <input
                    type="text"
                    value={formData.siret}
                    onChange={(e) => setFormData({ ...formData, siret: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </>
            )}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              {client ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
