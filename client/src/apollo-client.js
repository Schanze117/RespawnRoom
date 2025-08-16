import { ApolloClient, InMemoryCache, createHttpLink, ApolloLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import AuthService from './utils/auth';

// Use environment variable for GraphQL URL
console.log('🔵 APOLLO: VITE_GRAPHQL_URL:', import.meta.env.VITE_GRAPHQL_URL);
console.log('🔵 APOLLO: All env vars:', import.meta.env);

const httpLink = createHttpLink({
  uri: import.meta.env.VITE_GRAPHQL_URL,
  credentials: 'include'
});

// Add request logging
const loggingLink = new ApolloLink((operation, forward) => {
  console.log('🔵 APOLLO: Request started:', operation.operationName);
  console.log('🔵 APOLLO: Request variables:', operation.variables);
  console.log('🔵 APOLLO: Request URI:', operation.getContext().uri || 'default');
  
  return forward(operation).map((response) => {
    console.log('🔵 APOLLO: Response received:', response);
    return response;
  });
});

// Add authentication token to requests
const authLink = setContext((_, { headers }) => {
  const token = AuthService.getToken();
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  };
});

const client = new ApolloClient({
  link: authLink.concat(loggingLink.concat(httpLink)),
  cache: new InMemoryCache()
});

export default client;
