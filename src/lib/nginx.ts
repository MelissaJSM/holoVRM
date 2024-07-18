import { query } from '@/lib/db';
import { exec } from 'child_process';

async function getBannedIPs(): Promise<string[]> {
    const result = await query('SELECT ip_address FROM banned_ips');
    return (result as any).map((row: any) => row.ip_address);
}

export async function updateFail2banConfig() {
    // fail2ban 재시작 (필요할 경우)
    exec('sudo fail2ban-client reload', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error reloading fail2ban: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Stderr from reloading fail2ban: ${stderr}`);
            return;
        }
        console.log(`fail2ban reloaded: ${stdout}`);
    });
}

export async function banIP(ip_address: string) {
    await query('INSERT INTO banned_ips (ip_address) VALUES (?)', [ip_address]);
    exec(`sudo fail2ban-client set custom-ban banip ${ip_address}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error banning IP address: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Stderr from banning IP address: ${stderr}`);
            return;
        }
        console.log(`IP address banned: ${stdout}`);
    });
    await updateFail2banConfig();
}

export async function unbanIP(ip_address: string) {
    await query('DELETE FROM banned_ips WHERE ip_address = ?', [ip_address]);
    exec(`sudo fail2ban-client set custom-ban unbanip ${ip_address}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error unbanning IP address: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Stderr from unbanning IP address: ${stderr}`);
            return;
        }
        console.log(`IP address unbanned: ${stdout}`);
    });
    await updateFail2banConfig();
}
