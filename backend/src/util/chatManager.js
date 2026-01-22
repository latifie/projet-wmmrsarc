var Dockerode = require('dockerode');

var docker = new Dockerode({ socketPath: process.env.DOCKER_HOST });

module.exports = {
    async createInstance(id) {
        var container_name = "chat_" + id
        var volume_name = container_name + "_open-webui"
        var port = 20000 + id

        await docker.createContainer({
            Image: 'ghcr.io/open-webui/open-webui:ollama',
            name: container_name,
            Env: ["WEBUI_AUTH=False"],
            HostConfig: {
                Binds: [volume_name + ":/app/backend/data"],
                PortBindings: { "8080/tcp": [{ HostPort: `${port}` }] },
                RestartPolicy: {
                    "Name": "always"
                }
            },
            AttachStdout: false,
            AttachStderr: false
        }).then(function (container) {
            container.start()
        })

        return "http://localhost:" + port
    }
}