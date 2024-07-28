const userTemplateService = require('../services/userTemplateService');
const modifyGptService = require('../services/modifyGptService');

// 사용자의 템플릿 정보

exports.getDirectoryStructure = async (req, res) => {
  const { dirPath } = req.query;  // 쿼리 파라미터로 디렉터리 경로 받기
  try {
    const directories = await userTemplateService.getDirectoryStructure(dirPath);
    res.json(directories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read directory' });
  }
};

exports.getFileContents = async (req, res) => {
  const { filePath } = req.query;  // 쿼리 파라미터로 디렉터리 및 파일 경로 받기
  try {
    const content = await userTemplateService.getFileContents(filePath);
    res.json(content);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read file' });
  }
};

exports.modifyFileWithGpt = async (req, res) => {
  const { filePath, prompt } = req.body;  // 요청 본문으로 데이터 받기
  try {
    const originalContent = await userTemplateService.getFileContents(filePath);
    const modifiedContent = await modifyGptService.modifyContent(originalContent, prompt);
    await userTemplateService.updateFileContents(filePath, modifiedContent);
    res.json({ message: 'File modified successfully', content: modifiedContent });
  } catch (error) {
    res.status(500).json({ error: 'Failed to modify file' });
  }
};
