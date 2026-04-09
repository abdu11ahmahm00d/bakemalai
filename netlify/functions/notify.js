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
            
            const chatIds = [process.env.TELEGRAM_CHAT_ID];
            if (process.env.TELEGRAM_CHAT_ID_2) {
                chatIds.push(process.env.TELEGRAM_CHAT_ID_2);
            }

            let completedRequests = 0;
            let errorOccurred = false;

            chatIds.forEach(chatId => {
                const data = JSON.stringify({
                    chat_id: chatId,
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
                        completedRequests++;
                        if (res.statusCode < 200 || res.statusCode >= 300) {
                            errorOccurred = true;
                        }
                        if (completedRequests === chatIds.length) {
                            if (errorOccurred) {
                                reject(new Error('Telegram API error'));
                            } else {
                                resolve();
                            }
                        }
                    });
                });

                req.on('error', reject);
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
                // Remove potential outer quotes added by some parsers
                const cleaned = key.trim().replace(/^['"]|['"]$/g, '');
                credentials = JSON.parse(cleaned);
            }

            const auth = new google.auth.GoogleAuth({
                credentials,
                scopes: ['https://www.googleapis.com/auth/spreadsheets']
            });
            const sheets = google.sheets({ version: 'v4', auth });
            
            const itemsStr = items.map(i => `${i.name} x${i.qty}`).join(', ');
            
            await sheets.spreadsheets.values.append({
                spreadsheetId: process.env.GOOGLE_SHEET_ID,
                range: 'Orders!A:J',
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [
                        [
                            '', // A: Order # (Placeholder)
                            new Date().toLocaleString(), // B: Timestamp
                            name, // C: Customer Name
                            phone, // D: Phone
                            address, // E: Address
                            city, // F: City
                            paymentMethod, // G: Payment Status/Method
                            total, // H: Total Amount
                            itemsStr, // I: Items
                            'New' // J: Order Status
                        ]
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
        console.error('Notify Function Error:', error);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ 
                success: false, 
                error: error.message,
                stack: error.stack 
            }) 
        };
    }
};
