var Dockerode = require('dockerode');
var DockerodeCompose = require('dockerode-compose');

var docker = new Dockerode({ socketPath: '/run/user/1000/podman/podman.sock' });

module.exports = {
    async createInstance(id) {
        var compose = new DockerodeCompose(docker, __dirname + '/compose.yml', "chat_" + id);

        await compose.pull()
        await compose.up()

        return "http://localhost:6767/"
    }
}