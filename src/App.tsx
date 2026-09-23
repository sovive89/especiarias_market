import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { DeliveriesPage } from "./pages/DeliveriesPage";
import { HistoryPage } from "./pages/HistoryPage";
import { HomePage } from "./pages/HomePage";
import { ProfilePage } from "./pages/ProfilePage";
import { RoutePage } from "./pages/RoutePage";

/*
 * Antes: as telas eram trocadas com useState, então o botão "voltar" do celular
 * não funcionava e não dava para abrir uma tela direto pelo link.
 * Agora cada tela tem um endereço de verdade (react-router).
 */
export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="rota" element={<RoutePage />} />
        <Route path="entregas" element={<DeliveriesPage />} />
        <Route path="historico" element={<HistoryPage />} />
        <Route path="perfil" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
