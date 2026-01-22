const Request = require('../models/request');
const AiModel = require('../models/aiModel');
const User = require('../models/users');
const Instance = require('../models/instance');
// const Docker = require('dockerode');
// const docker = new Docker({ socketPath: '/var/run/docker.sock' }); // ← Commenté aussi

// Configure les relations ici
Request.belongsTo(AiModel, { foreignKey: 'aiModelId' });
Request.belongsTo(User, { foreignKey: 'userId' });
Request.belongsTo(Instance, { foreignKey: 'instanceId' });

// GET /api/requests - Liste des demandes de l'utilisateur
exports.getUserRequests = async (req, res) => {
  try {
    const requests = await Request.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: AiModel,
          attributes: ['id', 'name', 'description']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      status: true,
      message: 'Requests retrieved successfully',
      data: requests
    });
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({
      status: false,
      message: 'Error fetching requests',
      error: error.message
    });
  }
};

// POST /api/requests - Créer une nouvelle demande
exports.createRequest = async (req, res) => {
  try {
    const { aiModelId } = req.body;

    if (!aiModelId) {
      return res.status(400).json({
        status: false,
        message: 'aiModelId is required'
      });
    }

    // Vérifier que le modèle existe
    const aiModel = await AiModel.findByPk(aiModelId);
    if (!aiModel) {
      return res.status(404).json({
        status: false,
        message: 'AI Model not found'
      });
    }

    // Créer la demande
    const request = await Request.create({
      userId: req.user.id,
      aiModelId,
      status: 'pending'
    });

    res.status(201).json({
      status: true,
      message: 'Request created successfully',
      data: request
    });
  } catch (error) {
    console.error('Error creating request:', error);
    res.status(500).json({
      status: false,
      message: 'Error creating request',
      error: error.message
    });
  }
};

// GET /api/requests/:id - Détails d'une demande
exports.getRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await Request.findByPk(id, {
      include: [
        {
          model: AiModel,
          attributes: ['id', 'name', 'description']
        },
        {
          model: User,
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!request) {
      return res.status(404).json({
        status: false,
        message: 'Request not found'
      });
    }

    // Vérifier que l'utilisateur est propriétaire ou admin
    if (request.userId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        status: false,
        message: 'Access denied'
      });
    }

    res.json({
      status: true,
      message: 'Request retrieved successfully',
      data: request
    });
  } catch (error) {
    console.error('Error fetching request:', error);
    res.status(500).json({
      status: false,
      message: 'Error fetching request',
      error: error.message
    });
  }
};

// POST /api/requests/:id/approve - Approuver une demande (ADMIN)
exports.approveRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await Request.findByPk(id, {
      include: [{ model: AiModel }]
    });

    if (!request) {
      return res.status(404).json({
        status: false,
        message: 'Request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        status: false,
        message: `Request is already ${request.status}`
      });
    }

    // Créer une instance (simulation pour l'instant)
    const instance = await Instance.create({
      userId: request.userId,
      aiModelId: request.aiModelId,
      serviceName: `ollama-${request.aiModel.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      status: 'running',
      port: Math.floor(Math.random() * (9000 - 8000) + 8000)
    });

    // Mettre à jour la demande
    request.status = 'approved';
    request.instanceId = instance.id;
    await request.save();

    // ✅ AJOUTE LA RÉPONSE ICI
    res.json({
      status: true,
      message: 'Request approved and instance deployed',
      data: { request, instance }
    });

    // TODO: Déployer réellement avec Docker plus tard
    // const docker = new Docker({ socketPath: '/var/run/docker.sock' });
    // const service = await docker.createService({ ... });

  } catch (error) {
    console.error('Error approving request:', error);
    res.status(500).json({
      status: false,
      message: 'Error approving request',
      error: error.message
    });
  }
};

// POST /api/requests/:id/reject - Rejeter une demande (ADMIN)
exports.rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const request = await Request.findByPk(id);

    if (!request) {
      return res.status(404).json({
        status: false,
        message: 'Request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        status: false,
        message: `Request is already ${request.status}`
      });
    }

    request.status = 'rejected';
    request.rejectionReason = reason || 'No reason provided';
    await request.save();

    res.json({
      status: true,
      message: 'Request rejected',
      data: request
    });
  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).json({
      status: false,
      message: 'Error rejecting request',
      error: error.message
    });
  }
};

// GET /api/requests/admin/all - Liste toutes les demandes (ADMIN)
exports.getAllRequests = async (req, res) => {
  try {
    const requests = await Request.findAll({
      include: [
        {
          model: AiModel,
          attributes: ['id', 'name', 'description']
        },
        {
          model: User,
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      status: true,
      message: 'All requests retrieved successfully',
      data: requests
    });
  } catch (error) {
    console.error('Error fetching all requests:', error);
    res.status(500).json({
      status: false,
      message: 'Error fetching requests',
      error: error.message
    });
  }
};