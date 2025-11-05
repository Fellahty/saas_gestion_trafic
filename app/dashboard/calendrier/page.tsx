'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, QuerySnapshot, DocumentData, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase.config';
import { Mission, VisiteTechnique, Assurance, Entretien, Absence, Camion, Chauffeur } from '@/lib/types';
import { Calendar, ChevronLeft, ChevronRight, Truck, Shield, Wrench, MapPin, Users, Filter, Grid, List } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, addDays, isToday, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatDate, formatCurrency } from '@/lib/utils';
import Link from 'next/link';

interface CalendarEvent {
  id: string;
  type: 'mission' | 'visite' | 'assurance' | 'entretien' | 'absence';
  title: string;
  date: Date;
  camionId?: string;
  chauffeurId?: string;
  color: string;
  data: any;
}

export default function CalendrierPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [visites, setVisites] = useState<VisiteTechnique[]>([]);
  const [assurances, setAssurances] = useState<Assurance[]>([]);
  const [entretiens, setEntretiens] = useState<Entretien[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [camions, setCamions] = useState<Camion[]>([]);
  const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    // Real-time synchronization
    const unsubscribeMissions = onSnapshot(
      collection(db, 'missions'),
      (snapshot: QuerySnapshot<DocumentData>) => {
        setMissions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Mission)));
      }
    );

    const unsubscribeVisites = onSnapshot(
      collection(db, 'visitesTechniques'),
      (snapshot: QuerySnapshot<DocumentData>) => {
        setVisites(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VisiteTechnique)));
      }
    );

    const unsubscribeAssurances = onSnapshot(
      collection(db, 'assurances'),
      (snapshot: QuerySnapshot<DocumentData>) => {
        setAssurances(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Assurance)));
      }
    );

    const unsubscribeEntretiens = onSnapshot(
      collection(db, 'entretiens'),
      (snapshot: QuerySnapshot<DocumentData>) => {
        setEntretiens(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Entretien)));
      }
    );

    const unsubscribeAbsences = onSnapshot(
      collection(db, 'absences'),
      (snapshot: QuerySnapshot<DocumentData>) => {
        setAbsences(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Absence)));
      }
    );

    const unsubscribeCamions = onSnapshot(
      collection(db, 'camions'),
      (snapshot: QuerySnapshot<DocumentData>) => {
        setCamions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Camion)));
      }
    );

    const unsubscribeChauffeurs = onSnapshot(
      collection(db, 'chauffeurs'),
      (snapshot: QuerySnapshot<DocumentData>) => {
        setChauffeurs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chauffeur)));
      }
    );

    setLoading(false);

    return () => {
      unsubscribeMissions();
      unsubscribeVisites();
      unsubscribeAssurances();
      unsubscribeEntretiens();
      unsubscribeAbsences();
      unsubscribeCamions();
      unsubscribeChauffeurs();
    };
  }, []);

  // Convertir les données en événements calendrier
  const events = useMemo(() => {
    const allEvents: CalendarEvent[] = [];

    // Missions
    missions.forEach(mission => {
      const dateDebut = mission.dateDebut instanceof Timestamp ? mission.dateDebut.toDate() : new Date(mission.dateDebut);
      const dateFin = mission.dateFin ? (mission.dateFin instanceof Timestamp ? mission.dateFin.toDate() : new Date(mission.dateFin)) : dateDebut;
      
      const camion = camions.find(c => c.id === mission.camionId);
      allEvents.push({
        id: `mission-${mission.id}`,
        type: 'mission',
        title: `${mission.depart} → ${mission.destination}`,
        date: dateDebut,
        camionId: mission.camionId,
        chauffeurId: mission.chauffeurId,
        color: '#0ea5e9', // Blue
        data: { ...mission, camion, dateFin },
      });
    });

    // Visites techniques
    visites.forEach(visite => {
      const date = visite.date instanceof Timestamp ? visite.date.toDate() : new Date(visite.date);
      const camion = camions.find(c => c.id === visite.camionId);
      allEvents.push({
        id: `visite-${visite.id}`,
        type: 'visite',
        title: `Visite technique - ${camion?.matricule || 'N/A'}`,
        date,
        camionId: visite.camionId,
        color: '#10b981', // Green
        data: { ...visite, camion },
      });
    });

    // Assurances (date d'expiration)
    assurances.forEach(assurance => {
      const dateFin = assurance.dateFin instanceof Timestamp ? assurance.dateFin.toDate() : new Date(assurance.dateFin);
      const camion = camions.find(c => c.id === assurance.camionId);
      allEvents.push({
        id: `assurance-${assurance.id}`,
        type: 'assurance',
        title: `Assurance expire - ${camion?.matricule || 'N/A'}`,
        date: dateFin,
        camionId: assurance.camionId,
        color: '#f59e0b', // Orange
        data: { ...assurance, camion },
      });
    });

    // Entretiens
    entretiens.forEach(entretien => {
      const date = entretien.date instanceof Timestamp ? entretien.date.toDate() : new Date(entretien.date);
      const camion = camions.find(c => c.id === entretien.camionId);
      allEvents.push({
        id: `entretien-${entretien.id}`,
        type: 'entretien',
        title: `${entretien.type === 'vidange' ? 'Vidange' : entretien.type === 'reparation' ? 'Réparation' : 'Entretien'} - ${camion?.matricule || 'N/A'}`,
        date,
        camionId: entretien.camionId,
        color: '#8b5cf6', // Purple
        data: { ...entretien, camion },
      });
    });

    // Absences
    absences.forEach(absence => {
      const dateDebut = absence.dateDebut instanceof Timestamp ? absence.dateDebut.toDate() : new Date(absence.dateDebut);
      const dateFin = absence.dateFin instanceof Timestamp ? absence.dateFin.toDate() : new Date(absence.dateFin);
      const chauffeur = chauffeurs.find(c => c.id === absence.chauffeurId);
      
      // Créer un événement pour chaque jour d'absence
      const days = eachDayOfInterval({ start: dateDebut, end: dateFin });
      days.forEach(day => {
        allEvents.push({
          id: `absence-${absence.id}-${format(day, 'yyyy-MM-dd')}`,
          type: 'absence',
          title: `${absence.type === 'conge' ? 'Congé' : absence.type === 'maladie' ? 'Maladie' : 'Absence'} - ${chauffeur?.prenom || ''} ${chauffeur?.nom || ''}`,
          date: day,
          chauffeurId: absence.chauffeurId,
          color: '#ef4444', // Red
          data: { ...absence, chauffeur },
        });
      });
    });

    return allEvents;
  }, [missions, visites, assurances, entretiens, absences, camions, chauffeurs]);

  // Filtrer les événements
  const filteredEvents = useMemo(() => {
    if (filterType === 'all') return events;
    return events.filter(e => e.type === filterType);
  }, [events, filterType]);

  // Événements du mois/semaine actuel
  const currentPeriodEvents = useMemo(() => {
    const start = viewMode === 'month' 
      ? startOfMonth(currentDate)
      : startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = viewMode === 'month'
      ? endOfMonth(currentDate)
      : endOfWeek(currentDate, { weekStartsOn: 1 });

    return filteredEvents.filter(event => {
      const eventDate = event.date;
      return eventDate >= start && eventDate <= end;
    });
  }, [filteredEvents, currentDate, viewMode]);

  // Jours du mois/semaine
  const days = useMemo(() => {
    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
      const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    } else {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: weekStart, end: weekEnd });
    }
  }, [currentDate, viewMode]);

  // Événements par jour
  const eventsByDay = useMemo(() => {
    const grouped: Record<string, CalendarEvent[]> = {};
    currentPeriodEvents.forEach(event => {
      const key = format(event.date, 'yyyy-MM-dd');
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(event);
    });
    return grouped;
  }, [currentPeriodEvents]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'mission': return <MapPin className="w-3 h-3" />;
      case 'visite': return <Shield className="w-3 h-3" />;
      case 'assurance': return <Shield className="w-3 h-3" />;
      case 'entretien': return <Wrench className="w-3 h-3" />;
      case 'absence': return <Users className="w-3 h-3" />;
      default: return <Calendar className="w-3 h-3" />;
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'mission': return 'Missions';
      case 'visite': return 'Visites';
      case 'assurance': return 'Assurances';
      case 'entretien': return 'Entretiens';
      case 'absence': return 'Absences';
      default: return 'Tous';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const todayEvents = selectedDate 
    ? eventsByDay[format(selectedDate, 'yyyy-MM-dd')] || []
    : eventsByDay[format(new Date(), 'yyyy-MM-dd')] || [];

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-3 sm:space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="text-primary-600" />
            Calendrier
          </h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
            Planification et suivi de vos activités
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('month')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
              viewMode === 'month'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Grid size={16} />
            <span className="hidden sm:inline">Mois</span>
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
              viewMode === 'week'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <List size={16} />
            <span className="hidden sm:inline">Semaine</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2 -mx-3 sm:-mx-4 px-3 sm:px-4">
          <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium text-gray-700 flex-shrink-0">Filtrer :</span>
          <div className="flex items-center gap-2 flex-1 min-w-max">
            {['all', 'mission', 'visite', 'assurance', 'entretien', 'absence'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap touch-manipulation ${
                  filterType === type
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 active:bg-gray-200'
                }`}
              >
                {getEventTypeLabel(type)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6">
          <button
            onClick={() => setCurrentDate(viewMode === 'month' ? subMonths(currentDate, 1) : subDays(currentDate, 7))}
            className="p-2 active:bg-gray-100 sm:hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
            aria-label="Période précédente"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          </button>
          <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 text-center px-2 truncate">
            {viewMode === 'month'
              ? format(currentDate, 'MMMM yyyy', { locale: fr })
              : `Semaine du ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'd MMMM', { locale: fr })}`}
          </h2>
          <button
            onClick={() => setCurrentDate(viewMode === 'month' ? addMonths(currentDate, 1) : addDays(currentDate, 7))}
            className="p-2 active:bg-gray-100 sm:hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
            aria-label="Période suivante"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <div className="grid grid-cols-7 gap-1 sm:gap-2 min-w-[350px]">
            {/* Days of week */}
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
              <div
                key={day}
                className="text-center text-[10px] sm:text-xs md:text-sm font-semibold text-gray-600 py-1.5 sm:py-2"
              >
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{day.substring(0, 1)}</span>
              </div>
            ))}

            {/* Calendar Days */}
            {days.map((day, dayIdx) => {
              const dayKey = format(day, 'yyyy-MM-dd');
              const dayEvents = eventsByDay[dayKey] || [];
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isCurrentDay = isToday(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);

              return (
                <div
                  key={dayIdx}
                  onClick={() => setSelectedDate(day)}
                  className={`min-h-[50px] sm:min-h-[70px] md:min-h-[80px] p-1 sm:p-2 border border-gray-200 rounded-lg cursor-pointer transition-all active:bg-gray-50 sm:hover:bg-gray-50 touch-manipulation ${
                    !isCurrentMonth ? 'opacity-40' : ''
                  } ${isCurrentDay ? 'bg-primary-50 border-primary-300' : ''} ${
                    isSelected ? 'ring-2 ring-primary-500 bg-primary-50' : ''
                  }`}
                >
                  <div className={`text-[10px] sm:text-xs md:text-sm font-medium mb-0.5 sm:mb-1 ${
                    isCurrentDay ? 'text-primary-600 font-bold' : 'text-gray-700'
                  }`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5 sm:space-y-1 overflow-hidden max-h-[40px] sm:max-h-[50px] md:max-h-[60px]">
                    {dayEvents.slice(0, viewMode === 'week' ? 5 : 2).map((event) => (
                      <div
                        key={event.id}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-0.5 sm:gap-1 px-1 sm:px-1.5 py-0.5 rounded text-[9px] sm:text-xs truncate"
                        style={{ backgroundColor: `${event.color}20`, color: event.color }}
                        title={event.title}
                      >
                        <span className="flex-shrink-0">{getEventIcon(event.type)}</span>
                        <span className="truncate hidden sm:inline">{event.title}</span>
                        <span className="sm:hidden truncate" style={{ maxWidth: '40px' }}>
                          {event.type === 'mission' ? 'M' : 
                           event.type === 'visite' ? 'V' :
                           event.type === 'assurance' ? 'A' :
                           event.type === 'entretien' ? 'E' : 'Ab'}
                        </span>
                      </div>
                    ))}
                    {dayEvents.length > (viewMode === 'week' ? 5 : 2) && (
                      <div className="text-[9px] sm:text-xs text-gray-500 px-1 sm:px-1.5">
                        +{dayEvents.length - (viewMode === 'week' ? 5 : 2)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Day Events */}
      {(selectedDate || isToday(new Date())) && (
        <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6">
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 flex-shrink-0" />
            <span className="truncate">
              {selectedDate ? format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr }) : "Aujourd'hui"}
            </span>
          </h3>
          {todayEvents.length === 0 ? (
            <p className="text-gray-500 text-xs sm:text-sm text-center py-4">Aucun événement prévu</p>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {todayEvents.map((event) => {
                const camion = event.camionId ? camions.find(c => c.id === event.camionId) : null;
                const chauffeur = event.chauffeurId ? chauffeurs.find(c => c.id === event.chauffeurId) : null;

                return (
                  <div
                    key={event.id}
                    className="p-2.5 sm:p-3 md:p-4 rounded-lg border-l-4"
                    style={{ borderLeftColor: event.color, backgroundColor: `${event.color}10` }}
                  >
                    <div className="flex items-start justify-between gap-2 sm:gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                          <div className="p-1 sm:p-1.5 rounded flex-shrink-0" style={{ backgroundColor: event.color }}>
                            <div className="text-white">
                              {getEventIcon(event.type)}
                            </div>
                          </div>
                          <h4 className="font-semibold text-xs sm:text-sm md:text-base text-gray-900 truncate">{event.title}</h4>
                        </div>
                        <div className="text-[10px] sm:text-xs md:text-sm text-gray-600 space-y-0.5 sm:space-y-1">
                          {camion && (
                            <div className="flex items-center gap-1">
                              <Truck className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                              <span className="truncate">{camion.matricule}</span>
                            </div>
                          )}
                          {chauffeur && (
                            <div className="flex items-center gap-1">
                              <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                              <span className="truncate">{chauffeur.prenom} {chauffeur.nom}</span>
                            </div>
                          )}
                          {event.type === 'mission' && event.data.recette && (
                            <div className="flex items-center gap-1">
                              <span className="font-medium text-[10px] sm:text-xs">Recette : {formatCurrency(event.data.recette)}</span>
                            </div>
                          )}
                          {event.type === 'entretien' && event.data.cout && (
                            <div className="flex items-center gap-1">
                              <span className="font-medium text-[10px] sm:text-xs">Coût : {formatCurrency(event.data.cout)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <Link
                          href={
                            event.type === 'mission' ? '/dashboard/trajets' :
                            event.type === 'visite' || event.type === 'assurance' || event.type === 'entretien' ? '/dashboard/camions' :
                            '/dashboard/chauffeurs'
                          }
                          className="text-[10px] sm:text-xs text-primary-600 hover:text-primary-700 hover:underline touch-manipulation"
                        >
                          Voir →
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6">
        <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-900 mb-2 sm:mb-3">Légende</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
          {[
            { type: 'mission', label: 'Missions', color: '#0ea5e9', icon: MapPin },
            { type: 'visite', label: 'Visites', color: '#10b981', icon: Shield },
            { type: 'assurance', label: 'Assurances', color: '#f59e0b', icon: Shield },
            { type: 'entretien', label: 'Entretiens', color: '#8b5cf6', icon: Wrench },
            { type: 'absence', label: 'Absences', color: '#ef4444', icon: Users },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.type} className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded flex-shrink-0" style={{ backgroundColor: item.color }}></div>
                <div className="flex items-center gap-1 min-w-0">
                  <Icon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-600 flex-shrink-0" />
                  <span className="text-[10px] sm:text-xs md:text-sm text-gray-700 truncate">{item.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

