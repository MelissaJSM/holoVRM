/** 1. 초기 설정 및 모델 로딩 **/

// 모델 사용을 위한 경로 설정
const cubism4Model = "../model/melissa_vts/멜리사3.model3.json";

// 이번 live2d 는 pixi 의 라이브러리를 사용하도록 한다.
const live2d = PIXI.live2d;

let app;

let model;

/* 메인 어플리케이션을 초기화 하고 실행하는 부분 */
(async function main() {
    app = new PIXI.Application({
        view: document.getElementById("canvas"), // canvas 로 연결된 view 설정
        autoStart: true, // 렌더링 루프를 자동으로 실행
        resizeTo: window, // 윈도우에 화면을 맞추도록 한다.
    });

    // 배경 이미지 로드
    const background = PIXI.Sprite.from('../model/background/background.png'); // 배경 이미지 경로 설정
    background.width = app.screen.width; // 배경 이미지의 너비를 화면 크기에 맞춘다
    background.height = app.screen.height; // 배경 이미지의 높이를 화면 크기에 맞춘다
    app.stage.addChild(background); // 배경 이미지를 스테이지에 추가

    // live2d 모델 로딩
    model = await live2d.Live2DModel.from(cubism4Model);

    // 로드된 모델을 pixi 스테이지에 추가하여 렌더링 시작
    app.stage.addChild(model);

    /** 2. 모델의 크기 조정 및 위치 설정 **/

    /* 창 크기에 모델 맞추기 위한 스케일 비율 계산 */
    const scaleX = (innerWidth * 0.4) / model.width; // 모델을 창 너비의 (innerWidth * 0.4) / model.width; (40%) 정도로 맞춘다.
    const scaleY = (innerHeight * 0.8) / model.height; // 모델을 창 높이의 (innerHeight * 0.8) / model.height; (80%) 정도로 맞춘다.

    // 두 스케일 비율 중 작은 값을 사용하여 모델의 크기를 설정
    model.scale.set(Math.max(scaleX, scaleY));

    // 모델을 창 높이의 innerHeight * 0.1; (10%)위치에 배치
    model.y = innerHeight * 0.1;

    model.x = (innerWidth - model.width) / 2; // 모델을 창 중앙에 가로로 배치
})();

/** 3. 드래그 **/

/* 드래그 함수 */
function draggable(model) {
    model.buttonMode = true; // 버튼 모드를 이용하여 모델을 인터랙티브 하게 만든다. 즉, 드래그 및 터치를 할 수 있도록 상호작용 시킨다는 뜻

    /* 모델에 마우스나 터치가 눌렸을 때의 이벤트 리스너를 추가하는 부분 */
    model.on("pointerdown", (e) => {
        model.dragging = true; // 드래그 중임을 나타내는 플래그
        model._pointerX = e.data.global.x - model.x; // 모델의 위치에 대한 포인터의 상대적인 위치 저장
        model._pointerY = e.data.global.y - model.y;
    });

    /* 포인터가 움직일 때의 이벤트 리스너를 추가하는 부분 */
    model.on("pointermove", (e) => {
        /* 모델이 드래그중인지 확인중 */
        if (model.dragging) {
            model.position.x = e.data.global.x - model._pointerX; // 포인터의 움직임에 따른 x좌표 수정
            model.position.y = e.data.global.y - model._pointerY; // 포인터의 움직임에 따른 y좌표 수정
        }
    });

    /* 포인터가 해제될 때 드래그를 중지하는 이벤트 리스너 (2개 다) */
    model.on("pointerupoutside", () => (model.dragging = false));
    model.on("pointerup", () => (model.dragging = false));
}

/** 체크박스 관련 함수 제거 **/
// 모든 체크박스 관련 함수 및 호출을 제거했습니다.

/** 4. 모델에 프레임 추가 **/
// 프레임 추가 함수 및 호출을 제거했습니다.

/** 5. 히트 영역 프레임 추가 **/
// 히트 영역 프레임 추가 함수 및 호출을 제거했습니다.

/** 6. 이벤트 핸들링 관련 함수들 **/
function handleTouchEvent(event, app, targetX, targetY, radius, rectWidth, rectHeight, model, touchType) {
    const rect = app.view.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * app.screen.width;
    const y = ((event.clientY - rect.top) / rect.height) * app.screen.height;

    console.log(`Clicked at: x=${x}, y=${y}`); // 클릭한 위치의 좌표를 콘솔에 출력

    if (touchType === 'head') {
        // 터치한 위치가 원 영역 내에 있는지 확인
        if (Math.hypot(x - targetX, y - targetY) <= radius) {
            console.log("머리 터치 성공"); // 터치 성공 로그 추가
            model.expression(); // 기본 애니메이션 재생
        } else {
            console.log("머리 터치 실패"); // 터치 실패 로그 추가
        }
    } else if (touchType === 'body') {
        // 터치한 위치가 사각형 영역 내에 있는지 확인
        if (x >= targetX - rectWidth / 2 && x <= targetX + rectWidth / 2 &&
            y >= targetY - rectHeight / 2 && y <= targetY + rectHeight / 2) {
            console.log("바디 터치 성공"); // 터치 성공 로그 추가
            model.motion("Taps"); // 기본 애니메이션 재생
        } else {
            console.log("바디 터치 실패"); // 터치 실패 로그 추가
        }
    }
}

