"""Выводит ключ подписи APK из секретной фразы.

Одна и та же фраза всегда даёт один и тот же RSA-ключ и сертификат, поэтому
ключ не нужно нигде хранить: достаточно секрета SIGNING_SEED в GitHub.
Новая версия APK встаёт поверх старой, пока фраза не меняется.

Использование: SIGNING_SEED=... python3 derive-keystore.py out.p12 <пароль-хранилища>
"""

import datetime
import hashlib
import hmac
import os
import sys

from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives.serialization import pkcs12
from cryptography.x509.oid import NameOID

SMALL_PRIMES = [p for p in range(3, 2000) if all(p % d for d in range(2, int(p**0.5) + 1))]


class Stream:
    """Детерминированный поток байтов на HMAC-SHA256."""

    def __init__(self, seed: bytes):
        self.key = hashlib.sha256(b"kapital-apk-signing-v1|" + seed).digest()
        self.counter = 0

    def read(self, n: int) -> bytes:
        out = b""
        while len(out) < n:
            out += hmac.new(self.key, self.counter.to_bytes(8, "big"), hashlib.sha256).digest()
            self.counter += 1
        return out[:n]


def is_prime(n: int) -> bool:
    for p in SMALL_PRIMES:
        if n % p == 0:
            return n == p
    d, r = n - 1, 0
    while d % 2 == 0:
        d //= 2
        r += 1
    for a in SMALL_PRIMES[:40]:  # Миллер — Рабин, 40 раундов
        x = pow(a, d, n)
        if x in (1, n - 1):
            continue
        for _ in range(r - 1):
            x = pow(x, 2, n)
            if x == n - 1:
                break
        else:
            return False
    return True


def prime(stream: Stream, bits: int, e: int) -> int:
    while True:
        c = int.from_bytes(stream.read(bits // 8), "big") | (3 << (bits - 2)) | 1
        if is_prime(c) and (c - 1) % e:
            return c


def derive(seed: bytes):
    e = 65537
    s = Stream(seed)
    p, q = prime(s, 1024, e), prime(s, 1024, e)
    if p < q:
        p, q = q, p
    d = pow(e, -1, (p - 1) * (q - 1))
    numbers = rsa.RSAPrivateNumbers(p, q, d, d % (p - 1), d % (q - 1), pow(q, -1, p), rsa.RSAPublicNumbers(e, p * q))
    key = numbers.private_key()
    name = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, "Kapital"), x509.NameAttribute(NameOID.COUNTRY_NAME, "RU")])
    # Все поля фиксированы, а подпись RSA PKCS#1 v1.5 детерминирована — сертификат всегда одинаковый.
    cert = (
        x509.CertificateBuilder()
        .subject_name(name)
        .issuer_name(name)
        .public_key(key.public_key())
        .serial_number(1)
        .not_valid_before(datetime.datetime(2026, 1, 1, tzinfo=datetime.timezone.utc))
        .not_valid_after(datetime.datetime(2076, 1, 1, tzinfo=datetime.timezone.utc))
        .sign(key, hashes.SHA256())
    )
    return key, cert


def main():
    seed = os.environ.get("SIGNING_SEED", "")
    if len(seed) < 16:
        sys.exit("SIGNING_SEED должен быть не короче 16 символов")
    out, password = sys.argv[1], sys.argv[2].encode()
    key, cert = derive(seed.encode())
    with open(out, "wb") as f:
        f.write(pkcs12.serialize_key_and_certificates(b"kapital", key, cert, None, serialization.BestAvailableEncryption(password)))
    print("SHA-256 сертификата:", cert.fingerprint(hashes.SHA256()).hex(":").upper())


if __name__ == "__main__":
    main()
