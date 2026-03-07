const PROJECT_REF = 'titgrqiexkbxvslvjhzo'
const ACCESS_TOKEN = 'sbp_10ce2509953bc9834a1bc42f81aa3a9dd7a1b0ac'
const API_URL = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`

async function test() {
    console.log('Testing connectivity...')
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: 'SELECT 1 as test' }),
            signal: controller.signal
        })
        console.log('Status:', res.status)
        const json = await res.json()
        console.log('Result:', json)
    } catch (err) {
        console.error('Error:', err.message)
    } finally {
        clearTimeout(timeoutId)
    }
}

test()
