import { GoogleGenAI, Modality } from "@google/genai";

// Helper to determine API Key based on user preference: VITE_VAIT_API_KEY > API_KEY
// Supports both import.meta.env (Vite) and process.env (Node/Webpack)
const getApiKey = (): string => {
  let key = "";

  // 1. Try import.meta.env (Vite standard)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      if (import.meta.env.VITE_VAIT_API_KEY) key = import.meta.env.VITE_VAIT_API_KEY;
      // @ts-ignore
      else if (import.meta.env.API_KEY) key = import.meta.env.API_KEY;
    }
  } catch (e) {
    // Ignore errors accessing import.meta
  }

  if (key) return key;

  // 2. Try process.env (Node/standard)
  try {
    if (typeof process !== 'undefined' && process.env) {
      if (process.env.VITE_VAIT_API_KEY) key = process.env.VITE_VAIT_API_KEY;
      else if (process.env.API_KEY) key = process.env.API_KEY;
    }
  } catch (e) {
    // Ignore errors accessing process.env
  }

  return key;
};

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: getApiKey() });

const SYSTEM_INSTRUCTION = `
당신은 한국의 중학교 학생들을 돕는 친절하고 유능한 영어 수행평가 튜터 'EngBuddy'입니다.
학생들이 영어 글쓰기(Writing)나 말하기(Speaking) 수행평가를 준비할 때 도움을 줍니다.

다음 원칙을 지켜주세요:
1. **친절하고 격려하는 말투**: 중학생이 부담을 느끼지 않도록 이모지를 적절히 사용하고 친근하게 대화하세요.
2. **명확한 교정**: 학생이 문장을 입력하면, 더 자연스러운 표현이나 문법적 오류를 수정해주고, **왜 틀렸는지 한국어로 쉽게 설명**해주세요. 단순히 정답만 주지 말고 학습이 되도록 도와주세요.
3. **주제 브레인스토밍**: 학생이 무엇을 써야 할지 모를 때, 중학생 수준에 맞는 흥미로운 주제(예: 나의 롤모델, 가장 기억에 남는 여행, 미래의 꿈 등)를 제안해주세요.
4. **수준별 맞춤**: 너무 어려운 단어보다는 중학교 교과 과정에 맞는 어휘를 주로 사용하되, 유용한 숙어도 알려주세요.
5. **구조 잡기**: 에세이 구조(서론-본론-결론)를 잡는 것을 도와주세요.

항상 답변은 Markdown 형식으로 가독성 있게 작성해주세요.
`;

export const sendMessageToGemini = async (
  history: { role: string; parts: { text: string }[] }[],
  userMessage: string
): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
      history: history,
    });

    const result = await chat.sendMessage({ message: userMessage });
    return result.text || "죄송합니다. 답변을 생성하지 못했습니다.";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    throw new Error("AI 응답을 가져오는 중 오류가 발생했습니다.");
  }
};

// Audio Utilities for TTS
const decode = (base64: string) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

const decodeAudioData = async (
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> => {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
};

export const playTextToSpeech = async (text: string): Promise<void> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Puck' }, // 'Puck' is a clear voice, good for education
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!base64Audio) {
      throw new Error("No audio data returned");
    }

    const outputAudioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const outputNode = outputAudioContext.createGain();
    
    // Connect to speakers
    outputNode.connect(outputAudioContext.destination);

    const audioBuffer = await decodeAudioData(
      decode(base64Audio),
      outputAudioContext,
      24000,
      1,
    );

    const source = outputAudioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(outputNode);
    source.start();

  } catch (error) {
    console.error("TTS Error:", error);
    throw new Error("음성을 재생하는 중 오류가 발생했습니다.");
  }
};