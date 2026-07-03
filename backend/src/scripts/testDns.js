import dns from 'dns';

function testDns() {
  console.log('Testing DNS lookup speed...');
  const start = performance.now();
  dns.lookup('ep-rapid-firefly-adikufah.c-2.us-east-1.aws.neon.tech', (err, address, family) => {
    if (err) {
      console.error('DNS Error:', err);
    } else {
      console.log(`DNS lookup completed in ${(performance.now() - start).toFixed(2)}ms. Address: ${address}`);
    }
  });
}

testDns();
