import fetch, { Response as FetchResponse } from 'node-fetch';

const API_KEY = process.env.CLOUDFLARE_API_KEY as string;
const EMAIL = process.env.CLOUDFLARE_EMAIL as string;
const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID as string;

export interface IPAccessRule {
    id: string;
    mode: string;
    notes: string;
    configuration: {
        target: string;
        value: string;
    };
}

interface CloudflareResponse<T> {
    success: boolean;
    errors: any[];
    messages: any[];
    result: T;
}

const fetchOptions = {
    headers: {
        'X-Auth-Email': EMAIL,
        'X-Auth-Key': API_KEY,
        'Content-Type': 'application/json',
    },
};

const parseJSON = async <T>(response: FetchResponse): Promise<CloudflareResponse<T>> => {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return await response.json() as CloudflareResponse<T>;
    } else {
        const errorText = await response.text();
        console.error('Error parsing JSON:', errorText);
        throw new Error('Failed to parse JSON');
    }
};

export async function addIPAccessRule(ip_address: string, mode: 'whitelist' | 'block', notes: string): Promise<void> {
    const data = {
        mode,
        configuration: {
            target: 'ip',
            value: ip_address,
        },
        notes,
    };

    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/firewall/access_rules/rules`, {
        ...fetchOptions,
        method: 'POST',
        body: JSON.stringify(data),
    });

    const responseData = await parseJSON<IPAccessRule>(response);
    console.log('Cloudflare response data:', responseData); // 응답 데이터 로그 추가
    if (!responseData.success) {
        throw new Error(`Failed to add IP access rule: ${JSON.stringify(responseData.errors)}`);
    }
}

export async function removeIPAccessRule(ip_address: string): Promise<void> {
    console.log('Trying to remove IP address:', ip_address); // IP 주소 로그 추가

    // 먼저 IP 차단 규칙 ID를 가져와야 합니다.
    const listResponse = await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/firewall/access_rules/rules?configuration.value=${ip_address}`, {
        method: 'GET',
        headers: fetchOptions.headers,
    });

    const listData = await parseJSON<IPAccessRule[]>(listResponse);
    console.log('List Data:', listData); // 응답 데이터 로그 추가
    if (!listData.success) {
        throw new Error(`Failed to list IP access rules: ${JSON.stringify(listData.errors)}`);
    }

    const rule = listData.result.find(r => r.configuration.value === ip_address);
    console.log('Found rule:', rule); // 찾은 규칙 로그 추가
    if (!rule) {
        throw new Error('IP address not found in access rules');
    }

    // IP 차단 규칙 삭제
    const deleteResponse = await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/firewall/access_rules/rules/${rule.id}`, {
        method: 'DELETE',
        headers: fetchOptions.headers,
        body: JSON.stringify({ cascade: 'none' }),
    });

    const deleteData = await parseJSON<null>(deleteResponse);
    console.log('Delete Data:', deleteData); // 응답 데이터 로그 추가
    if (!deleteData.success) {
        throw new Error(`Failed to delete IP access rule: ${JSON.stringify(deleteData.errors)}`);
    }
}

export async function getBannedIPs(): Promise<IPAccessRule[]> {
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/firewall/access_rules/rules?page=1&per_page=1000&mode=block&configuration.target=ip`, {
        method: 'GET',
        headers: fetchOptions.headers,
    });

    const data = await parseJSON<IPAccessRule[]>(response);
    console.log('Get Banned IPs Data:', data); // 응답 데이터 로그 추가
    if (!data.success) {
        throw new Error(`Failed to fetch banned IPs: ${JSON.stringify(data.errors)}`);
    }
    return data.result;
}
