import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';

function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
     {
      id: 1,
      role: 'assistant',
      content: 'Bonjour ! Je suis votre assistant IA. Comment puis-je vous aider aujourd\'hui ?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    
    if (!input.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // TODO: Intégrer avec l'API Ollama/LLM
    // Simulation de réponse pour l'instant
    setTimeout(() => {
      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Cette fonctionnalité sera bientôt connectée à Ollama. Pour l\'instant, c\'est une simulation.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      setLoading(false);
    }, 1000);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="chat-page">
      <Navbar />
      
      <div className="chat-container">
        {/* Sidebar des conversations */}
        <div className="chat-sidebar">
          <div className="chat-sidebar-header">
            <h2>Conversations</h2>
            <button className="btn-new-chat">
              <span>+</span>
              Nouveau chat
            </button>
          </div>
          
          <div className="chat-list">
            <div className="chat-item active">
              <div className="chat-item-title">Conversation actuelle</div>
              <div className="chat-item-preview">Dernière activité</div>
            </div>
          </div>
        </div>

        {/* Zone de chat principale */}
        <div className="chat-main">
          <div className="chat-header">
            <div className="chat-info">
              <h3>Chat avec Ollama</h3>
              <p className="chat-status">
                <span className="status-dot"></span>
                Prêt
              </p>
            </div>
          </div>

          <div className="chat-messages">
            {messages.map(message => (
              <div 
                key={message.id} 
                className={`message ${message.role}`}
              >
                <div className="message-avatar">
                  {message.role === 'user' ? (
                    <span>{user?.name?.charAt(0) || 'U'}</span>
                  ) : (
                    <span>🤖</span>
                  )}
                </div>
                <div className="message-content">
                  <div className="message-header">
                    <span className="message-author">
                      {message.role === 'user' ? user?.name : 'Assistant'}
                    </span>
                    <span className="message-time">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  <div className="message-text">
                    {message.content}
                  </div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="message assistant">
                <div className="message-avatar">
                  <span>🤖</span>
                </div>
                <div className="message-content">
                  <div className="message-text">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="chat-input-container">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tapez votre message..."
              className="chat-input"
              disabled={loading}
            />
            <button 
              type="submit" 
              className="btn-send"
              disabled={!input.trim() || loading}
            >
              Envoyer
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Chat;