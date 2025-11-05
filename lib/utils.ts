import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | number): string {
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'MAD'
  }).format(amount);
}

/**
 * Nettoie une chaîne de caractères pour supprimer les caractères de contrôle invalides
 * qui peuvent causer des erreurs JSON.parse
 */
export function cleanString(value: string | undefined | null): string {
  if (!value) return '';
  return String(value)
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Supprime les caractères de contrôle
    .replace(/\u200B/g, '') // Supprime les zero-width spaces
    .replace(/\uFEFF/g, '') // Supprime le BOM
    .trim();
}

/**
 * Nettoie un objet avant de l'envoyer à Firebase
 * Supprime les caractères de contrôle invalides des chaînes
 */
export function cleanFirestoreData<T extends Record<string, any>>(data: T): T {
  const cleaned: any = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) {
      cleaned[key] = value;
    } else if (typeof value === 'string') {
      cleaned[key] = cleanString(value);
    } else if (value instanceof Date) {
      cleaned[key] = value;
    } else if (typeof value === 'number') {
      // S'assurer que les nombres sont valides (pas NaN, Infinity, etc.)
      cleaned[key] = isNaN(value) || !isFinite(value) ? 0 : value;
    } else if (typeof value === 'boolean') {
      cleaned[key] = value;
    } else if (typeof value === 'object' && !Array.isArray(value) && value.constructor === Object) {
      cleaned[key] = cleanFirestoreData(value);
    } else if (Array.isArray(value)) {
      cleaned[key] = value.map(item => {
        if (typeof item === 'string') {
          return cleanString(item);
        } else if (typeof item === 'number') {
          return isNaN(item) || !isFinite(item) ? 0 : item;
        } else if (typeof item === 'object' && item !== null && item.constructor === Object) {
          return cleanFirestoreData(item);
        }
        return item;
      });
    } else {
      // Pour tout autre type, convertir en string et nettoyer
      try {
        const stringValue = String(value);
        cleaned[key] = cleanString(stringValue);
      } catch {
        // Si la conversion échoue, ignorer la propriété
        console.warn(`Impossible de nettoyer la propriété ${key}:`, value);
      }
    }
  }
  
  return cleaned as T;
}

/**
 * Valide et nettoie les données reçues de Firestore
 * Utilisé lors de la lecture pour nettoyer les données existantes
 */
export function cleanFirestoreReadData<T extends Record<string, any>>(data: T): T {
  return cleanFirestoreData(data);
}