// 터치 라인 생성 함수 수정
function touchLineCreateHead(model, app, widthPart, heightPart, radiusArea, areaColor, visibility) {
    const targetX = app.screen.width * widthPart; // 화면의 중앙 X 좌표
    const targetY = app.screen.height * heightPart; // 화면의 중앙 Y 좌표
    const radius = radiusArea; // 반경 설정

    // 기존 영역 제거
    if (touchAreaHead) {
        app.stage.removeChild(touchAreaHead);
        touchAreaHead.destroy();
    }

    touchAreaHead = new PIXI.Graphics();
    if (visibility === true) {
        touchAreaHead.beginFill(areaColor, 0.5); // 반투명 컬러 채우기
    } else {
        touchAreaHead.beginFill(areaColor, 0.0); // 반투명 컬러 채우기
    }

    touchAreaHead.drawCircle(targetX, targetY, radius);
    touchAreaHead.endFill();
    app.stage.addChild(touchAreaHead); // 터치 영역을 스테이지에 추가

    const handleClick = (event) => handleTouchEvent(event, app, targetX, targetY, radius, null, null, model, 'head');

    // 기존 이벤트 리스너 제거
    app.view.removeEventListener('click', handleClick);
    // 새 이벤트 리스너 추가
    app.view.addEventListener('click', handleClick);
}

function touchLineCreateBodyUp(model, app, widthPart, heightPart, widthArea, heightArea, areaColor, visibility) {
    const targetX = app.screen.width * widthPart; // 화면의 중앙 X 좌표
    const targetY = app.screen.height * heightPart; // 화면의 중앙 Y 좌표
    const rectWidth = widthArea; // 사각형의 너비
    const rectHeight = heightArea; // 사각형의 높이

    // 기존 영역 제거
    if (touchAreaBodyUp) {
        app.stage.removeChild(touchAreaBodyUp);
        touchAreaBodyUp.destroy();
    }

    touchAreaBodyUp = new PIXI.Graphics();
    if (visibility === true) {
        touchAreaBodyUp.beginFill(areaColor, 0.5); // 반투명 컬러 채우기
    } else {
        touchAreaBodyUp.beginFill(areaColor, 0.0); // 반투명 컬러 채우기
    }

    touchAreaBodyUp.drawRect(targetX - rectWidth / 2, targetY - rectHeight / 2, rectWidth, rectHeight);
    touchAreaBodyUp.endFill();
    app.stage.addChild(touchAreaBodyUp); // 터치 영역을 스테이지에 추가

    const handleClick = (event) => handleTouchEvent(event, app, targetX, targetY, null, rectWidth, rectHeight, model, 'body');

    // 기존 이벤트 리스너 제거
    app.view.removeEventListener('click', handleClick);
    // 새 이벤트 리스너 추가
    app.view.addEventListener('click', handleClick);
}

function touchLineCreateBodyDown(model, app, widthPart, heightPart, widthArea, heightArea, areaColor, visibility) {
    const targetX = app.screen.width * widthPart; // 화면의 중앙 X 좌표
    const targetY = app.screen.height * heightPart; // 화면의 중앙 Y 좌표
    const rectWidth = widthArea; // 사각형의 너비
    const rectHeight = heightArea; // 사각형의 높이

    // 기존 영역 제거
    if (touchAreaBodyDown) {
        app.stage.removeChild(touchAreaBodyDown);
        touchAreaBodyDown.destroy();
    }

    touchAreaBodyDown = new PIXI.Graphics();
    if (visibility === true) {
        touchAreaBodyDown.beginFill(areaColor, 0.5); // 반투명 컬러 채우기
    } else {
        touchAreaBodyDown.beginFill(areaColor, 0.0); // 반투명 컬러 채우기
    }

    touchAreaBodyDown.drawRect(targetX - rectWidth / 2, targetY - rectHeight / 2, rectWidth, rectHeight);
    touchAreaBodyDown.endFill();
    app.stage.addChild(touchAreaBodyDown); // 터치 영역을 스테이지에 추가

    const handleClick = (event) => handleTouchEvent(event, app, targetX, targetY, null, rectWidth, rectHeight, model, 'body');

    // 기존 이벤트 리스너 제거
    app.view.removeEventListener('click', handleClick);
    // 새 이벤트 리스너 추가
    app.view.addEventListener('click', handleClick);
}

function deBugMode(debug) {
    if (debug) {
        document.getElementById("title").style.display = "block";
        document.getElementById("control").style.display = "block"; // 체크박스 영역 표시
    } else {
        document.getElementById("title").style.display = "none";
        document.getElementById("control").style.display = "none"; // 체크박스 영역 숨기기
    }
}

function TalkAndIdleMode(type) {
    if(type){
        model.motion("Taps"); // 기본 애니메이션 재생 // 파일 이슈일수도있다.
    }
    else{
        model.motion("Idle"); // 기본 애니메이션 재생 // 파일 이슈일수도있다.
    }
}
