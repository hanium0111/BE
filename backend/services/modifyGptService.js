const axios = require('axios');

exports.modifyContent = async (originalContent, prompt) => {
  const gptResponse = await axios.post('https://api.openai.com/v1/engines/davinci-codex/completions', {
    prompt: `${prompt}\n\n${originalContent}`,
    max_tokens: 1000,
    n: 1,
    stop: null,
    temperature: 0.7
  }, {
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  const modifiedContent = gptResponse.data.choices[0].text.trim();
  return modifiedContent;
};
