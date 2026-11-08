# little wish · 온라인 레터링 케이크

모바일 우선 Next.js App Router MVP. React Three Fiber 3D 케이크를 사용하며 색상·크림·토핑·문구 수정이 즉시 반영됩니다. 외부 이미지나 API 키 없이 실행할 수 있습니다.

## 실행

Node.js 22 이상 권장 (검증: 24.22.1).

```sh
npm ci
npm run dev
```

브라우저에서 포트 3000으로 접속합니다. npm 캐시 디렉터리 권한 문제가 있는 환경에서는 `npm ci --cache /tmp/lettering-npm-cache`를 사용하세요.

```sh
npm run build
npm run start
npm run typecheck
```

## 컴포넌트와 우선순위

- `src/components/CakeBuilder.tsx`: 상태, 3단계 편집 패널, 공유 다이얼로그, PNG 다운로드. 모바일은 세로 배치, 데스크톱은 미리보기와 편집 패널 나란히 배치.
- `src/components/CakeViewer3D.tsx`: WebGL 케이크, 펄프 상자, 표면 크림 짜기와 3D 토핑. `CakeViewer.tsx`는 이전 CSS 구현 참고용입니다.
- `src/lib/cake.ts`: 케이크 타입, 팔레트, 공유 데이터 인코딩·검증. `src/lib/cake3d.ts`: 3D 저장 계약, 엄격한 파서와 JSON 직렬화.
- `src/app/globals.css`: 파스텔 UI, 크림과 토핑 표현, 반응형 스타일.

1. 구현: 바탕색 6종, 크림 3종, 토핑 3종, 레터링·축하 메시지·받는 사람 편집.
2. 구현: 이미지 다운로드, 링크 복사, Web Share 지원 기기의 시스템 공유, 받는 사람의 상자 열기·촛불 끄기.
3. 후속: Supabase 영속 저장과 짧은 고유 URL, Kakao SDK 공유, 배포.

## 공유 방식과 제한

현재는 URL의 `#gift=`에 UTF-8 케이크 데이터를 인코딩합니다. 같은 링크로 다른 기기에서도 열 수 있고 DB·로그인은 필요하지 않습니다. 암호화가 아니므로 링크를 아는 사람은 메시지를 읽거나 수정할 수 있습니다. 민감한 정보를 넣지 마세요. 긴 메시지는 공유 URL도 길어집니다. 선물 링크는 서버에 저장되지 않습니다.

완성 후 이미지 저장은 현재 케이크를 PNG로 캡처합니다. `navigator.share`가 제공되는 HTTPS/로컬 환경에서는 기기의 공유 메뉴를 사용합니다. Kakao SDK 직접 공유는 아직 연결하지 않았습니다.

## Supabase / Vercel 연결 계획

현재 구현에 환경 변수는 필요 없습니다. 다음 단계에서 Supabase `cakes` 테이블(id UUID, design JSONB, created_at TIMESTAMPTZ), 서버 전용 생성 API와 `/gift/[id]` 조회 페이지를 추가하면 됩니다. 무분별한 생성과 메시지 노출을 막기 위해 검증·요청 제한·조회 권한 정책도 함께 구현해야 합니다. 서비스 역할 키를 브라우저에 노출하면 안 됩니다.

Vercel에서는 Next.js 프리셋과 기본 `npm run build` 명령으로 배포할 수 있습니다. 이 저장소에서 실제 배포나 Supabase 프로비저닝은 수행하지 않았습니다.

## 3D 마이그레이션 (Phase 1.5)

추가 패키지:

```sh
npm install three @react-three/fiber @react-three/drei
npm install -D @types/three
```

현재 미리보기는 `CakeViewer3D.tsx`를 클라이언트에서 지연 로딩합니다. `Canvas` → 조명·도시락 용기·Cylinder 케이크·텍스처 레터링·토핑·크림 TubeGeometry 순으로 씬을 구성합니다. 폰트/모델 CDN 다운로드는 필요 없습니다. 이전 CSS `CakeViewer.tsx`는 참고용으로 남아 있으며 활성 화면은 3D입니다.

