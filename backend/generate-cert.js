/**
 * Script tạo SSL Certificate tự ký (self-signed) cho development
 * Sử dụng thư viện node-forge
 * Chạy: node generate-cert.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let forge;
try {
    forge = require('node-forge');
} catch (error) {
    console.log(' Đang cài đặt thư viện node-forge...\n');
    execSync('npm install node-forge --save-dev', { stdio: 'inherit' });
    forge = require('node-forge');
}

const certsDir = path.join(__dirname, 'certs');

if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir, { recursive: true });
}

const keyPath = path.join(certsDir, 'key.pem');
const certPath = path.join(certsDir, 'cert.pem');

if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    console.log(' SSL Certificate đã tồn tại!');
    console.log(`   Key: ${keyPath}`);
    console.log(`   Cert: ${certPath}`);
    console.log('\n💡 Để tạo certificate mới, xóa thư mục certs và chạy lại script này.');
    process.exit(0);
}

console.log(' Đang tạo SSL Certificate tự ký...\n');

try {
    const pki = forge.pki;

    // Tạo cặp khóa RSA 2048-bit
    console.log('   Đang tạo RSA key pair (2048-bit)...');
    const keys = pki.rsa.generateKeyPair(2048);

    // Tạo certificate
    console.log('   Đang tạo certificate...');
    const cert = pki.createCertificate();

    cert.publicKey = keys.publicKey;
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

    // Thông tin certificate
    const attrs = [
        { name: 'commonName', value: 'localhost' },
        { name: 'countryName', value: 'VN' },
        { shortName: 'ST', value: 'Ho Chi Minh' },
        { name: 'localityName', value: 'Ho Chi Minh' },
        { name: 'organizationName', value: 'Do An Web' },
        { shortName: 'OU', value: 'Development' }
    ];

    cert.setSubject(attrs);
    cert.setIssuer(attrs);

    // Extensions
    cert.setExtensions([
        { name: 'basicConstraints', cA: true },
        { name: 'keyUsage', keyCertSign: true, digitalSignature: true, keyEncipherment: true },
        { name: 'extKeyUsage', serverAuth: true, clientAuth: true },
        {
            name: 'subjectAltName',
            altNames: [
                { type: 2, value: 'localhost' },
                { type: 7, ip: '127.0.0.1' }
            ]
        }
    ]);

    // Tự ký certificate
    console.log('   Đang ký certificate...');
    cert.sign(keys.privateKey, forge.md.sha256.create());

    // Chuyển đổi sang định dạng PEM
    const pemPrivateKey = pki.privateKeyToPem(keys.privateKey);
    const pemCertificate = pki.certificateToPem(cert);

    // Lưu file
    fs.writeFileSync(keyPath, pemPrivateKey);
    console.log(` Đã tạo Private Key: ${keyPath}`);

    fs.writeFileSync(certPath, pemCertificate);
    console.log(` Đã tạo Certificate: ${certPath}`);

    console.log('\n Tạo SSL Certificate thành công!');
    console.log('\n Thông tin Certificate:');
    console.log('   - Common Name (CN): localhost');
    console.log('   - Organization: Do An Web');
    console.log('   - Valid for: 1 năm');
    console.log('   - Key Size: 2048-bit RSA');
    console.log('\n  Lưu ý:');
    console.log('   - Đây là certificate tự ký (self-signed), dùng cho development.');
    console.log('   - Trình duyệt sẽ hiển thị cảnh báo "Not Secure" hoặc "Your connection is not private".');
    console.log('   - Nhấn "Advanced" → "Proceed to localhost (unsafe)" để tiếp tục.');
    console.log('\n Khởi động server:');
    console.log('   npm run dev');
    console.log('\n   HTTP:  http://localhost:3000');
    console.log('   HTTPS: https://localhost:3443\n');

} catch (error) {
    console.error(' Lỗi khi tạo certificate:', error.message);
    console.error(error);
    process.exit(1);
}
