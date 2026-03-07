// hooks/useContracts.js (React Hook otimizado)
import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  where, 
  orderBy,
  limit,
  startAfter,
  getDocs,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useContracts(options = {}) {
  const {
    status = null,
    limit: pageSize = 20,
    realTime = true
  } = options;

  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pendentes: 0,
    assinados: 0,
    cancelados: 0
  });

  const unsubscribeRef = useRef(null);

  // Build query
  const buildQuery = useCallback((isInitial = true) => {
    let constraints = [orderBy('createdAt', 'desc')];
    
    if (status) {
      constraints.unshift(where('status', '==', status));
    }
    
    if (!isInitial && lastDoc) {
      constraints.push(startAfter(lastDoc));
    }
    
    constraints.push(limit(pageSize));
    
    return query(collection(db, 'contracts'), ...constraints);
  }, [status, pageSize, lastDoc]);

  // Load initial data
  const loadContracts = useCallback(async () => {
    try {
      setLoading(true);
      const q = buildQuery(true);
      const snapshot = await getDocs(q);
      
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setContracts(data);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === pageSize);
      setLoading(false);
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  }, [buildQuery, pageSize]);

  // Real-time subscription
  useEffect(() => {
    if (!realTime) {
      loadContracts();
      return;
    }

    const q = buildQuery(true);
    
    unsubscribeRef.current = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setContracts(data);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === pageSize);
      setLoading(false);
      
      // Calcular estatísticas
      const newStats = {
        total: data.length,
        pendentes: data.filter(c => c.status === 'pendente').length,
        assinados: data.filter(c => c.status === 'assinado').length,
        cancelados: data.filter(c => c.status === 'cancelado').length
      };
      setStats(newStats);
    }, (err) => {
      setError(err);
      setLoading(false);
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [status, realTime, buildQuery, loadContracts, pageSize]);

  // Load more (pagination)
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    
    try {
      setLoading(true);
      const q = buildQuery(false);
      const snapshot = await getDocs(q);
      
      const newData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setContracts(prev => [...prev, ...newData]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === pageSize);
      setLoading(false);
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  }, [buildQuery, hasMore, loading, pageSize]);

  // Refresh
  const refresh = useCallback(() => {
    setLastDoc(null);
    setHasMore(true);
    loadContracts();
  }, [loadContracts]);

  return {
    contracts,
    loading,
    error,
    hasMore,
    stats,
    loadMore,
    refresh,
    lastDoc
  };
}

// Hook de busca com debounce
export function useContractSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!searchTerm || searchTerm.length < 3) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setSearching(true);
      try {
        // Busca por CPF (exato) ou Nome (contém)
        const q = query(
          collection(db, 'contracts'),
          where('nome', '>=', searchTerm),
          where('nome', '<=', searchTerm + '\uf8ff'),
          limit(10)
        );
        
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setResults(data);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  return { searchTerm, setSearchTerm, results, searching };
}