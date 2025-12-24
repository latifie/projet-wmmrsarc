# Notre projet:

Réalisation un cloud qui permet d'automatiquement déployer un modèle de LLM basé sur ollama.

Nous pensons que pour réaliser ce projet à bien, nous allons utiliser l'image docker ollama/ollama `https://hub.docker.com/r/ollama/ollama` et kubernetes pour automatiquement déployer notre solution.
En partant de l'image docker de Ollama, nous allons demander à nos 'client' d'utiliser cette doc: `https://docs.ollama.com/quickstart#curl` pour communiquer avec ollama.

Notre solution consistera à réaliser un site web suivant le modèle frontend-backend, pour que nos clients puissent nous demander des machines qui ont ollama qui tournent dessus, et que nous puission, en étant connecté en administrateur sur notre plateforme, accepter leur demandes.

On peut trouver à cette addresse des example pour démarrer l'image docker/pour mettre en place un contexte

`https://docs.ollama.com/api/introduction`
