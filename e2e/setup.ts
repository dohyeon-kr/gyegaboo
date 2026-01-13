import { execSync } from "child_process";
import { existsSync, unlinkSync } from "fs";
import { join } from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

/**
 * E2E 테스트 전에 테스트 환경을 설정합니다.
 * - 테스트용 데이터베이스 초기화
 * - 테스트용 사용자 생성
 */
async function globalSetup() {
    const testDbPath = join(process.cwd(), "e2e-test.db");

    // 기존 테스트 데이터베이스 삭제
    if (existsSync(testDbPath)) {
        unlinkSync(testDbPath);
    }

    // 테스트용 데이터베이스 디렉토리 생성
    const testDataDir = join(process.cwd(), "e2e-test-data");
    execSync(`mkdir -p ${testDataDir}`, { stdio: "inherit" });

    // 환경 변수 설정
    const databaseUrl = `file:${testDbPath}`;
    process.env.DATABASE_URL = databaseUrl;
    process.env.NODE_ENV = "test";
    process.env.PORT = "3001";

    // Prisma 스키마 적용
    try {
        execSync("npx prisma db push --accept-data-loss", {
            stdio: "inherit",
            env: {
                ...process.env,
                DATABASE_URL: databaseUrl,
            },
        });
    } catch (error) {
        console.error("Failed to setup database:", error);
        throw error;
    }

    const adapter = new PrismaLibSql({
        url: process.env.DATABASE_URL ?? "",
    });

    // Prisma 클라이언트 생성 (환경 변수 사용)
    const prisma = new PrismaClient({
        adapter,
    });

    try {
        // 기본 카테고리 시드
        const defaultCategories = [
            { id: "1", name: "식비", type: "expense", color: "#FF6B6B" },
            { id: "2", name: "교통비", type: "expense", color: "#4ECDC4" },
            { id: "3", name: "쇼핑", type: "expense", color: "#45B7D1" },
            { id: "4", name: "의료비", type: "expense", color: "#FFA07A" },
            { id: "5", name: "기타", type: "expense", color: "#98D8C8" },
            { id: "6", name: "급여", type: "income", color: "#6BCB77" },
            { id: "7", name: "부수입", type: "income", color: "#4D96FF" },
        ];

        for (const cat of defaultCategories) {
            try {
                await prisma.category.upsert({
                    where: { id: cat.id },
                    update: {},
                    create: cat,
                });
            } catch (error) {
                console.warn("Failed to seed category:", cat.name, error);
            }
        }

        // 테스트용 사용자 생성
        const testUserPassword = "testpass123";
        const testUserPasswordHash = bcrypt.hashSync(testUserPassword, 10);

        await prisma.user.upsert({
            where: { username: "testuser" },
            update: {
                passwordHash: testUserPasswordHash,
            },
            create: {
                id: `test-user-${Date.now()}`,
                username: "testuser",
                passwordHash: testUserPasswordHash,
                nickname: "테스트 사용자",
                isInitialAdmin: 0,
            },
        });

        console.log("Test user created: testuser / testpass123");
        console.log("Default categories seeded");
    } catch (error) {
        console.error("Failed to setup test data:", error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }

    console.log("Test database setup completed");
}

export default globalSetup;
