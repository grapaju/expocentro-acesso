
import { useMemo } from 'react';
import { useAppData } from '@/store/AppDataContext.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';

export const useFornecedorData = () => {
  const { currentUser } = useAuth();
  const {
    events: appEvents,
    suppliers,
    people,
    fees,
    adminMockData,
    createPerson,
    updatePerson: patchPerson,
    submitPeopleForApproval,
    addHistoryLog
  } = useAppData();

  const linkedSuppliers = useMemo(() => {
    const currentEmail = String(currentUser?.email || '').toLowerCase();
    const currentName = String(currentUser?.name || '').toLowerCase();

    return (suppliers || []).filter((supplier) => {
      const supplierName = String(supplier?.nome || '').toLowerCase();
      const supplierEmail = String(supplier?.emailEmpresa || supplier?.email || '').toLowerCase();

      if (currentEmail && supplierEmail && supplierEmail === currentEmail) return true;
      if (currentName && supplierName && supplierName === currentName) return true;
      return false;
    });
  }, [suppliers, currentUser?.email, currentUser?.name]);

  const linkedSupplierIds = useMemo(
    () => new Set(linkedSuppliers.map((supplier) => supplier.id)),
    [linkedSuppliers]
  );

  const linkedPeople = useMemo(() => {
    return (people || []).filter((person) => {
      const isExcluded = String(person.status || '').toLowerCase() === 'excluido';
      if (isExcluded) return false;
      return linkedSupplierIds.has(person.supplierId);
    });
  }, [people, linkedSupplierIds]);

  const linkedEventIds = useMemo(() => {
    const ids = new Set();
    linkedSuppliers.forEach((supplier) => {
      if (supplier.eventId) ids.add(supplier.eventId);
    });
    linkedPeople.forEach((person) => {
      if (person.eventId) ids.add(person.eventId);
    });
    return ids;
  }, [linkedSuppliers, linkedPeople]);

  const events = useMemo(() => {
    return (appEvents || [])
      .filter((event) => linkedEventIds.has(event.id))
      .map((event) => {
        const eventSuppliers = linkedSuppliers.filter((supplier) => supplier.eventId === event.id);
        const eventSupplierIds = new Set(eventSuppliers.map((supplier) => supplier.id));
        const eventPeople = linkedPeople.filter((person) => person.eventId === event.id && eventSupplierIds.has(person.supplierId));
        const eventFee = (fees || []).find((fee) => fee.eventId === event.id && eventSupplierIds.has(fee.supplierId));

        return {
          id: event.id,
          name: event.nome,
          period: event.periodo,
          credenciamentoStatus: event.faseNova || event.faseAtual,
          prazoEnvio: String(event.periodo || '').split(' a ')[0] || '-',
          pessoasCadastradas: eventPeople.length,
          statusFornecedor: eventSuppliers[0]?.statusCadastral || 'Aguardando aprovação',
          aceiteNormas: (adminMockData.normas || []).some((norma) => eventSupplierIds.has(norma.supplierId) && norma.aceiteCompleto),
          taxa: eventFee?.status || eventSuppliers[0]?.statusPagamento || 'Pendente'
        };
      });
  }, [appEvents, linkedEventIds, linkedSuppliers, linkedPeople, fees, adminMockData.normas]);

  const defaultEventId = events[0]?.id || null;
  const defaultSupplier = linkedSuppliers.find((supplier) => supplier.eventId === defaultEventId) || linkedSuppliers[0] || null;

  const addPerson = (personData, status = 'aguardando_aprovacao') => {
    const targetEventId = personData?.eventId || defaultEventId;
    const supplierForEvent = linkedSuppliers.find((supplier) => supplier.eventId === targetEventId);
    const targetSupplier = supplierForEvent || defaultSupplier;

    if (!targetEventId || !targetSupplier?.id) return null;

    return createPerson(targetEventId, targetSupplier.id, {
      ...personData,
      status,
      statusCode: status,
      supplierName: targetSupplier?.nome,
      createdBy: 'fornecedor',
      temPendencia: status === 'Rascunho',
      motivoPendencia: status === 'Rascunho' ? 'Cadastro incompleto' : null
    });
  };

  const updatePerson = (id, updatedData) => patchPerson(id, updatedData);

  const deletePerson = (id) => {
    patchPerson(id, { status: 'Excluido' });
    addHistoryLog({
      acao: 'Exclusao logica de pessoa',
      usuario: 'Fornecedor',
      detalhes: `Cadastro ${id} marcado como excluido.`
    });
  };

  const submitForAnalysis = (id) => {
    patchPerson(id, { status: 'aguardando_aprovacao', statusCode: 'aguardando_aprovacao', temPendencia: false, motivoPendencia: null });
  };

  const submitListForApproval = () => {
    let totalSubmitted = 0;

    linkedSuppliers.forEach((supplier) => {
      if (!supplier.eventId || !supplier.id) return;
      const ids = submitPeopleForApproval(supplier.eventId, supplier.id);
      totalSubmitted += ids.length;
    });

    if (totalSubmitted > 0) {
      addHistoryLog({
        acao: 'Envio de lista para aprovação',
        usuario: 'Fornecedor',
        detalhes: `Lista enviada com ${totalSubmitted} pessoa(s).`
      });
    }

    return totalSubmitted;
  };

  const pendingItems = useMemo(() => {
    const issues = [];

    linkedPeople.forEach((person) => {
      if (person.temPendencia || String(person.status || '').toLowerCase().includes('correcao')) {
        issues.push({
          id: `pend-pessoa-${person.id}`,
          tipo: 'Pessoa',
          titulo: person.nome,
          detalhe: person.motivoPendencia || person.status || 'Pendência operacional'
        });
      }
    });

    linkedSuppliers.forEach((supplier) => {
      const status = String(supplier.statusCadastral || '').toLowerCase();
      if (status.includes('aguardando') || status.includes('correcao')) {
        issues.push({
          id: `pend-fornecedor-${supplier.id}`,
          tipo: 'Fornecedor',
          titulo: supplier.nome,
          detalhe: supplier.statusCadastral
        });
      }
    });

    events.forEach((event) => {
      if (String(event.taxa || '').toLowerCase() === 'pendente' || String(event.taxa || '').toLowerCase() === 'atrasada') {
        issues.push({
          id: `pend-taxa-${event.id}`,
          tipo: 'Taxa',
          titulo: event.name,
          detalhe: `Taxa ${event.taxa}`
        });
      }
    });

    return issues;
  }, [linkedPeople, linkedSuppliers, events]);

  // Derived stats
  const stats = {
    totalEvents: events.length,
    totalPeople: linkedPeople.length,
    pendingPeople: linkedPeople.filter((p) => {
      const status = String(p.statusCode || p.status || '').toLowerCase();
      return status.includes('aguardando') || status.includes('correcao') || status.includes('pendente');
    }).length,
    approvedPeople: linkedPeople.filter((p) => {
      const status = String(p.statusCode || p.status || '').toLowerCase();
      return status === 'aprovado' || status === 'liberado_guarita' || status.includes('liberado');
    }).length,
    pendingFees: events.filter(e => ['Pendente', 'Atrasada'].includes(e.taxa)).length,
    correctionsRequested: linkedPeople.filter((p) => String(p.statusCode || p.status || '').toLowerCase().includes('correcao')).length
  };

  return {
    people: linkedPeople,
    events,
    stats,
    pendingItems,
    addPerson,
    updatePerson,
    deletePerson,
    submitForAnalysis,
    submitListForApproval
  };
};
