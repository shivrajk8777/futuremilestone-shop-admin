import { Algorithm, hash, verify } from "@node-rs/argon2";

const PASSWORD_OPTIONS = {
  algorithm: Algorithm.Argon2id,
  memoryCost: 19456,
  parallelism: 1,
  timeCost: 3,
};

export async function hashPassword(password) {
  return hash(password, PASSWORD_OPTIONS);
}

export async function verifyPassword(passwordHash, password) {
  return verify(passwordHash, password, PASSWORD_OPTIONS);
}
