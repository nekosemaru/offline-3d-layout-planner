import { Sidebar } from './components/Sidebar';
import { LayoutCanvas } from './components/LayoutCanvas';

const App: React.FC = () => {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="canvas-area">
        <LayoutCanvas />
      </main>
    </div>
  );
};

export default App;
