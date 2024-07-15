import React, { useEffect, useState, useRef } from 'react';
import Chart from 'chart.js/auto';
import 'chartjs-adapter-date-fns';
import { fetchWithToken } from '@/lib/api';
import { parseISO, startOfISOWeek, format } from 'date-fns';
import { fetchMemos, addMemo, deleteMemo } from '@/lib/api';

type UserStat = {
    date: string;
    count: number;
    joinCount?: number;
    leaveCount?: number;
};

type SessionStat = {
    date: string;
    count: number;
};

type CharacterStat = {
    character: string;
    count: number;
};

type User = {
    id: string;
    created_at: string;
};

type Memo = {
    id: number;
    content: string;
    created_at: string;
};

const AdminControl = () => {
    const [userStats, setUserStats] = useState<UserStat[]>([]);
    const [sessionStats, setSessionStats] = useState<SessionStat[]>([]);
    const [userLoginStats, setUserLoginStats] = useState<SessionStat[]>([]);
    const [characterStats, setCharacterStats] = useState<CharacterStat[]>([]);
    const [totalStats, setTotalStats] = useState<any[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [activeTab, setActiveTab] = useState('stats');
    const [timeUnit, setTimeUnit] = useState<'year' | 'month' | 'week' | 'day'>('day');
    const [memos, setMemos] = useState<Memo[]>([]);
    const [newMemoContent, setNewMemoContent] = useState('');

    const userChartRef = useRef<Chart | null>(null);
    const sessionChartRef = useRef<Chart | null>(null);
    const userLoginChartRef = useRef<Chart | null>(null);
    const totalChartRef = useRef<Chart | null>(null);
    const characterChartRef = useRef<Chart | null>(null);

    const destroyCharts = () => {
        userChartRef.current?.destroy();
        sessionChartRef.current?.destroy();
        userLoginChartRef.current?.destroy();
        totalChartRef.current?.destroy();
        characterChartRef.current?.destroy();
    };

    // 누적 회원 수 계산 함수
    const calculateCumulativeUserStats = (data: UserStat[]) => {
        let cumulativeCount = 0;
        return data.map(entry => {
            console.log(`Date: ${entry.date}, Join Count: ${entry.joinCount}, Leave Count: ${entry.leaveCount}`);
            cumulativeCount += (entry.joinCount ?? 0) - (entry.leaveCount ?? 0);
            console.log(`Cumulative Count: ${cumulativeCount}`);
            return { date: entry.date, count: cumulativeCount };
        });
    };

    const renderLineChart = (id: string, data: any[], label: string, ref: React.MutableRefObject<Chart | null>) => {
        const ctx = document.getElementById(id) as HTMLCanvasElement;
        if (!ctx) return;
        const ctxContext = ctx.getContext('2d');
        if (!ctxContext) return;

        ref.current = new Chart(ctxContext, {
            type: 'line',
            data: {
                labels: data.map((entry: any) => {
                    if (timeUnit === 'week') {
                        const [year, week] = entry.date.split('-');
                        const startOfWeek = startOfISOWeek(new Date(parseInt(year), 0, (parseInt(week) - 1) * 7 + 1));
                        return format(startOfWeek, 'yyyy-MM-dd');
                    }
                    return entry.date;
                }),
                datasets: [{
                    label: label,
                    data: data.map((entry: any) => entry.count),
                    fill: false,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    tension: 0.1
                }]
            },
            options: {
                layout: {
                    padding: {
                        bottom: 20 // 하단 패딩 추가
                    }
                },
                scales: {
                    x: {
                        type: 'category',  // 'time' 대신 'category'를 사용하여 'YYYY-WW' 형식 유지
                        labels: data.map((entry: any) => entry.date) // 라벨을 직접 지정
                    },
                    y: {
                        beginAtZero: true
                    }
                },
                maintainAspectRatio: false // 추가된 옵션
            }
        });
    };

    const renderBarChart = (id: string, data: any[], label: string, ref: React.MutableRefObject<Chart | null>) => {
        const ctx = document.getElementById(id) as HTMLCanvasElement;
        if (!ctx) return;
        const ctxContext = ctx.getContext('2d');
        if (!ctxContext) return;

        ref.current = new Chart(ctxContext, {
            type: 'bar',
            data: {
                labels: data.map((entry: any) => entry.character),
                datasets: [{
                    label: label,
                    data: data.map((entry: any) => entry.count),
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                layout: {
                    padding: {
                        bottom: 20 // 하단 패딩 추가
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                maintainAspectRatio: false // 추가된 옵션
            }
        });
    };

    const fetchStats = async () => {
        const userStatsResponse = await fetchWithToken(`/api/admin/userStats?unit=${timeUnit}`);
        const sessionStatsResponse = await fetchWithToken(`/api/admin/sessionStats?unit=${timeUnit}`);
        const userLoginStatsResponse = await fetchWithToken(`/api/admin/userLoginStats?unit=${timeUnit}`);
        const characterStatsResponse = await fetchWithToken(`/api/admin/characterStats?unit=${timeUnit}`);
        const totalStatsResponse = await fetchWithToken(`/api/admin/totalStats?unit=${timeUnit}`);
        const usersResponse = await fetchWithToken('/api/admin/users');
        const memosResponse = await fetchMemos();

        console.log('Fetched User Stats:', userStatsResponse);

        const formattedUserStats = userStatsResponse.map((entry: any) => ({
            date: entry.date,
            joinCount: entry.count, // 가입자 수를 joinCount로 사용
            leaveCount: 0 // 이탈자 수가 없는 경우 0으로 설정
        }));

        setUserStats(formattedUserStats);
        setSessionStats(Array.isArray(sessionStatsResponse) ? sessionStatsResponse : []);
        setUserLoginStats(Array.isArray(userLoginStatsResponse) ? userLoginStatsResponse : []);
        setCharacterStats(Array.isArray(characterStatsResponse) ? characterStatsResponse : []);
        setTotalStats(Array.isArray(totalStatsResponse) ? totalStatsResponse : []);
        setUsers(Array.isArray(usersResponse) ? usersResponse : []);
        setMemos(Array.isArray(memosResponse) ? memosResponse.map((memo: any) => ({
            ...memo,
            created_at: memo.timestamp, // timestamp를 created_at으로 매핑
        })) : []);

        destroyCharts();
        const cumulativeUserStats = calculateCumulativeUserStats(formattedUserStats);
        console.log('Cumulative User Stats:', cumulativeUserStats);
        renderLineChart('userChart', cumulativeUserStats, '누적 회원 수', userChartRef);
        renderLineChart('sessionChart', Array.isArray(sessionStatsResponse) ? sessionStatsResponse : [], '비회원 접속 횟수', sessionChartRef);
        renderLineChart('userLoginChart', Array.isArray(userLoginStatsResponse) ? userLoginStatsResponse : [], '회원 접속 횟수', userLoginChartRef);
        renderLineChart('totalChart', Array.isArray(totalStatsResponse) ? totalStatsResponse : [], '회원 + 비회원 통합 접속 횟수', totalChartRef);
        renderBarChart('characterChart', Array.isArray(characterStatsResponse) ? characterStatsResponse : [], '캐릭터별 대화 횟수', characterChartRef);
    };

    useEffect(() => {
        fetchStats();
    }, [activeTab, timeUnit]);

    const handleDeleteUser = async (id: string) => {
        if (!confirm('정말로 삭제하시겠습니까?')) return;
        await fetchWithToken('/api/admin/deleteUser', {
            method: 'POST',
            body: JSON.stringify({ id }),
        });
        setUsers(users.filter((user) => user.id !== id));
    };

    const handleAddMemo = async () => {
        if (!newMemoContent) return;
        await addMemo(newMemoContent);
        fetchStats(); // 메모 추가 후 메모 목록을 다시 불러옴
        setNewMemoContent('');
    };

    const handleDeleteMemo = async (id: number) => {
        await deleteMemo(id);
        setMemos(memos.filter((memo) => memo.id !== id));
    };

    const handleKeyPress = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {  // Shift + Enter 인 경우는 제외
            e.preventDefault();
            await handleAddMemo();
        }
    };

    return (
        <div className="admin-container">
            <div className="sidebar">
                <div className="sidebar-title">관리자 메뉴</div>
                <div className={`sidebar-item ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>
                    <span className="sidebar-icon">👤</span> <span className="sidebar-text">사용량 통계</span>
                </div>
                <div className={`sidebar-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
                    <span className="sidebar-icon">≡</span> <span className="sidebar-text">사용자 관리</span>
                </div>
            </div>
            <div className="content">
                {activeTab === 'stats' && (
                    <div className="stats-container">
                        <div className="sort-buttons">
                            <button className={`sort-button ${timeUnit === 'year' ? 'active' : ''}`} onClick={() => setTimeUnit('year')}>Year</button>
                            <button className={`sort-button ${timeUnit === 'month' ? 'active' : ''}`} onClick={() => setTimeUnit('month')}>Month</button>
                            <button className={`sort-button ${timeUnit === 'week' ? 'active' : ''}`} onClick={() => setTimeUnit('week')}>Week</button>
                            <button className={`sort-button ${timeUnit === 'day' ? 'active' : ''}`} onClick={() => setTimeUnit('day')}>Day</button>
                        </div>
                        <div className="charts-grid">
                            <div className="chart-box">
                                <div className="chart-title">회원 그래프</div>
                                <canvas id="userChart"></canvas>
                            </div>
                            <div className="chart-box">
                                <div className="chart-title">통합 유저 그래프</div>
                                <canvas id="totalChart"></canvas>
                            </div>
                            <div className="chart-box">
                                <div className="chart-title">회원 접속 그래프</div>
                                <canvas id="userLoginChart"></canvas>
                            </div>
                            <div className="chart-box">
                                <div className="chart-title">비회원 접속 그래프</div>
                                <canvas id="sessionChart"></canvas>
                            </div>
                            <div className="chart-box-full">
                                <div className="chart-title">캐릭터별 대화 횟수</div>
                                <canvas id="characterChart"></canvas>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'users' && (
                    <div className="users-container">
                        <div className="user-list-title">회원 리스트</div>
                        <table className="user-list-table">
                            <thead>
                            <tr>
                                <th>ID</th>
                                <th>가입일</th>
                                <th>액션</th>
                            </tr>
                            </thead>
                            <tbody>
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td>{user.id}</td>
                                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <button className="delete-button" onClick={() => handleDeleteUser(user.id)}>
                                            삭제
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <div className="sidebar-right">
                <div className="admin-info">
                    <div className="admin-avatar">
                        <div className="admin-avatar-image" style={{ backgroundImage: `url('/iconLucia.png')` }} />
                    </div>
                    <div className="admin-title">Admin : MelissaJ</div>
                    <div className="admin-email">jsm930602@gmail.com</div>
                    <div className="admin-details">사용방식: WEB</div>
                    <div className="admin-details">SSL: CloudFlare SSL</div>
                    <div className="admin-details">도메인: https://www.holovrm.com</div>
                </div>
                <div className="memo-section">
                    <div className="memo-title">메모</div>
                    <div className="memo-content">
                        {memos.map((memo) => (
                            <div key={memo.id} className="memo-item">
                                <div className="memo-user">멜리사J</div>
                                <div className="memo-timestamp">{new Date(memo.created_at).toLocaleString()}</div>
                                <div className="memo-text">{memo.content}</div>
                                <button className="delete-button" onClick={() => handleDeleteMemo(memo.id)}>삭제</button>
                            </div>
                        ))}
                    </div>
                    <div className="memo-input">
                        <textarea
                            className="memo-textarea"
                            placeholder="관리자들과 공유할 메모를 남겨주세요"
                            value={newMemoContent}
                            onChange={(e) => setNewMemoContent(e.target.value)}
                            onKeyPress={handleKeyPress} // 엔터키 입력 이벤트 핸들러 추가
                        />
                        <button className="add-memo-button" onClick={handleAddMemo}>등록</button>
                    </div>
                </div>
            </div>
            <style jsx>{`
                .admin-container {
                    display: flex;
                    height: 100vh;
                    font-family: Arial, sans-serif;
                }

                .sidebar {
                    width: 15%;
                    background-color: #e6e6fa;
                    padding: 10px;
                    display: flex;
                    flex-direction: column;
                }

                .sidebar-title {
                    font-size: 1.2em;
                    font-weight: bold;
                    margin-bottom: 10px;
                    text-align: center;
                }

                .sidebar-item {
                    padding: 10px;
                    cursor: pointer;
                    color: #333;
                    border-radius: 5px;
                    margin-bottom: 5px;
                    display: flex;
                    align-items: center;
                }

                .sidebar-icon {
                    margin-right: 5px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .sidebar-text {
                    display: flex;
                    align-items: center;
                }

                .sidebar-item.active,
                .sidebar-item:hover {
                    background-color: #dcdcdc;
                }

                .content {
                    width: 55%;
                    padding: 10px;
                }

                .sort-buttons {
                    text-align: center;
                    margin-bottom: 10px;
                }

                .sort-button {
                    background-color: #d3d3d3;
                    border: none;
                    padding: 10px;
                    margin: 0 5px;
                    cursor: pointer;
                    border-radius: 5px;
                }

                .sort-button.active {
                    background-color: #a3a3a3;
                }

                .charts-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    grid-template-rows: repeat(3, 1fr);
                    grid-gap: 20px; /* 차트 사이의 간격을 더 넓게 설정 */
                    height: calc(100vh - 160px); /* 상단과 버튼 영역을 제외한 전체 높이 */
                }

                .chart-box {
                    border: 1px solid #ccc;
                    padding: 20px; /* 차트 내부 여백을 추가 */
                    background-color: #f9f9f9;
                    display: flex; /* 추가 */
                    flex-direction: column; /* 추가 */
                    justify-content: center; /* 추가 */
                    align-items: center; /* 추가 */
                    height: calc((100vh - 160px) / 3 - 30px); /* 높이 조정 */
                }

                .chart-box-full {
                    grid-column: span 2;
                    border: 1px solid #ccc;
                    padding: 20px; /* 차트 내부 여백을 추가 */
                    background-color: #f9f9f9;
                    display: flex; /* 추가 */
                    flex-direction: column; /* 추가 */
                    justify-content: center; /* 추가 */
                    align-items: center; /* 추가 */
                    width: 100%; /* 추가 */
                    height: calc((100vh - 160px) / 3 - 30px); /* 높이 조정 */
                }

                .chart-title {
                    font-size: 1.2em;
                    margin-bottom: 10px;
                }

                .users-container {
                    padding: 10px;
                }

                .user-list-title {
                    font-size: 1.5em;
                    margin-bottom: 10px;
                }

                .user-list-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .user-list-table th,
                .user-list-table td {
                    border: 1px solid #ccc;
                    padding: 8px;
                    text-align: left;
                }

                .delete-button {
                    background-color: #ff6347;
                    color: #fff;
                    border: none;
                    padding: 5px 10px;
                    cursor: pointer;
                    border-radius: 5px;
                }

                .sidebar-right {
                    width: 30%;
                    padding: 10px;
                    background-color: #f0f0f0;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }

                .admin-info {
                    border: 1px solid #ccc;
                    padding: 10px;
                    background-color: #2f3b4c;
                    color: #fff;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    border-radius: 8px;
                    margin-bottom: 10px;
                }

                .admin-avatar {
                    width: 60px;
                    height: 60px;
                    background-color: #bbb;
                    border-radius: 50%;
                    margin-bottom: 10px;
                    overflow: hidden; /* 이미지가 원형으로 보이게 하기 위해 추가 */
                }

                .admin-avatar-image {
                    width: 100%;
                    height: 100%;
                    background-size: cover;
                    background-position: center;
                }

                .admin-title {
                    font-size: 1.2em;
                    margin-bottom: 10px;
                }

                .admin-email,
                .admin-details {
                    margin-bottom: 5px;
                    color: #ccc;
                }

                .memo-section {
                    border: 1px solid #ccc;
                    padding: 10px;
                    background-color: #fff;
                    border-radius: 8px;
                    flex-grow: 1;
                    display: flex;
                    flex-direction: column;
                    height: 50vh; /* 높이를 명시적으로 설정 */
                }

                .memo-title {
                    font-size: 1.2em;
                    margin-bottom: 10px;
                }

                .memo-content {
                    flex-grow: 1;
                    display: flex;
                    flex-direction: column;
                    overflow-y: auto; /* 스크롤 추가 */
                }

                .memo-item {
                    margin-bottom: 10px;
                    border: 1px solid #ccc; /* 테두리 추가 */
                    border-radius: 8px; /* 둥근 모서리 추가 */
                    padding: 10px; /* 내부 여백 추가 */
                    background-color: #fffcdb; /* 배경색 추가 */
                }

                .memo-user {
                    background-color: #ffeb3b;
                    padding: 5px;
                    border-radius: 5px;
                    margin-bottom: 5px;
                }

                .memo-timestamp {
                    margin-bottom: 5px;
                }

                .memo-textarea {
                    width: calc(100% - 110px); /* 버튼 너비 고려한 크기 */
                    height: 50px;
                    padding: 5px;
                    border: 1px solid #ccc;
                    border-radius: 5px;
                    float: left; /* 왼쪽 정렬 */
                }

                .add-memo-button {
                    margin-top: 10px;
                    padding: 10px;
                    background-color: #4caf50;
                    color: #fff;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    float: right; /* 오른쪽 정렬 */
                }
            `}</style>
        </div>
    );
};

export default AdminControl;
