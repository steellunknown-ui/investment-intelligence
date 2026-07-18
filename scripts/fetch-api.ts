import http from 'http';

http.get('http://localhost:3000/api/dashboard/net-worth', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', data);
  });
}).on('error', err => {
  console.log('Error:', err.message);
});
