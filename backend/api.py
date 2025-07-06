from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import openai
import json
import asyncio
import os
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import List, Dict, Optional

# .env 파일 로드
load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Your React app's address
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 환경 변수에서 API 키 가져오기
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise ValueError("OPENAI_API_KEY environment variable is not set")

client = openai.Client(api_key=openai_api_key)

# 허용되는 모델 목록
ALLOWED_MODELS = ["gpt-3.5-turbo", "gpt-4o"]

# Request 모델 정의
class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    model: str = "gpt-3.5-turbo"
    temperature: Optional[float] = 0.7
    topP: Optional[float] = 1.0
    frequencyPenalty: Optional[float] = 0
    presencePenalty: Optional[float] = 0

class TitleRequest(BaseModel):
    userMessage: str
    aiResponse: str

@app.post("/chat")
async def chat(request: Request) -> StreamingResponse:
    # Parse the request body
    chat_request_data = await request.json()
    
    # ChatRequest 모델로 파싱하여 유효성 검사
    try:
        chat_request = ChatRequest(**chat_request_data)
    except Exception as e:
        # 파싱 실패 시 기본값으로 처리
        messages = chat_request_data.get("messages", [])
        model = chat_request_data.get("model", "gpt-3.5-turbo")
        temperature = chat_request_data.get("temperature", 0.7)
        top_p = chat_request_data.get("topP", 1.0)
        frequency_penalty = chat_request_data.get("frequencyPenalty", 0)
        presence_penalty = chat_request_data.get("presencePenalty", 0)
    else:
        messages = [{"role": msg.role, "content": msg.content} for msg in chat_request.messages]
        model = chat_request.model
        temperature = chat_request.temperature
        top_p = chat_request.topP
        frequency_penalty = chat_request.frequencyPenalty
        presence_penalty = chat_request.presencePenalty
    
    # 모델 유효성 검사
    if model not in ALLOWED_MODELS:
        model = "gpt-3.5-turbo"  # 기본값으로 설정
    
    # 파라미터 범위 검증
    temperature = max(0, min(2, temperature or 0.7))
    top_p = max(0.1, min(1.0, top_p or 1.0))
    frequency_penalty = max(0, min(2, frequency_penalty or 0))
    presence_penalty = max(0, min(2, presence_penalty or 0))
    
    async def stream_openai_response():
        try:
            # 시스템 메시지가 이미 포함되어 있는지 확인
            if not any(msg["role"] == "system" for msg in messages):
                messages.insert(0, {
                    "role": "system", 
                    "content": "당신은 도움이 되는 AI 어시스턴트입니다. 사용자의 질문에 친절하고 정확하게 한국어로 답변해주세요. 자연스럽고 이해하기 쉬운 한국어를 사용하며, 필요한 경우 예시나 설명을 추가해주세요."
                })
            
            # OpenAI API 호출에 파라미터 추가
            stream = client.chat.completions.create(
                messages=messages,
                model=model,
                stream=True,
                temperature=temperature,
                top_p=top_p,
                frequency_penalty=frequency_penalty,
                presence_penalty=presence_penalty,
            )

            for chunk in stream:
                # Check if client disconnected
                if await request.is_disconnected():
                    print("Client disconnected, stopping LLM generation")
                    break
                
                content = chunk.choices[0].delta.content or ""
                if content:
                    data = json.dumps({"status": "processing", "data": content}, ensure_ascii=False)
                    yield f"data: {data}\n\n"
                    await asyncio.sleep(0.03)
            
            if not await request.is_disconnected():
                yield f"data: {json.dumps({'status': 'complete', 'data': 'Stream finished'}, ensure_ascii=False)}\n\n"
            
        except Exception as e:
            error_data = json.dumps({"status": "error", "data": str(e)}, ensure_ascii=False)
            yield f"data: {error_data}\n\n"

    return StreamingResponse(
        stream_openai_response(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream"
        }
    )

@app.post("/generate-title")
async def generate_title(title_request: TitleRequest):
    try:
        messages = [
            {
                "role": "system", 
                "content": "당신은 대화의 제목을 만들어주는 도우미입니다. 간결하고 내용을 잘 표현하는 한국어 제목을 만들어주세요."
            },
            {
                "role": "user", 
                "content": f"다음 대화를 요약하여 5단어 이내의 간단한 한국어 제목을 만들어주세요.\n\n사용자 메시지: '{title_request.userMessage}'\nAI 응답 시작 부분: '{title_request.aiResponse[:100]}...'\n\n제목만 답변해주세요."
            }
        ]
        
        response = client.chat.completions.create(
            messages=messages,
            model="gpt-3.5-turbo",
            max_tokens=20,
            temperature=0.7
        )
        
        title = response.choices[0].message.content.strip().replace('"', '')
        # Remove quotes if the model adds them
        if title.startswith('"') and title.endswith('"'):
            title = title[1:-1]
            
        return {"title": title}
    except Exception as e:
        print(f"Error generating title: {str(e)}")
        # Fallback to using the first few words of user message
        words = title_request.userMessage.split()
        fallback_title = " ".join(words[:5]) + ("..." if len(words) > 5 else "")
        return {"title": fallback_title}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)