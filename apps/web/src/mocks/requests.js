export const requests = {
  aprovacoes: [
    { id: 'apr-1', nome: 'Bruno Gomes', iniciais: 'BG', cpf: '222.333.444-55', fornecedor: 'Segurança Total', funcao: 'Segurança', acesso: 'Evento', periodo: '15/07 a 18/07', alertas: ['Sem foto'] },
    { id: 'apr-2', nome: 'Daniel Faria', iniciais: 'DF', cpf: '444.555.666-77', fornecedor: 'Limpeza Express', funcao: 'Auxiliar', acesso: 'Desmontagem', periodo: '19/07', alertas: ['Taxa pendente'] }
  ],
  equipesHistorico: [
    {
      fornecedorId: 'for-1',
      eventoId: 'evt-002',
      pessoas: [
        { id: 'eqh-1', nome: 'Ana Costa', cpf: '111.222.333-44', funcao: 'Coordenadora' },
        { id: 'eqh-2', nome: 'Rafael Braga', cpf: '555.666.777-88', funcao: 'Montador' }
      ]
    },
    {
      fornecedorId: 'for-2',
      eventoId: 'evt-002',
      pessoas: [
        { id: 'eqh-3', nome: 'Bruno Gomes', cpf: '222.333.444-55', funcao: 'Segurança' },
        { id: 'eqh-4', nome: 'Marcos Tavares', cpf: '888.999.111-22', funcao: 'Supervisor de acesso' }
      ]
    },
    {
      fornecedorId: 'for-2',
      eventoId: 'evt-003',
      pessoas: [
        { id: 'eqh-5', nome: 'Livia Mota', cpf: '777.888.999-00', funcao: 'Segurança' }
      ]
    }
  ]
};
