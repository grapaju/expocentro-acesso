
import {
  accessLogs,
  events,
  fees,
  invitations,
  operationHistory,
  people,
  requests,
  supplierNorms,
  suppliers
} from '@/mocks/index.js';

export const adminMockData = {
  eventos: events,
  convites: invitations,
  fornecedores: suppliers,
  pessoas: people,
  aprovacoes: requests.aprovacoes,
  taxas: fees,
  normas: supplierNorms,
  guarita: accessLogs,
  historico: operationHistory,
  equipesHistorico: requests.equipesHistorico
};

export const getEventoById = (id) => adminMockData.eventos.find(e => e.id === id);
