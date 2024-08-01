const axios = require('axios');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const ncp = require('ncp').ncp;
const Deploy = require('../models/deploy'); // 모델 파일 경로에 맞게 수정하세요

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_BRANCH = process.env.GITHUB_BRANCH;


// deployProjects 하위에 deployName 이름의 디렉터리 생성
exports.createDeployDirectory = (deployName) => {
    const outputDir = path.join(__dirname, '../../deployProjects', deployName);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    return outputDir;
};

// 생성된 디렉터리에 사용자가 배포하기 원하는 프로젝트를 복사
exports.copyTemplate = (templatePath, outputDir) => {
    return new Promise((resolve, reject) => {
        ncp(templatePath, outputDir, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

// 배포 로직
exports.deployTemplate = async (templatePath, deployName,commitMessage) => {
    if (!fs.existsSync(templatePath)) {
        throw new Error(`Template path ${templatePath} does not exist.`);
    }

    // 중복되는 deployName 확인
    const existingDeploy = await Deploy.findOne({ where: { deployName } });
    if (existingDeploy) {
         return { error: `Deploy name ${deployName} already exists.` };
    }

    const outputDir = exports.createDeployDirectory(deployName);
    await exports.copyTemplate(templatePath, outputDir);

    // 프로젝트 루트 디렉토리 설정
    const projectRoot = path.resolve(__dirname, '../..');

    // 상대 경로로 변환
    const relativeOutputDir = path.relative(projectRoot, outputDir);
    const relativeTemplatePath = path.relative(projectRoot, templatePath);

    //DB에 데이터 삽입
    try {
        await Deploy.create({
            templatePath: `/${relativeTemplatePath.replace(/\\/g, '/')}`,
            deployProjectPath: `/${relativeOutputDir.replace(/\\/g, '/')}`,
            deployName: deployName
        });
        console.log('Deployment details saved to the database.');
    } catch (error) {
        console.error('Error saving deployment details to the database:', error);
        throw error; // 에러가 발생하면 상위로 던져서 gitDeploy가 실행되지 않도록 함
    }

    await exports.gitDeploy(outputDir, deployName,commitMessage);
};





function zipDirectory(sourceDir, outPath) {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const stream = fs.createWriteStream(outPath);

    return new Promise((resolve, reject) => {
        archive
            .directory(sourceDir, false)
            .on('error', err => reject(err))
            .pipe(stream);

        stream.on('close', () => resolve());
        archive.finalize();
    });
}

async function uploadFileToGitHub(filePath, commitMessage) {
    const fileContent = fs.readFileSync(filePath, 'base64');
    const fileName = path.basename(filePath);
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${fileName}`;

    const data = {
        message: commitMessage,
        content: fileContent,
        branch: GITHUB_BRANCH
    };

    const headers = {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
    };

    try {
        const response = await axios.put(url, data, { headers });
        return response.data;
    } catch (error) {
        throw new Error(`Failed to upload ${fileName}: ${error.message}`);
    }
}

async function deployDirectoryToGitHub(dirPath, commitMessage) {
    const zipPath = path.join(__dirname, 'temp.zip');
    await zipDirectory(dirPath, zipPath);
    await uploadFileToGitHub(zipPath, commitMessage);
    fs.unlinkSync(zipPath); // 업로드 후 임시 zip 파일 삭제
}

module.exports = {
    deployDirectoryToGitHub
};
