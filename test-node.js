import axios from 'axios';

async function testOllama() {
  try {
    const tagsRes = await axios.get('http://localhost:11434/api/tags');
    const tags = tagsRes.data;

    console.log('✅ Connected to Ollama');
    console.log(
      '📦 Available models:',
      tags.models.map(m => m.name)
    );

    if (tags.models.length === 0) {
      console.log('⚠️ No models found. Pull one with: ollama pull qwen:latest');
      return;
    }

    const chatRes = await axios.post('http://localhost:11434/api/chat', {
      model: 'qwen:latest',
      messages: [
        {
          role: 'user',
          content: 'Hello! Are you working?'
        }
      ],
      stream: false
    });

    const chat = chatRes.data;

    console.log('💬 Response:', chat.message.content);
    console.log('✅ All tests passed!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('Make sure Ollama is running: ollama serve');
  }
}

testOllama();
