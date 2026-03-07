// lib/firebaseUtils.js (utilitários genéricos)
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  serverTimestamp,
  writeBatch,
  increment,
  arrayUnion,
  arrayRemove
} from "firebase/firestore";
import { db } from "./firebase";

// CRUD Genérico
export class FirebaseCRUD {
  constructor(collectionName) {
    this.collectionName = collectionName;
    this.collectionRef = collection(db, collectionName);
  }

  // Criar
  async create(data, id = null) {
    const dataWithTimestamps = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    if (id) {
      await setDoc(doc(db, this.collectionName, id), dataWithTimestamps);
      return { id, ...dataWithTimestamps };
    } else {
      const docRef = await addDoc(this.collectionRef, dataWithTimestamps);
      return { id: docRef.id, ...dataWithTimestamps };
    }
  }

  // Ler um
  async getById(id) {
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  }

  // Ler todos com filtros
  async getAll(options = {}) {
    const {
      where: whereClauses = [],
      orderBy: orderByField = "createdAt",
      orderDirection = "desc",
      limit: limitCount = 100,
      lastDoc = null
    } = options;

    let constraints = [];

    // Where clauses
    whereClauses.forEach(([field, operator, value]) => {
      constraints.push(where(field, operator, value));
    });

    // Ordenação
    constraints.push(orderBy(orderByField, orderDirection));

    // Paginação
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    // Limite
    constraints.push(limit(limitCount));

    const q = query(this.collectionRef, ...constraints);
    const snapshot = await getDocs(q);
    
    return {
      data: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
      hasMore: snapshot.docs.length === limitCount
    };
  }

  // Atualizar
  async update(id, data) {
    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    return { id, ...data };
  }

  // Deletar
  async delete(id) {
    await deleteDoc(doc(db, this.collectionName, id));
    return { id, deleted: true };
  }

  // Batch create
  async batchCreate(items) {
    const batch = writeBatch(db);
    const createdIds = [];

    items.forEach((item, index) => {
      const docRef = doc(this.collectionRef);
      batch.set(docRef, {
        ...item,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      createdIds.push({ tempId: index, firebaseId: docRef.id });
    });

    await batch.commit();
    return createdIds;
  }

  // Increment field
  async increment(id, field, value = 1) {
    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, {
      [field]: increment(value),
      updatedAt: serverTimestamp()
    });
  }

  // Array operations
  async addToArray(id, field, value) {
    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, {
      [field]: arrayUnion(value),
      updatedAt: serverTimestamp()
    });
  }

  async removeFromArray(id, field, value) {
    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, {
      [field]: arrayRemove(value),
      updatedAt: serverTimestamp()
    });
  }
}

// Helpers de data
export const DateHelpers = {
  toTimestamp: (date) => Timestamp.fromDate(date instanceof Date ? date : new Date(date)),
  toDate: (timestamp) => timestamp?.toDate ? timestamp.toDate() : null,
  formatBR: (timestamp) => {
    const date = DateHelpers.toDate(timestamp);
    return date ? date.toLocaleDateString('pt-BR') : '-';
  },
  now: () => Timestamp.now(),
  startOfDay: (date = new Date()) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return Timestamp.fromDate(d);
  },
  endOfDay: (date = new Date()) => {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return Timestamp.fromDate(d);
  }
};

// Error handler
export function handleFirebaseError(error) {
  const errorMessages = {
    'permission-denied': 'Você não tem permissão para realizar esta ação.',
    'not-found': 'Documento não encontrado.',
    'already-exists': 'Este registro já existe.',
    'resource-exhausted': 'Limite de operações excedido. Tente novamente mais tarde.',
    'failed-precondition': 'Operação não permitida no momento.',
    'unavailable': 'Serviço temporariamente indisponível. Verifique sua conexão.',
    'unauthenticated': 'Sessão expirada. Faça login novamente.'
  };

  return {
    code: error.code,
    message: errorMessages[error.code] || error.message || 'Erro desconhecido',
    original: error
  };
}

// Cache simples em memória
export const cache = {
  data: new Map(),
  set: (key, value, ttlMinutes = 5) => {
    const expires = Date.now() + (ttlMinutes * 60 * 1000);
    cache.data.set(key, { value, expires });
  },
  get: (key) => {
    const item = cache.data.get(key);
    if (!item) return null;
    if (Date.now() > item.expires) {
      cache.data.delete(key);
      return null;
    }
    return item.value;
  },
  clear: () => cache.data.clear(),
  delete: (key) => cache.data.delete(key)
};