export async function fetchAllData() {
    try {
        const token = sessionStorage.getItem('jwtToken');
        if (!token) throw new Error('No token available');

        // consider using Promise.all()
        // check Line 117
        const userData = await executeQuery(USER_QUERY, token);
        console.log(userData);
        const xpSumData = await executeQuery(XP_SUM_QUERY, token);
        console.log(xpSumData);
        const xpTransactionData = await executeQuery(XP_TRANSACTIONS_QUERY, token);
        console.log(xpTransactionData);
        const typeTransactionData = await executeQuery(TYPE_TRANSACTION_QUERY, token);
        console.log(typeTransactionData);

        // consider error handling here in case of the query is returning an empty array
        // or null, this might break UI or show undefined.
        return {
            user: userData.user[0],
            xpSum: xpSumData.transaction_aggregate.aggregate.sum.amount,
            xpTransaction: xpTransactionData.transaction,
            typeTransaction: typeTransactionData.transaction
        };
    } catch (error) {
        console.error('Error fetching data:', error)
        throw error;
    }
}

async function executeQuery(query, token) {
    try {
        const response = await fetch('https://01.gritlab.ax/api/graphql-engine/v1/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ query }),
    });

    // if (!response.ok) throw new Error('Failed to fetch data');
    // adding more robust error handling

    // Handle 401 Unauthorized (token expired)
    if (response.status === 401) {
        sessionStorage.removeItem('jwtToken'); // Clear expired token
        window.location.reload(); // Redirect to login
        throw new Error('Session expired. Please log in again.');
    }

    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }


    const { data, errors } = await response.json();
    if (errors) {
        throw new Error(`GraphQL Error: ${errors[0].message}`);
    }
    
    return data;
    } catch {
        onsole.error('Query failed:', error.message);
        throw error; // Re-throw for handling in fetchAllData
    }
}
// removed attrs for efficiency since the data was unused
const USER_QUERY = `
    query {
        user {
            id
            firstName
            lastName
            login
            auditRatio
            totalUp
            totalDown
        }
    }`;

const XP_SUM_QUERY = `
    query {
        transaction_aggregate(
        where: {_and: [{type: {_eq: "xp"}}, {eventId: {_eq: 104}}]}
        ) {
        aggregate {
            sum {
            amount
            }
        }
    }
}`;

const XP_TRANSACTIONS_QUERY = `
    query {
        transaction(
        order_by: [{ createdAt: desc }]
        where: { type: { _like: "xp" }, eventId: {_eq: 104}}
    ) {
        path
        type
        createdAt
        amount
    }
}`;

const TYPE_TRANSACTION_QUERY = `
    query { 
        transaction(where: {eventId: {_eq: 104}}) {
        type
        }
    }
`


// export async function fetchAllData() {
//     try {
//         const token = sessionStorage.getItem('jwtToken');
//         if (!token) throw new Error('No token available');

//         // Execute queries in parallel (optional)
//         const [userData, xpSumData, xpTransactionData, typeTransactionData] = await Promise.all([
//             executeQuery(USER_QUERY, token).catch(e => ({ error: e.message })),
//             executeQuery(XP_SUM_QUERY, token).catch(e => ({ error: e.message })),
//             executeQuery(XP_TRANSACTIONS_QUERY, token).catch(e => ({ error: e.message })),
//             executeQuery(TYPE_TRANSACTION_QUERY, token).catch(e => ({ error: e.message })),
//         ]);

//         // Check for errors in any query
//         const errors = [
//             userData.error,
//             xpSumData.error,
//             xpTransactionData.error,
//             typeTransactionData.error
//         ].filter(Boolean);

//         if (errors.length > 0) {
//             console.warn('Partial data errors:', errors);
//         }

//         // Validate critical data
//         if (!userData?.user?.[0]) {
//             throw new Error('User data not found');
//         }

//         return {
//             user: userData.user[0],
//             xpSum: xpSumData?.transaction_aggregate?.aggregate?.sum?.amount || 0, // Default to 0
//             xpTransaction: xpTransactionData?.transaction || [],
//             typeTransaction: typeTransactionData?.transaction || [],
//             errors // Pass errors to UI if needed
//         };

//     } catch (error) {
//         console.error('Data fetch failed:', error.message);
//         throw error; // Let displayData.js handle UI errors
//     }
// }
