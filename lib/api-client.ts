const GRAPHQL_ENDPOINT = 'https://green-tarsier-764009.hostingersite.com/graphql';
const REST_ENDPOINT = 'https://green-tarsier-764009.hostingersite.com/wp-json/infoline/v1';

export async function graphqlRequest(
  query: string,
  variables?: Record<string, any>
) {
  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      throw new Error(data.errors[0]?.message || 'GraphQL request failed');
    }

    return data.data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

export async function submitJobApplication(formData: FormData) {
  try {
    const response = await fetch(`${REST_ENDPOINT}/apply`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Job application submission failed:', error);
    throw error;
  }
}
