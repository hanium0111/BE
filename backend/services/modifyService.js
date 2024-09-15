const axios = require('axios');
const fs = require('fs');
const path = require('path');
const Dashboard = require('../models/dashboard'); // 모델 파일 경로에 맞게 수정하세요
const { captureScreenshot } = require('./generateService');

exports.modifyElement = async (domElement, modificationRequest) => {
  try {
      const messages = [
          {
              role: "system",
              content: "You are an assistant that helps modify HTML DOM elements."
          },
          {
              role: "user",
              content: `Modify the following DOM element as requested and return only the modified element without including any additional characters or symbols.

DOM Element:
${domElement}

Modification:
${modificationRequest}

Return only the modified element:`
          }
      ];

      // GPT API 호출
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
          model: "gpt-4o-mini", // 올바른 모델 이름 사용
          messages: messages,
          max_tokens: 1000,
          temperature: 0.7,
      }, {
          headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, // OpenAI API 키를 인증 헤더에 포함합니다.
              'Content-Type': 'application/json'
          }
      });

      // GPT의 응답에서 수정된 DOM 요소 추출
      const gptGeneratedElement = response.data.choices[0].message.content.trim();
      return gptGeneratedElement;
  } catch (error) {
      console.error('Error processing prompt with GPT:', error.message);
      throw new Error('Error processing prompt with GPT: ' + error.message);
  }
};

exports.updateHtmlFile = async (filePath, originalElement, modifiedElement) => {
    return new Promise(async (resolve, reject) => {
        try {
            // filePath에서 '/copied_userTemplates/template1' 부분만 추출
            const parts = filePath.split(path.sep);
            const directoryPath = `/${parts[1]}/${parts[2]}`; // 슬래시를 포함한 경로 생성

            // Dashboard 테이블에서 해당 경로와 일치하는 항목 찾기
            const dashboard = await Dashboard.findOne({ where: { projectPath: directoryPath } });

            if (!dashboard) {
                return reject(new Error('Dashboard not found.'));
            }

            const htmlFilePath = path.join(__dirname, '../..', filePath);

            // HTML 파일 읽기
            fs.readFile(htmlFilePath, 'utf8', (err, data) => {
                if (err) {
                    return reject(new Error('Error reading HTML file.'));
                }

                // 원본 DOM 요소를 찾아 수정된 요소로 교체
                const escapedOriginalElement = originalElement.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
                const regex = new RegExp(escapedOriginalElement, 'g');
                const updatedHtmlContent = data.replace(regex, modifiedElement);

                // 수정된 HTML 파일 저장
                fs.writeFile(htmlFilePath, updatedHtmlContent, 'utf8', async (err) => {
                    if (err) {
                        return reject(new Error('Error writing to HTML file.'));
                    }

                    // 업데이트 성공 시 dashboard.modified를 true로 설정
                    dashboard.modified = true;
                    await dashboard.save();

                    resolve();
                });
            });
        } catch (error) {
            reject(error);
        }
    });
};

