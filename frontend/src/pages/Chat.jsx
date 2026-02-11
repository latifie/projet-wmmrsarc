import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from '../api/axios';
import Navbar from '../components/Navbar';
import './Chat.css';

function Chat() {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chatStatuses, setChatStatuses] = useState({});
  const messagesEndRef = useRef(null);
  const [searchParams] = useSearchParams();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchChats();
  }, []);

  // Poll status for all chats
  useEffect(() => {
    if (chats.length === 0) return;

    const checkAllStatuses = async () => {
      const statuses = {};
      for (const chat of chats) {
        try {
          const response = await axios.get(`/api/chats/${chat.id}/status`);
          statuses[chat.id] = response.data.data;
        } catch (err) {
          statuses[chat.id] = { modelLoaded: false, containerReady: false };
        }
      }
      setChatStatuses(statuses);
    };

    checkAllStatuses();
    const interval = setInterval(checkAllStatuses, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [chats]);

  const fetchChats = async () => {
    try {
      const response = await axios.get('/api/chats');
      setChats(response.data.data);
    } catch (err) {
      console.error('Error fetching chats:', err);
      setError('Failed to load chats');
    }
  };

  // Handle URL query param selection
  useEffect(() => {
    const chatIdParam = searchParams.get('id');
    if (chatIdParam && chats.length > 0) {
      const chatToSelect = chats.find(c => c.id.toString() === chatIdParam);
      if (chatToSelect && (!selectedChat || selectedChat.id !== chatToSelect.id)) {
        handleSelectChat(chatToSelect);
      }
    }
  }, [chats, searchParams]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !selectedChat) return;

    const userMessage = { role: 'user', content: inputMessage };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);
    setError(null);

    try {
      // Check if model is loaded first
      const statusResponse = await axios.get(`/api/chats/${selectedChat.id}/status`);

      if (!statusResponse.data.data.containerReady) {
        setError('Le conteneur est en cours de démarrage. Veuillez patienter...');
        setLoading(false);
        return;
      }

      if (!statusResponse.data.data.modelLoaded) {
        setError('Le modèle est en cours de téléchargement. Cela peut prendre 1-2 minutes. Veuillez réessayer dans quelques instants.');
        setLoading(false);
        return;
      }

      // Model is ready, send the message
      const response = await axios.post(`/api/chats/${selectedChat.id}/message`, {
        message: inputMessage
      });

      const assistantMessage = {
        role: 'assistant',
        content: response.data.data.response
      };
      setMessages(prev => [...prev, assistantMessage]);
      setError(null);
    } catch (err) {
      console.error('Error sending message:', err);
      if (err.response?.status === 500) {
        setError('Le modèle est peut-être encore en cours de chargement. Veuillez réessayer dans 30 secondes.');
      } else {
        setError(err.response?.data?.message || 'Échec de l\'envoi du message.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    setMessages([]);
    setError(null);
  };

  // Poll model status when chat is selected
  useEffect(() => {
    if (!selectedChat) return;

    let pollInterval;
    let hasNotified = false;

    const checkModelStatus = async () => {
      try {
        const response = await axios.get(`/api/chats/${selectedChat.id}/status`);
        const { modelLoaded, containerReady } = response.data.data;

        if (modelLoaded && containerReady && !hasNotified) {
          setError('✅ Le modèle est prêt! Vous pouvez maintenant envoyer des messages.');
          hasNotified = true;
          setTimeout(() => setError(null), 5000); // Clear message after 5 seconds
          if (pollInterval) clearInterval(pollInterval);
        } else if (!modelLoaded && containerReady) {
          setError('⏳ Téléchargement du modèle en cours... Veuillez patienter.');
        } else if (!containerReady) {
          setError('🔄 Démarrage du conteneur...');
        }
      } catch (err) {
        console.error('Error checking model status:', err);
      }
    };

    // Check immediately
    checkModelStatus();

    // Then poll every 5 seconds
    pollInterval = setInterval(checkModelStatus, 5000);

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [selectedChat]);

  return (
    <div className="chat-page">
      <Navbar />
      <div className="chat-container">
        <div className="chat-sidebar">
          <h2>Your Chats</h2>
          {chats.length === 0 ? (
            <p className="no-chats">No active deployments</p>
          ) : (
            <ul className="chat-list">
              {chats.map(chat => {
                const status = chatStatuses[chat.id] || { modelLoaded: false, containerReady: false };
                const progress = status.downloadProgress;
                const statusIcon = status.modelLoaded && status.containerReady ? '✅' :
                  (progress && progress.percent > 0) || status.containerReady ? '⏳' : '🔄';
                const statusText = status.modelLoaded && status.containerReady ? 'Prêt' :
                  progress && progress.percent > 0 ? `${progress.percent}%` :
                    status.containerReady ? 'Téléchargement...' : 'Démarrage...';

                return (
                  <li
                    key={chat.id}
                    className={selectedChat?.id === chat.id ? 'active' : ''}
                    onClick={() => handleSelectChat(chat)}
                  >
                    <div className="chat-item">
                      <strong>{chat.model}</strong>
                      <small>ID: {chat.id}</small>
                      <span className="chat-status">{statusIcon} {statusText}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="chat-main">
          {!selectedChat ? (
            <div className="chat-placeholder">
              <h2>Select a chat to start</h2>
              <p>Choose a deployed AI model from the sidebar</p>
            </div>
          ) : (
            <>
              <div className="chat-header">
                <h2>{selectedChat.model}</h2>
                <small>Connected to: {selectedChat.url}</small>
              </div>

              <div className="messages-container">
                {messages.length === 0 && (
                  <div className="welcome-message">
                    <p>Start a conversation with {selectedChat.model}</p>
                  </div>
                )}
                {messages.map((msg, idx) => (
                  <div key={idx} className={`message ${msg.role}`}>
                    <div className="message-content">
                      {msg.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="message assistant">
                    <div className="message-content loading">
                      Thinking...
                    </div>
                  </div>
                )}
                {error && (
                  <div className="error-message">
                    {error}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form className="message-input-form" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type your message..."
                  disabled={loading}
                  className="message-input"
                />
                <button type="submit" disabled={loading || !inputMessage.trim()}>
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Chat;