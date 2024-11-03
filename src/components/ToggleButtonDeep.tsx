import React from 'react';
import styled from 'styled-components';

// Props 타입 정의
type ToggleButtonProps = {
    latestSort: boolean;
    toggleHandler: () => void;
};

// 컴포넌트에 Props 타입 적용
const ToggleButtonDeep: React.FC<ToggleButtonProps> = ({ latestSort, toggleHandler }) => {
    return (
        <ToggleContainerDeep onClick={toggleHandler} isLatestSort={latestSort}>
            <ToggleSwitchDeep isLatestSort={latestSort}>
                {latestSort ? 'ON' : 'OFF'}
            </ToggleSwitchDeep>
            <ToggleTextDeep isLatestSort={latestSort}>
                {latestSort ? ' 깊게 생각하기' : ' 깊게 생각하기'}
            </ToggleTextDeep>
        </ToggleContainerDeep>
    );
};



export default ToggleButtonDeep;

const ToggleContainerDeep  = styled.div<{ isLatestSort: boolean }>`
    display: flex;
    align-items: center;
    width: 12rem;
    height: 3rem;
    border-radius: 2em;
    background-color: ${(props) =>
            props.isLatestSort ? '#e0e0e0' : '#f0f0f0'};
    cursor: pointer;
    position: absolute; /* 위치를 절대적으로 설정 */
    bottom: 45px; /* 화면 하단에서 20px 위로 위치 */
    right: 250px; /* 화면 왼쪽에서 50px 오른쪽으로 위치 */
    z-index: 39; /* z-index를 높게 설정하여 다른 요소 위에 배치 */
    transition: background-color 0.2s ease-in-out;
`;

const ToggleSwitchDeep  = styled.div<{ isLatestSort: boolean }>`
    position: absolute;
    top: 0.2rem;
    left: ${(props) => (props.isLatestSort ? '6rem' : '0.2rem')}; // 위치 변경
    width: 5.6rem;
    height: 2.6rem;
    border-radius: 2rem;
    background-color: white;
    box-shadow: 1px 2px 8px rgba(0, 0, 0, 0.16);
    transition: left 0.2s ease-in-out;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 0.9rem;
    color: #333;
`;

const ToggleTextDeep  = styled.span<{ isLatestSort: boolean }>`
    margin-left: ${(props) => (props.isLatestSort ? '1rem' : '7rem')}; // 위치 변경
    color: #333;
    font-weight: bold;
    transition: margin-left 0.2s ease-in-out;
`;
