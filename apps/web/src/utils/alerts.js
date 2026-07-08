import { getOperationalAlerts as getOperationalAlertsFromRules } from '@/utils/rules.js';

export const getOperationalAlerts = (
  evento,
  fornecedores = [],
  pessoas = [],
  convites = [],
  taxas = []
) => {
  return getOperationalAlertsFromRules(evento, fornecedores, pessoas, convites, taxas);
};
