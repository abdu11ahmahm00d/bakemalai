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

        const telegramPromise = new Promise((resolve) => {
            const itemsList = items.map(i => `• ${i.name} (x${i.qty}) = ৳${i.price * i.qty}`).join('\n');
            const message = `🛍️ <b>New Order Received!</b>\n\n👤 <b>Name:</b> ${name}\n📞 <b>Phone:</b> ${phone}\n📍 <b>Address:</b> ${address}, ${city}\n💳 <b>Payment:</b> ${paymentMethod}\n🧾 <b>Items:</b>\n${itemsList}\n\n💰 <b>Total:</b> ৳${total}`;
            

            const chatIds = Object.keys(process.env)
                .filter(key => key.startsWith('TELEGRAM_CHAT_ID'))
                .map(key => process.env[key] ? String(process.env[key]).trim() : null)
                .filter(Boolean);
            
            console.log('Dispatching Telegram notifications to:', chatIds);
            
            if (chatIds.length === 0) {
                console.warn('No Telegram chat IDs found in environment.');
                return resolve();
            }

            let completedRequests = 0;
            chatIds.forEach(chatId => {
                const data = JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' });
                const req = https.request(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json', 
                        'Content-Length': Buffer.byteLength(data) 
                    }
                }, (res) => {
                    let resBody = '';
                    res.on('data', (d) => { resBody += d; });
                    res.on('end', () => {
                        if (res.statusCode !== 200) {
                            console.error(`Telegram delivery failed for ID ${chatId}:`, res.statusCode, resBody);
                        } else {
                            console.log(`Telegram message delivered to ${chatId}`);
                        }
                        completedRequests++;
                        if (completedRequests === chatIds.length) resolve();
                    });
                });
                
                req.on('error', (err) => {
                    console.error(`Request error for Telegram ID ${chatId}:`, err);
                    completedRequests++;
                    if (completedRequests === chatIds.length) resolve();
                });
                
                req.write(data);
                req.end();
            });
        });

        const sheetsPromise = (async () => {
            let key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
            if (!key) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY environment variable is missing.");
            
            let credentials;
            try {
                credentials = JSON.parse(key);
            } catch (err) {
                const cleaned = key.trim().replace(/^['"]|['"]$/g, '');
                credentials = JSON.parse(cleaned);
            }

            const auth = new google.auth.GoogleAuth({
                credentials,
                scopes: ['https://www.googleapis.com/auth/spreadsheets']
            });
            const sheets = google.sheets({ version: 'v4', auth });
            
            const itemsStr = items.map(i => `${i.name} x${i.qty}`).join(', ');
            const displayPaymentMethod = paymentMethod === 'bkash' ? 'Bkash' : 'Cash on Delivery';

            const spreadsheet = await sheets.spreadsheets.get({
                spreadsheetId: process.env.GOOGLE_SHEET_ID
            });
            const targetSheet = spreadsheet.data.sheets.find(s => s.properties.title === 'Orders');
            if (!targetSheet) throw new Error("Sheet 'Orders' not found.");
            const sheetId = targetSheet.properties.sheetId;

            const formatTimestamp = () => {
                const now = new Date();
                const pad = (n) => String(n).padStart(2, '0');
                return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
            };
            

            await sheets.spreadsheets.batchUpdate({
                spreadsheetId: process.env.GOOGLE_SHEET_ID,
                requestBody: {
                    requests: [{
                        insertDimension: {
                            range: {
                                sheetId: sheetId,
                                dimension: 'ROWS',
                                startIndex: 3,
                                endIndex: 4
                            },
                            inheritFromBefore: false
                        }
                    }]
                }
            });


            await sheets.spreadsheets.values.update({
                spreadsheetId: process.env.GOOGLE_SHEET_ID,
                range: 'Orders!A4:K4',
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [
                        [

                            formatTimestamp(),
                            name,
                            phone,
                            address,
                            city,
                            displayPaymentMethod,
                            bkashTxnId,
                            itemsStr,
                            total,
                            'New'
                        ]
                    ]
                }
            });
        })();

        await Promise.all([telegramPromise, sheetsPromise]);

        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
            body: JSON.stringify({ success: true })
        };
    } catch (error) {
        console.error('Notify Function Error:', error);
        return { 
            statusCode: 500, 
            headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
            body: JSON.stringify({ success: false, error: error.message }) 
        };
    }
};
