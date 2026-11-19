import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { PanelLayout } from "./components/layout/PanelLayout";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { PublicLayout } from "./components/layout/PublicLayout";
import { AuthProvider } from "./context/AuthContext";
import { AgenciesPage } from "./pages/AgenciesPage";
import { AgencyPage } from "./pages/AgencyPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { PropertyDetailPage } from "./pages/PropertyDetailPage";
import { RegisterPage } from "./pages/RegisterPage";
import { NotFoundPage } from "./pages/StatusPages";
import { ActivityPage } from "./pages/panel/ActivityPage";
import { AgencySettingsPage } from "./pages/panel/AgencySettingsPage";
import { MyPropertiesPage } from "./pages/panel/MyPropertiesPage";
import { EditPropertyPage, NewPropertyPage } from "./pages/panel/PropertyFormPage";
import { QuestionsPage } from "./pages/panel/QuestionsPage";
import { ReportsPage } from "./pages/panel/ReportsPage";
import { VisitsPage } from "./pages/panel/VisitsPage";

/**
 * raiz de la app: provee la sesion y define que pagina corresponde a cada url.
 * las pantallas publicas comparten un layout y las del panel otro, que ademas
 * exige tener la sesion iniciada.
 *
 * @returns la app con su ruteo
 */
export const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/propiedades/:id" element={<PropertyDetailPage />} />
          <Route path="/inmobiliarias" element={<AgenciesPage />} />
          <Route path="/inmobiliarias/:id" element={<AgencyPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegisterPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* todo lo que cuelga de /panel exige sesion */}
        <Route
          path="/panel"
          element={
            <ProtectedRoute>
              <PanelLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/panel/propiedades" replace />} />
          <Route path="propiedades" element={<MyPropertiesPage />} />
          <Route path="propiedades/nueva" element={<NewPropertyPage />} />
          <Route path="propiedades/:id/editar" element={<EditPropertyPage />} />
          <Route path="inmobiliaria" element={<AgencySettingsPage />} />
          <Route path="visitas" element={<VisitsPage />} />
          <Route path="consultas" element={<QuestionsPage />} />
          <Route path="actividad" element={<ActivityPage />} />
          <Route path="reportes" element={<ReportsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);
