import dns from 'dns';
const hostname = '_mongodb._tcp.newsapp.73bnntz.mongodb.net';

console.log(`Resolving SRV for ${hostname}...`);
dns.resolveSrv(hostname, (err, addresses) => {
    if (err) {
        console.error('DNS SRV resolution failed:', err);
    } else {
        console.log('SRV Records:', addresses);
    }
});

dns.lookup('google.com', (err, address) => {
    if (err) console.error("Internet check failed:", err);
    else console.log("Internet check (google.com):", address);
});
