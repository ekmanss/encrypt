#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const minimist = require('minimist');
const algorithm = 'aes-256-cbc';

// 从字符串密钥生成密钥和 IV
function generateKeyAndIVFromString(str) {
    const hash = crypto.createHash('sha256');
    hash.update(str);
    const key = hash.digest();
    const iv = crypto.randomBytes(16); // 安全地生成随机 IV
    return { key, iv };
}

// 加密文件函数
function encryptFile(filePath, keyStr) {
    const { key, iv } = generateKeyAndIVFromString(keyStr);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const input = fs.createReadStream(filePath);
    const output = fs.createWriteStream(`${filePath}.enc`);

    input.pipe(cipher).pipe(output);

    output.on('finish', () => {
        console.log('File encrypted successfully.');
        fs.writeFileSync(`${filePath}.iv`, iv);
    });
}

// 解密文件函数
function decryptFile(encryptedFilePath, keyStr, ivFilePath) {
    const { key } = generateKeyAndIVFromString(keyStr);
    const iv = fs.readFileSync(ivFilePath);
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    const input = fs.createReadStream(encryptedFilePath);
    const output = fs.createWriteStream(path.basename(encryptedFilePath, '.enc'));

    input.pipe(decipher).pipe(output);

    output.on('finish', () => {
        console.log('File decrypted successfully.');
    });
}

// 解析命令行参数
const argv = minimist(process.argv.slice(2));
const command = argv._[0];

// 检查命令行参数并执行相应操作
if (command === 'encrypt' && argv.file && argv.key) {
    encryptFile(argv.file, argv.key);
} else if (command === 'decrypt' && argv.file && argv.key && argv.iv) {
    decryptFile(argv.file, argv.key, argv.iv);
} else {
    console.log('Usage:');
    console.log('  encrypt-decrypt-cli.js encrypt --file <path> --key <key>');
    console.log('  encrypt-decrypt-cli.js decrypt --file <path> --key <key> --iv <iv file path>');
}