import bcrypt from "bcryptjs";
import { env } from "../config/env.js";

export const hashPassword = async (plaintext) => bcrypt.hash(plaintext, env.bcryptRounds);

export const verifyPassword = async (plaintext, hash) => bcrypt.compare(plaintext, hash);

