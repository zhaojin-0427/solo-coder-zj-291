import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home';
import Game from '@/pages/Game';
import Learn from '@/pages/Learn';
import Practice, { PracticeSelect } from '@/pages/Practice';
import BusinessDay from '@/pages/BusinessDay';
import FreeCreate from '@/pages/FreeCreate';
import Gallery from '@/pages/Gallery';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game/:levelId" element={<Game />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/practice" element={<PracticeSelect />} />
        <Route path="/practice/:patternType" element={<Practice />} />
        <Route path="/business-day" element={<BusinessDay />} />
        <Route path="/free-create" element={<FreeCreate />} />
        <Route path="/free-create/:artworkId" element={<FreeCreate />} />
        <Route path="/gallery" element={<Gallery />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
