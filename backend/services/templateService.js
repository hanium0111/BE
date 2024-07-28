const basicTemplates = require('../models/basicTemplates'); // Sequelize 모델
const sharedTemplates= require('../models/sharedTemplates'); // Sequelize 모델
const Dashboard = require('../models/dashboard'); //sequelize 모델

const fs = require('fs-extra');
const path = require('path');

// 모든 basic템플릿의 'id','websiteType','feature','mood'를 가져옵니다.
exports.getAllbasicTemplates = async () => {
  // 데이터베이스에서 모든 템플릿을 가져옵니다.
  return await basicTemplates.findAll({
    attributes: ['id','websiteType', 'feature','mood'] // 가져올 필드를 명시합니다.
  });
};

//id를 키로 basic템플릿의 경로를 추출합니다.
exports.getbasicTemplatePathById = async (id) => {
  return await basicTemplates.findByPk(id, {
    attributes: ['templateName','templatePath']
  });
};

//모든 shared템플릿을 가져옵니다.
exports.getAllsharedTemplates = async () => {
  // 데이터베이스에서 모든 shared템플릿을 가져옵니다.
  return await sharedTemplates.findAll();
};


// 공유된 템플릿을 사용하기를 클릭하면 해당 템플릿을 복사하여 작업할 수 있게합니다.
exports.usesharedTemplate = async (templateId, pageName, userEmail) => {
  const template = await sharedTemplates.findByPk(templateId);
  if (!template) {
    throw new Error('Template not found');
  }

  const timestamp = Date.now();
  const newDirName = `${pageName}_${userEmail}_${timestamp}`;
  const newTemplatePath = path.join('copied_userTemplates', newDirName);

  // 디렉토리가 없는 경우 생성
  await fs.ensureDir(newTemplatePath);

  // 디렉터리 복사
  await fs.copy(template.templatePath, newTemplatePath);

  // 새로운 이미지 경로 설정
  const newImagePath = path.join('page_screenshots', `${newDirName}.png`);
  await fs.copy(template.imagePath, newImagePath);

  // dashboard 테이블에 저장
  const newDashboard = await Dashboard.create({
    projectName: pageName,
    projectPath: newTemplatePath,
    imagePath: newImagePath,
    shared: false,
    email: userEmail,
    like: 0,
    publish: false,
    websiteType: template.category,
    features: '',
    mood: '',
    content: '',
  });

  return newTemplatePath;
};
  

//좋아요 클릭 시 숫자 증가
exports.likeTemplate = async (templateId) => {
  const template = await sharedTemplates.findByPk(templateId);
  if (!template) {
    throw new Error('Template not found');
  }

  // 좋아요 증가
  template.likes += 1;
  await template.save();

  // 경로의 마지막 부분 추출
  const templatePathBaseName = path.basename(template.templatePath);

  // 해당 대시보드의 좋아요도 증가
  const dashboard = await Dashboard.findAll({
    where: {
      email: template.email,
      projectPath: { [Op.like]: `%/${templatePathBaseName}` }
    }
  });

  if (dashboard) {
    dashboard.like += 1;
    await dashboard.save();
  }

  return template;
};