// backend/controllers/deployController.js
const deployService = require('../services/deployService');
const path = require('path');

const deploy = async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const deployName=req.body.deployName
  const projectPath = path.resolve(__dirname, '../../', req.body.projectPath); // 경로 수정
  const commitMessage = req.body.commitMessage || 'Deploy template';

  try {
    const result = await deployService.deployToGitHub(projectPath, commitMessage);
    res.status(200).json({ message: 'Template deployed successfully', result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  deploy
};
