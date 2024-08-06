// services/dashboardService.js
const Dashboard = require('../models/dashboard');
const SharedTemplates = require('../models/sharedTemplates');
const fs = require('fs-extra');
const path = require('path');


// 데이터베이스에 저장하는 함수
exports.saveDashboard = async (projectData) => {
  try {
    const newProject = await Dashboard.create(projectData);
    console.log('Project saved successfully:', newProject);
    return newProject;
  } catch (error) {
    console.error('Error saving project to database:', error);
    throw new Error('Failed to save project to database.');
  }
};


// 이메일을 기준으로 대시보드 가져옴
exports.getDashboardsByEmail = async (email) => {
  const dashboards = await Dashboard.findAll({
    where: { email: email }
  });

  return dashboards;
};

//대시보드 이름을 수정
exports.updateDashboardName = async (id, newName) => {
  const dashboard = await Dashboard.findByPk(id);
  if (!dashboard) {
    throw new Error('Dashboard not found');
  }
  if (dashboard.shared) {
    const sharedTemplates = await SharedTemplates.findOne({
      where: {
        dashboardKey: dashboard.id
      }
    });
    if (!sharedTemplates) {
      throw new Error('Shared template not found');
    }
    sharedTemplates.templateName = newName;
    await sharedTemplates.save();
  }
  dashboard.projectName = newName;
  await dashboard.save();
  return dashboard;
};

 //id를 키로 프로젝트 경로를 리턴. 사용자가 해당 대시보드 클릭 시 프로젝트 경로를 리턴하여 이어서 작업할 수 있도록 함
 exports.getProjectPathById = async (id) => {
  const dashboard = await Dashboard.findByPk(id, {
  attributes: ['projectPath'],
  });
  if (!dashboard) {
  throw new Error('Dashboard not found');
  }
  return dashboard.projectPath;
};

// 스크린샷을 찍기 위해 경로를 기준으로 이미지 경로와 프로젝트이름을 가져옴
 exports.getDashboardsByProjectPath = async (projectPath) => {
  const dashboard = await Dashboard.findOne({
    where: { projectPath: projectPath },
    attributes: ['imagePath', 'projectName'],
  });
  if (!dashboard) {
    throw new Error('No dashboards found for the given project path');
  }
  return dashboard; // findOne은 객체를 반환합니다
};

//대시보드를 템플릿으로 공유
exports.shareDashboard = async (id, category, description, user) => {
  const dashboard = await Dashboard.findByPk(id);
  if (!dashboard) {
    throw new Error('Dashboard not found');
  }

  const originalTemplatePath = dashboard.projectPath; // e.g., 'copied_userTemplates/broadcast'
  const originalImagePath = dashboard.imagePath;

  // 새로운 템플릿 경로 설정 (디렉터리 복사)
  const newTemplatePath = path.join('sharedTemplates', originalTemplatePath.replace('copied_userTemplates', ''));
  const newImagePath = path.join('sharedpage_screenshots', originalImagePath.replace('page_screenshots', ''));

  // 디렉토리가 없는 경우 생성
  await fs.ensureDir(path.dirname(newTemplatePath));
  await fs.ensureDir(path.dirname(newImagePath));

  // 디렉터리 복사
  await fs.copy(originalTemplatePath, newTemplatePath);

  if (originalImagePath) {
    await fs.copy(originalImagePath, newImagePath);
  }

  const sharedTemplate = await SharedTemplates.create({
    displayName: user.displayName,
    templateName:dashboard.projectName,
    dashboardKey:dashboard.id,
    email: user.email,
    profileImageUrl: user.profileImageUrl,
    category,
    templatePath: newTemplatePath,
    imagePath: newImagePath,
    description,
  });

  dashboard.shared = true;
  await dashboard.save();

  return sharedTemplate;
};


//특정 대시보드 삭제
exports.deleteDashboard = async (dashboardId) => {
  const dashboard = await Dashboard.findByPk(dashboardId);
  if (!dashboard) {
    throw new Error('Dashboard not found');
  }

  const projectPath = dashboard.projectPath;
  const imagePath = dashboard.imagePath;

  //절대경로
  const project_absolute_path = path.join(__dirname, '../..',projectPath);
  const image_absolute_path = path.join(__dirname, '../..',imagePath);

  try {
    // Dashboard 테이블에서 항목 삭제
    const result = await Dashboard.destroy({ where: { id: dashboardId } });

    // 파일 시스템에서 디렉터리 및 파일 삭제
    if (projectPath) {
      await fs.remove(project_absolute_path);
    }
    if (imagePath) {
      await fs.remove(image_absolute_path);
    }

    return result;
  } catch (error) {
    throw new Error('Error deleting dashboard: ' + error.message);
  }
};

//특정 대시보드 공유 중지
exports.stopSharingDashboard = async (id, user) => {
  const dashboard = await Dashboard.findByPk(id);
  if (!dashboard) {
    throw new Error('Dashboard not found');
  }

  if (!dashboard.shared) {
    throw new Error('Dashboard is not shared');
  }

  // sharedTemplates 테이블에서 해당 항목을 삭제
  const templateName = path.basename(dashboard.projectPath); // 디렉토리 마지막 이름
  const deletedTemplate = await SharedTemplates.findOne({
    where: {
      email: user.email,
      templatePath: {
        [Op.like]: `%/${templateName}`
      }
    }
  });

  if (!deletedTemplate) {
    throw new Error('Shared template not found or user does not have permission to delete it');
  }

  const templatePath = deletedTemplate.templatePath;
  const imagePath = deletedTemplate.imagePath;

  // sharedTemplates 테이블에서 항목 삭제
  await SharedTemplates.destroy({
    where: {
      id: deletedTemplate.id
    }
  });

  // 파일 시스템에서 디렉터리 및 파일 삭제
  await fs.remove(templatePath);
  if (imagePath) {
    await fs.remove(imagePath);
  }

  // dashboard 테이블에서 shared 필드를 false로 업데이트
  dashboard.shared = false;
  await dashboard.save();

  return dashboard;
};