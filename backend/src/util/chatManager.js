var Dockerode = require('dockerode');
const axios = require('axios');

var docker = new Dockerode({ socketPath: process.env.DOCKER_HOST || '/var/run/docker.sock' });

module.exports = {
    async createInstance(id) {
        var container_name = "chat_" + id
        var volume_name = container_name + "_ollama"
        var port = 20000 + id

        try {
            // Cleanup existing container if any (handling restart/DB reset scenarios)
            const existingContainer = docker.getContainer(container_name);
            try {
                const info = await existingContainer.inspect();
                if (info) {

                    await existingContainer.remove({ force: true });
                }
            } catch (e) {
                // Container doesn't exist, ignore
            }


            const container = await docker.createContainer({
                Image: 'ollama/ollama',
                name: container_name,
                HostConfig: {
                    Binds: [volume_name + ":/root/.ollama"],
                    PortBindings: { "11434/tcp": [{ HostPort: `${port}` }] },
                    RestartPolicy: {
                        "Name": "always"
                    }
                },
                AttachStdout: false,
                AttachStderr: false
            })


            await container.start()
        } catch (error) {
            console.error(`Failed to create/start container ${container_name}:`, error)
            throw error
        }

        return "http://localhost:" + port
    },


    async pullModel(containerUrl, modelName, chatId) {
        const progressCache = require('./downloadProgressCache');

        try {
            // Extract model tag (remove 'ollama/' prefix if present)
            const modelTag = modelName.replace(/^ollama\//, '')



            // Initialize progress
            progressCache.setProgress(chatId, {
                percent: 0,
                downloaded: 0,
                total: 0,
                status: 'starting'
            });

            // Wait for Ollama to be ready
            let retries = 10;
            while (retries > 0) {
                try {
                    await axios.get(`${containerUrl}/api/tags`, { timeout: 2000 });
                    break;
                } catch (err) {

                    await new Promise(resolve => setTimeout(resolve, 2000));
                    retries--;
                }
            }

            if (retries === 0) {
                throw new Error('Ollama container failed to start in time');
            }

            // Call Ollama API to pull the model with streaming
            const response = await axios.post(`${containerUrl}/api/pull`, {
                name: modelTag,
                stream: true
            }, {
                timeout: 600000, // 10 minutes timeout for large models
                responseType: 'stream'
            })

            let lastStatus = ''
            let downloadedBytes = 0
            let totalBytes = 0

            // Process the stream
            return new Promise((resolve, reject) => {
                response.data.on('data', (chunk) => {
                    const lines = chunk.toString().split('\n').filter(line => line.trim())

                    lines.forEach(line => {
                        try {
                            const data = JSON.parse(line)

                            if (data.status && data.status !== lastStatus) {

                                lastStatus = data.status

                                progressCache.setProgress(chatId, {
                                    percent: 0,
                                    downloaded: 0,
                                    total: 0,
                                    status: data.status
                                });
                            }

                            if (data.total && data.completed) {
                                totalBytes = data.total
                                downloadedBytes = data.completed
                                const percent = ((downloadedBytes / totalBytes) * 100).toFixed(1)
                                const mbDownloaded = (downloadedBytes / 1024 / 1024).toFixed(1)
                                const mbTotal = (totalBytes / 1024 / 1024).toFixed(1)


                                // Update cache
                                progressCache.setProgress(chatId, {
                                    percent: parseFloat(percent),
                                    downloaded: downloadedBytes,
                                    total: totalBytes,
                                    status: 'downloading'
                                });
                            }
                        } catch (e) {
                            // Ignore JSON parse errors
                        }
                    })
                })

                response.data.on('end', () => {


                    progressCache.setProgress(chatId, {
                        percent: 100,
                        downloaded: totalBytes,
                        total: totalBytes,
                        status: 'completed'
                    });

                    // Clear cache after 5 seconds
                    setTimeout(() => progressCache.clearProgress(chatId), 5000);

                    resolve({ status: 'success' })
                })

                response.data.on('error', (error) => {
                    console.error(`[MODEL PULL] ❌ Failed to pull ${modelTag}:`, error.message)
                    progressCache.clearProgress(chatId);
                    reject(error)
                })
            })
        } catch (error) {
            console.error(`[MODEL PULL] ❌ Failed to pull model ${modelName}:`, error.message)
            progressCache.clearProgress(chatId);
            throw error
        }
    }
}