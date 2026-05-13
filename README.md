# laundry-pickup-web

세탁 서비스 수거 스태프용 웹 앱입니다. 수거 기사가 차량을 선택해 런(run)을 시작하고, 백(bag)을 등록한 뒤 현장에서 고객 아이템을 백에 담아 공장에 인도하는 흐름을 처리합니다.

이 문서는 **처음 이 프로젝트를 받은 사람이 설치부터 화면 띄우기까지 할 수 있도록** 만든 가이드입니다.

---

## 1. 준비물

| 항목 | 버전 | 설명 |
|---|---|---|
| Node.js | **24.14.0** | 프로젝트 루트의 `.node-version` 기준. 다른 버전이면 동작이 안 보장됩니다. |
| npm | Node에 포함 | 별도 설치 불필요 |
| 백엔드 (`laundry-api`) | 함께 클론 | 같은 모노레포의 `laundry-api/` 폴더에 있어야 합니다 |

### Node.js 설치 확인

PowerShell에서:

```powershell
node --version
```

`v24.14.0`이 안 뜨면 nvm(Node Version Manager)을 쓰는 걸 권장합니다.

**Windows에 nvm이 없으면** [nvm-windows](https://github.com/coreybutler/nvm-windows/releases)에서 `nvm-setup.exe`를 받아 설치한 뒤:

```powershell
nvm install 24.14.0
nvm use 24.14.0
```

> 💡 이미 nvm-windows를 `C:\nvm4w\nodejs`에 설치해놓은 환경이라면, 새 PowerShell 창마다 PATH가 안 잡힐 수 있습니다. 그 경우:
> ```powershell
> $env:PATH='C:\nvm4w\nodejs;' + $env:PATH
> ```
> 한 줄로 임시 적용. 영구 적용은 시스템 환경변수에서 추가하세요.

---

## 2. 설치

이 폴더(`laundry-pickup-web`)에서:

```powershell
npm install
```

처음에는 1~2분 걸립니다. `node_modules/`와 `package-lock.json`이 생기면 성공.

---

## 3. 백엔드 먼저 띄우기

이 앱은 백엔드(`laundry-api`)가 떠 있어야 동작합니다. 다른 터미널을 열어 **모노레포 루트의 `laundry-api/` 폴더에서**:

```powershell
cd ..\laundry-api
npm install              # 처음 한 번만
npx prisma migrate dev   # DB 마이그레이션 (처음 한 번만)
npx prisma db seed       # 차량/백 시드 데이터 (idempotent, 여러 번 실행해도 됨)
npm run start:dev
```

성공하면 `http://localhost:3000`에서 백엔드가 응답합니다. 확인하려면 브라우저에서 `http://localhost:3000/docs`를 열어 Swagger 화면이 보이면 OK.

> ⚠️ 백엔드 띄우기에서 막히면 `laundry-api/README.md`를 참고하세요. 이 앱은 백엔드가 떠야만 로그인이 됩니다.

---

## 4. 프론트 띄우기

다시 `laundry-pickup-web` 터미널로 돌아와서:

```powershell
npm run dev
```

성공하면 콘솔에 이렇게 나옵니다:

```
  VITE v8.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5174/
```

브라우저에서 **http://localhost:5174** 를 엽니다.

---

## 5. 로그인해서 동작 확인

1. 로그인 화면이 뜨면 Staff ID 입력란에 기본값 `pickup-staff-1`이 들어가 있습니다. 그대로 "시작하기" 클릭.
2. "오늘의 수거 요청" 목록이 보이면 성공. (목록이 비어있어도 정상입니다 — 주문은 고객 앱에서 만들어야 생깁니다.)

### 수거 요청이 비어있다면

수거 요청은 **고객 앱(`laundry-user-web`)에서 주문을 만들어야** 보입니다. 빠르게 테스트 주문 하나 만드는 법은 모노레포 루트의 `laundry-user-web/README.md`를 참고하세요. 또는 백엔드의 `http://localhost:3000/docs` Swagger에서 직접 호출해도 됩니다.

---

## 6. 자주 쓰는 명령어

| 명령어 | 용도 |
|---|---|
| `npm run dev` | 개발 서버 (포트 5174, HMR) |
| `npm run build` | 타입체크 + 프로덕션 빌드 |
| `npm run typecheck` | TypeScript 검사만 |
| `npm run test` | 테스트 watch 모드 |
| `npm run test:run` | 테스트 1회 실행 (CI용) |
| `npm run preview` | 빌드 결과를 로컬에서 미리보기 |

---

## 7. 상태 초기화 (자주 막히는 부분)

이 앱은 로그인 정보와 진행 중인 런(run) 정보를 **브라우저 localStorage**에 저장합니다. 작업 중 꼬여서 새로 시작하고 싶으면:

1. 브라우저에서 F12 → Application 탭 → Local Storage → `http://localhost:5174` 선택
2. `laundry-pickup-web-state` 키를 삭제
3. 페이지 새로고침

또는 콘솔(F12 → Console)에서:

```js
localStorage.removeItem('laundry-pickup-web-state');
location.reload();
```

백엔드 DB까지 완전 초기화하려면 `laundry-api/` 폴더에서:

```powershell
npx prisma migrate reset    # 모든 데이터 삭제 후 마이그레이션 재실행
npx prisma db seed          # 시드 다시 넣기
```

---

## 8. 환경 변수 (선택)

기본값으로 동작하지만, 백엔드를 다른 주소에 띄우는 경우 `.env.local` 파일을 만들고:

```
VITE_API_BASE_URL=http://localhost:3000
```

설정 없이도 `vite.config.ts`의 프록시가 `/api/*` → `http://localhost:3000`으로 넘겨줘서 보통은 불필요합니다.

---

## 9. 폴더 구조 한눈에 보기

```
laundry-pickup-web/
├─ src/
│  ├─ App.tsx              화면 전환 로직 (login → requests → ...)
│  ├─ api.ts               백엔드 호출 함수
│  ├─ types.ts             응답 타입
│  ├─ store.ts             zustand 전역 상태 (세션, 런, 백 목록)
│  ├─ components/          화면별 컴포넌트
│  ├─ styles.css           디자인 시스템 CSS
│  └─ test/                테스트 인프라 (MSW, fixtures)
├─ docs/                   AI/하네스용 문서 (사람이 읽어도 됨)
│  ├─ README.md            진입점
│  ├─ contracts.md         API 표
│  ├─ harness.md           E2E 검증 시나리오
│  └─ tests.md             테스트로 핀 된 동작 목록
├─ vite.config.ts          개발 서버 설정 (프록시 포함)
├─ vitest.config.ts        테스트 러너 설정
└─ package.json
```

---

## 10. 트러블슈팅

### `npm install`이 실패해요
- Node 버전이 24.14.0인지 확인 (`node --version`)
- `node_modules`와 `package-lock.json`을 지우고 재시도

### 로그인 누르면 에러가 떠요
- 백엔드(`http://localhost:3000`)가 떠 있는지 확인
- `http://localhost:3000/docs`가 브라우저에서 열리는지 확인

### "오늘 수거 요청이 없습니다"만 보여요
- 정상입니다. 주문은 고객 앱에서 만들어야 생깁니다 (위 5번 참고)

### 화면이 이상하게 굳어있어요 / 백이 안 보여요
- 7번 "상태 초기화" 따라하기

### 포트 5174가 이미 쓰이고 있어요
- 다른 프로세스가 점유 중. PowerShell에서 찾아 종료:
  ```powershell
  Get-NetTCPConnection -LocalPort 5174 | Select-Object -Property OwningProcess
  Stop-Process -Id <위에서 나온 PID>
  ```

---

## 더 알고 싶다면

- **백엔드 API 어떻게 호출되는지**: `docs/contracts.md`
- **수거 흐름 끝까지 어떻게 검증하는지**: `docs/harness.md`
- **테스트로 어떤 동작이 보장되는지**: `docs/tests.md`
- **백엔드 도메인 규칙**: `../laundry-api/docs/pickup/README.md`
