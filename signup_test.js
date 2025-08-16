import fetch from 'node-fetch';
const ts = Date.now().toString().slice(-6);
const username = 'u' + ts; // <= 7 chars
const email = `u${ts}@example.com`;
const password = 'StrongP@ssw0rd';
const body = {
  query: `mutation($userName:String!,$email:String,$password:String){ addUser(userName:$userName,email:$email,password:$password){ token user { _id userName email } } }`,
  variables: { userName: username, email, password }
};
(async () => {
  const res = await fetch('http://localhost:3001/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  console.log('HTTP', res.status);
  console.log(text.substring(0, 600));
})();
