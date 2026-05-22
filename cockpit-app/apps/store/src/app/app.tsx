import { Route, Routes } from 'react-router-dom';
import StoreBrowserPage from './features/store/pages/StoreBrowserPage/StoreBrowserPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<StoreBrowserPage />} />
    </Routes>
  );
}
