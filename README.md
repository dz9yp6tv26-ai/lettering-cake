# little wish · 온라인 레터링 케이크

레터링 문구 입력 아래의 한글/English 탭에서 한글 4종(Gaegu, Jua, Gowun Batang, Noto Sans KR)과 영문 Cake 폰트 4종(Pacifico, Fredoka, Cherry Swash, Shrikhand)을 선택할 수 있습니다. 새 케이크는 `handwrite`(개구체)로 시작합니다. 레터링은 폰트 윤곽선을 ExtrudeGeometry로 만든 실제 3D 메쉬이며, 영문 폰트가 지원하지 않는 한글은 Google Fonts 나눔손글씨 펜으로 입체 표현합니다.

Google Fonts CDN이 개발 환경에서 차단되어, [Google Fonts 공식 저장소](https://github.com/google/fonts)의 배포본과 OFL 라이선스를 저장소에 포함했습니다. 신규 한글 폰트 원본은 `ofl/gaegu`, `ofl/jua`, `ofl/gowunbatang`, `ofl/notosanskr`이며, Noto Sans KR은 FontTools로 가변 원본의 `wght=400`을 고정했습니다. UI 폰트는 `next/font/local`, 메쉬 윤곽선은 `public/fonts`의 같은 배포본을 opentype.js로 읽습니다. 폰트는 선택 시 로드하고 메쉬 파싱 결과를 캐시합니다. 케이크 판 Canvas는 `document.fonts.load()` 완료 후 그리며 `texture.needsUpdate`로 갱신합니다. 최초 다운로드 시간은 연결과 파일 크기에 따라 달라지므로 0.1초 반영을 보장하지 않습니다. 폰트에 없는 이모지/문자는 `?`로 표시됩니다.

`Cake3DState.fontFamily`와 공유 카드의 같은 필드에 폰트 ID를 저장합니다. 새 필드가 있으면 기존 `letteringFont`보다 우선합니다. 필드가 없는 이전 링크는 기존 `letteringFont` 또는 나눔손글씨 펜(`classic`)을 유지하며, 알 수 없는 ID는 파서에서 거부합니다. 두 필드 모두 허용 목록을 검증합니다.

`letteringFont`는 `classic | pacifico | fredoka | cherry | shrikhand` 중 하나인 선택 필드이며, Cake와 Cake3DState/공유 링크/JSON에 보존됩니다. 필드가 없는 기존 버전 1 데이터는 `classic`으로 표시합니다. 글자 윤곽선의 경계·줄 수·커닝을 고려해 가로와 세로를 같은 비율로 조정하고, 두께는 0.03으로 유지합니다.

`letteringColor`(HEX 색상), `letteringPosition`(`top-center | top-rim | front-side | board`)도 같은 저장 경로를 사용합니다. 이전 버전 1 데이터에 필드가 없으면 버건디(`#9f4b64`)·윗면 중앙으로 표시합니다. 잘못된 필드는 파서에서 거부합니다. UI에는 전용 팔레트 8색과 배치 컨트롤 4종이 있습니다.

`src/lib/lettering-geometry.ts`가 윤곽선→둥근 ExtrudeGeometry→케이크 좌표 변환을 담당하고, `src/components/Lettering3D.tsx`가 폰트 요청·캐시·메쉬 재질·자원 해제를 담당합니다. 두께 0.03, bevelThickness 0.005, 글자 크기에 비례한 bevelSize, roughness 0.36, metalness 0.02를 사용하며 그림자를 주고받습니다. 윗면 중앙은 얕은 곡선, 윗면 테두리는 호, 전면 측면은 반지름 1.009의 원통을 따라 모든 꼭짓점을 휘게 합니다. 여러 줄 문구도 해당 배치 영역에 맞춥니다. 케이크 판에 레터링을 배치하면 기존 축하 메시지는 판의 뒤쪽으로 이동합니다. 축하 메시지 자체는 평면 텍스처로 유지합니다.

모바일 우선 Next.js App Router MVP. React Three Fiber 3D 케이크를 사용하며 색상·크림·토핑·문구 수정이 즉시 반영됩니다. 외부 이미지나 API 키 없이 실행할 수 있습니다.

테두리 호와 케이크 판 배치는 좁고 긴 영역에 맞춰 줄바꿈을 공백으로 이어 한 줄로 표현합니다. 윗면 중앙과 측면은 여러 줄을 유지합니다. 토핑과 직접 짠 크림은 같은 표면을 공유하므로, 레터링과 겹치면 토핑 이동이나 글자 위치 선택으로 조정하세요.

## 실행

편집 순서는 **케이크/크림 → 레터링/토핑 → 촛불 커스텀**입니다. `CandleEditor.tsx`와 `ToppingEditor.tsx`가 각 편집 UI를 담당하고, `Candles3D.tsx`와 `ToppingMeshes.tsx`가 메쉬를 렌더링합니다. 생크림 그리기·실행 취소·입체 레터링·JSON·공유·PNG 저장은 같은 상태를 계속 사용합니다.

### 토핑과 초 저장 계약

토핑 `kind`는 `cherry | heart | strawberry | rose | ribbon | star`입니다. 누운 하트와 별은 둥근 ExtrudeGeometry, 딸기는 LatheGeometry와 인스턴스 씨앗, 장미는 겹치는 곡면 꽃잎, 리본은 곡선을 따라 압출한 띠로 표현합니다. 모든 새 프리셋은 바닥 기준점을 사용합니다.

`Cake3DState.candles` 예:

```json
{
  "shape": "number",
  "count": 3,
  "color": "#efafc4",
  "isLit": true,
  "enabled": true,
  "sparkle": true,
  "number": "20"
}
```

- `shape`: `straight | bear | heart | number`.
- `count`: 정수 1~99. `enabled: false`로 초 전체를 숨길 수 있습니다.
- `number`: 숫자 초 하나에 새길 0~99. 예를 들어 위 설정은 **20 모양의 초 3개**입니다.
- `isLit`: 제작자가 선택한 초기 불꽃 상태. 받는 사람은 별도의 임시 상태로 끄거나 다시 켤 수 있습니다.
- `sparkle`: 흔들림·Glow·날리는 불씨 효과. 동작 줄이기 설정에서는 흔들림과 불씨 이동을 멈춥니다.
- `positions`: 과거 링크의 수동 배치를 보존하는 선택적 로컬 좌표 배열. 길이가 `count`와 같아야 하며 각 좌표는 케이크 상단에 있어야 합니다. 새 편집에서는 원형/방사형으로 자동 배치하며 개수를 바꾸면 수동 좌표를 해제합니다.

카메라 수나 점광원을 초 개수만큼 늘리지 않고 몸체·심지·불꽃·Glow·불씨를 인스턴싱합니다. 많은 초를 선택하면 자동으로 크기가 줄어듭니다. 최대 개수는 검증하지만 실제 기기별 프레임률은 GPU에 따라 다릅니다.

`schemaVersion: 1`은 유지하며 `candles`가 없는 기존 데이터도 읽습니다. 예전 `kind: "candle"` 토핑은 파싱할 때 별도 `candles` 설정으로 옮기고 위치를 보존합니다. 초가 없던 이전 케이크에는 새 초를 강제로 추가하지 않습니다. 새 케이크에는 일자 초 1개가 기본 적용됩니다. 모양·색·개수·효과·숫자와 토핑은 JSON 및 공유 링크를 통해 복원됩니다.

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

1. 구현: 바탕색 6종, 크림 3종, 토핑 6종, 레터링·축하 메시지·받는 사람 편집. 독립된 촛불 커스텀에서 모양 4종, 개수 1~99개, 초 전용 색상과 불꽃·효과 설정.
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

현재 미리보기는 `CakeViewer3D.tsx`를 클라이언트에서 지연 로딩합니다. 조명·도시락 용기·Cylinder 케이크·입체 레터링·토핑·크림 TubeGeometry·독립된 초 렌더러를 구성합니다. 폰트/모델 CDN 다운로드는 필요 없습니다. 이전 CSS `CakeViewer.tsx`는 참고용으로 남아 있으며 활성 화면은 3D입니다.

- **360° 회전:** 드래그/터치로 방위각 회전, 핀치/휠로 확대·축소. 아래쪽을 보거나 과도하게 확대하지 못하도록 OrbitControls를 제한합니다.
- **크림 짜기:** 케이크 윗면·옆면을 드래그합니다. 실제 Cylinder 교차점만 저장하고, 곡선 중심선을 표면에 재투영합니다. 빈 공간이나 윗면/옆면 경계를 지나면 해당 획을 끝냅니다. 새 획으로 이어 그리세요. 한 점은 크림 방울로 표현합니다.
- **토핑 옮기기:** 체리·하트·딸기·장미·리본·별을 최대 12개 추가하고 선택한 토핑을 윗면 탭 위치로 이동합니다. 모양과 배율의 바닥 면적을 고려해 케이크 바깥으로 넘어가지 않도록 위치를 보정합니다.
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

크림 `points`는 표면에서 약간 떠 있는 **중심선**입니다. 윗면 Y는 0.685, 옆면 XZ 반지름은 1.035이며 굵기는 `radius`에 저장합니다. 좌표는 소수점 세 자리로 양자화합니다. `rotation`은 XYZ 오일러 회전(라디안), `scale`은 균일 배율입니다. 토핑 `position`은 프리셋 모델의 바닥 기준점이며 새 배치는 Y=0.651입니다. 카메라·받는 사람의 임시 불꽃 토글·상자 열림·편집 모드는 저장하지 않습니다. 제작자가 선택한 초기 불꽃 상태는 `candles.isLit`에 저장합니다.

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
