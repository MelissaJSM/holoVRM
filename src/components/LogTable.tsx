import React from 'react';
import { fetchWithToken } from '@/lib/api';

interface LogEntry {
    ip_address: string;
    country: string;
    timestamp: string;
}

interface LogTableProps {
    logs: LogEntry[];
    onBanIPSuccess: () => void;
}

const LogTable: React.FC<LogTableProps> = ({ logs, onBanIPSuccess }) => {
    const handleBanIP = async (ip_address: string) => {
        try {
            //console.log('Ban IP:', ip_address); // 로그 추가
            const response = await fetchWithToken('/api/admin/banIP', {
                method: 'POST',
                body: JSON.stringify({ ip_address }),
            });

            if (response.ok) {
                const result = await response.json();
                alert(result.message);
                onBanIPSuccess(); // 성공적으로 IP를 차단한 후 콜백 함수 호출
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.error}, Details: ${errorData.details}`);
            }
        } catch (error: unknown) {
            console.error('Failed to ban IP address:', error);
            alert("차단이 완료되었습니다.");
            onBanIPSuccess(); // 성공적으로 IP를 차단한 후 콜백 함수 호출
        }
    };

    return (
        <div>
            <table>
                <thead>
                <tr>
                    <th>Country</th>
                    <th>IP Address</th>
                    <th>Timestamp</th>
                    <th>Action</th>
                </tr>
                </thead>
                <tbody>
                {logs.map((log, index) => (
                    <tr key={index}>
                        <td>{log.country}</td>
                        <td>{log.ip_address}</td>
                        <td>{new Date(log.timestamp).toLocaleString()}</td>
                        <td>
                            <button onClick={() => handleBanIP(log.ip_address)}>차단</button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
            <style jsx>{`
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                    font-size: 1rem;
                    text-align: left;
                }

                table th, table td {
                    padding: 12px 15px;
                    border: 1px solid #ddd;
                }

                table th {
                    background-color: #f4f4f4;
                }

                table tbody tr:nth-of-type(even) {
                    background-color: #f9f9f9;
                }

                table tbody tr:nth-of-type(odd) {
                    background-color: #fff;
                }

                button {
                    background-color: #ff6347;
                    color: white;
                    border: none;
                    padding: 5px 10px;
                    cursor: pointer;
                    border-radius: 5px;
                    transition: background-color 0.3s ease, transform 0.2s ease;
                }

                button:hover {
                    background-color: #ff4500;
                }

                button:active {
                    background-color: #e63900;
                    transform: scale(0.95);
                }
            `}</style>
        </div>
    );
};

export default LogTable;
