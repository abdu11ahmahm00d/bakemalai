const https = require('https');
const { google } = require('googleapis');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const body = JSON.parse(event.body);
        const { name, phone, address, city, paymentMethod, bkashTxnId, items, total } = body;

        if (!name || !phone || !address || !city || !paymentMethod || !items || !total) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
        }

        const telegramPromise = new Promise((resolve, reject) => {
            const itemsList = items.map(i => `• ${i.name} (x${i.qty}) = ৳${i.price * i.qty}`).join('\n');
            const message = `🛍️ <b>New Order Received!</b>\n\n👤 <b>Name:</b> ${name}\n📞 <b>Phone:</b> ${phone}\n📍 <b>Address:</b> ${address}, ${city}\n💳 <b>Payment:</b> ${paymentMethod}\n🧾 <b>Items:</b>\n${itemsList}\n\n💰 <b>Total:</b> ৳${total}`;
            
            const data = JSON.stringify({
                chat_id: process.env.TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            });

            const req = https.request('https://api.telegram.org/bot' + process.env.TELEGRAM_BOT_TOKEN + '/sendMessage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(data)
                }
            }, (res) => {
                let resData = '';
                res.on('data', chunk => resData += chunk);
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) resolve();
                    else reject(new Error('Telegram API error'));
                });
            });

            req.on('error', reject);
            req.write(data);
            req.end();
        });

        const sheetsPromise = (async () => {
            const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
            const auth = new google.auth.GoogleAuth({
                credentials,
                scopes: ['https://www.googleapis.com/auth/spreadsheets']
            });
            const sheets = google.sheets({ version: 'v4', auth });
            
            const itemsStr = items.map(i => `${i.name} x${i.qty}`).join(', ');
            
            await sheets.spreadsheets.values.append({
                spreadsheetId: process.env.GOOGLE_SHEET_ID,
                range: 'Sheet1!A:J',
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [
                        [new Date().toISOString(), name, phone, address, city, paymentMethod, bkashTxnId || '', itemsStr, total, 'New']
                    ]
                }
            });
        })();

        await Promise.all([telegramPromise, sheetsPromise]);

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ success: true })
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ success: false }) };
    }
};
