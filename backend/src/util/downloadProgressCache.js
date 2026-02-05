// Cache global pour stocker la progression des téléchargements
const downloadProgress = new Map();

module.exports = {
    setProgress(chatId, data) {
        downloadProgress.set(chatId, {
            ...data,
            lastUpdate: Date.now()
        });
    },

    getProgress(chatId) {
        return downloadProgress.get(chatId) || null;
    },

    clearProgress(chatId) {
        downloadProgress.delete(chatId);
    },

    // Nettoyer les entrées obsolètes (>10 min)
    cleanup() {
        const now = Date.now();
        for (const [chatId, data] of downloadProgress.entries()) {
            if (now - data.lastUpdate > 600000) {
                downloadProgress.delete(chatId);
            }
        }
    }
};

// Nettoyage automatique toutes les 5 minutes
setInterval(() => {
    module.exports.cleanup();
}, 300000);