- **360° 회전:** 드래그/터치로 방위각 회전, 핀치/휠로 확대·축소. 아래쪽을 보거나 과도하게 확대하지 못하도록 OrbitControls를 제한합니다.
- **크림 짜기:** 케이크 윗면·옆면을 드래그합니다. 실제 Cylinder 교차점만 저장하고, 곡선 중심선을 표면에 재투영합니다. 빈 공간이나 윗면/옆면 경계를 지나면 해당 획을 끝냅니다. 새 획으로 이어 그리세요. 한 점은 크림 방울로 표현합니다.
- **토핑 옮기기:** 선택한 프리셋 토핑을 윗면 탭 위치로 이동합니다. 현재 편집 UI는 프리셋 한 묶음을 다루고, 데이터는 최대 12개 토핑의 위치·회전·크기를 지원합니다.
- **한 획 취소 / 크림 지우기:** 직접 그린 크림만 수정하며 기본 테두리 크림에는 영향을 주지 않습니다.
- **3D JSON 저장:** `serializeCake3DState(state3D)` 결과를 내려받습니다. Three.js 객체나 카메라 상태는 저장하지 않습니다.

### DB에 저장할 계약

`src/lib/cake3d.ts`의 `Cake3DState`와 `parseCake3DState`가 버전 1의 계약입니다. `schemaVersion: 1`, `coordinateSystem: "cake-local-y-up"`을 사용합니다. 케이크 바닥 중심이 원점, Y가 위쪽, 반지름 1, 높이 0.65입니다. 좌표 단위는 미터가 아닌 케이크 반지름입니다. 이 크기를 바꿀 때는 스키마 버전 및 마이그레이션도 함께 변경해야 합니다.

```json
{
  "schemaVersion": 1,
  "coordinateSystem": "cake-local-y-up",
  "cake": { "radius": 1, "height": 0.65, "color": "#f4b9c7", "cream": "shell" },
  "lettering": "happy birthday",
  "message": "너의 모든 날을 응원해 ♡",
  "recipient": "지민",
  "strokes": [
    {
      "id": "stroke-1",
      "surface": "top",
      "color": "#fff7e3",
      "radius": 0.035,
      "points": [
        [0, 0.685, 0],
        [0.1, 0.685, 0.2]
      ]
    }
  ],
  "toppings": [
    {
      "id": "preset-0",
      "kind": "cherry",
      "position": [0, 0.65, -0.38],
      "rotation": [0, 0, 0],
      "scale": 1
    }
  ]
}
```

크림 `points`는 표면에서 약간 떠 있는 **중심선**입니다. 윗면 Y는 0.685, 옆면 XZ 반지름은 1.035이며 굵기는 `radius`에 저장합니다. 좌표는 소수점 세 자리로 양자화합니다. `rotation`은 XYZ 오일러 회전(라디안), `scale`은 균일 배율입니다. 토핑 `position`은 프리셋 모델의 바닥 기준점입니다. 카메라·꺼진 촛불·상자 열림·편집 모드는 일시적인 수신/편집 상태로 저장 대상에서 제외합니다.

크림은 최대 24획, 획당 최대 100점으로 제한합니다. 스키마 파서는 개수·유한 좌표·크림의 표면 제약·색상·크기를 검증하고 알 수 없는 필드를 제거합니다. 향후 Supabase API에서도 이 파서를 서버에서 적용해야 합니다.

기존 2D 선물 링크는 3D 프리셋으로 읽습니다. 새 링크는 `design3D` 전체를 포함합니다. DB 없는 링크 방식의 임시 호환 기능이며, 많은 크림을 그리면 URL이 길어져 일부 공유 앱에서 잘릴 수 있습니다. 8,000자 초과 시 안내합니다. 실제 서비스에서는 JSONB 저장 후 짧은 UUID 링크로 전환해야 합니다.

### 이미지와 제약

WebGL `preserveDrawingBuffer`를 켜서 기존 html-to-image 다운로드에 3D 렌더 결과가 포함되도록 했습니다. 현재 PNG는 사용자가 보고 있는 카메라 각도의 이미지입니다. 이 옵션에는 GPU 메모리 비용이 있습니다. 카카오 공유용 고정 카메라 썸네일 생성·서버 이미지 저장·OG 메타데이터는 후속 단계입니다.

WebGL 미지원 시 안내를 표시합니다. 3D 크림 도구는 포인터/터치 조작이며 키보드로 궤적을 그리는 기능은 없습니다. 모바일 성능을 위해 DPR, 튜브 세그먼트, 획 수를 제한했습니다. Chromium에서 실제 touch 이벤트의 크림 궤적 저장을 검증했으며, iOS Safari 실기기 성능은 아직 검증하지 않았습니다. Supabase / 카카오 SDK / 실제 배포는 아직 연결하지 않았습니다.

검증 명령:

```sh
npm test             # 직렬화, 기존 링크 호환, 잘못된 상태 검증
npm run typecheck
npm run build
```
