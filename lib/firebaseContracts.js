// lib/firebaseContracts.js (funções específicas para contratos)
import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  getDoc,
  getDocs,
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  Timestamp,
  serverTimestamp,
  writeBatch,
  increment
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "./firebase";

const CONTRACTS_COLLECTION = "contracts";
const CONTRACTS_STATS_DOC = "stats/contracts";

// Criar novo contrato
export async function createContract(contractData, pdfFile = null) {
  try {
    let pdfUrl = null;
    
    // Upload do PDF se fornecido
    if (pdfFile) {
      const storageRef = ref(storage, `contracts/${Date.now()}_${contractData.cpf}.pdf`);
      await uploadBytes(storageRef, pdfFile);
      pdfUrl = await getDownloadURL(storageRef);
    }

    // Preparar dados
    const newContract = {
      ...contractData,
      status: "pendente",
      pdfUrl,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      dataAssinatura: contractData.dataAssinatura ? Timestamp.fromDate(new Date(contractData.dataAssinatura)) : serverTimestamp(),
    };

    // Adicionar documento
    const docRef = await addDoc(collection(db, CONTRACTS_COLLECTION), newContract);
    
    // Atualizar estatísticas
    await updateContractStats("create");
    
    return { id: docRef.id, ...newContract };
  } catch (error) {
    console.error("Erro ao criar contrato:", error);
    throw error;
  }
}

// Atualizar contrato
export async function updateContract(contractId, updates) {
  try {
    const contractRef = doc(db, CONTRACTS_COLLECTION, contractId);
    
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    // Converter datas se necessário
    if (updates.dataAssinatura) {
      updateData.dataAssinatura = Timestamp.fromDate(new Date(updates.dataAssinatura));
    }

    await updateDoc(contractRef, updateData);
    
    // Se status mudou, atualizar estatísticas
    if (updates.status) {
      await updateContractStats("statusChange");
    }
    
    return { id: contractId, ...updateData };
  } catch (error) {
    console.error("Erro ao atualizar contrato:", error);
    throw error;
  }
}

// Deletar contrato
export async function deleteContract(contractId, pdfUrl = null) {
  try {
    // Deletar PDF do Storage se existir
    if (pdfUrl) {
      const storageRef = ref(storage, pdfUrl);
      await deleteObject(storageRef).catch(() => console.log("PDF já não existe"));
    }

    // Deletar documento
    await deleteDoc(doc(db, CONTRACTS_COLLECTION, contractId));
    
    // Atualizar estatísticas
    await updateContractStats("delete");
    
    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar contrato:", error);
    throw error;
  }
}

// Buscar contrato por ID
export async function getContractById(contractId) {
  try {
    const docRef = doc(db, CONTRACTS_COLLECTION, contractId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("Erro ao buscar contrato:", error);
    throw error;
  }
}

// Query builders otimizados
export function buildContractsQuery(options = {}) {
  const {
    status = null,
    searchTerm = null,
    startDate = null,
    endDate = null,
    orderByField = "createdAt",
    orderDirection = "desc",
    limitCount = 50,
    lastDoc = null
  } = options;

  let constraints = [];

  // Filtros
  if (status) {
    constraints.push(where("status", "==", status));
  }

  if (startDate && endDate) {
    constraints.push(
      where("dataAssinatura", ">=", Timestamp.fromDate(new Date(startDate))),
      where("dataAssinatura", "<=", Timestamp.fromDate(new Date(endDate)))
    );
  }

  // Ordenação (deve vir depois dos where que usam o mesmo campo)
  if (orderByField) {
    constraints.push(orderBy(orderByField, orderDirection));
  }

  // Limite
  if (limitCount) {
    constraints.push(limit(limitCount));
  }

  // Paginação
  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }

  return query(collection(db, CONTRACTS_COLLECTION), ...constraints);
}

// Busca por CPF ou RG (para verificação de duplicatas)
export async function checkExistingContract(cpf, rg) {
  try {
    const q = query(
      collection(db, CONTRACTS_COLLECTION),
      where("cpf", "==", cpf),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    return !snapshot.empty ? snapshot.docs[0].data() : null;
  } catch (error) {
    console.error("Erro ao verificar contrato existente:", error);
    throw error;
  }
}

// Atualizar estatísticas (usando transação para segurança)
async function updateContractStats(action) {
  try {
    const statsRef = doc(db, "stats", "contracts");
    
    const updates = {};
    switch (action) {
      case "create":
        updates.total = increment(1);
        updates.pendentes = increment(1);
        break;
      case "delete":
        updates.total = increment(-1);
        break;
      case "statusChange":
        // Recalcula tudo no cliente para manter consistência
        break;
    }
    
    updates.lastUpdated = serverTimestamp();
    
    await updateDoc(statsRef, updates);
  } catch (error) {
    console.error("Erro ao atualizar estatísticas:", error);
  }
}

// Batch operations para ações em massa
export async function batchUpdateContracts(contractIds, updates) {
  const batch = writeBatch(db);
  
  contractIds.forEach(id => {
    const ref = doc(db, CONTRACTS_COLLECTION, id);
    batch.update(ref, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  });
  
  await batch.commit();
  return { updated: contractIds.length };
}

export async function batchDeleteContracts(contracts) {
  const batch = writeBatch(db);
  
  contracts.forEach(({ id }) => {
    const ref = doc(db, CONTRACTS_COLLECTION, id);
    batch.delete(ref);
  });
  
  await batch.commit();
  return { deleted: contracts.length };
}

// Gerar relatório mensal
export async function generateMonthlyReport(year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  
  const q = query(
    collection(db, CONTRACTS_COLLECTION),
    where("dataAssinatura", ">=", Timestamp.fromDate(startDate)),
    where("dataAssinatura", "<=", Timestamp.fromDate(endDate)),
    orderBy("dataAssinatura", "desc")
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Exportar todos
export {
  CONTRACTS_COLLECTION,
  serverTimestamp,
  Timestamp
};