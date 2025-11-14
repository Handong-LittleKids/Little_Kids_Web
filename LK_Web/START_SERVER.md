# 프론트엔드 서버 실행 방법

## 빠른 실행

```bash
cd Little_Kids_Web/LK_Web
npm run dev
```

## 단계별 설명

### 1. 프론트엔드 디렉토리로 이동
```bash
cd Little_Kids_Web/LK_Web
```

### 2. 서버 실행
```bash
npm run dev
```

## 처음 실행하는 경우

패키지가 설치되지 않았다면 먼저 설치:
```bash
cd Little_Kids_Web/LK_Web
npm install
npm run dev
```

## 서버 확인

서버가 정상적으로 실행되면:
- 브라우저가 자동으로 열리고 `http://localhost:5173` 접속
- 또는 터미널에 표시된 URL로 접속
- 터미널에 "Local: http://localhost:5173" 메시지 표시

## 서버 종료

서버를 종료하려면 터미널에서 `Ctrl + C`를 누르세요.

## 문제 해결

### "npm: command not found"
Node.js가 설치되지 않았습니다. [Node.js 공식 사이트](https://nodejs.org/)에서 설치하세요.

### "Cannot find module 'react-router-dom'"
패키지가 설치되지 않았으면:
```bash
npm install
```

### 포트 5173이 이미 사용 중
Vite가 자동으로 다른 포트를 사용합니다 (예: 5174, 5175 등).

## 사용 가능한 명령어

- `npm run dev` - 개발 서버 실행 (핫 리로드 지원)
- `npm run build` - 프로덕션 빌드
- `npm run preview` - 빌드된 파일 미리보기
- `npm run lint` - 코드 린팅

