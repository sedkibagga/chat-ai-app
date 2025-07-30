import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Chat from './components/Chat';
import { ChatProvider } from './context/ChatContext';
import TestAudioPage from './pages/TestAudioPage';
import ChatAsistant from './pages/ChatAsistant';

function App() {
  return (
    <ChatProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/test" element={<TestAudioPage/>} />
          <Route path='/chatAsistant' element={<ChatAsistant />} />
        </Routes>
      </Router>
    </ChatProvider>
  );
}

export default App;
