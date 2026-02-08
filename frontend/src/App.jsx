import { Navigate, Route, Routes } from 'react-router-dom';

import Navbar from './components/Navbar';
import CreateItemPage from './pages/CreateItemPage';
import ItemDetailPage from './pages/ItemDetailPage';
import ItemsPage from './pages/ItemsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/items" element={<ItemsPage />} />
        <Route path="/items/:id" element={<ItemDetailPage />} />
        <Route path="/create" element={<CreateItemPage />} />
        <Route path="*" element={<Navigate to="/items" replace />} />
      </Routes>
    </>
  );
}

export default App;
