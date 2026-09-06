import { Navigate, Route, Routes } from 'react-router-dom';
import { Landing } from './pages/Landing';
import { ThePlatform } from './pages/ThePlatform';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/the-platform" element={<ThePlatform />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
