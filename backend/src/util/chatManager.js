var Dockerode = require('dockerode');

var docker = new Dockerode({ socketPath: process.env.DOCKER_HOST });

module.exports = {
    async createInstance(id, model) {
        var container_name = "chat_" + id
        var volume_name = container_name + "_data"
        var port = 20000 + id

        await docker.createContainer({
            Image: 'docker.io/ollama/ollama:latest',
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
        }).then(function (container) {
            container.start()
        })

        // TODO: wait start & pull model

        return "http://localhost:" + port
    }
}