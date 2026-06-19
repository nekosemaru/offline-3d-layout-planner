import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { LayoutCanvas } from './components/LayoutCanvas';
import { Guide } from './components/Guide';

type View = 'editor' | 'guide';

const App: React.FC = () => {
  const [view, setView] = useState<View>('editor');

  return (
    <div className="app-root">
      <header className="app-header">
        <span className="app-title">3Dレイアウトプランナー</span>
        <nav className="app-tabs">
          <button
            className={`app-tab ${view === 'editor' ? 'active' : ''}`}
            onClick={() => setView('editor')}
          >
            エディタ
          </button>
          <button
            className={`app-tab ${view === 'guide' ? 'active' : ''}`}
            onClick={() => setView('guide')}
          >
            使い方・FAQ
          </button>
        </nav>
      </header>
      {view === 'editor' ? (
        <div className="app-layout">
          <Sidebar />
          <main className="canvas-area">
            <LayoutCanvas />
          </main>
        </div>
      ) : (
        <Guide />
      )}
    </div>
  );
};

export default App;
