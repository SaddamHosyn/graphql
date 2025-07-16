// Basic function to perform GraphQL queries
async function performQuery(query, authToken) {
    try {
        const response = await fetch('https://01.gritlab.ax/api/graphql-engine/v1/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({ query }),
        });

        if (response.status === 401) {
            sessionStorage.removeItem('authToken');
            window.location.reload();
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
    } catch (error) {
        console.error('Query execution failed:', error.message);
        throw error;
    }
}

export async function loadUserData() {
    try {
        const authToken = sessionStorage.getItem('authToken');
        if (!authToken) throw new Error('Authentication token missing');

        const userProfile = await performQuery(PROFILE_QUERY, authToken);
        console.log(userProfile);
        const totalExperience = await performQuery(TOTAL_XP_QUERY, authToken);
        console.log(totalExperience);
        const experienceHistory = await performQuery(XP_HISTORY_QUERY, authToken);
        console.log(experienceHistory);
        const auditTransactions = await performQuery(AUDIT_TRANSACTIONS_QUERY, authToken);
        console.log(auditTransactions);

        return {
            profile: userProfile.user[0],
            totalXP: totalExperience.transaction_aggregate.aggregate.sum.amount,
            xpHistory: experienceHistory.transaction,
            auditData: auditTransactions.transaction
        };
    } catch (error) {
        console.error('Data loading failed:', error)
        throw error;
    }
}

// NEW: Function to execute nested query (mandatory requirement)
export async function loadNestedUserData() {
    try {
        const authToken = sessionStorage.getItem('authToken');
        if (!authToken) throw new Error('Authentication token missing');

        const nestedUserData = await performQuery(NESTED_USER_QUERY, authToken);
        console.log('Nested Query Result:', nestedUserData);
        
        return {
            profile: nestedUserData.user[0],
            transactions: nestedUserData.user[0]?.transactions || [],
            auditCount: nestedUserData.user[0]?.audits_aggregate?.aggregate?.count || 0
        };
    } catch (error) {
        console.error('Nested query failed:', error);
        throw error;
    }
}

// NEW: Function to execute query with arguments (mandatory requirement)
export async function loadUserByIdWithTransactions(userId) {
    try {
        const authToken = sessionStorage.getItem('authToken');
        if (!authToken) throw new Error('Authentication token missing');

        const variables = { userId: parseInt(userId) };
        const userData = await performQueryWithVariables(USER_BY_ID_QUERY, variables, authToken);
        console.log('Query with Arguments Result:', userData);
        
        return {
            profile: userData.user[0],
            recentTransactions: userData.user[0]?.transactions || []
        };
    } catch (error) {
        console.error('Query with arguments failed:', error);
        throw error;
    }
}



//  function to perform queries with variables
async function performQueryWithVariables(query, variables, authToken) {
    try {
        const response = await fetch('https://01.gritlab.ax/api/graphql-engine/v1/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({ 
                query: query,
                variables: variables
            }),
        });

        if (response.status === 401) {
            sessionStorage.removeItem('authToken');
            window.location.reload();
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
    } catch (error) {
        console.error('Query with variables execution failed:', error.message);
        throw error;
    }
}

const PROFILE_QUERY = `
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

// Enhanced nested query with user and related transactions
const NESTED_USER_QUERY = `
    query {
        user {
            id
            firstName
            lastName
            login
            auditRatio
            totalUp
            totalDown
            transactions(
                order_by: [{ createdAt: desc }]
                limit: 10
                where: { type: { _like: "xp" } }
            ) {
                id
                type
                amount
                createdAt
                path
                object {
                    id
                    name
                }
            }
            audits_aggregate {
                aggregate {
                    count
                }
            }
        }
    }`;

// Query with arguments - parameterized query
const USER_BY_ID_QUERY = `
    query GetUserById($userId: Int!) {
        user(where: { id: { _eq: $userId } }) {
            id
            firstName
            lastName
            login
            auditRatio
            totalUp
            totalDown
            transactions(
                order_by: [{ createdAt: desc }]
                limit: 5
                where: { type: { _eq: "xp" } }
            ) {
                id
                type
                amount
                createdAt
                path
            }
        }
    }`;


const TOTAL_XP_QUERY = `
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

const XP_HISTORY_QUERY = `
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

const AUDIT_TRANSACTIONS_QUERY = `
    query {
        transaction(where: {eventId: {_eq: 104}}) {
            type
        }
    }`;
