// src/lib/api.ts

export const fetchWithToken = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
        ...options.headers,
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };

    let response = await fetch(url, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        // 토큰이 만료된 경우
        const refreshToken = localStorage.getItem('refreshToken');
        const refreshResponse = await fetch('/api/auth/refreshToken', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken }),
        });

        if (refreshResponse.ok) {
            const { accessToken } = await refreshResponse.json();
            localStorage.setItem('token', accessToken);

            // 원래 요청을 새로운 토큰으로 다시 시도
            response = await fetch(url, {
                ...options,
                headers: {
                    ...headers,
                    'Authorization': `Bearer ${accessToken}`,
                },
            });
        } else {
            // 리프레시 토큰 갱신 실패 시, 사용자에게 다시 로그인 요청
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
            return;
        }
    }

    return response.json();
};

export const fetchMemos = async () => {
    const response = await fetchWithToken('/api/memos');
    return response;
};

export const addMemo = async (content: string) => {
    const response = await fetchWithToken('/api/memos', {
        method: 'POST',
        body: JSON.stringify({ content }),
    });
    return response;
};

export const deleteMemo = async (id: number) => {
    const response = await fetchWithToken('/api/memos', {
        method: 'DELETE',
        body: JSON.stringify({ id }),
    });
    return response;
};
