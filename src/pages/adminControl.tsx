import React, { useEffect, useState, useRef } from 'react';
import Chart from 'chart.js/auto';
import 'chartjs-adapter-date-fns';
import { fetchWithToken, fetchMemos, addMemo, deleteMemo } from '@/lib/api';
import { parseISO, startOfISOWeek, format } from 'date-fns';
import LogTable from '../components/LogTable';

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

type LogEntry = {
    ip_address: string;
    original_ip: string;
    country: string;
    timestamp: string;
};

type BannedIP = {
    id: number;
    ip_address: string;
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
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('');
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [searchIP, setSearchIP] = useState('');
    const [allCountries, setAllCountries] = useState<string[]>([]);
    const [bannedIPs, setBannedIPs] = useState<BannedIP[]>([]);

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

    const calculateCumulativeUserStats = (data: UserStat[]) => {
        let cumulativeCount = 0;
        return data.map(entry => {
            cumulativeCount += (entry.joinCount ?? 0) - (entry.leaveCount ?? 0);
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
                        bottom: 20
                    }
                },
                scales: {
                    x: {
                        type: 'category',
                        labels: data.map((entry: any) => entry.date)
                    },
                    y: {
                        beginAtZero: true
                    }
                },
                maintainAspectRatio: false
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
                        bottom: 20
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                maintainAspectRatio: false
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
        const logsResponse = await fetch('/api/getLogs');
        const bannedIPsResponse = await fetchWithToken('/api/admin/bannedIPs');

        const formattedUserStats = userStatsResponse.map((entry: any) => ({
            date: entry.date,
            joinCount: entry.count,
            leaveCount: 0
        }));

        setUserStats(formattedUserStats);
        setSessionStats(Array.isArray(sessionStatsResponse) ? sessionStatsResponse : []);
        setUserLoginStats(Array.isArray(userLoginStatsResponse) ? userLoginStatsResponse : []);
        setCharacterStats(Array.isArray(characterStatsResponse) ? characterStatsResponse : []);
        setTotalStats(Array.isArray(totalStatsResponse) ? totalStatsResponse : []);
        setUsers(Array.isArray(usersResponse) ? usersResponse : []);
        setMemos(Array.isArray(memosResponse) ? memosResponse.map((memo: any) => ({
            ...memo,
            created_at: memo.timestamp,
        })) : []);
        const logsData = await logsResponse.json();
        setLogs(logsData);
        setAllCountries([...new Set(logsData.map((log: LogEntry) => log.country))] as string[]); // 고유한 국가 목록을 allCountries에 설정
        setBannedIPs(Array.isArray(bannedIPsResponse) ? bannedIPsResponse.map((ip: any) => ({
            ...ip,
            created_at: ip.created_at ? new Date(ip.created_at).toLocaleString() : 'Invalid Date',
        })) : []);

        destroyCharts();
        const cumulativeUserStats = calculateCumulativeUserStats(formattedUserStats);
        renderLineChart('userChart', cumulativeUserStats, '누적 회원 수', userChartRef);
        renderLineChart('sessionChart', Array.isArray(sessionStatsResponse) ? sessionStatsResponse : [], '비회원 접속 횟수', sessionChartRef);
        renderLineChart('userLoginChart', Array.isArray(userLoginStatsResponse) ? userLoginStatsResponse : [], '회원 접속 횟수', userLoginChartRef);
        renderLineChart('totalChart', Array.isArray(totalStatsResponse) ? totalStatsResponse : [], '회원 + 비회원 통합 접속 횟수', totalChartRef);
        renderBarChart('characterChart', Array.isArray(characterStatsResponse) ? characterStatsResponse : [], '캐릭터별 대화 횟수', characterChartRef);
    };

    const fetchBannedIPs = async () => {
        const bannedIPsResponse = await fetchWithToken('/api/admin/bannedIPs');
        setBannedIPs(Array.isArray(bannedIPsResponse) ? bannedIPsResponse.map((ip: any) => ({
            ...ip,
            created_at: ip.created_at ? new Date(ip.created_at).toLocaleString() : 'Invalid Date',
        })) : []);
    };

    useEffect(() => {
        fetchStats();
        fetchBannedIPs();
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
        fetchStats();
        setNewMemoContent('');
    };

    const handleDeleteMemo = async (id: number) => {
        await deleteMemo(id);
        setMemos(memos.filter((memo) => memo.id !== id));
    };

    const handleKeyPress = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            await handleAddMemo();
        }
    };

    const handleFilter = async () => {
        let url = '/api/getLogs?';
        if (startDate) url += `start=${startDate}&`;
        if (endDate) url += `end=${endDate}&`;
        if (selectedCountry) url += `country=${selectedCountry}&`;
        if (searchIP) url += `ip=${searchIP}&`;
        console.log('Fetching logs with URL:', url); // 디버그 로그 추가
        const response = await fetch(url);
        const filteredLogs = await response.json();
        setLogs(filteredLogs);
    };

    const handleReset = () => {
        setStartDate('');
        setEndDate('');
        setSelectedCountry('');
        setSearchIP('');
        fetchStats();
    };

    const handleDeleteLogs = async () => {
        if (!confirm('정말로 모든 로그를 삭제하시겠습니까?')) return;
        await fetch('/api/deleteLogs', { method: 'DELETE' });
        fetchStats();
    };

    const handleUnbanIP = async (ip_address: string) => {
        try {
            const response = await fetchWithToken('/api/admin/unbanIP', {
                method: 'POST',
                body: JSON.stringify({ ip_address }), // IP 주소를 직접 전달합니다.
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('Unban result:', result); // 응답 데이터 로그 추가
            alert('차단 해제를 완료하였습니다');
            fetchBannedIPs(); // 차단된 IP 리스트를 갱신합니다.
        } catch (error) {
            alert('차단 해제를 완료하였습니다');
            fetchBannedIPs(); // 차단된 IP 리스트를 갱신합니다.
        }
    };

    return (
        <div className="admin-container">
            <div className="sidebar">
                <div className="sidebar-title">관리자 메뉴</div>
                <div className={`sidebar-item ${activeTab === 'stats' ? 'active' : ''}`}
                     onClick={() => setActiveTab('stats')}>
                    <span className="sidebar-icon">👤</span> <span className="sidebar-text">사용량 통계</span>
                </div>
                <div className={`sidebar-item ${activeTab === 'users' ? 'active' : ''}`}
                     onClick={() => setActiveTab('users')}>
                    <span className="sidebar-icon">≡</span> <span className="sidebar-text">사용자 관리</span>
                </div>
                <div className={`sidebar-item ${activeTab === 'bans' ? 'active' : ''}`}
                     onClick={() => setActiveTab('bans')}>
                    <span className="sidebar-icon">🚫</span> <span className="sidebar-text">차단 IP 관리</span>
                </div>
                <div className="sidebar-divider"></div>
                <div className="sidebar-title">IP 접속 기록</div>
                <div className="log-filter">
                    <div>
                        <label>시작 날짜: </label>
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}/>
                    </div>
                    <div>
                        <label>종료 날짜: </label>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}/>
                    </div>
                    <div>
                        <label>국가: </label>
                        <select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)}>
                            <option value="">선택하세요</option>
                            {allCountries.map((country) => (
                                <option key={country} value={country}>{country}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label>IP 주소 검색: </label>
                        <input type="text" value={searchIP} onChange={(e) => setSearchIP(e.target.value)}/>
                    </div>
                    <button onClick={handleFilter}>필터 적용</button>
                    <button onClick={handleReset}>초기화</button>
                    <button className="delete-logs-button" onClick={handleDeleteLogs}>기록 삭제</button>
                </div>
                <div className="log-table-container">
                    <LogTable logs={logs} onBanIPSuccess={fetchBannedIPs} />
                </div>
            </div>
            <div className="content">
                <div className="sidebar-title"></div>
                {activeTab === 'stats' && (
                    <div className="stats-container">
                        <div className="sort-buttons">
                            <button className={`sort-button ${timeUnit === 'year' ? 'active' : ''}`}
                                    onClick={() => setTimeUnit('year')}>Year
                            </button>
                            <button className={`sort-button ${timeUnit === 'month' ? 'active' : ''}`}
                                    onClick={() => setTimeUnit('month')}>Month
                            </button>
                            <button className={`sort-button ${timeUnit === 'week' ? 'active' : ''}`}
                                    onClick={() => setTimeUnit('week')}>Week
                            </button>
                            <button className={`sort-button ${timeUnit === 'day' ? 'active' : ''}`}
                                    onClick={() => setTimeUnit('day')}>Day
                            </button>
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
                {activeTab === 'bans' && (
                    <div className="users-container">
                        <div className="user-list-title">차단된 IP 리스트</div>
                        <table className="user-list-table">
                            <thead>
                            <tr>
                                <th>IP Address</th>
                                <th>차단일</th>
                                <th>액션</th>
                            </tr>
                            </thead>
                            <tbody>
                            {bannedIPs.map((ip) => (
                                <tr key={ip.id}>
                                    <td>{ip.ip_address}</td>
                                    <td>{ip.created_at}</td>
                                    <td>
                                        <button className="unban-button" onClick={() => handleUnbanIP(ip.ip_address)}>
                                            차단 해제
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
                            onKeyPress={handleKeyPress}
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
                    width: 25%;
                    background-color: #e6e6fa;
                    padding: 10px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .sidebar-title {
                    margin-top: 10px;
                    font-size: 1.2em;
                    font-weight: bold;
                    margin-bottom: 10px;
                    text-align: center;
                }
                .sidebar-divider {
                    width: 100%;
                    border-top: 1px solid #ccc;
                    margin: 10px 0;
                }

                .sidebar-item {
                    padding: 10px;
                    cursor: pointer;
                    color: #333;
                    border-radius: 5px;
                    margin-bottom: 5px;
                    display: flex;
                    align-items: center;
                    width: 100%;
                    justify-content: center;
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

                .log-filter {
                    display: flex;
                    flex-direction: column;
                    margin-top: 10px;
                    width: 100%;
                }

                .log-filter div {
                    display: flex;
                    flex-direction: column;
                    margin-bottom: 10px;
                }

                .log-filter label {
                    margin-bottom: 5px;
                }

                .log-filter input,
                .log-filter select {
                    padding: 8px;
                    border: 1px solid #ccc;
                    border-radius: 5px;
                }

                .log-filter button {
                    background-color: #4caf50;
                    color: white;
                    border: none;
                    padding: 10px;
                    border-radius: 5px;
                    cursor: pointer;
                    margin-top: 10px;
                }

                .log-filter button {
                    background-color: #4caf50;
                    color: white;
                    border: none;
                    padding: 10px;
                    border-radius: 5px;
                    cursor: pointer;
                    margin-top: 10px;
                    transition: background-color 0.3s ease, transform 0.2s ease;
                }

                .log-filter button:hover {
                    background-color: #45a049;
                }

                .log-filter button:active {
                    background-color: #388e3c;
                    transform: scale(0.95);
                }


                .log-filter .delete-logs-button {
                    background-color: #ff6347;
                    color: white;
                    border: none;
                    padding: 10px;
                    border-radius: 5px;
                    cursor: pointer;
                    margin-top: 10px;
                    transition: background-color 0.3s ease, transform 0.2s ease;
                }

                .log-filter .delete-logs-button:hover {
                    background-color: #ff4500;
                }

                .log-filter .delete-logs-button:active {
                    background-color: #e63900;
                    transform: scale(0.95);
                }


                .log-table-container {
                    margin-top: 20px;
                    width: 100%;
                    height: calc(100vh - 500px);
                    overflow-y: auto;
                }

                .content {
                    width: 50%;
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
                    transition: background-color 0.3s ease, transform 0.2s ease;
                }

                .sort-button:hover {
                    background-color: #c0c0c0;
                }

                .sort-button:active {
                    background-color: #a9a9a9;
                    transform: scale(0.95);
                }

                .sort-button.active {
                    background-color: #a3a3a3;
                    transition: background-color 0.3s ease, transform 0.2s ease;
                }

                .sort-button.active:hover {
                    background-color: #909090;
                }

                .sort-button.active:active {
                    background-color: #787878;
                    transform: scale(0.95);
                }


                .charts-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    grid-template-rows: repeat(3, 1fr);
                    grid-gap: 20px;
                    height: calc(100vh - 160px);
                }

                .chart-box {
                    border: 1px solid #ccc;
                    padding: 20px;
                    background-color: #f9f9f9;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    height: calc((100vh - 160px) / 3 - 30px);
                }

                .chart-box-full {
                    grid-column: span 2;
                    border: 1px solid #ccc;
                    padding: 20px;
                    background-color: #f9f9f9;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    width: 100%;
                    height: calc((100vh - 160px) / 3 - 30px);
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
                    transition: background-color 0.3s ease, transform 0.2s ease;
                }

                .delete-button:hover {
                    background-color: #ff4500;
                }

                .delete-button:active {
                    background-color: #e63900;
                    transform: scale(0.95);
                }

                .unban-button {
                    background-color: #ff6347;
                    color: #fff;
                    border: none;
                    padding: 5px 10px;
                    cursor: pointer;
                    border-radius: 5px;
                    transition: background-color 0.3s ease, transform 0.2s ease;
                }

                .unban-button:hover {
                    background-color: #ff4500;
                }

                .unban-button:active {
                    background-color: #e63900;
                    transform: scale(0.95);
                }


                .sidebar-right {
                    width: 25%;
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
                    overflow: hidden;
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
                    height: 50vh;
                }

                .memo-title {
                    font-size: 1.2em;
                    margin-bottom: 10px;
                }

                .memo-content {
                    flex-grow: 1;
                    display: flex;
                    flex-direction: column;
                    overflow-y: auto;
                }

                .memo-item {
                    margin-bottom: 10px;
                    border: 1px solid #ccc;
                    border-radius: 8px;
                    padding: 10px;
                    background-color: #fffcdb;
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
                    width: calc(100% - 110px);
                    height: 50px;
                    padding: 5px;
                    border: 1px solid #ccc;
                    border-radius: 5px;
                    float: left;
                }

                .add-memo-button {
                    margin-top: 10px;
                    padding: 10px;
                    background-color: #4caf50;
                    color: #fff;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    float: right;
                    transition: background-color 0.3s ease, transform 0.2s ease;
                }

                .add-memo-button:hover {
                    background-color: #45a049;
                }

                .add-memo-button:active {
                    background-color: #388e3c;
                    transform: scale(0.95);
                }

            `}</style>
        </div>
    );
};

export default AdminControl;
