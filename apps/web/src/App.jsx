
import React from 'react';
import { Route, Routes, BrowserRouter as Router, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext.jsx';
import { AppDataProvider } from '@/store/AppDataContext.jsx';
import ScrollToTop from '@/components/ScrollToTop.jsx';
import ProtectedRoute from '@/components/ProtectedRoute.jsx';
import HomePage from '@/pages/HomePage.jsx';

import AdminLoginPage from '@/pages/AdminLoginPage.jsx';
import FornecedorLoginPage from '@/pages/FornecedorLoginPage.jsx';
import GuaritaLoginPage from '@/pages/GuaritaLoginPage.jsx';

import AdminDashboardPage from '@/pages/AdminDashboardPage.jsx';
import EventosControlePage from '@/pages/EventosControlePage.jsx';
import EventoDetalheConvitesPage from '@/pages/EventoDetalheConvitesPage.jsx';
import EventoDetalheDocumentosPage from '@/pages/EventoDetalheDocumentosPage.jsx';
import EventoDetalheFornecedoresPage from '@/pages/EventoDetalheFornecedoresPage.jsx';
import EventoDetalhePessoasPage from '@/pages/EventoDetalhePessoasPage.jsx';
import EventoDetalheAprovacoesPage from '@/pages/EventoDetalheAprovacoesPage.jsx';
import EventoDetalheTaxasPage from '@/pages/EventoDetalheTaxasPage.jsx';
import EventoDetalheNormasPage from '@/pages/EventoDetalheNormasPage.jsx';
import EventoDetalheGuaritaPage from '@/pages/EventoDetalheGuaritaPage.jsx';
import EventoDetalheHistoricoPage from '@/pages/EventoDetalheHistoricoPage.jsx';

import CentralCredenciamentoPage from '@/pages/CentralCredenciamentoPage.jsx';
import CentralGuaritaAdminPage from '@/pages/CentralGuaritaAdminPage.jsx';
import FornecedoresParceirosPage from '@/pages/FornecedoresParceirosPage.jsx';
import FornecedorParceiroDetalhePage from '@/pages/FornecedorParceiroDetalhePage.jsx';
import RelatoriosPage from '@/pages/RelatoriosPage.jsx';
import ConfiguracoesPage from '@/pages/ConfiguracoesPage.jsx';

import FornecedorPortalPage from '@/pages/FornecedorPortalPage.jsx';
import CadastroFornecedorPage from '@/pages/CadastroFornecedorPage.jsx';
import CadastroPessoasPage from '@/pages/CadastroPessoasPage.jsx';
import PessoasCadastradasPage from '@/pages/PessoasCadastradasPage.jsx';
import SucessoCadastroPage from '@/pages/SucessoCadastroPage.jsx';
import ValidarConvitePage from '@/pages/ValidarConvitePage.jsx';
import PortalOrganizadorPage from '@/pages/PortalOrganizadorPage.jsx';

import GuaritaAccessPage from '@/pages/GuaritaAccessPage.jsx';
import GuaritaSolicitacoesPage from '@/pages/GuaritaSolicitacoesPage.jsx';
import GuaritaHistoricoPage from '@/pages/GuaritaHistoricoPage.jsx';

import { Toaster } from 'sonner';

function App() {
  return (
    <AppDataProvider>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/validar-convite" element={<ValidarConvitePage />} />
          <Route path="/portal-organizador" element={<PortalOrganizadorPage />} />
          <Route path="/cadastro-fornecedor" element={<CadastroFornecedorPage />} />
          <Route path="/sucesso-cadastro" element={<SucessoCadastroPage />} />
          
          <Route path="/admin-login" element={<AdminLoginPage />} />
          <Route path="/fornecedor-login" element={<FornecedorLoginPage />} />
          <Route path="/guarita-login" element={<GuaritaLoginPage />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin-dashboard" element={<Navigate to="/admin/dashboard" replace />} />
          
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboardPage /></ProtectedRoute>} />
          <Route path="/admin/eventos" element={<ProtectedRoute allowedRoles={['admin']}><EventosControlePage /></ProtectedRoute>} />
          
          <Route path="/admin/eventos/:eventoId/convites" element={<ProtectedRoute allowedRoles={['admin']}><EventoDetalheConvitesPage /></ProtectedRoute>} />
          <Route path="/admin/eventos/:eventoId/documentos" element={<ProtectedRoute allowedRoles={['admin']}><EventoDetalheDocumentosPage /></ProtectedRoute>} />
          <Route path="/admin/eventos/:eventoId/fornecedores" element={<ProtectedRoute allowedRoles={['admin']}><EventoDetalheFornecedoresPage /></ProtectedRoute>} />
          <Route path="/admin/eventos/:eventoId/pessoas" element={<ProtectedRoute allowedRoles={['admin']}><EventoDetalhePessoasPage /></ProtectedRoute>} />
          <Route path="/admin/eventos/:eventoId/aprovacoes" element={<ProtectedRoute allowedRoles={['admin']}><EventoDetalheAprovacoesPage /></ProtectedRoute>} />
          <Route path="/admin/eventos/:eventoId/taxas" element={<ProtectedRoute allowedRoles={['admin']}><EventoDetalheTaxasPage /></ProtectedRoute>} />
          <Route path="/admin/eventos/:eventoId/normas" element={<ProtectedRoute allowedRoles={['admin']}><EventoDetalheNormasPage /></ProtectedRoute>} />
          <Route path="/admin/eventos/:eventoId/guarita" element={<ProtectedRoute allowedRoles={['admin']}><EventoDetalheGuaritaPage /></ProtectedRoute>} />
          <Route path="/admin/eventos/:eventoId/historico" element={<ProtectedRoute allowedRoles={['admin']}><EventoDetalheHistoricoPage /></ProtectedRoute>} />

          <Route path="/credenciamento" element={<ProtectedRoute allowedRoles={['admin']}><CentralCredenciamentoPage /></ProtectedRoute>} />
          <Route path="/admin/fornecedores-parceiros" element={<ProtectedRoute allowedRoles={['admin']}><FornecedoresParceirosPage /></ProtectedRoute>} />
          <Route path="/admin/fornecedores-parceiros/:parceiroId" element={<ProtectedRoute allowedRoles={['admin']}><FornecedorParceiroDetalhePage /></ProtectedRoute>} />
          <Route path="/admin/guarita" element={<ProtectedRoute allowedRoles={['admin']}><CentralGuaritaAdminPage /></ProtectedRoute>} />
          <Route path="/relatorios" element={<ProtectedRoute allowedRoles={['admin']}><RelatoriosPage /></ProtectedRoute>} />
          <Route path="/configuracoes" element={<ProtectedRoute allowedRoles={['admin']}><ConfiguracoesPage /></ProtectedRoute>} />
          
          {/* Fornecedor Routes */}
          <Route path="/fornecedor-portal" element={<ProtectedRoute allowedRoles={['fornecedor']}><FornecedorPortalPage /></ProtectedRoute>} />
          <Route path="/cadastro-pessoas" element={<ProtectedRoute allowedRoles={['fornecedor']}><CadastroPessoasPage /></ProtectedRoute>} />
          <Route path="/pessoas-cadastradas" element={<ProtectedRoute allowedRoles={['fornecedor']}><PessoasCadastradasPage /></ProtectedRoute>} />
          
          {/* Guarita Routes */}
          <Route path="/guarita" element={<Navigate to="/guarita-access" replace />} />
          <Route path="/guarita-access" element={<ProtectedRoute allowedRoles={['guarita']}><GuaritaAccessPage /></ProtectedRoute>} />
          <Route path="/guarita-solicitacoes" element={<ProtectedRoute allowedRoles={['guarita']}><GuaritaSolicitacoesPage /></ProtectedRoute>} />
          <Route path="/guarita-historico" element={<ProtectedRoute allowedRoles={['guarita']}><GuaritaHistoricoPage /></ProtectedRoute>} />
          </Routes>
          <Toaster />
        </Router>
      </AuthProvider>
    </AppDataProvider>
  );
}

export default App;