// 전체 HTML 페이지를 수정하는 함수
exports.modifyEntirePage = async (filePath, modificationRequest) => {
    try {
        const htmlFilePath = path.join(__dirname, '../..', filePath);

        // filePath에서 '/copied_userTemplates/template1' 부분만 추출
        const parts = filePath.split(path.sep);
        const directoryPath = `/${parts[1]}/${parts[2]}`; // 슬래시를 포함한 경로 생성

        // Dashboard 테이블에서 해당 경로와 일치하는 항목 찾기
        const dashboard = await Dashboard.findOne({ where: { projectPath: directoryPath } });


        if (!dashboard) {
            throw new Error('Dashboard not found.');
        }

        // HTML 파일의 전체 내용 읽기
        const htmlContent = await fs.promises.readFile(htmlFilePath, 'utf8');

        const messages = [
            {
                role: "system",
                content: "You are a helpful assistant."
            },
            {
                role: "user",
                content: `Modify the HTML content below to match the user's requirements
Current HTML:
${htmlContent}

Modification Requirements:
${modificationRequest}`
            }
        ];

        // GPT API 호출
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4o-mini",
            messages: messages,
            max_tokens: 16384,
            temperature: 0.7,
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        // GPT의 응답에서 수정된 페이지 콘텐츠 추출
        let gptGeneratedPage = response.data.choices[0].message.content.trim();

        // HTML 태그만 추출하기 위한 정규 표현식 사용
        const htmlMatch = gptGeneratedPage.match(/<!DOCTYPE html>[\s\S]*<html[^>]*>([\s\S]*?)<\/html>/i);
        if (htmlMatch) {
            gptGeneratedPage = htmlMatch[0];
        }

        // 수정된 HTML 페이지 내용을 덮어쓰는 방식으로 저장
        await fs.promises.writeFile(htmlFilePath, gptGeneratedPage, 'utf8');


        // dashboard.imagePath를 절대 경로로 변환
        const screenshotAbsolutePath = path.join(__dirname, '../..', dashboard.imagePath);

        const localServerUrl = `https://1am11m.store${directoryPath}/index.html`;
        
        // Puppeteer를 사용하여 스크린샷 찍기
        await captureScreenshot(localServerUrl, screenshotAbsolutePath);

        console.log(`Screenshot saved to: ${screenshotAbsolutePath}`);
        

        // 업데이트 성공 시 dashboard.modified를 true로 설정
        dashboard.modified = true;
        await dashboard.save();

        return gptGeneratedPage;
    } catch (error) {
        console.error('Error processing prompt with GPT:', error.response ? error.response.data : error.message);
        throw new Error('Error processing prompt with GPT: ' + error.message);
    }
};

// 이미지 업로드 서비스 

exports.saveUploadedFile = async (file, targetDir, imgFilename) => {
    
    // __dirname을 기준으로 절대 경로 생성
  const targetPath = path.join(__dirname, '../../',targetDir,imgFilename);
  
    // 기존 파일이 있으면 삭제
    try {
      fs.unlink(targetPath);
    } catch (error) {
      // 파일이 없으면 무시
    }
  
    // 파일을 지정된 경로로 이동
    fs.rename(file.path, targetPath);
  
    return targetPath;
  };
  
exports.updateImageSrcInHTML = async (pagePath, oldSrc, newSrc) => {
    try {
      let htmlContent = fs.readFile(pagePath, 'utf-8');
  
      // 이미지 태그의 src 속성을 새 이미지로 업데이트
      const updatedContent = htmlContent.replace(new RegExp(oldSrc, 'g'), newSrc);
  
      // 업데이트된 내용을 다시 파일에 씀
      fs.writeFile(pagePath, updatedContent, 'utf-8');

      // index.html 파일이 수정된 경우 스크린샷 찍기
      if (path.basename(pagePath) === 'index.html') {

        // filePath에서 '/copied_userTemplates/template1' 부분만 추출
        const parts = filePath.split(path.sep);
        const directoryPath = `/${parts[1]}/${parts[2]}`; // 슬래시를 포함한 경로 생성

        // Dashboard 테이블에서 해당 경로와 일치하는 항목 찾기
        const dashboard = await Dashboard.findOne({ where: { projectPath: directoryPath } });

        // 로컬 서버 URL 생성
        const localServerUrl = `https://1am11m.store/${directoryPath}/index.html`;

        if (!dashboard) {
            throw new Error('Dashboard not found.');
        }

        // dashboard.imagePath를 절대 경로로 변환
        const screenshotAbsolutePath = path.resolve(__dirname, '../..', dashboard.imagePath);

        // Puppeteer를 사용하여 스크린샷 찍기
        await captureScreenshot(localServerUrl, screenshotAbsolutePath);

        console.log(`Screenshot saved to: ${screenshotAbsolutePath}`);

        // 업데이트 성공 시 dashboard.modified를 true로 설정
        dashboard.modified = true;
        await dashboard.save();

    }
    } catch (error) {
      throw new Error(`Failed to update image src in ${pagePath}: ${error.message}`);
    }
};
  