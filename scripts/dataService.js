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
